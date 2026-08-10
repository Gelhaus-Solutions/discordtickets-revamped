import { error } from '@sveltejs/kit';

/**
 * Rendered on the client only, like the automation canvas next door.
 *
 * This page is a live editor: a block editor, a question list, an emoji picker
 * and a dozen inherit-or-override controls, none of which are useful as static
 * HTML. What it *was* getting from SSR was a hydration pass over a deeply
 * nested form — and when that pass went wrong the grid wrappers stopped
 * participating in layout, so the fields promoted into the outer two-column
 * grid and drew on top of each other. Svelte only reports a hydration mismatch
 * in dev builds, so in a production image the page simply came apart in silence.
 *
 * Turning SSR off removes the hydration step entirely rather than guessing at
 * which node diverged.
 */
export const ssr = false;

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params }) {
	const fetchOptions = { credentials: 'include' };
	let body;
	if (params.category === 'new') {
		// Every inheritable field starts as `null`, which means "use the server
		// default". Seeding them with the old hard-coded values would make each
		// new category an override from birth, so a server-wide setting could
		// never reach it — which is the whole point of having one.
		body = {
			channelName: null,
			claiming: false,
			cooldown: null,
			description: '',
			discordCategory: 'new',
			enableFeedback: false,
			blockedRoles: null,
			emoji: '',
			image: '',
			memberLimit: null,
			name: '',
			openingMessage: '',
			pingRoles: null,
			questions: [],
			ratelimit: null,
			requiredRoles: null,
			requireTopic: false,
			staffRoles: null,
			totalLimit: null,
			channelMode: 'CHANNEL',
			backupCategoryId: null
		};
	} else {
		const response = await fetch(
			`/api/admin/guilds/${params.guild}/categories/${params.category}`,
			fetchOptions
		);
		const isJSON = response.headers.get('Content-Type')?.includes('json');
		body = isJSON ? await response.json() : await response.text();
		if (!response.ok) {
			error(response.status, isJSON ? JSON.stringify(body) : body);
		}
	}

	let url = `/api/admin/guilds/${params.guild}/categories`;
	if (params.category !== 'new') url += `/${params.category}`;

	return {
		url,
		category: body,
		channels: await (
			await fetch(`/api/admin/guilds/${params.guild}/data?query=channels.cache`, fetchOptions)
		).json(),
		roles: await (
			await fetch(`/api/admin/guilds/${params.guild}/data?query=roles.cache`, fetchOptions)
		).json(),
		categories: await (
			await fetch(`/api/admin/guilds/${params.guild}/categories`, fetchOptions)
		).json(),
		settings: await (
			await fetch(`/api/admin/guilds/${params.guild}/settings`, fetchOptions)
		).json(),
		// Only automations a button press can start: the opening message's ticket
		// controls can carry buttons for them, and the API rejects the rest.
		automations: await (async () => {
			const response = await fetch(
				`/api/admin/guilds/${params.guild}/automations`,
				fetchOptions
			);
			if (!response.ok) return [];
			const body = await response.json();
			return (Array.isArray(body) ? body : []).filter((a) =>
				a.triggerTypes?.includes('trigger.button.pressed')
			);
		})()
	};
}
