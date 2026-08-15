/**
 * `client.automations` — the owner of automation rows, runs, and the bridge to
 * Temporal.
 *
 * Sits beside `client.tickets` for a specific reason: the Temporal activities
 * are written as `client.<manager>.<method>`, so keeping this shape means the
 * durability layer needs no new dependency wiring.
 *
 * A note on vocabulary, because this codebase already uses the obvious word for
 * something else: "workflow" here always means a *Temporal* workflow. The thing
 * an admin builds on the canvas is an **automation**, its JSON is a **graph**,
 * and one execution is a **run**.
 */

const ms = require('ms');
const ShortUniqueId = require('short-unique-id');
const {
	LIMITS,
	RUN_RETENTION_DAYS,
} = require('./errors');
const { Context } = require('./context');
const { makeRunners } = require('./actions');
const {
	RUN,
	runAutomation,
	runFrom,
} = require('./runtime');
const { cronNodes } = require('./schedules');
const { upgradeGraph } = require('./upgrade');

const uid = new ShortUniqueId({ length: 6 });

/** How long the per-guild automation list is cached. A backstop, not the mechanism. */
const CACHE_TTL = ms('10m');

const cacheKey = guildId => `cache/automations:${guildId}`;

class AutomationManager {
	constructor(client) {
		/** @type {import("client")} */
		this.client = client;
		this.runners = makeRunners(client, (key, ctx) => this.runNested(key, ctx));
	}

	/* ── storage ─────────────────────────────────────────────────────────────── */

	/**
	 * Every enabled automation in a guild.
	 *
	 * One cache entry for the whole guild, filtered in memory by trigger type, so
	 * a single `keyv.delete` invalidates everything — the same shape as
	 * `cache/guild-tags:<id>`. This is read on the hot path of every message in
	 * every guild, so it must stay one cache read.
	 */
	async getForGuild(guildId) {
		const key = cacheKey(guildId);
		let all = await this.client.keyv.get(key);
		if (!all) {
			const rows = await this.client.prisma.automation.findMany({
				select: {
					graph: true,
					id: true,
					key: true,
					name: true,
					triggerTypes: true,
				},
				where: {
					enabled: true,
					guildId,
				},
			});
			// Upgraded before it is cached, not after: every reader downstream of
			// here — the dispatcher, the button handler, the interpreter — is then
			// looking at exactly one graph format.
			all = rows.map(row => ({
				...row,
				graph: upgradeGraph(row.graph),
			}));
			await this.client.keyv.set(key, all, CACHE_TTL);
		}
		return all;
	}

	invalidate(guildId) {
		return this.client.keyv.delete(cacheKey(guildId));
	}

	/** A short per-guild-unique handle, for button custom_ids and schedule ids. */
	async uniqueKey(guildId) {
		for (let attempt = 0; attempt < 5; attempt++) {
			const key = uid.randomUUID();
			const clash = await this.client.prisma.automation.findFirst({
				select: { id: true },
				where: {
					guildId,
					key,
				},
			});
			if (!clash) return key;
		}
		throw new Error('Could not generate a unique automation key');
	}

	/* ── running ─────────────────────────────────────────────────────────────── */

	/**
	 * Run an automation from its trigger, recording a run row.
	 *
	 * Two queries, not one per node: the row is created `RUNNING` up front so a
	 * crash mid-run is visible, and updated once at the end with the whole trace.
	 */
	async run(automation, ctx, startNodeId = null) {
		const startedAt = Date.now();
		let row;
		try {
			row = await this.client.prisma.automationRun.create({
				data: {
					automationId: automation.id,
					guildId: ctx.guildId,
					steps: [],
					ticketId: ctx.ticketId,
					triggerType: ctx.triggerType,
					userId: ctx.actorId,
				},
			});
		} catch (error) {
			this.client.log.warn('Could not record an automation run: %s', error?.message ?? error);
			return null;
		}

		ctx.runId = row.id;
		ctx.automationId = automation.id;
		// `action.message.send` needs it to build a button that comes back here.
		ctx.automationKey = automation.key;

		let result;
		try {
			result = await runAutomation(automation.graph, ctx, {
				runners: this.runners,
				startNodeId,
			});
		} catch (error) {
			// The interpreter catches per-node faults itself, so reaching here means
			// something structural. Record it rather than losing the run.
			result = {
				error: String(error?.message ?? error).slice(0, 200),
				status: RUN.failed,
				steps: ctx.trace ?? [],
			};
		}

		return this.finish(row.id, result, startedAt, ctx);
	}

	/**
	 * Answer the button or menu that started a run, if nothing else did.
	 *
	 * `src/buttons/auto.js` opens an ephemeral `deferReply` before dispatching,
	 * because the handler has three seconds and a run has no such limit. A graph
	 * that posts something private fills that in — but a graph whose whole job is
	 * to create a channel, add a role or close a ticket has nothing to say, so the
	 * reply sat there spinning until Discord gave up on it. Whether the run
	 * succeeded, failed or is still going, the person who pressed the button saw
	 * exactly the same thing: nothing. Which is how "the create-a-thread step does
	 * nothing" gets reported when the step may well have worked.
	 *
	 * Only ever the reply this bot opened and nobody used: a node that answered
	 * has set `replied`, and `ack: 'none'` deferred an *update*, which needs no
	 * answer at all.
	 *
	 * The failure text names no reason on purpose. Whoever pressed the button is
	 * often the member a ticket belongs to, and "could not create the thread:
	 * wrong_parent_type" is for the admin who built the graph — it is in the run
	 * log, which the message points at.
	 */
	async acknowledge(ctx, result) {
		const interaction = ctx?.interaction;
		if (!interaction?.isRepliable?.()) return;
		if (!interaction.ephemeral || !interaction.deferred || interaction.replied) return;

		const content = {
			[RUN.failed]: 'That did not go through. An administrator can see why in this automation\'s run log.',
			[RUN.suspended]: 'Done — the rest of this runs later.',
		}[result?.status] ?? 'Done.';

		await interaction.editReply({ content }).catch(() => null);
	}

	/**
	 * Write the outcome of a run, parking it in Temporal if it hit a `flow.wait`.
	 */
	async finish(runId, result, startedAt, ctx) {
		if (result.status === RUN.suspended) {
			await this.persist(runId, result, startedAt);
			// Already inside an activity: the workflow owns the sleeping, so hand
			// the remainder back up rather than starting a second workflow.
			if (ctx?.durable) return result;
			await this.acknowledge(ctx, result);
			await this.park(runId, result);
			return result;
		}

		await this.persist(runId, result, startedAt);
		await this.acknowledge(ctx, result);
		return result;
	}

	async persist(runId, result, startedAt) {
		try {
			await this.client.prisma.automationRun.update({
				data: {
					durationMs: Date.now() - startedAt,
					error: result.error ?? null,
					finishedAt: result.status === RUN.suspended ? null : new Date(),
					status: result.status,
					steps: result.steps ?? [],
				},
				where: { id: runId },
			});
		} catch (error) {
			// A failed log write must never fail the run it describes.
			this.client.log.warn('Could not update automation run %s: %s', runId, error?.message ?? error);
		}
	}

	/**
	 * Hand a parked run to Temporal.
	 *
	 * Temporal being unreachable is treated the way `ready.js` already treats it —
	 * non-fatal. A short wait falls back to an in-process timer; a long one is
	 * honestly reported as failed rather than silently dropped.
	 */
	async park(runId, result) {
		const temporal = require('../temporal');
		try {
			await temporal.startAutomationRun({
				automationId: result.state.automationId,
				guildId: result.state.guildId,
				runId,
				state: result.state,
				waitMs: result.waitMs,
			});
		} catch (error) {
			this.client.log.warn('Could not make automation run %s durable: %s', runId, error?.message ?? error);
			if (result.waitMs <= LIMITS.inlineWaitMs) {
				setTimeout(() => this.resume(result.state).catch(e => this.client.log.warn(e)), result.waitMs).unref?.();
				return;
			}
			await this.persist(runId, {
				error: 'durability_unavailable',
				status: RUN.failed,
				steps: result.steps,
			}, Date.now());
		}
	}

	/**
	 * Continue a run that was parked on a `flow.wait`.
	 *
	 * The graph is **re-read, not carried**: an edit during a three-day wait takes
	 * effect. If the automation is gone, disabled, or no longer contains a node
	 * the run was about to execute, the run ends `CANCELLED` — running a stale
	 * graph would be worse.
	 */
	async resume(state) {
		const startedAt = Date.now();
		const automation = await this.client.prisma.automation.findUnique({ where: { id: state.automationId } });

		if (!automation || !automation.enabled) {
			await this.persist(state.runId, {
				error: automation ? 'disabled' : 'deleted',
				status: RUN.cancelled,
				steps: state.trace ?? [],
			}, startedAt);
			return { status: RUN.cancelled };
		}

		const ctx = new Context(this.client, state);
		ctx.durable = true;
		ctx.executed = state.executed ?? [];
		ctx.trace = state.trace ?? [];

		// A run can park for days, so the graph it wakes to may predate the last
		// deploy — upgrade it here as well as at the cached read.
		const result = await runFrom(upgradeGraph(automation.graph), ctx, state.queue ?? [], { runners: this.runners });
		await this.finish(state.runId, result, startedAt, ctx);
		return result;
	}

	/** Entry point for `trigger.schedule.cron`, called from a Temporal schedule. */
	async runScheduled(automationId, guildId, nodeId) {
		const row = await this.client.prisma.automation.findUnique({ where: { id: automationId } });
		if (!row?.enabled || row.guildId !== guildId) return;
		const automation = {
			...row,
			graph: upgradeGraph(row.graph),
		};

		// The schedule names its node; a graph may hold several cron triggers, and
		// only the one that fired should run.
		const node = cronNodes(automation.graph).find(n => n.id === nodeId);
		if (!node) return;

		const ctx = new Context(this.client, {
			guildId,
			triggerType: node.type,
		});
		await this.run(automation, ctx, node.id);
	}

	/**
	 * `action.automation.run`: run another automation with the same context, one
	 * level deeper.
	 */
	async runNested(key, parent) {
		const automation = (await this.getForGuild(parent.guildId)).find(a => a.key === key);
		if (!automation) return;
		const child = parent.descend(automation.id, null, automation.key);
		await this.run(automation, child);
		// The step budget is shared, so a chain of automations cannot spend it
		// afresh at every level.
		parent.budget.steps = child.budget.steps;
	}

	/* ── retention ───────────────────────────────────────────────────────────── */

	/**
	 * Delete old run rows.
	 *
	 * Two passes, because either alone leaves a hole: the age window bounds how
	 * far back the log goes, and the per-guild cap stops one busy server filling
	 * the table inside that window.
	 */
	async pruneRuns() {
		const cutoff = new Date(Date.now() - RUN_RETENTION_DAYS * 864e5);
		const { count } = await this.client.prisma.automationRun.deleteMany({ where: { createdAt: { lt: cutoff } } });

		let capped = 0;
		if (Number.isFinite(LIMITS.runsPerGuild)) {
			const guilds = await this.client.prisma.automationRun.groupBy({
				_count: { id: true },
				by: ['guildId'],
			});
			for (const {
				_count, guildId,
			} of guilds) {
				if (_count.id <= LIMITS.runsPerGuild) continue;
				const keep = await this.client.prisma.automationRun.findMany({
					orderBy: { createdAt: 'desc' },
					select: { id: true },
					take: LIMITS.runsPerGuild,
					where: { guildId },
				});
				const { count: removed } = await this.client.prisma.automationRun.deleteMany({
					where: {
						guildId,
						id: { notIn: keep.map(r => r.id) },
					},
				});
				capped += removed;
			}
		}

		this.client.log.info(`Pruned ${count + capped} automation runs`);
		return count + capped;
	}
}

module.exports = { AutomationManager };
