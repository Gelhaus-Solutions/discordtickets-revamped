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
export async function handle({ event, resolve }) {
	const response = await resolve(event, {
		filterSerializedResponseHeaders: () => true
	});
	return response;
}

/**
 * Paths served by the Fastify app rather than by SvelteKit. A same-origin
 * `fetch` for one of these from a `load` function finds no SvelteKit route, so
 * SvelteKit falls back to a *real* HTTP request against `ORIGIN` — i.e. back
 * out through the reverse proxy and in again. Behind Coolify/Traefik/Cloudflare
 * that round trip either fails or is answered by the proxy's own HTML error
 * page, and the `.json()` in the caller then throws
 * `Unexpected token '<', "<!DOCTYPE "...`. Keep the hop inside the container.
 */
const INTERNAL_PREFIXES = ['/api/', '/auth/', '/attachments/', '/avatars/', '/transcript/'];

/**
 * Base URL of our own HTTP server, reachable without leaving the container.
 * `HTTP_INTERNAL` wins when set; otherwise talk to the port Fastify is bound to
 * (a wildcard bind address becomes loopback).
 */
function internalOrigin() {
	if (process.env.HTTP_INTERNAL) return process.env.HTTP_INTERNAL.replace(/\/$/, '');
	const port = process.env.HTTP_PORT;
	if (!port) return null;
	let host = process.env.HTTP_HOST || '127.0.0.1';
	if (host === '0.0.0.0' || host === '::' || host === '*' || host === '') host = '127.0.0.1';
	if (host.includes(':')) host = `[${host}]`; // IPv6 literal
	return `http://${host}:${port}`;
}

/** @type {import('@sveltejs/kit').HandleFetch} */
export async function handleFetch({ event, request, fetch }) {
	const url = new URL(request.url);
	const isSameOrigin = url.origin === event.url.origin;
	const isInternalPath = INTERNAL_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));

	if (!isSameOrigin || !isInternalPath) return fetch(request);

	const origin = internalOrigin();
	if (!origin) return fetch(request);

	// Changing the origin makes this a cross-origin request as far as SvelteKit
	// is concerned, so it no longer forwards the browser's cookies for us —
	// every one of these endpoints authenticates with the `token` cookie, so
	// copy the incoming header across explicitly.
	const headers = new Headers(request.headers);
	const cookie = event.request.headers.get('cookie');
	if (cookie) headers.set('cookie', cookie);
	headers.set('x-forwarded-host', event.url.host);
	headers.set('x-forwarded-proto', event.url.protocol.replace(':', ''));

	const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
	const rewritten = new Request(origin + url.pathname + url.search, {
		body: hasBody ? request.body : undefined,
		duplex: 'half', // required by undici whenever a body stream is passed
		headers,
		method: request.method,
		signal: request.signal
	});

	return fetch(rewritten);
}

/** @type {import('@sveltejs/kit').HandleServerError} */
export function handleError({ error, event }) {
	const errorId = Date.now().toString(16);
	if (dev || process?.env.NODE_ENV === 'development') console.error(error);
	process?.emit('sveltekit:error', {
		error,
		errorId,
		event
	});
	return {
		name: 'Internal Server Error',
		message: error.message,
		errorId
	};
}
