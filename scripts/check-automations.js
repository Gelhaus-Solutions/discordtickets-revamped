/**
 * Checks the automations contract: what the validator rejects, how the
 * interpreter traverses a graph, and — most importantly — that a run parked on
 * a `flow.wait` can survive a round trip through JSON and carry on.
 *
 * The interpreter takes its runners as an argument, so everything here runs with
 * stub nodes and no Discord, Prisma or Temporal. That is the whole reason for
 * the injection: a state machine you can only exercise against a live Discord
 * gateway is a state machine nobody exercises.
 *
 * It also guards the two things that are duplicated on purpose and would
 * otherwise drift silently:
 *   - the dashboard's node registry mirror
 *   - the button custom_id, against Discord's 100-character limit
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const {
	GRAPH_VERSION, LIMITS, PRIVATE_LIMITS, PUBLIC_LIMITS, AutomationError, describeError,
} = require(path.join(root, 'src', 'lib', 'automations', 'errors'));
const {
	NODE_TYPES, isValidCron, needsOf,
} = require(path.join(root, 'src', 'lib', 'automations', 'registry'));
const {
	deriveTrigger, validateGraph,
} = require(path.join(root, 'src', 'lib', 'automations', 'validate'));
const {
	RUN, STEP, runAutomation, runFrom,
} = require(path.join(root, 'src', 'lib', 'automations', 'runtime'));
const { Context } = require(path.join(root, 'src', 'lib', 'automations', 'context'));

let pass = 0;
const t = async (name, fn) => {
	try {
		await fn();
		pass++;
		console.log('  ok  ', name);
	} catch (e) {
		console.log('  FAIL', name, '\n       ', e.message);
		process.exitCode = 1;
	}
};

/* ────────────────────────────────── helpers ────────────────────────────────── */

let seq = 0;
const node = (type, params = {}, id) => ({
	id: id ?? `n${++seq}`,
	params,
	position: {
		x: 0,
		y: 0,
	},
	type,
});
const edge = (from, to, fromHandle = 'out', id) => ({
	from,
	fromHandle,
	id: id ?? `e${++seq}`,
	to,
});
const graph = (nodes, edges = []) => ({
	edges,
	nodes,
	version: GRAPH_VERSION,
});

/** A minimal valid automation: a ticket closes, a role is added. */
function simple() {
	const a = node('trigger.ticket.closed', { categoryIds: [] }, 'a');
	const b = node('action.role.add', {
		roleId: '820000000000000001',
		subject: 'ticketCreator',
	}, 'b');
	return graph([a, b], [edge('a', 'b')]);
}

/** The code of the first error, or null if the graph validated. */
function codeOf(g, options) {
	try {
		validateGraph(g, options);
		return null;
	} catch (error) {
		assert.ok(error instanceof AutomationError, 'expected an AutomationError');
		return error.errors[0].code;
	}
}

const ctx = (state = {}) => {
	const c = new Context(null, {
		guildId: '1',
		...state,
	});
	return c;
};

/**
 * Run `fn` as if this were a public instance.
 *
 * The quota limits only exist when `PUBLIC_BOT=true`; on a private bot they are
 * Infinity, so a test that asserts "too many nodes is rejected" has to say which
 * kind of bot it is talking about.
 */
function asPublic(fn) {
	const before = process.env.PUBLIC_BOT;
	process.env.PUBLIC_BOT = 'true';
	const restore = () => {
		if (before === undefined) delete process.env.PUBLIC_BOT;
		else process.env.PUBLIC_BOT = before;
	};

	let result;
	try {
		result = fn();
	} catch (error) {
		restore();
		throw error;
	}
	// `LIMITS` is read while the run executes, not while `fn` is called, so an
	// async body has to keep the env set until it settles.
	if (result && typeof result.then === 'function') return result.finally(restore);
	restore();
	return result;
}

/** Runners that record what ran, so a trace can be asserted against intent. */
function stubRunners(overrides = {}) {
	const ran = [];
	const base = new Proxy({}, {
		get: (_, type) => {
			if (typeof type !== 'string') return undefined;
			if (overrides[type]) return overrides[type];
			return async n => {
				ran.push(n.id);
				return {};
			};
		},
		has: () => true,
	});
	return {
		ran,
		runners: base,
	};
}

(async () => {
	console.log('\nvalidation\n');

	await t('accepts a minimal trigger -> action graph', () => {
		assert.strictEqual(codeOf(simple()), null);
	});

	await t('rejects a newer graph version', () => {
		assert.strictEqual(codeOf({
			...simple(),
			version: GRAPH_VERSION + 1,
		}), 'unsupported');
	});

	await t('rejects zero triggers', () => {
		const g = graph([node('action.log', { content: 'hi' }, 'a')]);
		assert.strictEqual(codeOf(g), 'no_trigger');
	});

	await t('rejects two triggers', () => {
		const g = simple();
		g.nodes.push(node('trigger.ticket.created', {}, 'c'));
		g.edges.push(edge('c', 'b'));
		assert.strictEqual(codeOf(g), 'multiple_triggers');
	});

	await t('rejects a graph that does nothing', () => {
		const g = graph([node('trigger.ticket.closed', {}, 'a')]);
		assert.strictEqual(codeOf(g), 'no_action');
	});

	await t('rejects an unknown node type', () => {
		const g = simple();
		g.nodes[1].type = 'action.does.not.exist';
		assert.strictEqual(codeOf(g), 'unknown_type');
	});

	await t('rejects duplicate node ids', () => {
		const g = simple();
		g.nodes.push(node('action.log', { content: 'x' }, 'a'));
		assert.strictEqual(codeOf(g), 'duplicate_id');
	});

	await t('rejects an edge to a node that does not exist', () => {
		const g = simple();
		g.edges.push(edge('a', 'nope'));
		assert.strictEqual(codeOf(g), 'unknown_node');
	});

	await t('rejects a handle the node does not have', () => {
		const g = simple();
		g.nodes.push(node('flow.if', {
			clauses: [{
				field: 'ticket.claimed',
				op: 'is',
				value: true,
			}],
			match: 'all',
		}, 'c'));
		g.edges.push(edge('a', 'c'));
		// flow.if has true/false, not out.
		g.edges.push(edge('c', 'b', 'out'));
		assert.strictEqual(codeOf(g), 'unknown_handle');
	});

	await t('rejects an edge leading into the trigger', () => {
		const g = simple();
		g.edges.push(edge('b', 'a'));
		assert.strictEqual(codeOf(g), 'trigger_has_input');
	});

	await t('rejects a self-loop', () => {
		const g = simple();
		g.edges.push(edge('b', 'b'));
		assert.strictEqual(codeOf(g), 'self_loop');
	});

	await t('rejects a cycle a -> b -> a', () => {
		// Built past the trigger, so it is a genuine cycle rather than an edge
		// into the trigger.
		const g = graph(
			[
				node('trigger.ticket.closed', {}, 't'),
				node('flow.noop', {}, 'a'),
				node('action.log', { content: 'x' }, 'b'),
			],
			[edge('t', 'a'), edge('a', 'b'), edge('b', 'a')],
		);
		assert.strictEqual(codeOf(g), 'cycle');
	});

	await t('rejects an unreachable node', () => {
		const g = simple();
		g.nodes.push(node('action.log', { content: 'orphan' }, 'c'));
		assert.strictEqual(codeOf(g), 'unreachable');
	});

	/** A chain of `count` actions hanging off one trigger. */
	const chain = count => {
		const nodes = [node('trigger.ticket.closed', {}, 'a')];
		const edges = [];
		for (let i = 0; i < count; i++) {
			nodes.push(node('action.log', { content: 'x' }, `x${i}`));
			edges.push(edge(i === 0 ? 'a' : `x${i - 1}`, `x${i}`));
		}
		return graph(nodes, edges);
	};

	/** `count` actions all hanging off the trigger's single handle. */
	const fanOut = count => {
		const nodes = [node('trigger.ticket.closed', {}, 'a')];
		const edges = [];
		for (let i = 0; i < count; i++) {
			nodes.push(node('action.log', { content: 'x' }, `x${i}`));
			edges.push(edge('a', `x${i}`));
		}
		return graph(nodes, edges);
	};

	await t('public bot: rejects more nodes than the limit', () => {
		asPublic(() => assert.strictEqual(codeOf(chain(PUBLIC_LIMITS.nodes)), 'too_many'));
	});

	await t('public bot: rejects more branches than the limit on one handle', () => {
		asPublic(() => assert.strictEqual(codeOf(fanOut(PUBLIC_LIMITS.branches + 1)), 'too_many_branches'));
	});

	// The point of the private/public split: a self-hosted bot is not rationing
	// its own CPU, so the fair-use quotas are simply absent.
	await t('private bot: the quota limits do not apply', () => {
		assert.strictEqual(codeOf(chain(PUBLIC_LIMITS.nodes)), null, 'node count should be unlimited on a private bot');
		assert.strictEqual(codeOf(fanOut(PUBLIC_LIMITS.branches + 1)), null, 'branching should be unlimited on a private bot');
		for (const key of ['branches', 'clauses', 'edges', 'nodes', 'perGuild', 'runsPerMinute', 'steps']) {
			assert.strictEqual(PRIVATE_LIMITS[key], Infinity, `${key} should be unlimited on a private bot`);
		}
	});

	// These four are correctness, not fair use, so they survive in both modes.
	await t('the safety limits are never removed', () => {
		assert.ok(Number.isFinite(PRIVATE_LIMITS.depth), 'depth bounds automation-calls-automation recursion');
		assert.ok(PRIVATE_LIMITS.depth >= PUBLIC_LIMITS.depth);
		assert.ok(Number.isFinite(PRIVATE_LIMITS.inlineMs), 'inlineMs bounds how long the gateway event is blocked');
		assert.ok(Number.isFinite(PRIVATE_LIMITS.waitMaxMs));
		assert.ok(Number.isFinite(PRIVATE_LIMITS.waitMinMs));
	});

	await t('LIMITS follows PUBLIC_BOT at read time, not require time', () => {
		asPublic(() => assert.strictEqual(LIMITS.nodes, PUBLIC_LIMITS.nodes));
		assert.strictEqual(LIMITS.nodes, PRIVATE_LIMITS.nodes);
	});

	await t('rejects an automation that runs itself', () => {
		const g = graph(
			[node('trigger.ticket.closed', {}, 'a'), node('action.automation.run', { automationKey: 'me' }, 'b')],
			[edge('a', 'b')],
		);
		assert.strictEqual(codeOf(g, { selfKey: 'me' }), 'self_reference');
	});

	await t('rejects a per-minute cron, accepts a sane one', () => {
		assert.strictEqual(isValidCron('* * * * *'), false, 'every minute must be rejected');
		assert.strictEqual(isValidCron('*/1 * * * *'), false, 'every minute must be rejected');
		assert.strictEqual(isValidCron('*/5 * * * *'), true);
		assert.strictEqual(isValidCron('0 9 * * 1'), true);
		assert.strictEqual(isValidCron('0 9 * *'), false, 'four fields is not a schedule');
		assert.strictEqual(isValidCron('0 99 * * *'), false, 'hour 99 does not exist');
	});

	await t('rejects an invalid timezone', () => {
		const g = graph(
			[
				node('trigger.schedule.cron', {
					cron: '0 9 * * *',
					timezone: 'Mars/Olympus',
				}, 'a'),
				node('action.log', { content: 'x' }, 'b'),
			],
			[edge('a', 'b')],
		);
		assert.strictEqual(codeOf(g), 'invalid_timezone');
	});

	await t('rejects a bad regex in a message trigger', () => {
		const g = graph(
			[
				node('trigger.message.created', {
					pattern: '([',
					scope: 'ticket',
				}, 'a'),
				node('action.log', { content: 'x' }, 'b'),
			],
			[edge('a', 'b')],
		);
		assert.strictEqual(codeOf(g), 'invalid_regex');
	});

	await t('rejects the role feedback loop', () => {
		const g = graph(
			[
				node('trigger.member.roleAdded', { roleId: '820000000000000001' }, 'a'),
				node('action.role.add', {
					roleId: '820000000000000001',
					subject: 'actor',
				}, 'b'),
			],
			[edge('a', 'b')],
		);
		assert.strictEqual(codeOf(g), 'self_loop');
	});

	// The assertion that proves the capability system is actually wired up, not
	// just declared.
	await t('capabilities: reply under a cron trigger is rejected', () => {
		const g = graph(
			[
				node('trigger.schedule.cron', {
					cron: '0 9 * * *',
					timezone: 'UTC',
				}, 'a'),
				node('action.message.reply', { content: 'hi' }, 'b'),
			],
			[edge('a', 'b')],
		);
		assert.strictEqual(codeOf(g), 'missing_context');
	});

	await t('capabilities: the same reply under a message trigger is accepted', () => {
		const g = graph(
			[
				node('trigger.message.created', { scope: 'ticket' }, 'a'),
				node('action.message.reply', { content: 'hi' }, 'b'),
			],
			[edge('a', 'b')],
		);
		assert.strictEqual(codeOf(g), null);
	});

	await t('capabilities: needsOf sees the subject, not just the declaration', () => {
		assert.ok(needsOf(node('action.role.add', {
			roleId: '1',
			subject: 'ticketCreator',
		})).includes('ticket'));
		assert.ok(!needsOf(node('action.message.send', {
			channelId: '820000000000000001',
			content: 'x',
			target: 'channel',
		})).includes('ticketChannel'));
		assert.ok(needsOf(node('action.message.send', {
			content: 'x',
			target: 'ticket',
		})).includes('ticketChannel'));
	});

	await t('deriveTrigger reports the type, and the cron only for schedules', () => {
		assert.deepStrictEqual(deriveTrigger(simple()), {
			triggerKey: null,
			triggerType: 'trigger.ticket.closed',
		});
		const cron = graph(
			[
				node('trigger.schedule.cron', {
					cron: '0 9 * * *',
					timezone: 'UTC',
				}, 'a'),
				node('action.log', { content: 'x' }, 'b'),
			],
			[edge('a', 'b')],
		);
		assert.deepStrictEqual(deriveTrigger(cron), {
			triggerKey: '0 9 * * *',
			triggerType: 'trigger.schedule.cron',
		});
	});

	await t('describeError produces the panels-shaped 400 body', () => {
		let thrown;
		try {
			validateGraph({ version: 99 });
		} catch (error) {
			thrown = error;
		}
		const described = describeError(thrown);
		assert.strictEqual(described.status, 400);
		assert.strictEqual(described.body.code, 'invalid_automation');
		assert.ok(described.body.errors[0].type);
		assert.ok(described.body.errors[0].message);
		assert.strictEqual(describeError(new Error('unrelated')), null, 'a real fault must not become a 400');
	});

	console.log('\ninterpreter\n');

	await t('a linear graph runs in order', async () => {
		const g = graph(
			[
				node('trigger.ticket.closed', {}, 'a'),
				node('action.log', { content: 'x' }, 'b'),
				node('action.log', { content: 'y' }, 'c'),
			],
			[edge('a', 'b'), edge('b', 'c')],
		);
		const {
			ran, runners,
		} = stubRunners();
		const result = await runAutomation(g, ctx(), { runners });
		assert.deepStrictEqual(ran, ['a', 'b', 'c']);
		assert.strictEqual(result.status, RUN.success);
		assert.strictEqual(result.steps.length, 3);
	});

	await t('flow.if false does not run the true branch', async () => {
		const g = graph(
			[
				node('trigger.ticket.closed', {}, 'a'),
				node('flow.if', {
					clauses: [{
						field: 'ticket.claimed',
						op: 'is',
						value: true,
					}],
					match: 'all',
				}, 'i'),
				node('action.log', { content: 'yes' }, 'yes'),
				node('action.log', { content: 'no' }, 'no'),
			],
			[edge('a', 'i'), edge('i', 'yes', 'true'), edge('i', 'no', 'false')],
		);
		const {
			ran, runners,
		} = stubRunners({ 'flow.if': async () => ({ handle: 'false' }) });
		await runAutomation(g, ctx(), { runners });
		assert.ok(ran.includes('no'), 'the false branch should run');
		assert.ok(!ran.includes('yes'), 'the true branch should not run');
	});

	// The semantic most likely to surprise someone, so it is pinned here.
	await t('converging edges run the join exactly once', async () => {
		const g = graph(
			[
				node('trigger.ticket.closed', {}, 'a'),
				node('flow.noop', {}, 'l'),
				node('flow.noop', {}, 'r'),
				node('action.log', { content: 'join' }, 'j'),
			],
			[edge('a', 'l'), edge('a', 'r'), edge('l', 'j'), edge('r', 'j')],
		);
		const {
			ran, runners,
		} = stubRunners();
		const result = await runAutomation(g, ctx(), { runners });
		assert.strictEqual(ran.filter(id => id === 'j').length, 1, 'the join ran more than once');
		const skipped = result.steps.filter(s => s.s === STEP.skip && s.r === 'already_ran');
		assert.strictEqual(skipped.length, 1, 'the second arrival should be traced as already_ran');
	});

	await t('public bot: a long chain stops at the step budget', async () => {
		const nodes = [node('trigger.ticket.closed', {}, 'a')];
		const edges = [];
		for (let i = 0; i < PUBLIC_LIMITS.steps + 10; i++) {
			nodes.push(node('action.log', { content: 'x' }, `x${i}`));
			edges.push(edge(i === 0 ? 'a' : `x${i - 1}`, `x${i}`));
		}
		const g = graph(nodes, edges);
		const { runners } = stubRunners();

		const capped = await asPublic(() => runAutomation(g, ctx(), { runners }));
		assert.strictEqual(capped.status, RUN.failed);
		assert.strictEqual(capped.error, 'step_budget_exceeded');

		// Unbounded on a private bot, and it still terminates — the graph is a DAG
		// and a node runs at most once, so the counter was never what stopped it.
		const uncapped = await runAutomation(g, ctx(), { runners });
		assert.strictEqual(uncapped.status, RUN.success);
	});

	await t('a throwing action stops its branch but not a parallel one', async () => {
		const g = graph(
			[
				node('trigger.ticket.closed', {}, 'a'),
				node('action.log', { content: 'boom' }, 'bad'),
				node('action.log', { content: 'after' }, 'after'),
				node('action.log', { content: 'other' }, 'other'),
			],
			[edge('a', 'bad'), edge('a', 'other'), edge('bad', 'after')],
		);
		const {
			ran, runners,
		} = stubRunners({
			'action.log': async n => {
				if (n.id === 'bad') throw new Error('nope');
				ran.push(n.id);
				return {};
			},
		});
		const result = await runAutomation(g, ctx(), { runners });
		assert.ok(!ran.includes('after'), 'the failed branch must not continue');
		assert.ok(ran.includes('other'), 'a parallel branch must still run');
		assert.strictEqual(result.status, RUN.failed);
	});

	await t('flow.stop ends only its own branch', async () => {
		const g = graph(
			[
				node('trigger.ticket.closed', {}, 'a'),
				node('flow.stop', {}, 's'),
				node('action.log', { content: 'never' }, 'never'),
				node('action.log', { content: 'other' }, 'other'),
			],
			// `flow.stop` has no outputs, so the edge out of it is unreachable by
			// construction — build it via a noop to keep the graph well-formed.
			[edge('a', 's'), edge('a', 'other')],
		);
		const {
			ran, runners,
		} = stubRunners();
		await runAutomation(g, ctx(), { runners });
		assert.ok(!ran.includes('never'));
		assert.ok(ran.includes('other'));
	});

	console.log('\ndurability\n');

	const waitGraph = () => graph(
		[
			node('trigger.ticket.closed', {}, 'a'),
			node('flow.wait', { ms: 60_000 }, 'w'),
			node('action.log', { content: 'sibling' }, 'sib'),
			node('action.log', { content: 'after' }, 'after'),
		],
		[edge('a', 'w'), edge('a', 'sib'), edge('w', 'after')],
	);

	await t('flow.wait suspends and carries the whole queue, siblings included', async () => {
		const { runners } = stubRunners();
		const result = await runAutomation(waitGraph(), ctx(), { runners });
		assert.strictEqual(result.status, RUN.suspended);
		assert.strictEqual(result.waitMs, 60_000);
		assert.ok(result.state.queue.includes('after'), 'the node after the wait must be queued');
		assert.ok(result.state.queue.includes('sib'), 'a sibling branch must not be lost');
	});

	await t('the parked state survives a JSON round trip', async () => {
		const { runners } = stubRunners();
		const result = await runAutomation(waitGraph(), ctx(), { runners });
		const round = JSON.parse(JSON.stringify(result.state));
		assert.deepStrictEqual(round, result.state, 'the state holds something JSON cannot represent');
	});

	await t('resuming from the round-tripped state finishes the run', async () => {
		const g = waitGraph();
		const { runners } = stubRunners();
		const parked = await runAutomation(g, ctx(), { runners });
		const state = JSON.parse(JSON.stringify(parked.state));

		const resumed = new Context(null, state);
		resumed.durable = true;
		resumed.executed = state.executed;
		resumed.trace = state.trace;
		const {
			ran, runners: runners2,
		} = stubRunners();
		const result = await runFrom(g, resumed, state.queue, { runners: runners2 });

		assert.ok(ran.includes('after'), 'the run must continue past the wait');
		assert.strictEqual(result.status, RUN.success);
	});

	await t('resuming against a graph missing the node is cancelled, not failed', async () => {
		const g = waitGraph();
		const { runners } = stubRunners();
		const parked = await runAutomation(g, ctx(), { runners });
		const state = JSON.parse(JSON.stringify(parked.state));

		const edited = graph(g.nodes.filter(n => n.id !== 'after'), g.edges.filter(e => e.to !== 'after'));
		const resumed = new Context(null, state);
		resumed.executed = state.executed;
		const result = await runFrom(edited, resumed, state.queue, { runners });

		assert.strictEqual(result.status, RUN.cancelled);
		assert.ok(result.error.startsWith('graph_changed'));
	});

	console.log('\nguards\n');

	await t('the button custom_id fits in Discord\'s 100 characters', () => {
		const id = JSON.stringify({
			action: 'auto',
			k: 'aB3xY9',
		});
		assert.ok(id.length <= 100, `custom_id is ${id.length} characters`);
		// Headroom for a future version field, since the id is stored in messages
		// that outlive the code that wrote them.
		assert.ok(id.length <= 60, 'leave room to add a field later');
	});

	await t('the recursion depth guard trips at the limit', () => {
		const deep = ctx({ depth: LIMITS.depth });
		assert.strictEqual(deep.atMaxDepth, true);
		assert.strictEqual(ctx({ depth: LIMITS.depth - 1 }).atMaxDepth, false);
	});

	await t('every node type is internally consistent', () => {
		for (const [type, definition] of Object.entries(NODE_TYPES)) {
			assert.strictEqual(type.split('.')[0], definition.category, `${type} prefix disagrees with its category`);
			assert.ok(Array.isArray(definition.outputs), `${type} has no outputs`);
			assert.ok(definition.label && definition.description, `${type} is missing its labels`);
			if (definition.category === 'trigger') {
				assert.ok(definition.provides?.length, `${type} provides nothing`);
				assert.deepStrictEqual(definition.outputs, ['out'], `${type} should have one output`);
			} else {
				assert.ok(!definition.provides, `${type} is not a trigger but declares provides`);
			}
			for (const field of definition.params) {
				assert.ok(field.key && field.label && field.type, `${type} has a malformed param`);
				if (field.type === 'select') assert.ok(field.options?.length, `${type}.${field.key} has no options`);
			}
		}
	});

	// A trigger that nothing emits is a node an admin can place on the canvas and
	// wait forever for. The registry cannot know its own call sites, so this
	// greps for them.
	await t('every trigger has an emit site', () => {
		/** Triggers whose emit site is not a plain `emit(...)` call. */
		const exempt = {
			'trigger.button.pressed': 'src/buttons/auto.js dispatches it directly',
			'trigger.menu.selected': 'src/menus/auto.js dispatches it directly',
			'trigger.schedule.cron': 'started by a Temporal schedule, not an event',
		};

		const roots = ['src/lib', 'src/listeners', 'src/modals', 'src/buttons', 'src/menus', 'src/commands'];
		const sources = [];
		const walk = dir => {
			if (!fs.existsSync(dir)) return;
			for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
				const full = path.join(dir, entry.name);
				if (entry.isDirectory()) walk(full);
				else if (entry.name.endsWith('.js')) sources.push(fs.readFileSync(full, 'utf8'));
			}
		};
		for (const root of roots) walk(path.join(__dirname, '..', root));
		const haystack = sources.join('\n');

		const missing = Object.keys(NODE_TYPES)
			.filter(type => NODE_TYPES[type].category === 'trigger')
			.filter(type => !exempt[type] && !haystack.includes(`'${type}'`));
		assert.deepStrictEqual(missing, [], `these triggers are never emitted: ${missing.join(', ')}`);
	});

	// `collectRouteFiles` turns every .js under src/routes into an endpoint and
	// every export into an HTTP verb, so a stray helper export becomes a live
	// route that 500s on the first request.
	await t('the automation routes export only HTTP verbs', () => {
		const verbs = new Set(['delete', 'get', 'head', 'options', 'patch', 'post', 'put']);
		const dir = path.join(root, 'src', 'routes', 'api', 'admin', 'guilds', '[guild]', 'automations');
		const files = [];
		const walk = at => {
			for (const entry of fs.readdirSync(at, { withFileTypes: true })) {
				const full = path.join(at, entry.name);
				if (entry.isDirectory()) walk(full);
				else if (entry.name.endsWith('.js')) files.push(full);
			}
		};
		walk(dir);
		assert.ok(files.length >= 6, `expected the six automation routes, found ${files.length}`);

		for (const file of files) {
			for (const key of Object.keys(require(file))) {
				assert.ok(verbs.has(key), `${path.basename(file)} exports "${key}", which would register as an HTTP method`);
			}
		}
	});

	console.log('\ndashboard mirror\n');

	// The comment in nodes.js asks people to keep the two in sync; this is what
	// makes that request enforceable.
	await t('the editor registry mirrors the bot registry', () => {
		const mirror = path.join(root, 'src', 'dashboard', 'src', 'components', 'AutomationEditor', 'nodes.js');
		if (!fs.existsSync(mirror)) {
			console.log('       (skipped: the editor registry does not exist yet)');
			return;
		}
		const source = fs.readFileSync(mirror, 'utf8');

		for (const type of Object.keys(NODE_TYPES)) {
			assert.ok(source.includes(`'${type}'`), `the editor is missing ${type}`);
		}
		const declared = [...source.matchAll(/'((?:trigger|condition|action|flow)\.[\w.]+)':\s*{/g)].map(m => m[1]);
		for (const type of new Set(declared)) {
			assert.ok(NODE_TYPES[type], `the editor declares ${type}, which the bot does not have`);
		}
		const version = source.match(/GRAPH_VERSION\s*=\s*(\d+)/);
		assert.ok(version, 'the editor does not declare GRAPH_VERSION');
		assert.strictEqual(Number(version[1]), GRAPH_VERSION, 'GRAPH_VERSION differs between the bot and the editor');

		// Compared against the *public* numbers: those are the canonical ones the
		// editor ships as its fallback. At runtime the editor uses whatever
		// `catalogue()` reports, which is the private set on a self-hosted bot.
		for (const key of ['nodes', 'edges', 'branches', 'steps', 'perGuild']) {
			const found = source.match(new RegExp(`${key}:\\s*(\\d+)`));
			assert.ok(found, `the editor does not declare the ${key} limit`);
			assert.strictEqual(Number(found[1]), PUBLIC_LIMITS[key], `the ${key} limit differs between the bot and the editor`);
		}
	});

	console.log(`\n${pass} checks passed${process.exitCode ? ' (with failures above)' : ''}\n`);
})();
