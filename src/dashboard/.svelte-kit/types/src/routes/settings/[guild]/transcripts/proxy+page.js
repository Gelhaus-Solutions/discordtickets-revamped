// @ts-nocheck
import { error } from '@sveltejs/kit';

/** @param {Parameters<import('./$types').PageLoad>[0]} event */
export async function load({ fetch, params }) {
	const fetchOptions = { credentials: 'include' };

	try {
		// Fetch tickets with transcripts
		const ticketsRes = await fetch(`/api/admin/guilds/${params.guild}/tickets?limit=100`, fetchOptions);
		const tickets = ticketsRes.ok ? await ticketsRes.json() : [];

		// Filter tickets that have transcripts
		const transcripts = Array.isArray(tickets) ? tickets.filter(t => t.transcript) : [];

		return {
			transcripts,
			totalTranscripts: transcripts.length
		};
	} catch (err) {
		console.error('Failed to load transcripts:', err);
		return {
			transcripts: [],
			totalTranscripts: 0
		};
	}
}
