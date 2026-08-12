import { error } from '@sveltejs/kit';

/** Mirrors MAX_RANGE_MS in src/routes/api/admin/guilds/[guild]/analytics.js. */
const MAX_RANGE_DAYS = 730;
const DEFAULT_RANGE_DAYS = 30;
const DAY = 86400;

/**
 * 'YYYY-MM-DD' to unix seconds at the UTC start or end of that day.
 * @param {string|null} value
 * @param {boolean} endOfDay
 * @returns {number|null} null when the value is absent or malformed
 */
function parseDay(value, endOfDay) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return null;
	const time = Date.parse(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}Z`);
	return Number.isNaN(time) ? null : Math.floor(time / 1000);
}

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params, parent, url }) {
	const now = Math.floor(Date.now() / 1000);

	// UTC end to end, because the report is: `ticketsPerDay` and `ticketsByHour`
	// are bucketed by UTC day and hour server-side, so anchoring the picker to
	// the viewer's local midnight would label days nobody asked for.
	//
	// Clamping duplicates what the server already does, deliberately — knowing
	// what we asked for is what lets the page notice the server answered with
	// something narrower and say so, rather than silently showing a different
	// range than the one in the inputs.
	let until = Math.min(parseDay(url.searchParams.get('until'), true) ?? now, now);
	let since = parseDay(url.searchParams.get('since'), false) ?? until - DEFAULT_RANGE_DAYS * DAY;
	if (since > until) since = until - DEFAULT_RANGE_DAYS * DAY;
	if (until - since > MAX_RANGE_DAYS * DAY) since = until - MAX_RANGE_DAYS * DAY;

	const rawCategory = url.searchParams.get('categoryId');
	const categoryId = /^\d+$/.test(rawCategory ?? '') ? rawCategory : '';

	const query = new URLSearchParams({
		since: String(since),
		until: String(until)
	});
	if (categoryId) query.set('categoryId', categoryId);

	// Started before `parent()` is awaited so the two round trips overlap.
	const request = fetch(`/api/admin/guilds/${params.guild}/analytics?${query}`);

	// The layout already holds `[{id, name, tickets}]` for every category, cached
	// server-side for five minutes, so the filter's <select> needs no request of
	// its own.
	const { guild } = await parent();

	const response = await request;
	const isJSON = response.headers.get('Content-Type')?.includes('json');
	const body = isJSON ? await response.json() : await response.text();
	// Propagated rather than swallowed: a statistics page that quietly renders
	// nothing when the request fails is indistinguishable from a quiet guild.
	if (!response.ok) error(response.status, isJSON ? JSON.stringify(body) : body);

	return {
		analytics: body,
		categories: guild.stats?.categories ?? [],
		filters: {
			categoryId,
			since,
			until
		}
	};
}
