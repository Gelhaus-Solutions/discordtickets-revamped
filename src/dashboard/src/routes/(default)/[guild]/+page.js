import { importJSON } from '$lib/i18n';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, parent }) {
	const { guild, locale } = await parent();
	const opts = { credentials: 'include' };

	const [mine, counts] = await Promise.all([
		fetch(`/api/guilds/${guild.id}/tickets/@me?status=open`, opts),
		// Staff only, and only the totals — the full list lives on the staff page.
		guild.privilegeLevel > 0
			? fetch(`/api/guilds/${guild.id}/tickets?countsOnly=true`, opts).catch(() => null)
			: null
	]);

	return {
		// null means the strip is unavailable, which is not the same as all-zero
		// and must not be rendered as though the queue were empty. A failure here
		// degrades to no strip rather than taking the page down.
		counts: counts?.ok ? (await counts.json()).counts : null,
		// Likewise: null is "could not load", [] is "you have none".
		tickets: mine.ok ? await mine.json() : null,
		translations: importJSON(
			await import(`../../../lib/locales/${locale}/_common.json`),
			await import(`../../../lib/locales/${locale}/portal.json`)
		)
	};
}
