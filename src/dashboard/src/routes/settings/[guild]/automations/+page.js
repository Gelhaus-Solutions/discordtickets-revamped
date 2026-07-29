import { error } from '@sveltejs/kit';

export async function load({ fetch, params }) {
	const [listResponse, catalogueResponse] = await Promise.all([
		fetch(`/api/admin/guilds/${params.guild}/automations`),
		fetch(`/api/admin/guilds/${params.guild}/automations/nodes`)
	]);

	for (const response of [listResponse, catalogueResponse]) {
		if (response.ok) continue;
		const isJSON = response.headers.get('Content-Type')?.includes('json');
		const body = isJSON ? await response.json() : await response.text();
		error(response.status, isJSON ? JSON.stringify(body) : body);
	}

	return {
		automations: await listResponse.json(),
		catalogue: await catalogueResponse.json()
	};
}
