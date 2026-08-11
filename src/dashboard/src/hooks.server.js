import { dev } from '$app/environment';

/**
 * The bot's own Sentry client, or null when it is not configured.
 *
 * Deliberately reached through a global rather than `import * as Sentry`. This
 * file is bundled by adapter-node into src/dashboard/build/server/, and the
 * runtime image ships that build *without* the dashboard's node_modules. A bare
 * import of `@sentry/sveltekit` here would either be inlined — dragging
 * `@sentry/node`'s module-loader hooks into an ESM chunk — or left external and
 * unresolvable, and the `catch` around the handler import in src/http.js would
 * swallow the failure and stop serving the dashboard entirely.
 *
 * The SvelteKit handler runs inside the bot's own process, so the SDK is
 * already initialised right there. `src/sentry-init.js` publishes it on this
 * global for exactly this purpose (a plain global, not `__SENTRY__`, which is
 * keyed by exact SDK version and would silently disconnect on an upgrade).
 */
const sentry = () => globalThis.__DT_SENTRY__ ?? null;

/**
 * Send the old `/<guildId>/…` URLs to their `/settings/<guildId>/…` homes.
 *
 * Scoped to 17-20 digits rather than `\d+`, because the portal addresses the
 * same guilds by a *base36* slug — `BigInt(id).toString(36)`, 11-12 characters
 * — and an all-digit slug would otherwise be swallowed by this rule and land
 * the visitor in the admin panel instead of the portal page they asked for.
 * Snowflakes are 17-20 digits, so the two forms cannot overlap at that length.
 *
 * It also turns "linked with the raw id by mistake" into an honest 404 rather
 * than a silent teleport into the settings tree.
 */
/** @type {import('@sveltejs/kit').Reroute} */
export function reroute({ url }) {
	const pathMatch = url.pathname.match(/^\/(\d{17,20})(\/.*)?$/);
	if (pathMatch && !url.pathname.startsWith('/settings/')) {
		const guildId = pathMatch[1];
		const rest = pathMatch[2] || '';
		return `/settings/${guildId}${rest}`;
	}
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const Sentry = sentry();
	if (!Sentry) {
		return await resolve(event, { filterSerializedResponseHeaders: () => true });
	}

	// Named by route id rather than pathname, so `/settings/[guild]/tags` is one
	// transaction instead of one per guild.
	return await Sentry.startSpan(
		{
			attributes: {
				'http.request.method': event.request.method,
				'sveltekit.route_id': event.route?.id ?? 'unknown'
			},
			name: `${event.request.method} ${event.route?.id ?? event.url.pathname}`,
			op: 'http.server.sveltekit'
		},
		() => resolve(event, { filterSerializedResponseHeaders: () => true })
	);
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

	// Reported here rather than left to the `sveltekit:error` bridge in
	// src/http.js, which only logs. Tagging with the same `errorId` the user is
	// shown means a screenshot of the error page resolves to a Sentry issue.
	// SvelteKit routes 404s through here too, so those are filtered out.
	const Sentry = sentry();
	if (Sentry && (event.route?.id || error?.status === undefined || error.status >= 500)) {
		try {
			Sentry.withScope((scope) => {
				scope.setTag('errorId', errorId);
				scope.setTag('sveltekit.route_id', event.route?.id ?? 'unknown');
				scope.setContext('sveltekit', {
					method: event.request.method,
					routeId: event.route?.id ?? null
				});
				Sentry.captureException(error);
			});
		} catch {
			// An error page must still render if reporting fails.
		}
	}

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
