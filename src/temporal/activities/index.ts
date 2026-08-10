import { Context } from '@temporalio/activity';
import type {
	AutomationResumeResult,
	AutomationRunState,
	CloseTicketInput,
	ExportGuildInput,
	ImportGuildInput,
} from '../types';

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
