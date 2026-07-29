const { randomUUID } = require('crypto');

/**
 * Issue a long-lived service API key.
 *
 * Restricted to the operators listed in `SUPER`. This used to be available to
 * *any* authenticated dashboard user, which handed out a 90-day bearer token
 * that survives an OAuth session revocation and is trusted to skip the
 * elevated-scope check in `isAdmin`. Nothing in the dashboard needs it; it
 * exists for operator tooling, so it is gated on the only notion of "operator"
 * this bot has.
 */
module.exports.get = fastify => ({
	handler: async function (req, res) { // MUST NOT use arrow function syntax
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;

		if (process.env.PUBLIC_BOT === 'true') {
			return res.code(400).send({
				error: 'Bad Request',
				message: 'API keys are not available on public bots.',
				statusCode: 400,
			});
		}

		if (!client.supers.includes(req.user.id)) {
			return res.code(403).send({
				error: 'Forbidden',
				message: 'Only the operators listed in the SUPER environment variable can issue service API keys.',
				statusCode: 403,
			});
		}

		const now = Date.now();
		// Service API keys expire after 90 days. Operators can rotate via
		// `INVALIDATE_TOKENS` (see the authenticate decorator in http.js), by
		// removing the id from `SUPER` (which stops the `service` claim being
		// trusted at all), or by re-issuing.
		const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
		return {
			token: this.jwt.sign({
				createdAt: now,
				expiresAt: now + ninetyDaysMs,
				id: req.user.id,
				jti: randomUUID(),
				service: true,
			}),
		};
	},
	onRequest: [fastify.authenticate],
});
