import { error, redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params, url }) {
	// The placeholder catalogue is the same for every guild and every visitor, so
	// it is fetched once here rather than by each of the dozen editors that need
	// it, and handed down through Svelte context in +layout.svelte.
	const [response, catalogue] = await Promise.all([
		fetch(`/api/admin/guilds/${params.guild}`),
		fetch('/api/placeholders')
	]);
	const isJSON = response.headers.get('Content-Type')?.includes('json');
	const body = isJSON ? await response.json() : await response.text();
	if (response.status === 401 && body.elevate) {
		redirect(
			307,
			`/auth/login?r=${encodeURIComponent(url.pathname + url.search)}&role=${body.elevate}`
		);
	} else if (!response.ok) {
		error(response.status, isJSON ? JSON.stringify(body) : body);
	} else {
		return {
			guild: body,
			// A picker with nothing in it is a worse page, not a broken one, so a
			// failure here must not take the settings down with it.
			placeholders: catalogue.ok ? await catalogue.json() : { contexts: [], placeholders: [] }
		};
	}
}
