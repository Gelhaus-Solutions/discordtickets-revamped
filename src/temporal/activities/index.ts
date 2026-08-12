import { Context } from '@temporalio/activity';
import {
	ensureStaleWorkflow,
	queryReopenState,
	startCloseTicket,
	startReopenWindow,
} from '../gateway';
import type {
	AutomationResumeResult,
	AutomationRunState,
	CloseTicketInput,
	ExportGuildInput,
	ImportGuildInput,
	StaleSweepResult,
} from '../types';

/**
 * How far past a deadline a ticket has to be before the sweep touches it.
 *
 * Wide enough that a healthy workflow waking up a little late — a busy worker,
 * a Discord rate limit on the close itself — is never raced by the sweep.
 */
const SWEEP_GRACE_MS = 5 * 60 * 1000;

/** Tickets the sweep will act on in one pass. The rest wait for the next tick. */
const SWEEP_MAX_ACTIONS = 200;

/** One thing the sweep found wrong, and what it intends to do about it. */
interface SweepAction {
	kind: 'close' | 'pending-close' | 'rearm';
	ticketId: string;
	guildId: string;
	/** The guild's reopen grace window; 0 means close outright. */
	reopenWindowMs: number;
}

/**
 * Everything an activity needs, injected by the worker bootstrap so that all
 * discord.js / Prisma / worker-thread I/O keeps running in the bot process.
 * The bot `client` is a discord.js Client augmented with `prisma`, `i18n`,
 * `tickets`, `config` and `log`.
 */
export interface ActivityDeps {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	client: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	sendToHouston: (client: any) => Promise<void> | void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	checkForUpdates: (client: any) => Promise<void> | void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	saveHtmlTranscript: (client: any, ticketId: string) => Promise<string | null>;
}

export function makeActivities(deps: ActivityDeps) {
	const { client } = deps;

	return {
		/** Run the full multi-step close (wraps TicketManager.finallyClose). */
		async finallyCloseTicket(input: CloseTicketInput): Promise<void> {
			await client.tickets.finallyClose(input.ticketId, {
				closedBy: input.closedBy ?? null,
				lock: input.lock ?? false,
				reason: input.reason ?? null,
			});
		},

		/**
		 * Apply a rename that the channel's rate-limit budget refused earlier.
		 *
		 * Through `client.tickets`, like every other activity here: this module is
		 * compiled into `dist/temporal`, so a relative `require` into `src/lib`
		 * would resolve to a path that does not exist.
		 *
		 * @returns null when there is nothing left to do — including when the
		 *   ticket or its channel is gone, which is a normal outcome and must not
		 *   burn five retries on a channel that is never coming back. A number is
		 *   the epoch at which to try again.
		 */
		async applyDeferredRename(ticketId: string): Promise<number | null> {
			return await client.tickets.applyDeferredRename(ticketId);
		},

		/**
		 * Rename a channel because its waiting-on-staff status changed.
		 *
		 * Returns nothing, unlike `applyDeferredRename`: this one passes
		 * `defer: true`, so an exhausted rename budget parks a
		 * `deferredRenameWorkflow` instead of coming back with a retry epoch.
		 * The debounce decides *when to try*; the deferral ladder owns what
		 * happens when the rate limit says no. A missing ticket or channel is a
		 * normal outcome and returns quietly rather than burning retries.
		 */
		async applyAwaitingRename(ticketId: string): Promise<void> {
			await client.tickets.applyAwaitingRename(ticketId);
		},

		async isTicketOpen(ticketId: string): Promise<boolean> {
			const t = await client.prisma.ticket.findUnique({
				select: { open: true },
				where: { id: ticketId },
			});
			return !!t?.open;
		},

		/** Config + last-activity needed to seed the stale timers. */
		async getStaleConfig(ticketId: string): Promise<{
			open: boolean;
			staleAfterMs: number;
			reopenWindowMs: number;
			lastActivityAt: number;
		}> {
			const ticket = await client.prisma.ticket.findUnique({
				select: {
					createdAt: true,
					guild: {
						select: {
							reopenWindow: true,
							staleAfter: true,
						},
					},
					lastMessageAt: true,
					open: true,
				},
				where: { id: ticketId },
			});
			if (!ticket) return { lastActivityAt: 0, open: false, reopenWindowMs: 0, staleAfterMs: 0 };
			const last = ticket.lastMessageAt ?? ticket.createdAt;
			return {
				lastActivityAt: last ? new Date(last).getTime() : 0,
				open: !!ticket.open,
				reopenWindowMs: Number(ticket.guild?.reopenWindow ?? 0),
				staleAfterMs: Number(ticket.guild?.staleAfter ?? 0),
			};
		},

		/** Send the inactivity warning; returns the auto-close epoch (or null). */
		async sendStaleWarning(ticketId: string): Promise<number | null> {
			return client.tickets.sendStaleWarning(ticketId);
		},

		async sendClosingSoon(ticketId: string, closeAtEpoch: number): Promise<void> {
			await client.tickets.sendClosingSoon(ticketId, closeAtEpoch);
		},

		/** Enter the reopen grace window: lock (don't delete) + post the reopen button. */
		async softCloseTicket(ticketId: string, closeAtEpoch: number): Promise<void> {
			await client.tickets.softClose(ticketId, closeAtEpoch);
		},

		/** Restore a ticket that was reopened within its grace window. */
		async reopenTicket(ticketId: string): Promise<void> {
			await client.tickets.reopen(ticketId);
		},

		async getOpenTicketIdsByUser(guildId: string, userId: string): Promise<string[]> {
			const tickets = await client.prisma.ticket.findMany({
				select: { id: true },
				where: {
					createdById: userId,
					guildId,
					open: true,
				},
			});
			return tickets.map((t: { id: string }) => t.id);
		},

		/**
		 * Close what the per-ticket timers should already have closed.
		 *
		 * `staleTicketWorkflow` is the only thing that closes an inactive ticket,
		 * and a workflow is not a guarantee: it fails if an activity exhausts its
		 * retries, it stops if it is terminated, and it makes no progress at all
		 * while no worker is polling the version it is assigned to — which is
		 * every deploy that does not manage to promote its build. None of that is
		 * visible from Discord: the ticket simply sits there past a deadline the
		 * bot already announced in the channel.
		 *
		 * So this re-derives the deadlines from the database — the same arithmetic
		 * the workflow does, `staleAfter` then `autoClose` from the last message —
		 * and finishes anything that is late. Every action is idempotent: the
		 * close/reopen workflow ids are per-ticket, and `finallyClose` claims the
		 * row with a compare-and-swap, so racing a workflow that turns out to be
		 * alive after all costs nothing.
		 */
		async sweepStaleTickets(): Promise<StaleSweepResult> {
			const result: StaleSweepResult = {
				closed: 0,
				pendingClosed: 0,
				rearmed: 0,
				truncated: false,
			};
			// The public bot never arms these timers in the first place (see
			// messageCreate and lib/sync), so it has nothing to recover.
			if (process.env.PUBLIC_BOT === 'true') return result;

			const now = Date.now();
			const guilds = await client.prisma.guild.findMany({
				select: {
					autoClose: true,
					id: true,
					reopenWindow: true,
					staleAfter: true,
				},
			});

			const overdue: SweepAction[] = [];
			const stuck: SweepAction[] = [];
			const inactive: SweepAction[] = [];

			for (const guild of guilds) {
				const staleAfterMs = Number(guild.staleAfter ?? 0);
				const autoCloseMs = Number(guild.autoClose ?? 0);
				const reopenWindowMs = Number(guild.reopenWindow ?? 0);

				// Soft-closed tickets whose reopen window has outlived the workflow
				// that owns it. Nothing else can rescue these: `pendingCloseAt` is
				// exactly what messageCreate and the startup sync skip, so a lost
				// reopenWindowWorkflow leaves a locked channel there for ever.
				const pending = await client.prisma.ticket.findMany({
					select: { id: true },
					take: SWEEP_MAX_ACTIONS + 1,
					where: {
						guildId: guild.id,
						open: true,
						pendingCloseAt: { lte: new Date(now - reopenWindowMs - SWEEP_GRACE_MS) },
					},
				});
				for (const ticket of pending) {
					stuck.push({
						guildId: guild.id,
						kind: 'pending-close',
						reopenWindowMs,
						ticketId: ticket.id,
					});
				}

				if (staleAfterMs <= 0) continue; // stale handling disabled for this guild

				// Everything that should have been warned by now. Split below into
				// the ones that are merely un-warned (re-arm) and the ones whose
				// auto-close deadline has also passed (close).
				const tickets = await client.prisma.ticket.findMany({
					select: {
						createdAt: true,
						id: true,
						lastMessageAt: true,
					},
					take: SWEEP_MAX_ACTIONS + 1,
					where: {
						OR: [
							{ lastMessageAt: { lte: new Date(now - staleAfterMs - SWEEP_GRACE_MS) } },
							{
								createdAt: { lte: new Date(now - staleAfterMs - SWEEP_GRACE_MS) },
								lastMessageAt: null,
							},
						],
						guildId: guild.id,
						open: true,
						pendingCloseAt: null,
					},
				});
				for (const ticket of tickets) {
					const lastActivity = new Date(ticket.lastMessageAt ?? ticket.createdAt).getTime();
					// `autoClose` of 0 means warn but never close, so those tickets
					// are never overdue however long they sit there.
					const isOverdue = autoCloseMs > 0 &&
						lastActivity + staleAfterMs + autoCloseMs + SWEEP_GRACE_MS <= now;
					(isOverdue ? overdue : inactive).push({
						guildId: guild.id,
						kind: isOverdue ? 'close' : 'rearm',
						reopenWindowMs,
						ticketId: ticket.id,
					});
				}
			}

			// Closes first: a ticket past its announced deadline is the visible
			// failure, and re-arming an inactive one can wait for the next tick.
			const actions = [...stuck, ...overdue, ...inactive];
			result.truncated = actions.length > SWEEP_MAX_ACTIONS;

			for (const action of actions.slice(0, SWEEP_MAX_ACTIONS)) {
				try {
					if (action.kind === 'rearm') {
						// lastActivityAt 0 makes the workflow read the database value.
						await ensureStaleWorkflow({
							guildId: action.guildId,
							lastActivityAt: 0,
							ticketId: action.ticketId,
						});
						result.rearmed++;
					} else if (action.kind === 'close' && action.reopenWindowMs > 0) {
						// Honour the grace window the guild configured — this is the
						// close the workflow would have done, not a harsher one.
						await startReopenWindow({
							guildId: action.guildId,
							reason: 'inactivity',
							ticketId: action.ticketId,
							windowMs: action.reopenWindowMs,
						});
						result.closed++;
					} else {
						// A grace window is late by this guild's *current* setting,
						// which is not the same as abandoned: shortening the window
						// does not move a countdown already running (or the deadline
						// posted in the channel). Ask the workflow before overruling
						// it — an unreachable one answers null, which is the case
						// this sweep exists for.
						if (action.kind === 'pending-close') {
							const live = await queryReopenState(action.ticketId);
							if (live && !live.reopened && live.closeAt > Date.now()) continue;
						}
						await startCloseTicket({
							closedBy: null,
							reason: 'inactivity',
							ticketId: action.ticketId,
						});
						if (action.kind === 'close') result.closed++;
						else result.pendingClosed++;
					}
				} catch (error) {
					client.log?.warn?.(
						'Stale sweep could not recover ticket %s: %s',
						action.ticketId,
						(error as Error)?.message ?? error,
					);
				}
			}

			return result;
		},

		async runHoustonStats(): Promise<void> {
			await deps.sendToHouston(client);
		},

		async runUpdateCheck(): Promise<void> {
			await deps.checkForUpdates(client);
		},

		async regenerateTranscript(ticketId: string): Promise<string | null> {
			Context.current().heartbeat('transcript');
			return deps.saveHtmlTranscript(client, ticketId);
		},

		async runGuildExport(input: ExportGuildInput): Promise<string> {
			return client.tickets.exportGuildToFile(
				input.guildId,
				input.outputPath,
				() => Context.current().heartbeat('export'),
			);
		},

		async runGuildImport(input: ImportGuildInput): Promise<void> {
			await client.tickets.importGuildFromArchive(
				input.guildId,
				input.archivePath,
				() => Context.current().heartbeat('import'),
			);
		},

		/**
		 * Continue an automation run that was parked on a `flow.wait`.
		 *
		 * Re-reads the graph rather than carrying it, so an edit during a
		 * three-day wait takes effect — and a run whose nodes no longer exist ends
		 * CANCELLED rather than executing a stale graph.
		 */
		async resumeAutomationRun(input: { runId: string; state: AutomationRunState }): Promise<AutomationResumeResult> {
			const result = await client.automations.resume(input.state);
			return {
				state: result?.state,
				status: result?.status ?? 'FAILED',
				waitMs: result?.waitMs,
			};
		},

		/** Entry point for `trigger.schedule.cron`. */
		async startScheduledAutomation(input: { automationId: number; guildId: string; nodeId: string }): Promise<void> {
			await client.automations.runScheduled(input.automationId, input.guildId, input.nodeId);
		},

		async failAutomationRun(runId: string, error: string): Promise<void> {
			await client.prisma.automationRun.update({
				data: {
					error,
					finishedAt: new Date(),
					status: 'FAILED',
				},
				where: { id: runId },
			}).catch(() => null);
		},

		async pruneAutomationRuns(): Promise<void> {
			await client.automations.pruneRuns();
		},
	};
}

export type Activities = ReturnType<typeof makeActivities>;
