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
	warned?: boolean;
	halfwaySent?: boolean;
	signalCount?: number;
}

export interface BulkCloseInput {
	ticketIds: string[];
	closedBy?: string | null;
	reason?: string | null;
	lock?: boolean;
	/** Max concurrent child close workflows. */
	concurrency?: number;
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
