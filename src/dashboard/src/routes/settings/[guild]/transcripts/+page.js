/**
 * Deliberately loads nothing.
 *
 * The page searches on demand against `/api/admin/guilds/:guild/tickets`, so
 * fetching a first page here would be a query nobody looks at. The scaffolding
 * is returned so the page has a shape to start from.
 *
 * This used to wrap the literal below in a try/catch, which could not throw —
 * making the catch, and the `fetch`/`params` it never used, unreachable.
 *
 * @type {import('./$types').PageLoad}
 */
export async function load() {
	return {
		transcripts: [],
		totalTranscripts: 0,
		searched: false
	};
}
