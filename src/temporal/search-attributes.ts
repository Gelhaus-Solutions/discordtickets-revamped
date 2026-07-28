/**
 * Custom Search Attributes so workflows are filterable in the Temporal UI/CLI
 * (e.g. `WorkflowKind="stale" AND GuildId="..."`). Registered idempotently on
 * the namespace at startup; workflow starts only attach the attributes the
 * namespace is actually known to have, so a failure here can never break core
 * ticket flows.
 */
import { temporal } from '@temporalio/proto';
import { getTemporalClient } from './client';
import { getTemporalConfig } from './config';
import { SearchAttr } from './task-queues';

const IndexedValueType = temporal.api.enums.v1.IndexedValueType;
const KEYWORD = IndexedValueType.INDEXED_VALUE_TYPE_KEYWORD;

/** Every attribute this bot wants; all of them are Keywords. */
const REQUIRED: readonly string[] = [
	SearchAttr.guildId,
	SearchAttr.kind,
	SearchAttr.ticketId,
	SearchAttr.userId,
];

/** Backoff for the background re-registration attempts (last entry = give up). */
const RETRY_DELAYS_MS = [10_000, 30_000, 120_000, 600_000];

export interface SearchAttributeLogger {
	debug?: (...args: unknown[]) => void;
	info?: (...args: unknown[]) => void;
	warn?: (...args: unknown[]) => void;
}

/**
 * Attribute names confirmed to exist on the namespace *as Keywords*. Only these
 * are attached to workflow starts: sending an unregistered (or wrongly typed)
 * attribute makes the server reject the start outright, which would take ticket
 * flows down with it.
 */
const usable = new Set<string>();
let _registered = false;
let _retryTimer: ReturnType<typeof setTimeout> | null = null;
let _stopped = false;

const asRecord = (err: unknown): { code?: unknown; message?: string; details?: string } =>
	(err && typeof err === 'object' ? err : {}) as { code?: unknown; message?: string; details?: string };

/** gRPC status code, when the error carries one. */
const rpcCode = (err: unknown): number | undefined => {
	const code = asRecord(err).code;
	return typeof code === 'number' ? code : undefined;
};

const describe = (err: unknown): string => {
	const e = asRecord(err);
	const text = e.details || e.message || String(err);
	const code = rpcCode(err);
	return code === undefined ? text : `[gRPC ${code}] ${text}`;
};

const isAlreadyExists = (err: unknown): boolean => {
	const e = asRecord(err);
	// gRPC ALREADY_EXISTS = 6; server wording varies across versions.
	return rpcCode(err) === 6 || /already exists/i.test(e.message ?? '') || /already exists/i.test(e.details ?? '');
};

/**
 * Whether retrying is pointless: the cluster does not expose the Operator
 * service to us at all (UNIMPLEMENTED / PERMISSION_DENIED / UNAUTHENTICATED).
 * This is the usual shape of the failure when the frontend sits behind a proxy
 * that only forwards WorkflowService, or when the namespace's auth claims don't
 * include admin rights — no amount of waiting fixes either.
 */
const isPermanent = (err: unknown): boolean => {
	const code = rpcCode(err);
	if (code === 12 || code === 7 || code === 16) return true;
	return /unimplemented|unknown method|permission denied|unauthenticated|unauthorized/i
		.test(`${asRecord(err).message ?? ''} ${asRecord(err).details ?? ''}`);
};

/** The namespace's current custom search attributes (`name -> IndexedValueType`). */
async function listCustomAttributes(namespace: string): Promise<Record<string, number>> {
	const client = getTemporalClient();
	const res = await client.connection.operatorService.listSearchAttributes({ namespace });
	return (res.customAttributes ?? {}) as Record<string, number>;
}

const typeName = (type: number | undefined): string =>
	IndexedValueType[type as number] ?? String(type);

/**
 * One registration pass: look at what the namespace already has, add whatever
 * is missing, then record which attributes are actually safe to attach.
 * Returns true only when all four are present as Keywords.
 */
async function attemptRegistration(log?: SearchAttributeLogger): Promise<boolean> {
	const { namespace } = getTemporalConfig();

	let present: Record<string, number>;
	try {
		present = await listCustomAttributes(namespace);
	} catch (err) {
		log?.warn?.(`Could not read Temporal search attributes on namespace "${namespace}": ${describe(err)}`);
		return false;
	}

	const missing = REQUIRED.filter(name => present[name] === undefined);
	if (missing.length > 0) {
		try {
			await getTemporalClient().connection.operatorService.addSearchAttributes({
				namespace,
				// Only the missing ones: AddSearchAttributes is all-or-nothing on some
				// server versions, so including an existing name can fail the batch.
				searchAttributes: Object.fromEntries(missing.map(name => [name, KEYWORD])),
			});
		} catch (err) {
			if (!isAlreadyExists(err)) {
				log?.warn?.(
					`Could not register Temporal search attributes (${missing.join(', ')}) ` +
					`on namespace "${namespace}": ${describe(err)}`,
				);
				if (isPermanent(err)) throw err; // no point retrying — surfaced to the caller
			}
		}
		// Re-read rather than assume: the add may have partially applied, and this
		// is also what catches a server that accepts the call but ignores it.
		try {
			present = await listCustomAttributes(namespace);
		} catch (err) {
			log?.debug?.(`Could not re-read Temporal search attributes: ${describe(err)}`);
		}
	}

	usable.clear();
	for (const name of REQUIRED) {
		const type = present[name];
		if (type === undefined) continue;
		if (type === KEYWORD) usable.add(name);
		else log?.warn?.(`Temporal search attribute ${name} exists as ${typeName(type)}, expected Keyword; it will not be set on workflows`);
	}

	_registered = usable.size === REQUIRED.length;
	return _registered;
}

/** Retry in the background so a transient failure heals without a bot restart. */
function scheduleRetry(log?: SearchAttributeLogger, attempt = 0): void {
	if (_stopped || _registered || _retryTimer || attempt >= RETRY_DELAYS_MS.length) return;
	_retryTimer = setTimeout(() => {
		_retryTimer = null;
		if (_stopped) return;
		attemptRegistration(log).then(
			ok => {
				if (ok) log?.info?.('Temporal search attributes registered; new workflows will be tagged');
				else scheduleRetry(log, attempt + 1);
			},
			() => { /* permanent failure — already logged, stop retrying */ },
		);
	}, RETRY_DELAYS_MS[attempt]);
	// Never hold the process open just for a retry.
	_retryTimer.unref?.();
}

/**
 * Register the custom search attributes on the namespace (idempotent).
 *
 * Non-fatal by contract: on failure the workflow starts simply omit the
 * attributes. It used to swallow the error entirely, which left the startup
 * warning with no cause attached and no way to find out — the reason is now
 * logged, and a background retry picks up transient failures.
 */
export async function ensureSearchAttributes(log?: SearchAttributeLogger): Promise<boolean> {
	if (_registered) return true;
	_stopped = false;
	try {
		if (await attemptRegistration(log)) return true;
	} catch {
		// Permanent (operator API unavailable to us): logged in attemptRegistration.
		return false;
	}
	scheduleRetry(log);
	return false;
}

/** Cancel any pending background retry (called on shutdown). */
export function stopSearchAttributeRetries(): void {
	_stopped = true;
	if (_retryTimer) {
		clearTimeout(_retryTimer);
		_retryTimer = null;
	}
}

export function searchAttributesRegistered(): boolean {
	return _registered;
}

export interface WorkflowTags {
	kind: string;
	ticketId?: string;
	guildId?: string;
	userId?: string;
}

/**
 * Build the `searchAttributes` payload for a workflow start, limited to the
 * attributes the namespace is known to accept (undefined when there are none,
 * so the start can't be rejected).
 */
export function buildSearchAttributes(tags: WorkflowTags): Record<string, string[]> | undefined {
	if (usable.size === 0) return undefined;
	const sa: Record<string, string[]> = {};
	const set = (name: string, value?: string) => {
		if (value && usable.has(name)) sa[name] = [value];
	};
	set(SearchAttr.kind, tags.kind);
	set(SearchAttr.ticketId, tags.ticketId);
	set(SearchAttr.guildId, tags.guildId);
	set(SearchAttr.userId, tags.userId);
	return Object.keys(sa).length > 0 ? sa : undefined;
}
