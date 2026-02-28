// @ts-nocheck
import { error } from '@sveltejs/kit';
/** @param {Parameters<import('./$types').PageLoad>[0]} event */
export async function load({ fetch, params }) {
	const fetchOptions = { credentials: 'include' };
	const response = await fetch(`/api/admin/guilds/${params.guild}/settings`, fetchOptions);
	const isJSON = response.headers.get('Content-Type')?.includes('json');
	const body = isJSON ? await response.json() : await response.text();
	if (!response.ok) {
		error(response.status, isJSON ? JSON.stringify(body) : body);
	} else {
		// Try to fetch analytics data
		let analytics = null;
		try {
			const analyticsRes = await fetch(`/api/admin/guilds/${params.guild}/analytics`, fetchOptions);
			if (analyticsRes.ok) {
				analytics = await analyticsRes.json();
			}
		} catch (err) {
			console.error('Failed to load analytics:', err);
		}

		return {
			settings: body,
			analytics,
			channels: await (
				await fetch(`/api/admin/guilds/${params.guild}/data?query=channels.cache`, fetchOptions)
			).json(),
			locales: await (await fetch(`/api/locales`, fetchOptions)).json(),
			roles: await (await fetch(`/api/admin/guilds/${params.guild}/data?query=roles.cache`, fetchOptions)).json()		};
	}
}