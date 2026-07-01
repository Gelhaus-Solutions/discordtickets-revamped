/**
 * Custom Search Attributes so workflows are filterable in the Temporal UI/CLI
 * (e.g. `WorkflowKind="stale" AND GuildId="..."`). Registered idempotently on
 * the namespace at startup; workflow starts only attach them once registration
 * has succeeded, so a failure here can never break core ticket flows.
 */
import { temporal } from '@temporalio/proto';
import { getTemporalClient } from './client';
import { getTemporalConfig } from './config';
import { SearchAttr } from './task-queues';

const KEYWORD = temporal.api.enums.v1.IndexedValueType.INDEXED_VALUE_TYPE_KEYWORD;

let _registered = false;

const isAlreadyExists = (err: unknown): boolean => {
	if (!err || typeof err !== 'object') return false;
	const e = err as { code?: number; message?: string; details?: string };
	// gRPC ALREADY_EXISTS = 6; server wording varies across versions.
	return e.code === 6 || /already exists/i.test(e.message ?? '') || /already exists/i.test(e.details ?? '');
};

/** Register the custom search attributes on the namespace (idempotent). */
export async function ensureSearchAttributes(): Promise<boolean> {
	if (_registered) return true;
	const client = getTemporalClient();
	const { namespace } = getTemporalConfig();
	try {
		await client.connection.operatorService.addSearchAttributes({
			namespace,
			searchAttributes: {
				[SearchAttr.guildId]: KEYWORD,
				[SearchAttr.kind]: KEYWORD,
				[SearchAttr.ticketId]: KEYWORD,
				[SearchAttr.userId]: KEYWORD,
			},
		});
		_registered = true;
	} catch (err) {
		if (isAlreadyExists(err)) {
			_registered = true;
		} else {
			// Leave _registered false: starts will simply omit search attributes.
			return false;
		}
	}
	return _registered;
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
 * Build the `searchAttributes` payload for a workflow start, or undefined when
 * the attributes aren't registered (so the start can't be rejected).
 */
export function buildSearchAttributes(tags: WorkflowTags): Record<string, string[]> | undefined {
	if (!_registered) return undefined;
	const sa: Record<string, string[]> = { [SearchAttr.kind]: [tags.kind] };
	if (tags.ticketId) sa[SearchAttr.ticketId] = [tags.ticketId];
	if (tags.guildId) sa[SearchAttr.guildId] = [tags.guildId];
	if (tags.userId) sa[SearchAttr.userId] = [tags.userId];
	return sa;
}
