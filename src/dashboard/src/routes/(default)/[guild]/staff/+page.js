import { error } from '@sveltejs/kit';
import { importJSON } from '$lib/i18n';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, parent, url }) {
	const { guild, locale } = await parent();

	// Seeded from the query string so the home page's summary strip can deep-link
	// straight into a bucket.
	const filter = url.searchParams.get('filter') ?? 'attention';
	const params = new URLSearchParams({
		filter,
		limit: '25',
		page: url.searchParams.get('page') ?? '1'
	});

	const response = await fetch(`/api/guilds/${guild.id}/tickets?${params}`, {
		credentials: 'include'
	});

	// Loaded server-side rather than client-side so a 403 renders the portal's
	// error page instead of an empty table. A level-0 member reaching this URL
	// should be told no, not shown a broken shell.
	const isJSON = response.headers.get('Content-Type')?.includes('json');
	const body = isJSON ? await response.json() : await response.text();
	if (!response.ok) error(response.status, isJSON ? JSON.stringify(body) : body);

	return {
		filter,
		initial: body,
		translations: importJSON(
			await import(`../../../../lib/locales/${locale}/_common.json`),
			await import(`../../../../lib/locales/${locale}/staff.json`)
		)
	};
}
