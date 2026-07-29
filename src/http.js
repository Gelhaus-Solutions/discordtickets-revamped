const fastify = require('fastify')({
	// The customization endpoint accepts avatars/banners as base64 data URIs,
	// which are ~4/3 the size of the source image. Fastify's 1 MiB default
	// rejected anything over ~768 KiB before the handler ever ran.
	bodyLimit: 8 * 1024 * 1024,
	trustProxy: process.env.HTTP_TRUST_PROXY === 'true',
});
const { short } = require('leeks.js');
const { join } = require('path');
const { existsSync } = require('fs');
const { pathToFileURL } = require('url');
const { collectRouteFiles } = require('./lib/routes');
const { getPrivilegeLevel } = require('./lib/users');
const { format } = require('util');
const { hkdfSync } = require('crypto');

process.env.ORIGIN = process.env.HTTP_INTERNAL || process.env.HTTP_EXTERNAL;

// Derive a JWT-signing secret. Prefer an explicit JWT_SECRET so JWT signing
// and at-rest data encryption don't share key material. If only
// ENCRYPTION_KEY is set, derive a separate sub-key via HKDF — this keeps
// existing deployments working while still giving cryptographic key
// separation between the two purposes.
function resolveJwtSecret(client) {
	if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
	if (!process.env.ENCRYPTION_KEY) {
		throw new Error('Neither JWT_SECRET nor ENCRYPTION_KEY is set');
	}
	if (client?.log?.warn) {
		client.log.warn('JWT_SECRET is not set — deriving JWT signing key from ENCRYPTION_KEY via HKDF. Set JWT_SECRET for proper key separation.');
	}
	return Buffer.from(hkdfSync('sha256', process.env.ENCRYPTION_KEY, Buffer.alloc(0), 'discord-tickets:jwt:v1', 32)).toString('base64');
}

module.exports = async client => {
	// These registrations are `await`ed rather than fire-and-forget because
	// @fastify/rate-limit installs its limiter from an `onRoute` hook. An
	// unawaited `register()` is only queued with avvio and doesn't boot until
	// `listen()` — long after the route-loading block below — so the hook never
	// fired for a single route and the limiter was a no-op on the whole app.

	// for file uploads
	await fastify.register(require('@fastify/multipart'), { limits: { fileSize: 2 ** 27 } }); // 128 MiB

	// cookies plugin, must be registered before oauth2 since oauth2@7.2.0
	await fastify.register(require('@fastify/cookie'));

	// security headers
	await fastify.register(require('@fastify/helmet'), {
		// Allow inline styles/scripts the SvelteKit dashboard build needs;
		// this can be tightened once the dashboard ships hashes/nonces.
		contentSecurityPolicy: false,
	});

	// rate limiting (defense-in-depth; per-route stricter limits below)
	await fastify.register(require('@fastify/rate-limit'), {
		max: 300,
		timeWindow: '1 minute',
	});

	// jwt plugin (separate secret from data encryption, see V13)
	await fastify.register(require('@fastify/jwt'), {
		cookie: {
			cookieName: 'token',
			signed: false,
		},
		secret: resolveJwtSecret(client),
	});

	// Activate Sentry if SENTRY_DNS is set
	if (process.env.SENTRY_DSN) {
		const Sentry = require('@sentry/node');
		Sentry.setupFastifyErrorHandler(fastify);
	}

	// auth

	/**
	 * Is this a top-level browser navigation rather than a fetch/XHR?
	 *
	 * Authenticated routes that a user can navigate to directly — `/transcript/:id`
	 * is opened in a new tab straight from the dashboard — used to answer an
	 * unauthenticated visitor with a raw JSON 401, which the browser rendered as
	 * text. Those callers get sent to the login flow instead. Everything else
	 * (the dashboard's own `fetch`es) must keep receiving JSON, because their
	 * error handling reads `body.elevate` and friends.
	 */
	const isBrowserNavigation = req => {
		if (req.headers['x-requested-with'] === 'XMLHttpRequest') return false;
		// Sent by every browser that supports Fetch Metadata; `fetch()` reports
		// `cors`/`same-origin` here, only address-bar/link navigations say `navigate`.
		const mode = req.headers['sec-fetch-mode'];
		if (mode) return mode === 'navigate';
		// Fallback for clients without Fetch Metadata: `fetch()` defaults to
		// `Accept: */*`, whereas a navigation asks for HTML explicitly.
		return (req.headers.accept ?? '').includes('text/html');
	};

	/**
	 * Is this a service token that may skip the elevated-scope re-auth?
	 *
	 * `service: true` used to be honoured on its own, and any authenticated
	 * dashboard user could mint such a token from `/api/users/@me/key`. Issuance
	 * is now restricted to `SUPER` operators, and the claim is only trusted for
	 * a user who is still in that list — so removing an id from `SUPER`
	 * immediately revokes its key, without waiting for the 90-day expiry.
	 *
	 * @param {{ id?: string, service?: boolean }} user the verified JWT payload
	 */
	const isServiceToken = user => user?.service === true && client.supers.includes(user.id);
	fastify.decorate('isServiceToken', isServiceToken);

	/**
	 * Send the caller through the OAuth flow and back to where they were going.
	 * `/auth/login` stores `r` in the state cookie and `/auth/callback` only
	 * honours it if it is a safe relative path.
	 */
	const redirectToLogin = (req, res, role) => {
		const params = new URLSearchParams({ r: req.url });
		if (role) params.set('role', role);
		return res.redirect(`/auth/login?${params}`, 302);
	};

	fastify.decorate('authenticate', async (req, res) => {
		try {
			const data = await req.jwtVerify();
			// Reject tokens that don't carry the expected lifetime fields rather
			// than letting `undefined < Date.now()` silently return false.
			// `Number.isFinite`, not `typeof`: JSON serialises NaN as null, but a
			// future change that keeps the number would otherwise pass this check
			// and then compare `NaN < Date.now()` — which is false, i.e. valid.
			if (!Number.isFinite(data.expiresAt) || !Number.isFinite(data.createdAt)) throw 'expired';
			if (data.expiresAt < Date.now()) throw 'expired';
			if (process.env.INVALIDATE_TOKENS) {
				const cutoff = new Date(process.env.INVALIDATE_TOKENS).getTime();
				if (Number.isFinite(cutoff) && data.createdAt < cutoff) throw 'expired';
			}
		} catch (error) {
			if (isBrowserNavigation(req)) return redirectToLogin(req, res);
			return res.code(401).send({
				error: 'Unauthorised',
				message: error === 'expired' ? 'Your token has expired; please re-authenticate.' : 'You are not authenticated.',
				statusCode: 401,
			});
		}
	});

	/**
	 * Fetch the requester's member object, mapping "not a member" to a 403.
	 *
	 * `GuildMemberManager#fetch` *rejects* with `DiscordAPIError[10007]` when the
	 * user isn't in the guild — it never resolves to a falsy value — so the
	 * `if (!guildMember)` check this replaces was unreachable, and the real
	 * not-a-member case fell into a catch that did a bare `res.send(err)`.
	 * That leaked the raw Discord error *and*, because an async hook that
	 * doesn't return its reply lets the request lifecycle continue, allowed the
	 * route handler to run for a user who is not a member of the guild.
	 * Every exit path here returns the reply.
	 *
	 * @returns {Promise<import("discord.js").GuildMember|null>} the member, or
	 * `null` when a response has already been sent.
	 */
	const fetchRequesterMember = async (req, res, guild) => {
		try {
			return await guild.members.fetch(req.user.id);
		} catch (error) {
			// 10007 unknown member, 10013 unknown user
			if (error?.code === 10007 || error?.code === 10013) {
				res.code(403).send({
					error: 'Forbidden',
					message: 'You are not permitted for this action.',
					statusCode: 403,
				});
				return null;
			}
			client.log.error('Failed to fetch member %s of guild %s', req.user.id, guild.id);
			client.log.error(error);
			res.code(500).send({
				error: 'Internal Server Error',
				message: 'Could not verify your membership of this guild.',
				statusCode: 500,
			});
			return null;
		}
	};

	fastify.decorate('isMember', async (req, res) => {
		const guildId = req.params.guild;
		const guild = client.guilds.cache.get(guildId);
		if (!guild) {
			return res.code(404).send({
				error: 'Not Found',
				message: 'The requested resource could not be found.',
				statusCode: 404,

			});
		}
		const guildMember = await fetchRequesterMember(req, res, guild);
		if (!guildMember) return res;
	});

	fastify.decorate('isAdmin', async (req, res) => {
		const guildId = req.params.guild;
		const guild = client.guilds.cache.get(guildId);
		if (!guild) {
			return res.code(404).send({
				error: 'Not Found',
				message: 'The requested resource could not be found.',
				statusCode: 404,

			});
		}
		if (client.banned_guilds.has(guildId)) {
			return res.code(451).send({
				error: 'Unavailable For Legal Reasons',
				message: 'This guild has been banned for breaking the terms of service.',
				statusCode: 451,
			});
		}
		if (!isServiceToken(req.user) && !req.user.scopes?.includes('applications.commands.permissions.update')) {
			// The dashboard reads `elevate` and re-authenticates itself; a
			// browser navigation has no such handler, so send it round the
			// admin login flow directly.
			if (isBrowserNavigation(req)) return redirectToLogin(req, res, 'admin');
			return res.code(401).send({
				elevate: 'admin',
				error: 'Unauthorised',
				message: 'Extra scopes required; reauthenticate.',
				statusCode: 401,
			});
		}
		const guildMember = await fetchRequesterMember(req, res, guild);
		if (!guildMember) return res;
		const isAdmin = await getPrivilegeLevel(guildMember) >= 2;
		if (!isAdmin) {
			return res.code(403).send({
				error: 'Forbidden',
				message: 'You are not permitted for this action.',
				statusCode: 403,

			});
		}
	});

	// body processing — own keys only (avoid walking prototype if upstream
	// hands us a polluted object).
	fastify.addHook('preHandler', (req, res, done) => {
		if (req.body && typeof req.body === 'object') {
			for (const prop of Object.keys(req.body)) {
				if (typeof req.body[prop] === 'string') {
					req.body[prop] = req.body[prop].trim();
				}
			}
		}
		done();
	});

	// logging
	fastify.addHook('onResponse', (req, res, done) => {
		done();
		const status = (res.statusCode >= 500
			? '&4'
			: res.statusCode >= 400
				? '&6'
				: res.statusCode >= 300
					? '&3'
					: res.statusCode >= 200
						? '&2'
						: '&f') + res.statusCode;
		let responseTime = res.elapsedTime.toFixed(2);
		responseTime = (responseTime >= 100
			? '&c'
			: responseTime >= 10
				? '&e'
				: '&a') + responseTime + 'ms';
		const level = req.routeOptions.url === '/status'
			? 'debug'
			: req.routeOptions.url === '/*'
				? 'verbose'
				: 'info';
		client.log[level].http(
			format(
				short(`${req.id} ${req.ip} ${req.method} %s &m-+>&r ${status}&b in ${responseTime}`),
				req.url,
			),
		);
		done();
	});

	fastify.addHook('onError', async (req, res, err) => client.log.error.http(req.id, err));

	// route loading
	const dir = join(__dirname, '/routes');
	collectRouteFiles(dir).forEach(file => {
		const path = file
			.substring(0, file.length - 3) // remove `.js`
			.substring(dir.length) // remove higher directories
			.replace(/\\/g, '/') // replace `\` with `/` because Windows is stupid
			.replace(/\[(\w+)\]/gi, ':$1') // convert [] to :
			.replace('/index', '') || '/'; // remove index
		const route = require(file);

		Object.keys(route).forEach(method => fastify.route({
			config: { client },
			method: method.toUpperCase(),
			path,
			...route[method](fastify),
		})); // register route
	});

	// The dashboard build is committed and ships alongside this file, so it is
	// found relative to `src/` — no cwd guessing and no hardcoded `/app`, each of
	// which was only ever right for one install method.
	let handlerModule;
	const handlerPath = join(__dirname, 'dashboard', 'build', 'handler.js');

	if (existsSync(handlerPath)) {
		try {
			// A file:// URL so dynamic import resolves correctly from CommonJS.
			handlerModule = await import(pathToFileURL(handlerPath).href);
			client.log.info('Using vendored dashboard build from ' + handlerPath);
		} catch (err) {
			client.log.error('Failed to import the dashboard build at ' + handlerPath, err && err.stack ? err.stack : err);
		}
	} else {
		client.log.warn('Dashboard build not found at ' + handlerPath + '; the dashboard will not be served.');
	}

	// Only register the dashboard handler if we successfully imported it.
	if (handlerModule && handlerModule.handler) {
		const { handler } = handlerModule;
		// https://stackoverflow.com/questions/72317071/how-to-set-up-fastify-correctly-so-that-sveltekit-works-fine
		fastify.all('/*', {}, (req, res) => {
			try {
				handler(req.raw, res.raw, () => {});
			} catch (err) {
				client.log.error.http('Dashboard handler error:', err);
				if (!res.headersSent) {
					res.statusCode = 500;
					res.send({ error: 'Internal Server Error' });
				}
			}
		});
	}

	// start the fastify server
	fastify.listen({
		host: process.env.HTTP_HOST,
		port: process.env.HTTP_PORT,
	}, (err, addr) => {
		if (err) {
			client.log.error.http(err);
		} else {
			client.log.success.http(`Listening at ${addr}`);
		}
	});

	process.on('sveltekit:error', ({
		error,
		errorId,
	}) => {
		client.log.error.http(`SvelteKit ${errorId} ${error}`);
	});
};
