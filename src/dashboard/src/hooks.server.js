import { dev } from '$app/environment';

/** @type {import('@sveltejs/kit').Reroute} */
export function reroute({ url }) {
	// Redirect old URL format (e.g., /1234567890/feedback) to new format (e.g., /settings/1234567890/feedback)
	// Only reroute if the path starts with a guild ID (numeric) and doesn't already have /settings/
	const pathMatch = url.pathname.match(/^\/(\d+)(\/.*)?$/);
	if (pathMatch && !url.pathname.startsWith('/settings/')) {
		const guildId = pathMatch[1];
		const rest = pathMatch[2] || '';
		return `/settings/${guildId}${rest}`;
	}
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({
	event, resolve,
}) {
	const response = await resolve(event, { filterSerializedResponseHeaders: () => true });
	return response;
}

/** @type {import('@sveltejs/kit').HandleServerError} */
export function handleError({
	error, event,
}) {
	const errorId = Date.now().toString(16);
	if (dev || process?.env.NODE_ENV === 'development') console.error(error);
	process?.emit('sveltekit:error', {
		error,
		errorId,
		event,
	});
	return {
		name: 'Internal Server Error',
		message: error.message,
		errorId,
	};
}
