import { error } from '@sveltejs/kit';
import { importJSON } from '$lib/i18n';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, parent, url }) {
	const { guild, locale } = await parent();

	// Seeded from the query string so a link into a bucket, or a reload after
	// paging, lands where it said it would.
	const status = url.searchParams.get('status') ?? 'all';
	const params = new URLSearchParams({
		limit: '25',
		page: url.searchParams.get('page') ?? '1',
		status
	});
	const categoryId = url.searchParams.get('categoryId') ?? '';
	if (categoryId) params.set('categoryId', categoryId);

	const response = await fetch(`/api/guilds/${guild.id}/tickets/@me?${params}`, {
		credentials: 'include'
	});

	// Loaded server-side rather than client-side so a 403 renders the portal's
	// error page instead of an empty table.
	const isJSON = response.headers.get('Content-Type')?.includes('json');
	const body = isJSON ? await response.json() : await response.text();
	if (!response.ok) error(response.status, isJSON ? JSON.stringify(body) : body);

	return {
		categoryId,
		initial: body,
		status,
		translations: importJSON(
			await import(`../../../../lib/locales/${locale}/_common.json`),
			await import(`../../../../lib/locales/${locale}/tickets.json`)
		)
	};
}
