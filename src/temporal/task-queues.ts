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
	bulkClose: 'bulkCloseWorkflow',
	cascadeCloseUser: 'cascadeCloseUserWorkflow',
	exportGuild: 'exportGuildWorkflow',
	importGuild: 'importGuildWorkflow',
	generateTranscript: 'generateTranscriptWorkflow',
	houstonStats: 'houstonStatsWorkflow',
	updateCheck: 'updateCheckWorkflow',
	dbMaintenance: 'dbMaintenanceWorkflow',
} as const;

/** Signal names used across workflows. */
export const SignalName = {
	newActivity: 'newActivity',
	requestClose: 'requestClose',
	cancelStale: 'cancelStale',
} as const;

/** Deterministic workflow ids so start/signal is idempotent. */
export const staleWorkflowId = (ticketId: string): string => `stale-${ticketId}`;
export const closeWorkflowId = (ticketId: string): string => `close-${ticketId}`;
export const exportWorkflowId = (guildId: string, stamp: string): string => `export-${guildId}-${stamp}`;
export const importWorkflowId = (guildId: string, stamp: string): string => `import-${guildId}-${stamp}`;
