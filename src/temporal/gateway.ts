/**
 * High-level, JS-friendly helpers the bot (gateway) calls to start and signal
 * workflows. Uses string workflow-type names so this module never imports the
 * sandboxed workflow code into the Node process.
 */
import type { WorkflowHandle } from '@temporalio/client';
import { getTemporalClient } from './client';
import { getTemporalConfig } from './config';
import {
	SignalName,
	WorkflowType,
	closeWorkflowId,
	exportWorkflowId,
	importWorkflowId,
	staleWorkflowId,
} from './task-queues';
import type {
	BulkCloseInput,
	CascadeCloseUserInput,
	CloseTicketInput,
	ExportGuildInput,
	GenerateTranscriptInput,
	ImportGuildInput,
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
	const client = getTemporalClient();
	await client.workflow.signalWithStart(WorkflowType.staleTicket, {
		workflowId: staleWorkflowId(input.ticketId),
		taskQueue: taskQueue(),
		args: [input],
		signal: SignalName.newActivity,
		signalArgs: [input.lastActivityAt],
	});
}

/** Start the per-ticket stale workflow when a ticket opens (idempotent). */
export async function ensureStaleWorkflow(input: StaleTicketInput): Promise<void> {
	const client = getTemporalClient();
	try {
		await client.workflow.start(WorkflowType.staleTicket, {
			workflowId: staleWorkflowId(input.ticketId),
			taskQueue: taskQueue(),
			args: [input],
		});
	} catch (err) {
		if (!isAlreadyStarted(err)) throw err;
	}
}

/** Best-effort cancel of a stale workflow (manual close, claim, channel gone). */
export async function cancelStaleWorkflow(ticketId: string): Promise<void> {
	const client = getTemporalClient();
	try {
		await client.workflow.getHandle(staleWorkflowId(ticketId)).signal(SignalName.cancelStale);
	} catch {
		// workflow may not exist; ignore
	}
}

/** Start (idempotently) the durable close workflow for a ticket. */
export async function startCloseTicket(input: CloseTicketInput): Promise<void> {
	const client = getTemporalClient();
	try {
		await client.workflow.start(WorkflowType.closeTicket, {
			workflowId: closeWorkflowId(input.ticketId),
			taskQueue: taskQueue(),
			args: [input],
		});
	} catch (err) {
		if (!isAlreadyStarted(err)) throw err;
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
	input: { closedBy?: string | null; reason?: string | null },
): Promise<void> {
	const client = getTemporalClient();
	try {
		await client.workflow.start(WorkflowType.closeTicket, {
			args: [{
				closedBy: input.closedBy ?? null,
				reason: input.reason ?? null,
				ticketId,
			}],
			startDelay: Math.ceil(delayMs),
			taskQueue: taskQueue(),
			workflowId: `close-request-${ticketId}`,
		});
	} catch (err) {
		if (!isAlreadyStarted(err)) throw err;
	}
}

export async function cancelCloseRequestTimeout(ticketId: string): Promise<void> {
	const client = getTemporalClient();
	try {
		await client.workflow.getHandle(`close-request-${ticketId}`).terminate('close request resolved');
	} catch {
		// no pending timeout; ignore
	}
}

export async function startBulkClose(input: BulkCloseInput): Promise<WorkflowHandle> {
	const client = getTemporalClient();
	return client.workflow.start(WorkflowType.bulkClose, {
		workflowId: `bulk-close-${Date.now()}`,
		taskQueue: taskQueue(),
		args: [input],
	});
}

export async function startCascadeCloseUser(input: CascadeCloseUserInput): Promise<WorkflowHandle> {
	const client = getTemporalClient();
	return client.workflow.start(WorkflowType.cascadeCloseUser, {
		workflowId: `cascade-close-${input.guildId}-${input.userId}`,
		taskQueue: taskQueue(),
		args: [input],
	});
}

export async function startExportGuild(input: ExportGuildInput): Promise<WorkflowHandle> {
	const client = getTemporalClient();
	return client.workflow.start(WorkflowType.exportGuild, {
		workflowId: exportWorkflowId(input.guildId, String(Date.now())),
		taskQueue: taskQueue(),
		args: [input],
	});
}

export async function startImportGuild(input: ImportGuildInput): Promise<WorkflowHandle> {
	const client = getTemporalClient();
	return client.workflow.start(WorkflowType.importGuild, {
		workflowId: importWorkflowId(input.guildId, String(Date.now())),
		taskQueue: taskQueue(),
		args: [input],
	});
}

export async function startGenerateTranscript(input: GenerateTranscriptInput): Promise<WorkflowHandle> {
	const client = getTemporalClient();
	return client.workflow.start(WorkflowType.generateTranscript, {
		workflowId: `transcript-${input.ticketId}-${Date.now()}`,
		taskQueue: taskQueue(),
		args: [input],
	});
}
