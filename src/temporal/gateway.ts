/**
 * High-level, JS-friendly helpers the bot (gateway) calls to start and signal
 * workflows. Uses string workflow-type names so this module never imports the
 * sandboxed workflow code into the Node process.
 */
import type { WorkflowHandle } from '@temporalio/client';
import { ensureTemporalClient } from './client';
import { getTemporalConfig } from './config';
import { buildSearchAttributes } from './search-attributes';
import {
	QueryName,
	SignalName,
	UpdateName,
	WorkflowKind,
	WorkflowType,
	automationRunWorkflowId,
	awaitingRenameWorkflowId,
	closeWorkflowId,
	exportWorkflowId,
	importWorkflowId,
	renameWorkflowId,
	reopenWorkflowId,
	staleWorkflowId,
} from './task-queues';
import type {
	AutomationRunInput,
	AwaitingRenameInput,
	BulkCloseInput,
	CascadeCloseUserInput,
	CloseTicketInput,
	DeferredRenameInput,
	ExportGuildInput,
	GenerateTranscriptInput,
	ImportGuildInput,
	ReopenState,
	ReopenWindowInput,
	StaleState,
	StaleTicketInput,
} from './types';

const isAlreadyStarted = (err: unknown): boolean =>
	!!err && typeof err === 'object' && (err as { name?: string }).name === 'WorkflowExecutionAlreadyStartedError';

function taskQueue(): string {
	return getTemporalConfig().taskQueue;
}

/**
 * Ensure a per-ticket stale workflow exists and register fresh activity.
 * Signal-with-start: starts the workflow if it isn't running, otherwise just
 * resets the inactivity timer via the `newActivity` signal.
 */
export async function signalTicketActivity(input: StaleTicketInput): Promise<void> {
	const client = await ensureTemporalClient();
	await client.workflow.signalWithStart(WorkflowType.staleTicket, {
		workflowId: staleWorkflowId(input.ticketId),
		taskQueue: taskQueue(),
		args: [input],
		searchAttributes: buildSearchAttributes({
			guildId: input.guildId,
			kind: WorkflowKind.stale,
			ticketId: input.ticketId,
		}),
		signal: SignalName.newActivity,
		signalArgs: [input.lastActivityAt],
	});
}

/**
 * Park a channel rename that Discord's rate limit refused.
 *
 * `signalWithStart` keyed on the channel, the same idiom `signalTicketActivity`
 * uses: several requests inside one rate-limit window coalesce into the single
 * rename that eventually happens, and the signal only ever pulls the deadline
 * earlier.
 */
export async function deferChannelRename(input: DeferredRenameInput): Promise<void> {
	const client = await ensureTemporalClient();
	await client.workflow.signalWithStart(WorkflowType.deferredRename, {
		workflowId: renameWorkflowId(input.ticketId),
		taskQueue: taskQueue(),
		args: [input],
		searchAttributes: buildSearchAttributes({
			guildId: input.guildId,
			kind: WorkflowKind.rename,
			ticketId: input.ticketId,
		}),
		signal: SignalName.renameRequested,
		signalArgs: [input.notBefore],
	});
}

/**
 * Drop a parked rename.
 *
 * Called by `finallyClose` before its own rename, so the close's name is the one
 * that survives rather than being overwritten minutes later by a deferral that
 * was queued while the ticket was still open.
 */
export async function cancelDeferredRename(ticketId: string): Promise<void> {
	const client = await ensureTemporalClient();
	const handle = client.workflow.getHandle(renameWorkflowId(ticketId));
	await handle.terminate('superseded').catch(() => undefined);
}

/**
 * Debounce the rename owed to the waiting-on-staff status changing.
 *
 * Signal-with-start, so a conversation's worth of flips collapses into the one
 * workflow already counting down rather than a rename per message.
 */
export async function scheduleAwaitingRename(input: AwaitingRenameInput): Promise<void> {
	const client = await ensureTemporalClient();
	await client.workflow.signalWithStart(WorkflowType.awaitingRename, {
		workflowId: awaitingRenameWorkflowId(input.ticketId),
		taskQueue: taskQueue(),
		args: [input],
		searchAttributes: buildSearchAttributes({
			guildId: input.guildId,
			kind: WorkflowKind.rename,
			ticketId: input.ticketId,
		}),
		signal: SignalName.awaitingChanged,
		signalArgs: [],
	});
}

/**
 * Drop a pending waiting-status rename.
 *
 * Called by `finallyClose`: a closed ticket waits on nobody, so the debounce
 * would wake up only to recompute a name the close has already written. Strictly
 * an optimisation — the activity is a no-op by then — but it saves a channel
 * fetch and keeps the Temporal UI free of workflows for closed tickets.
 */
export async function cancelAwaitingRename(ticketId: string): Promise<void> {
	const client = await ensureTemporalClient();
	const handle = client.workflow.getHandle(awaitingRenameWorkflowId(ticketId));
	await handle.terminate('ticket closed').catch(() => undefined);
}

/** Start the per-ticket stale workflow when a ticket opens (idempotent). */
export async function ensureStaleWorkflow(input: StaleTicketInput): Promise<void> {
	const client = await ensureTemporalClient();
	try {
		await client.workflow.start(WorkflowType.staleTicket, {
			workflowId: staleWorkflowId(input.ticketId),
			taskQueue: taskQueue(),
			args: [input],
			searchAttributes: buildSearchAttributes({
				guildId: input.guildId,
				kind: WorkflowKind.stale,
				ticketId: input.ticketId,
			}),
		});
	} catch (err) {
		if (!isAlreadyStarted(err)) throw err;
	}
}

/** Best-effort cancel of a stale workflow (manual close, claim, channel gone). */
export async function cancelStaleWorkflow(ticketId: string): Promise<void> {
	const client = await ensureTemporalClient();
	try {
		await client.workflow.getHandle(staleWorkflowId(ticketId)).signal(SignalName.cancelStale);
	} catch {
		// workflow may not exist; ignore
	}
}

/** Query the live state of a ticket's stale workflow (null when not running). */
export async function queryStaleState(ticketId: string): Promise<StaleState | null> {
	const client = await ensureTemporalClient();
	try {
		return await client.workflow
			.getHandle(staleWorkflowId(ticketId))
			.query<StaleState>(QueryName.staleState);
	} catch {
		return null;
	}
}

/**
 * Live-reconfigure a running stale workflow after guild settings change.
 * Best-effort: returns false when the workflow isn't running (nothing to do).
 */
export async function reconfigureStaleWorkflow(ticketId: string, staleAfterMs: number): Promise<boolean> {
	const client = await ensureTemporalClient();
	try {
		await client.workflow
			.getHandle(staleWorkflowId(ticketId))
			.executeUpdate(UpdateName.reconfigureStale, { args: [{ staleAfterMs }] });
		return true;
	} catch {
		return false;
	}
}

/** Start (idempotently) the durable close workflow for a ticket. */
export async function startCloseTicket(input: CloseTicketInput): Promise<void> {
	const client = await ensureTemporalClient();
	try {
		await client.workflow.start(WorkflowType.closeTicket, {
			workflowId: closeWorkflowId(input.ticketId),
			taskQueue: taskQueue(),
			args: [input],
			searchAttributes: buildSearchAttributes({
				kind: WorkflowKind.close,
				ticketId: input.ticketId,
				userId: input.closedBy ?? undefined,
			}),
		});
	} catch (err) {
		if (!isAlreadyStarted(err)) throw err;
	}
}

/**
 * Start (idempotently) the reopen grace-window workflow: soft-close now, then
 * terminal close at the deadline unless the `reopen` signal arrives first.
 */
export async function startReopenWindow(input: ReopenWindowInput): Promise<void> {
	const client = await ensureTemporalClient();
	try {
		await client.workflow.start(WorkflowType.reopenWindow, {
			workflowId: reopenWorkflowId(input.ticketId),
			taskQueue: taskQueue(),
			args: [input],
			searchAttributes: buildSearchAttributes({
				guildId: input.guildId,
				kind: WorkflowKind.reopen,
				ticketId: input.ticketId,
				userId: input.closedBy ?? undefined,
			}),
		});
	} catch (err) {
		if (!isAlreadyStarted(err)) throw err;
	}
}

/** Reopen a soft-closed ticket. Returns false when no grace window is active. */
export async function signalReopenTicket(ticketId: string): Promise<boolean> {
	const client = await ensureTemporalClient();
	try {
		await client.workflow.getHandle(reopenWorkflowId(ticketId)).signal(SignalName.reopen);
		return true;
	} catch {
		return false;
	}
}

/** Query the reopen grace window (deadline + whether already reopened). */
export async function queryReopenState(ticketId: string): Promise<ReopenState | null> {
	const client = await ensureTemporalClient();
	try {
		return await client.workflow
			.getHandle(reopenWorkflowId(ticketId))
			.query<ReopenState>(QueryName.reopenState);
	} catch {
		return null;
	}
}

/**
 * Auto-close a ticket after `delayMs` if a pending close request goes
 * unanswered. Uses a durable start-delay so it survives restarts. Cancelled by
 * `cancelCloseRequestTimeout` when the request is accepted or rejected.
 */
export async function startCloseRequestTimeout(
	ticketId: string,
	delayMs: number,
	input: {
		closedBy?: string | null;
		reason?: string | null;
		guildId?: string | null;
		/** Grace window to honour once the timeout fires; 0 disables it. */
		reopenWindowMs?: number | null;
	},
): Promise<void> {
	const client = await ensureTemporalClient();
	const reopenWindowMs = Number(input.reopenWindowMs ?? 0);

	// A ticket closed by *accepting* the request goes through the reopen grace
	// window (see acceptClose), so one closed by *ignoring* it must too —
	// otherwise the identical ticket was deleted outright with no Reopen button.
	// `guildId` is threaded through for the GuildId search attribute, which these
	// workflows previously started without.
	const useReopenWindow = reopenWindowMs > 0 && !!input.guildId;

	try {
		await client.workflow.start(
			useReopenWindow ? WorkflowType.reopenWindow : WorkflowType.closeTicket,
			{
				args: [useReopenWindow
					? {
						closedBy: input.closedBy ?? null,
						guildId: input.guildId as string,
						reason: input.reason ?? null,
						ticketId,
						windowMs: reopenWindowMs,
					}
					: {
						closedBy: input.closedBy ?? null,
						reason: input.reason ?? null,
						ticketId,
					}],
				searchAttributes: buildSearchAttributes({
					guildId: input.guildId ?? undefined,
					kind: useReopenWindow ? WorkflowKind.reopen : WorkflowKind.close,
					ticketId,
					userId: input.closedBy ?? undefined,
				}),
				startDelay: Math.ceil(delayMs),
				taskQueue: taskQueue(),
				workflowId: `close-request-${ticketId}`,
			},
		);
	} catch (err) {
		if (!isAlreadyStarted(err)) throw err;
	}
}

export async function cancelCloseRequestTimeout(ticketId: string): Promise<void> {
	const client = await ensureTemporalClient();
	try {
		await client.workflow.getHandle(`close-request-${ticketId}`).terminate('close request resolved');
	} catch {
		// no pending timeout; ignore
	}
}

export async function startBulkClose(input: BulkCloseInput): Promise<WorkflowHandle> {
	const client = await ensureTemporalClient();
	return client.workflow.start(WorkflowType.bulkClose, {
		workflowId: `bulk-close-${Date.now()}`,
		taskQueue: taskQueue(),
		args: [input],
		searchAttributes: buildSearchAttributes({
			kind: WorkflowKind.bulkClose,
			userId: input.closedBy ?? undefined,
		}),
	});
}

export async function startCascadeCloseUser(input: CascadeCloseUserInput): Promise<WorkflowHandle> {
	const client = await ensureTemporalClient();
	return client.workflow.start(WorkflowType.cascadeCloseUser, {
		workflowId: `cascade-close-${input.guildId}-${input.userId}`,
		taskQueue: taskQueue(),
		args: [input],
		searchAttributes: buildSearchAttributes({
			guildId: input.guildId,
			kind: WorkflowKind.cascadeClose,
			userId: input.userId,
		}),
	});
}

/**
 * Start a guild export. Throws `WorkflowExecutionAlreadyStartedError` when an
 * export for this guild is already running (callers map this to HTTP 429).
 */
export async function startExportGuild(input: ExportGuildInput): Promise<WorkflowHandle> {
	const client = await ensureTemporalClient();
	return client.workflow.start(WorkflowType.exportGuild, {
		workflowId: exportWorkflowId(input.guildId),
		taskQueue: taskQueue(),
		args: [input],
		searchAttributes: buildSearchAttributes({
			guildId: input.guildId,
			kind: WorkflowKind.export,
			userId: input.requestedBy ?? undefined,
		}),
	});
}

/**
 * Start a guild import. Throws `WorkflowExecutionAlreadyStartedError` when an
 * import for this guild is already running (callers map this to HTTP 429).
 */
export async function startImportGuild(input: ImportGuildInput): Promise<WorkflowHandle> {
	const client = await ensureTemporalClient();
	return client.workflow.start(WorkflowType.importGuild, {
		workflowId: importWorkflowId(input.guildId),
		taskQueue: taskQueue(),
		args: [input],
		searchAttributes: buildSearchAttributes({
			guildId: input.guildId,
			kind: WorkflowKind.import,
			userId: input.requestedBy ?? undefined,
		}),
	});
}

/** True when `err` is Temporal's "workflow already running" start rejection. */
export function isWorkflowAlreadyStarted(err: unknown): boolean {
	return isAlreadyStarted(err);
}

export async function startGenerateTranscript(input: GenerateTranscriptInput): Promise<WorkflowHandle> {
	const client = await ensureTemporalClient();
	return client.workflow.start(WorkflowType.generateTranscript, {
		workflowId: `transcript-${input.ticketId}-${Date.now()}`,
		taskQueue: taskQueue(),
		args: [input],
		searchAttributes: buildSearchAttributes({
			kind: WorkflowKind.transcript,
			ticketId: input.ticketId,
		}),
	});
}

/**
 * Park an automation run until its `flow.wait` elapses.
 *
 * The workflow id is derived from the run id, so a retried park reuses the same
 * workflow instead of creating a second one — which is why an already-started
 * error is swallowed rather than raised.
 */
export async function startAutomationRun(input: AutomationRunInput): Promise<void> {
	const client = await ensureTemporalClient();
	try {
		await client.workflow.start(WorkflowType.automationRun, {
			args: [input],
			searchAttributes: buildSearchAttributes({
				guildId: input.guildId,
				kind: WorkflowKind.automation,
			}),
			taskQueue: taskQueue(),
			workflowId: automationRunWorkflowId(input.runId),
		});
	} catch (err) {
		if (!isAlreadyStarted(err)) throw err;
	}
}
