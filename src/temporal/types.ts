/**
 * Shared input/output types for workflows and activities.
 * No runtime imports — safe for both the sandbox and the gateway.
 */

export interface CloseTicketInput {
	ticketId: string;
	/** Discord user id that requested the close, or null for automated closes. */
	closedBy?: string | null;
	reason?: string | null;
	/** When true, lock the channel/thread instead of deleting it. */
	lock?: boolean;
}

export interface StaleTicketInput {
	ticketId: string;
	guildId: string;
	/** Epoch ms of the last known activity, used to seed the inactivity timer. */
	lastActivityAt: number;
	/** Carried across Continue-As-New. */
	signalCount?: number;
}

/** Args for the `reconfigureStale` Update (live guild-setting change). */
export interface ReconfigureStaleInput {
	/** New inactivity threshold in ms; <= 0 disables and stops the workflow. */
	staleAfterMs: number;
}

/** State exposed by the `getStaleState` Query. */
export interface StaleState {
	phase: 'waiting' | 'warned' | 'closing-soon' | 'done';
	lastActivityAt: number;
	/** Epoch ms the ticket is scheduled to auto-close, or null if not yet warned. */
	closeAt: number | null;
	staleAfterMs: number;
}

export interface BulkCloseInput {
	ticketIds: string[];
	closedBy?: string | null;
	reason?: string | null;
	lock?: boolean;
	/** Max concurrent child close workflows. */
	concurrency?: number;
}

export interface BulkCloseResult {
	closed: number;
	failed: number;
}

export interface ReopenWindowInput {
	ticketId: string;
	guildId: string;
	/** Grace-window length in ms before the ticket is terminally closed. */
	windowMs: number;
	closedBy?: string | null;
	reason?: string | null;
	/** When true, lock (don't delete) at terminal close. */
	lock?: boolean;
}

/** State exposed by the `getReopenState` Query. */
export interface ReopenState {
	/** Epoch ms the grace window ends and the ticket is terminally closed. */
	closeAt: number;
	reopened: boolean;
}

export interface CascadeCloseUserInput {
	guildId: string;
	userId: string;
	reason?: string | null;
}

export interface ExportGuildInput {
	guildId: string;
	/** Absolute path the ZIP should be written to. */
	outputPath: string;
	requestedBy?: string | null;
}

export interface ImportGuildInput {
	guildId: string;
	/** Absolute path of the uploaded archive to import. */
	archivePath: string;
	requestedBy?: string | null;
}

export interface GenerateTranscriptInput {
	ticketId: string;
}

export interface JobResult {
	ok: boolean;
	message?: string;
}

/**
 * A parked automation run.
 *
 * Ids only — never a discord.js object, a Map, a Set or a Date. This crosses
 * the Temporal boundary as JSON and may sit there for days, and
 * `scripts/check-automations.js` asserts the round trip is lossless.
 */
export interface AutomationRunState {
	runId: string;
	automationId: number;
	guildId: string;
	triggerType: string;
	actorId: string | null;
	ticketId: string | null;
	channelId: string | null;
	messageId: string | null;
	selection: string[] | null;
	vars: Record<string, unknown>;
	depth: number;
	stepsUsed: number;
	/** Nodes already executed, so a resumed run keeps the at-most-once rule. */
	executed: string[];
	/** Node ids still to run. */
	queue: string[];
	trace: unknown[];
}

export interface AutomationRunInput {
	runId: string;
	automationId: number;
	guildId: string;
	state: AutomationRunState;
	/** How long to sleep before resuming. */
	waitMs: number;
}

export interface AutomationResumeResult {
	status: string;
	/** Present only when the run hit another `flow.wait`. */
	waitMs?: number;
	state?: AutomationRunState;
}

export interface AutomationCronInput {
	automationId: number;
	guildId: string;
	/** Which `trigger.schedule.cron` node in the graph this schedule belongs to. */
	nodeId: string;
}

/**
 * A rename that Discord's rate limit would not let us do now.
 *
 * Carries **no name** — only the ticket and when a slot frees up. The activity
 * recomputes the managed name from the database when it fires, which is
 * strictly stronger than "the latest desired name wins": if the ticket was
 * claimed, re-prioritised, moved, given a different emoji override, or its
 * category's emoji settings changed while the rename was parked, the one rename
 * that happens is correct for the state at that moment. Two deferred renames
 * for one channel cannot disagree, because neither carries an opinion.
 */
export interface DeferredRenameInput {
	ticketId: string;
	guildId: string;
	/** Epoch ms: the earliest the rename budget will have a slot. */
	notBefore: number;
}
