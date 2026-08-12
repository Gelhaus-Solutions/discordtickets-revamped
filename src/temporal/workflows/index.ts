import {
	ParentClosePolicy,
	condition,
	continueAsNew,
	defineQuery,
	defineSignal,
	defineUpdate,
	executeChild,
	log,
	proxyActivities,
	setHandler,
	sleep,
	startChild,
} from '@temporalio/workflow';
import type { Activities } from '../activities';
import {
	QueryName,
	SignalName,
	UpdateName,
	closeWorkflowId,
	reopenWorkflowId,
} from '../task-queues';
import type {
	AutomationCronInput,
	AutomationRunInput,
	AutomationRunState,
	AwaitingRenameInput,
	BulkCloseInput,
	BulkCloseResult,
	CascadeCloseUserInput,
	CloseTicketInput,
	DeferredRenameInput,
	ExportGuildInput,
	GenerateTranscriptInput,
	ImportGuildInput,
	ReconfigureStaleInput,
	ReopenState,
	ReopenWindowInput,
	StaleState,
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
// Reconfigurable live by the `reconfigureStale` Update; inspectable via the
// `getStaleState` Query.
// ---------------------------------------------------------------------------
const newActivitySignal = defineSignal<[number]>(SignalName.newActivity);
const cancelStaleSignal = defineSignal<[]>(SignalName.cancelStale);
const reconfigureStaleUpdate = defineUpdate<void, [ReconfigureStaleInput]>(UpdateName.reconfigureStale);
const staleStateQuery = defineQuery<StaleState>(QueryName.staleState);

const CONTINUE_AS_NEW_AFTER = 500;

export async function staleTicketWorkflow(input: StaleTicketInput): Promise<void> {
	const cfg = await acts.getStaleConfig(input.ticketId);
	if (!cfg.open) return;
	let staleAfterMs = cfg.staleAfterMs;
	if (!staleAfterMs) return; // stale handling disabled for this guild

	let lastActivityAt = input.lastActivityAt || cfg.lastActivityAt || Date.now();
	let activityVersion = 0;
	let totalSignals = input.signalCount ?? 0;
	let cancelled = false;
	let phase: StaleState['phase'] = 'waiting';
	let closeAtState: number | null = null;

	setHandler(newActivitySignal, (at: number) => {
		lastActivityAt = Math.max(lastActivityAt, at || Date.now());
		activityVersion++;
		totalSignals++;
	});
	setHandler(cancelStaleSignal, () => {
		cancelled = true;
	});
	// Live reconfigure when guild settings change. A non-positive threshold means
	// stale handling was disabled — stop the workflow. Bumping activityVersion
	// breaks the current wait so Phase 1 recomputes against the new threshold.
	setHandler(
		reconfigureStaleUpdate,
		(next: ReconfigureStaleInput) => {
			if (next.staleAfterMs <= 0) {
				cancelled = true;
			} else {
				staleAfterMs = next.staleAfterMs;
			}
			activityVersion++;
		},
		{
			validator: (next: ReconfigureStaleInput) => {
				if (!next || !Number.isFinite(next.staleAfterMs)) {
					throw new Error('reconfigureStale: staleAfterMs must be a finite number');
				}
			},
		},
	);
	setHandler(staleStateQuery, (): StaleState => ({
		closeAt: closeAtState,
		lastActivityAt,
		phase,
		staleAfterMs,
	}));

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
		phase = 'waiting';
		closeAtState = null;
		const v1 = activityVersion;
		const waitMs = lastActivityAt + staleAfterMs - Date.now();
		if (waitMs > 0) await condition(() => cancelled || activityVersion !== v1, waitMs);
		if (cancelled) return;
		if (activityVersion !== v1) continue; // activity reset the timer
		if (!(await acts.isTicketOpen(input.ticketId))) return;

		// Phase 2 — send the inactivity warning; get the auto-close epoch.
		const closeAt = await acts.sendStaleWarning(input.ticketId);
		phase = 'warned';
		if (closeAt == null) {
			// No auto-close: wait for the next activity, then re-arm.
			const v2 = activityVersion;
			await condition(() => cancelled || activityVersion !== v2);
			if (cancelled) return;
			continue;
		}
		closeAtState = closeAt;

		// Phase 3 — halfway "closing soon" reminder.
		const vWarn = activityVersion;
		const halfway = closeAt - (closeAt - Date.now()) / 2;
		const waitH = halfway - Date.now();
		if (waitH > 0) await condition(() => cancelled || activityVersion !== vWarn, waitH);
		if (cancelled) return;
		if (activityVersion !== vWarn) continue;
		if (!(await acts.isTicketOpen(input.ticketId))) return;
		phase = 'closing-soon';
		await acts.sendClosingSoon(input.ticketId, closeAt);

		// Phase 4 — wait until the auto-close deadline, then close.
		const waitC = closeAt - Date.now();
		if (waitC > 0) await condition(() => cancelled || activityVersion !== vWarn, waitC);
		if (cancelled) return;
		if (activityVersion !== vWarn) continue;
		// Re-read config at close time: checks open AND picks up a reopenWindow
		// changed since this (potentially days-old) workflow started.
		const closeCfg = await acts.getStaleConfig(input.ticketId);
		if (!closeCfg.open) return;
		phase = 'done';

		// If the guild grants a reopen grace window, defer the destructive close to
		// the reopen workflow; otherwise close immediately. startChild (not
		// executeChild): the grace window can be hours long and this parent must
		// not wait it out.
		if (closeCfg.reopenWindowMs > 0) {
			try {
				await startChild(reopenWindowWorkflow, {
					args: [{
						guildId: input.guildId,
						reason: 'inactivity',
						ticketId: input.ticketId,
						windowMs: closeCfg.reopenWindowMs,
					}],
					parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
					workflowId: reopenWorkflowId(input.ticketId),
				});
			} catch (err) {
				if (!isAlreadyStarted(err)) throw err;
			}
			return;
		}

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
// Reopen grace window: soft-close (lock, keep the channel) then either reopen
// on the `reopen` signal or perform the real terminal close when the window
// expires. Inspectable via the `getReopenState` Query.
// ---------------------------------------------------------------------------
const reopenSignal = defineSignal<[]>(SignalName.reopen);
const reopenStateQuery = defineQuery<ReopenState>(QueryName.reopenState);

export async function reopenWindowWorkflow(input: ReopenWindowInput): Promise<ReopenState> {
	let reopened = false;
	const closeAt = Date.now() + Math.max(0, input.windowMs);

	setHandler(reopenSignal, () => {
		reopened = true;
	});
	setHandler(reopenStateQuery, (): ReopenState => ({ closeAt, reopened }));

	// Enter the grace state: lock the channel (do NOT delete/archive) and post
	// the reopen button + countdown.
	await acts.softCloseTicket(input.ticketId, closeAt);

	const waitMs = closeAt - Date.now();
	if (waitMs > 0) await condition(() => reopened, waitMs);

	if (reopened) {
		await acts.reopenTicket(input.ticketId);
		return { closeAt, reopened: true };
	}

	// Window expired — perform the real, terminal close.
	try {
		await executeChild(closeTicketWorkflow, {
			args: [{
				closedBy: input.closedBy ?? null,
				lock: input.lock ?? false,
				reason: input.reason ?? null,
				ticketId: input.ticketId,
			}],
			parentClosePolicy: ParentClosePolicy.PARENT_CLOSE_POLICY_ABANDON,
			workflowId: closeWorkflowId(input.ticketId),
		});
	} catch (err) {
		if (!isAlreadyStarted(err)) throw err;
	}
	return { closeAt, reopened: false };
}

// ---------------------------------------------------------------------------
// Deferred channel rename.
//
// Discord allows two channel renames per ten minutes and then simply stalls, so
// the bot keeps its own budget. A rename refused by that budget used to be
// dropped and repaired by whatever wrote the name next — which, for a ticket
// nothing else happens to, is never.
//
// Temporal rather than a keyv entry and a `setTimeout`: the window is ten
// minutes, deploys land inside ten minutes, a process-local timer loses the
// rename when they do, and under more than one process every timer fires.
// ---------------------------------------------------------------------------
const renameRequestedSignal = defineSignal<[number]>(SignalName.renameRequested);

/**
 * How long a deferred rename may keep rescheduling itself.
 *
 * A channel being renamed every few minutes for hours is a loop, not a backlog,
 * and this stops one lingering after everyone has stopped caring what it says.
 */
const MAX_RENAME_DEFERRALS = 12;

export async function deferredRenameWorkflow(input: DeferredRenameInput): Promise<void> {
	let notBefore = input.notBefore;
	let version = 0;

	// Further requests while parked do not queue a second rename; they only pull
	// the deadline earlier if a slot frees up sooner than this one expected.
	setHandler(renameRequestedSignal, (at: number) => {
		if (at && at < notBefore) {
			notBefore = at;
			version++;
		}
	});

	for (let attempt = 0; attempt < MAX_RENAME_DEFERRALS; attempt++) {
		const waitMs = notBefore - Date.now();
		if (waitMs > 0) {
			const v = version;
			await condition(() => version !== v, waitMs);
			if (version !== v) continue; // an earlier slot was signalled
		}

		// The activity recomputes the name; a return of `null` means it is done,
		// a number means the budget was *still* exhausted and says when to retry.
		const retryAt = await acts.applyDeferredRename(input.ticketId);
		if (retryAt == null) return;
		notBefore = retryAt;
	}

	log.warn('Gave up deferring a channel rename', { ticketId: input.ticketId });
}

// ---------------------------------------------------------------------------
// Debounce the rename owed to the waiting-on-staff status flipping.
//
// The status flips on every human message, but Discord allows two channel
// renames per ten minutes, so renaming on each flip would exhaust the budget
// inside one exchange and spend the rest of the conversation parking deferrals
// for a name that is already stale.
//
// Leading-edge with a tail catch: the first flip starts the clock, flips during
// the wait are absorbed, and a flip *during the activity* runs one more pass.
// The signal must never push the deadline out — an active back-and-forth would
// then starve and the channel would never be renamed at all.
// ---------------------------------------------------------------------------
const awaitingChangedSignal = defineSignal<[]>(SignalName.awaitingChanged);

/**
 * How many times one debounce may re-run for the same ticket.
 *
 * Matches the spirit of `MAX_RENAME_DEFERRALS`: a ticket flipping this many
 * times without settling is a conversation, and the next message will start a
 * fresh workflow anyway.
 */
const MAX_AWAITING_PASSES = 5;

export async function awaitingRenameWorkflow(input: AwaitingRenameInput): Promise<void> {
	let pending = false;
	setHandler(awaitingChangedSignal, () => {
		pending = true;
	});

	const waitMs = input.notBefore - Date.now();
	if (waitMs > 0) await sleep(waitMs);

	for (let pass = 0; pass < MAX_AWAITING_PASSES; pass++) {
		// Clear before the activity, not after: a flip that lands *while* the
		// activity is reading the row would otherwise be erased by the reset and
		// lost, with no timer left to reschedule it.
		pending = false;

		// Recomputes from the row as it is now, and parks a deferral of its own
		// if the rename budget is exhausted. Nothing to inspect in the result:
		// the deferral ladder owns the retry from that point.
		await acts.applyAwaitingRename(input.ticketId);

		if (!pending) return;
	}

	log.warn('Gave up debouncing a waiting-status rename', { ticketId: input.ticketId });
}

// ---------------------------------------------------------------------------
// Bulk close (parent fan-out to bounded-concurrency child close workflows).
// ---------------------------------------------------------------------------
export async function bulkCloseWorkflow(input: BulkCloseInput): Promise<BulkCloseResult> {
	const concurrency = Math.max(1, input.concurrency ?? 5);
	const queue = [...input.ticketIds];
	let closed = 0;
	let failed = 0;

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
			if (isAlreadyStarted(err)) {
				closed++; // a close is already in flight for this ticket — idempotent
			} else {
				// Don't abort the whole batch on one bad ticket, but do record it.
				failed++;
				log.warn('bulkClose: failed to close ticket', { error: String(err), ticketId });
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
	if (failed > 0) log.warn('bulkClose finished with failures', { closed, failed });
	return { closed, failed };
}

// ---------------------------------------------------------------------------
// Cascade: close every open ticket a user created (they left the guild).
// ---------------------------------------------------------------------------
export async function cascadeCloseUserWorkflow(input: CascadeCloseUserInput): Promise<BulkCloseResult> {
	const ids = await acts.getOpenTicketIdsByUser(input.guildId, input.userId);
	if (!ids.length) return { closed: 0, failed: 0 };
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

export async function generateTranscriptWorkflow(input: GenerateTranscriptInput): Promise<{ ref: string | null }> {
	// A storage reference (`local:transcripts/...`), not a path: where the bytes
	// went is the storage layer's business, and on S3 there is no path at all.
	const ref = await longActs.regenerateTranscript(input.ticketId);
	return { ref };
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

/**
 * How many `flow.wait` hops one parked run may take.
 *
 * Each hop is a sleep plus an activity, so history grows linearly. Twenty is far
 * more than any sane automation and bounds the history without needing
 * continue-as-new — a graph is a DAG with a node cap, so it cannot legitimately
 * wait more times than it has nodes.
 */
const MAX_WAIT_HOPS = 20;

/**
 * Carry an automation run across its `flow.wait` nodes.
 *
 * The workflow owns the sleeping and nothing else: all the interpretation
 * happens back in the bot process, inside `resumeAutomationRun`. That keeps the
 * graph semantics in one place (`runtime.js`) rather than split across the
 * sandbox boundary.
 */
export async function automationRunWorkflow(input: AutomationRunInput): Promise<void> {
	let state: AutomationRunState = input.state;
	let waitMs = input.waitMs;

	for (let hop = 0; hop < MAX_WAIT_HOPS; hop++) {
		if (waitMs > 0) await sleep(waitMs);
		const result = await acts.resumeAutomationRun({
			runId: input.runId,
			state,
		});
		// Anything other than another park means the run is over — the activity
		// has already written the final row.
		if (result.status !== 'SUSPENDED' || !result.state) return;
		state = result.state;
		waitMs = result.waitMs ?? 0;
	}

	log.warn('Automation run exceeded the wait-hop limit', { runId: input.runId });
	await acts.failAutomationRun(input.runId, 'too_many_waits');
}

/** One tick of a `trigger.schedule.cron` automation. */
export async function automationCronWorkflow(input: AutomationCronInput): Promise<void> {
	await acts.startScheduledAutomation(input);
}

/** Delete run rows past the retention window and the per-guild cap. */
export async function automationRetentionWorkflow(): Promise<void> {
	await acts.pruneAutomationRuns();
}
