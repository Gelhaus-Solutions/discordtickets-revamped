import {
	ParentClosePolicy,
	condition,
	continueAsNew,
	defineSignal,
	executeChild,
	proxyActivities,
	setHandler,
} from '@temporalio/workflow';
import type { Activities } from '../activities';
import { SignalName, closeWorkflowId } from '../task-queues';
import type {
	BulkCloseInput,
	CascadeCloseUserInput,
	CloseTicketInput,
	ExportGuildInput,
	GenerateTranscriptInput,
	ImportGuildInput,
	StaleTicketInput,
} from '../types';

const acts = proxyActivities<Activities>({
	retry: { maximumAttempts: 5 },
	startToCloseTimeout: '2 minutes',
});

/** Long, CPU/IO-heavy activities that heartbeat (transcript, export, import). */
const longActs = proxyActivities<Activities>({
	heartbeatTimeout: '1 minute',
	retry: { maximumAttempts: 3 },
	startToCloseTimeout: '60 minutes',
});

const isAlreadyStarted = (err: unknown): boolean =>
	!!err && typeof err === 'object' && (err as { name?: string }).name === 'WorkflowExecutionAlreadyStartedError';

// ---------------------------------------------------------------------------
// Close a single ticket (durable wrapper around the 12-step finallyClose).
// ---------------------------------------------------------------------------
export async function closeTicketWorkflow(input: CloseTicketInput): Promise<void> {
	if (!(await acts.isTicketOpen(input.ticketId))) return;
	await acts.finallyCloseTicket(input);
}

// ---------------------------------------------------------------------------
// Per-ticket stale lifecycle: inactive -> warn -> closing-soon -> auto-close.
// Resettable by `newActivity`, cancellable by `cancelStale`, bounded by CAN.
// ---------------------------------------------------------------------------
const newActivitySignal = defineSignal<[number]>(SignalName.newActivity);
const cancelStaleSignal = defineSignal<[]>(SignalName.cancelStale);

const CONTINUE_AS_NEW_AFTER = 500;

export async function staleTicketWorkflow(input: StaleTicketInput): Promise<void> {
	const cfg = await acts.getStaleConfig(input.ticketId);
	if (!cfg.open) return;
	const staleAfterMs = cfg.staleAfterMs;
	if (!staleAfterMs) return; // stale handling disabled for this guild

	let lastActivityAt = input.lastActivityAt || cfg.lastActivityAt || Date.now();
	let activityVersion = 0;
	let totalSignals = input.signalCount ?? 0;
	let cancelled = false;

	setHandler(newActivitySignal, (at: number) => {
		lastActivityAt = Math.max(lastActivityAt, at || Date.now());
		activityVersion++;
		totalSignals++;
	});
	setHandler(cancelStaleSignal, () => {
		cancelled = true;
	});

	// eslint-disable-next-line no-constant-condition
	while (true) {
		if (cancelled) return;
		if (totalSignals >= CONTINUE_AS_NEW_AFTER) {
			await continueAsNew<typeof staleTicketWorkflow>({
				...input,
				lastActivityAt,
				signalCount: 0,
			});
		}

		// Phase 1 — wait for the inactivity threshold (resettable).
		const v1 = activityVersion;
		const waitMs = lastActivityAt + staleAfterMs - Date.now();
		if (waitMs > 0) await condition(() => cancelled || activityVersion !== v1, waitMs);
		if (cancelled) return;
		if (activityVersion !== v1) continue; // activity reset the timer
		if (!(await acts.isTicketOpen(input.ticketId))) return;

		// Phase 2 — send the inactivity warning; get the auto-close epoch.
		const closeAt = await acts.sendStaleWarning(input.ticketId);
		if (closeAt == null) {
			// No auto-close: wait for the next activity, then re-arm.
			const v2 = activityVersion;
			await condition(() => cancelled || activityVersion !== v2);
			if (cancelled) return;
			continue;
		}

		// Phase 3 — halfway "closing soon" reminder.
		const vWarn = activityVersion;
		const halfway = closeAt - (closeAt - Date.now()) / 2;
		const waitH = halfway - Date.now();
		if (waitH > 0) await condition(() => cancelled || activityVersion !== vWarn, waitH);
		if (cancelled) return;
		if (activityVersion !== vWarn) continue;
		if (!(await acts.isTicketOpen(input.ticketId))) return;
		await acts.sendClosingSoon(input.ticketId, closeAt);

		// Phase 4 — wait until the auto-close deadline, then close.
		const waitC = closeAt - Date.now();
		if (waitC > 0) await condition(() => cancelled || activityVersion !== vWarn, waitC);
		if (cancelled) return;
		if (activityVersion !== vWarn) continue;
		if (!(await acts.isTicketOpen(input.ticketId))) return;

		try {
			await executeChild(closeTicketWorkflow, {
				args: [{
					closedBy: null,
					reason: 'inactivity',
					ticketId: input.ticketId,
				}],
				parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
				workflowId: closeWorkflowId(input.ticketId),
			});
		} catch (err) {
			if (!isAlreadyStarted(err)) throw err;
		}
		return;
	}
}

// ---------------------------------------------------------------------------
// Bulk close (parent fan-out to bounded-concurrency child close workflows).
// ---------------------------------------------------------------------------
export async function bulkCloseWorkflow(input: BulkCloseInput): Promise<{ closed: number }> {
	const concurrency = Math.max(1, input.concurrency ?? 5);
	const queue = [...input.ticketIds];
	let closed = 0;

	const runOne = async (ticketId: string): Promise<void> => {
		try {
			await executeChild(closeTicketWorkflow, {
				args: [{
					closedBy: input.closedBy ?? null,
					lock: input.lock ?? false,
					reason: input.reason ?? null,
					ticketId,
				}],
				workflowId: closeWorkflowId(ticketId),
			});
			closed++;
		} catch (err) {
			if (!isAlreadyStarted(err)) {
				// swallow individual failures so one bad ticket doesn't abort the batch
			}
		}
	};

	const worker = async (): Promise<void> => {
		let next = queue.shift();
		while (next !== undefined) {
			await runOne(next);
			next = queue.shift();
		}
	};

	await Promise.all(
		Array.from({ length: Math.min(concurrency, queue.length) }, () => worker()),
	);
	return { closed };
}

// ---------------------------------------------------------------------------
// Cascade: close every open ticket a user created (they left the guild).
// ---------------------------------------------------------------------------
export async function cascadeCloseUserWorkflow(input: CascadeCloseUserInput): Promise<{ closed: number }> {
	const ids = await acts.getOpenTicketIdsByUser(input.guildId, input.userId);
	if (!ids.length) return { closed: 0 };
	return bulkCloseWorkflow({
		closedBy: null,
		reason: input.reason ?? 'user left the server',
		ticketIds: ids,
	});
}

// ---------------------------------------------------------------------------
// Export / import / transcript (long, heartbeated activities).
// ---------------------------------------------------------------------------
export async function exportGuildWorkflow(input: ExportGuildInput): Promise<{ path: string }> {
	const path = await longActs.runGuildExport(input);
	return { path };
}

export async function importGuildWorkflow(input: ImportGuildInput): Promise<void> {
	await longActs.runGuildImport(input);
}

export async function generateTranscriptWorkflow(input: GenerateTranscriptInput): Promise<{ path: string | null }> {
	const path = await longActs.regenerateTranscript(input.ticketId);
	return { path };
}

// ---------------------------------------------------------------------------
// Scheduled workflows (driven by Temporal Schedules).
// ---------------------------------------------------------------------------
export async function houstonStatsWorkflow(): Promise<void> {
	await acts.runHoustonStats();
}

export async function updateCheckWorkflow(): Promise<void> {
	await acts.runUpdateCheck();
}

export async function dbMaintenanceWorkflow(): Promise<void> {
	await acts.runDbMaintenance();
}
