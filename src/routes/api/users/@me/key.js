module.exports.get = fastify => ({
	handler: async function (req, res) { // MUST NOT use arrow function syntax
		if (process.env.PUBLIC_BOT === 'true') {
			return res.code(400).send({
				error: 'Bad Request',
				message: 'API keys are not available on public bots.',
				statusCode: 400,
			});
		} else {
			const now = Date.now();
			// Service API keys expire after 90 days. Operators can rotate via
			// `INVALIDATE_TOKENS` (see http.js authenticate decorator) or by
			// re-issuing.
			const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
			return {
				token: this.jwt.sign({
					createdAt: now,
					expiresAt: now + ninetyDaysMs,
					id: req.user.id,
					service: true,
				}),
			};
		}
	},
	onRequest: [fastify.authenticate],
});
