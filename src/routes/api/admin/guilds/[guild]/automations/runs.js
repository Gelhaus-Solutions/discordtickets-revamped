const { runQuery } = require('../../../../../../lib/automations/http');

/**
 * The guild-wide run log.
 *
 * A static segment, so Fastify's radix router prefers it over the sibling
 * `:automation` parameter — and `loadAutomation` rejects non-numeric ids anyway,
 * so the two cannot be confused.
 */
module.exports.get = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const {
			before, limit, status,
		} = runQuery(req.query);

		const runs = await client.prisma.automationRun.findMany({
			orderBy: { createdAt: 'desc' },
			take: limit,
			where: {
				guildId: req.params.guild,
				...(status ? { status } : {}),
				...(before ? { createdAt: { lt: before } } : {}),
			},
		});

		return {
			nextBefore: runs.length === limit ? runs[runs.length - 1].createdAt : null,
			runs,
		};
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
