// @ts-nocheck
/** @param {Parameters<import('./$types').PageLoad>[0]} event */
export async function load({ fetch }) {
	const fetchOptions = { credentials: 'include' };
	return {
		guilds: await (await fetch(`/api/admin/guilds`, fetchOptions)).json()
	};
}
