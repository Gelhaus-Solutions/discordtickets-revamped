import { error } from '@sveltejs/kit';
import { importJSON } from '$lib/i18n';

const DAY = 86400;

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, parent, url }) {
	const { guild, locale } = await parent();

	// Seeded from the query string so a chosen range survives a reload, and
	// clamped to the presets the page offers: `since` is the only knob here, and
	// an arbitrary one would let a link ask for a window the page cannot draw.
	const requested = Number(url.searchParams.get('days'));
	const days = [30, 90, 365].includes(requested) ? requested : 30;
	const params = new URLSearchParams({
		since: String(Math.floor(Date.now() / 1000) - days * DAY)
	});

	const response = await fetch(`/api/guilds/${guild.id}/feedback?${params}`, {
		credentials: 'include'
	});

	// Loaded server-side rather than client-side so a 403 renders the portal's
	// error page instead of an empty chart.
	const isJSON = response.headers.get('Content-Type')?.includes('json');
	const body = isJSON ? await response.json() : await response.text();
	if (!response.ok) error(response.status, isJSON ? JSON.stringify(body) : body);

	return {
		days,
		initial: body,
		translations: importJSON(
			await import(`../../../../lib/locales/${locale}/_common.json`),
			await import(`../../../../lib/locales/${locale}/feedback.json`)
		)
	};
}
