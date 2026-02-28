// @ts-nocheck
import { error } from '@sveltejs/kit';

/** @param {Parameters<import('./$types').PageLoad>[0]} event */
export async function load({ fetch, params }) {
	const fetchOptions = { credentials: 'include' };

	try {
		// Don't load transcripts initially - wait for user to search
		return {
			transcripts: [],
			totalTranscripts: 0,
			searched: false
		};
	} catch (err) {
		console.error('Failed to load transcripts:', err);
		return {
			transcripts: [],
			totalTranscripts: 0,
			searched: false
		};
	}
}
