import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
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
