/**
 * Task-queue names, workflow-id helpers, and workflow-type name constants.
 *
 * This file must NOT import `@temporalio/workflow` — it is imported by both the
 * sandboxed workflow bundle AND the plain-Node gateway/bot process.
 */

export const DEFAULT_TASK_QUEUE = 'discord-tickets';
export const DEFAULT_DEPLOYMENT_NAME = 'discord-tickets';

/** Canonical workflow-type names (must match the exported function names in ./workflows). */
export const WorkflowType = {
	staleTicket: 'staleTicketWorkflow',
	closeTicket: 'closeTicketWorkflow',
	reopenWindow: 'reopenWindowWorkflow',
	bulkClose: 'bulkCloseWorkflow',
	cascadeCloseUser: 'cascadeCloseUserWorkflow',
	exportGuild: 'exportGuildWorkflow',
	importGuild: 'importGuildWorkflow',
	generateTranscript: 'generateTranscriptWorkflow',
	houstonStats: 'houstonStatsWorkflow',
	updateCheck: 'updateCheckWorkflow',
} as const;

/** Coarse workflow classification, exposed as the `WorkflowKind` search attribute. */
export const WorkflowKind = {
	stale: 'stale',
	close: 'close',
	reopen: 'reopen',
	bulkClose: 'bulk-close',
	cascadeClose: 'cascade-close',
	export: 'export',
	import: 'import',
	transcript: 'transcript',
} as const;

/** Custom Search Attribute keys (registered on the namespace at startup). */
export const SearchAttr = {
	ticketId: 'TicketId',
	guildId: 'GuildId',
	userId: 'UserId',
	kind: 'WorkflowKind',
} as const;

/** Signal names used across workflows. */
export const SignalName = {
	newActivity: 'newActivity',
	requestClose: 'requestClose',
	cancelStale: 'cancelStale',
	reopen: 'reopen',
} as const;

/** Update names used across workflows. */
export const UpdateName = {
	reconfigureStale: 'reconfigureStale',
} as const;

/** Query names used across workflows. */
export const QueryName = {
	staleState: 'getStaleState',
	reopenState: 'getReopenState',
} as const;

/** Deterministic workflow ids so start/signal is idempotent. */
export const staleWorkflowId = (ticketId: string): string => `stale-${ticketId}`;
export const closeWorkflowId = (ticketId: string): string => `close-${ticketId}`;
export const reopenWorkflowId = (ticketId: string): string => `reopen-${ticketId}`;
// Per-guild (no timestamp): a second concurrent export/import for the same
// guild fails with WorkflowExecutionAlreadyStartedError, which the HTTP routes
// surface as 429. Re-running after completion reuses the id (allowed).
export const exportWorkflowId = (guildId: string): string => `export-${guildId}`;
export const importWorkflowId = (guildId: string): string => `import-${guildId}`;
