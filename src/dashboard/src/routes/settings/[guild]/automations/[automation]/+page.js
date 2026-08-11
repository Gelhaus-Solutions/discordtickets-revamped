import { error } from '@sveltejs/kit';

// Svelte Flow measures the DOM to place handles and edges, so there is nothing
// to gain from rendering a canvas on the server.
export const ssr = false;

export async function load({ fetch, params }) {
	const isNew = params.automation === 'new';

	const requests = [
		fetch(`/api/admin/guilds/${params.guild}/automations/nodes`),
		fetch(`/api/admin/guilds/${params.guild}/data?query=roles.cache`),
		fetch(`/api/admin/guilds/${params.guild}/data?query=channels.cache`),
		fetch(`/api/admin/guilds/${params.guild}/categories`),
		fetch(`/api/admin/guilds/${params.guild}/automations`),
		...(isNew
			? []
			: [fetch(`/api/admin/guilds/${params.guild}/automations/${params.automation}`)])
	];

	// In flight alongside the others, but kept out of the array so it skips the
	// strict check below: this only feeds the message preview's footer and accent
	// colour, and a settings hiccup should not take the whole canvas down.
	const settingsRequest = fetch(`/api/admin/guilds/${params.guild}/settings`)
		.then((r) => (r.ok ? r.json() : {}))
		.catch(() => ({}));

	const responses = await Promise.all(requests);
	for (const response of responses) {
		if (response.ok) continue;
		const isJSON = response.headers.get('Content-Type')?.includes('json');
		const body = isJSON ? await response.json() : await response.text();
		error(response.status, isJSON ? JSON.stringify(body) : body);
	}

	const [[catalogue, roles, channels, categories, siblings, automation], settings] =
		await Promise.all([Promise.all(responses.map((r) => r.json())), settingsRequest]);

	return {
		automation: automation ?? null,
		// What an `action.message.send` button may point at. The server rejects
		// anything else, so the picker only offers these.
		// `triggerTypes` is a list — the API has never sent a singular
		// `triggerType`, so this filter used to match nothing and the "start
		// another automation" option never appeared.
		buttonAutomations: siblings
			.filter(
				(a) =>
					(a.triggerTypes ?? []).includes('trigger.button.pressed') &&
					a.id !== Number(params.automation)
			)
			.map((a) => ({ key: a.key, name: a.name })),
		catalogue,
		categories,
		channels,
		isNew,
		// Colouring matches the category editor's role picker.
		roles: roles
			.filter((r) => r.name !== '@everyone')
			.sort((a, b) => b.rawPosition - a.rawPosition)
			.map((r) => {
				const hex = r.color > 0 ? `#${r.color.toString(16).padStart(6, '0')}` : null;
				return { ...r, _style: hex ? `color: ${hex}` : '' };
			}),
		// Only the two fields the message preview needs. The bot renders the guild
		// footer and accent colour on automation messages too, so a preview without
		// them is showing a message that will not be sent.
		settings
	};
}
