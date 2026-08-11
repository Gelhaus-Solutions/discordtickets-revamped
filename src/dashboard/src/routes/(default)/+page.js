import { redirect } from '@sveltejs/kit';
import Big from 'big-integer';
// import { importJSON } from '@eartharoid/vite-plugin-i18n'; // doesn't work?
import { importJSON } from '$lib/i18n';

/** @type {import('./$types').PageLoad} */
export async function load({ parent, fetch }) {
	const { locale } = await parent();
	const guilds = await (await fetch('/api/guilds')).json();
	// No redirect for the empty case any more. Bouncing someone with no shared
	// servers into the admin panel showed them a second empty list and no way
	// forward; the page below has an invite link, which is the actual next step.
	if (guilds.length === 1) {
		// The base36 slug, not the raw id. `reroute()` in hooks.server.js rewrites
		// any path whose first segment is all digits to `/settings/<id>`, so the
		// numeric form this used to send bounced the one-guild case straight back
		// into the admin panel — which, while the portal root redirected to
		// /settings anyway, was invisible.
		redirect(302, `/${new Big(guilds[0].id).toString(36)}`);
	}
	return {
		translations: importJSON(
			await import(`../../lib/locales/${locale}/_common.json`),
			await import(`../../lib/locales/${locale}/misc.json`)
		),
		guilds
	};
}
