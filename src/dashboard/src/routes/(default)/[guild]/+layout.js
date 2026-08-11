import { error } from '@sveltejs/kit';
import Big from 'big-integer';
import { importJSON } from '$lib/i18n';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params, parent }) {
	if (params.guild.split('.')[0] === 'favicon') error(404, 'Not Found');
	const { locale } = await parent();
	const guildId = new Big(params.guild, 36);
	const response = await fetch(`/api/guilds/${guildId}`);
	const body = await response.json();
	if (!response.ok) error(response.status, JSON.stringify(body));
	return {
		guild: body,
		// The nav moved into the layout, so the layout needs the strings for it.
		// Layout and page data are separate bags, so this does not collide with a
		// page that loads `_common.json` for itself.
		translations: importJSON(await import(`../../../lib/locales/${locale}/_common.json`))
	};
}
