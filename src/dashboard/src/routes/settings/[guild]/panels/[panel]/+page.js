import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params }) {
	const fetchOptions = { credentials: 'include' };

	const [categories, channels, settings, automations] = await Promise.all([
		fetch(`/api/admin/guilds/${params.guild}/categories`, fetchOptions).then((r) => r.json()),
		fetch(`/api/admin/guilds/${params.guild}/data?query=channels.cache`, fetchOptions).then(
			(r) => r.json()
		),
		// `/settings` carries primaryColour and footer; the guild root returns stats.
		fetch(`/api/admin/guilds/${params.guild}/settings`, fetchOptions).then((r) =>
			r.ok ? r.json() : {}
		),
		// Only automations a button press can start — anything else would be a
		// button that does nothing, and the API rejects it on save.
		fetch(`/api/admin/guilds/${params.guild}/automations`, fetchOptions).then((r) =>
			r.ok ? r.json() : []
		)
	]);

	const buttonAutomations = (Array.isArray(automations) ? automations : []).filter((a) =>
		a.triggerTypes?.includes('trigger.button.pressed')
	);

	// `new` is not a panel id — it means "start from a blank layout", matching the
	// convention used by settings/[guild]/categories/[category].
	if (params.panel === 'new') {
		return {
			automations: buttonAutomations,
			categories,
			channels,
			panel: null,
			settings
		};
	}

	const response = await fetch(
		`/api/admin/guilds/${params.guild}/panels/${params.panel}`,
		fetchOptions
	);
	const isJSON = response.headers.get('Content-Type')?.includes('json');
	const body = isJSON ? await response.json() : await response.text();
	if (!response.ok) {
		error(response.status, isJSON ? JSON.stringify(body) : body);
	}

	return {
		automations: buttonAutomations,
		categories,
		channels,
		panel: body,
		settings
	};
}
