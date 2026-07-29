import { error } from '@sveltejs/kit';

export async function load({ fetch, params }) {
	const base = `/api/admin/guilds/${params.guild}/automations`;
	const responses = await Promise.all([
		fetch(`${base}/${params.automation}`),
		fetch(`${base}/${params.automation}/runs?limit=50`),
		fetch(`${base}/nodes`)
	]);

	for (const response of responses) {
		if (response.ok) continue;
		const isJSON = response.headers.get('Content-Type')?.includes('json');
		const body = isJSON ? await response.json() : await response.text();
		error(response.status, isJSON ? JSON.stringify(body) : body);
	}

	const [automation, runs, catalogue] = await Promise.all(responses.map((r) => r.json()));
	return { automation, catalogue, runs: runs.runs };
}
