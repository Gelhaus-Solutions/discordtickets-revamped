const {
	loadAutomation,
	runQuery,
} = require('../../../../../../../lib/automations/http');

/** One automation's run log, newest first. */
module.exports.get = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const automation = await loadAutomation(client, req, res);
		if (!automation) return;

		const {
			before, limit, status,
		} = runQuery(req.query);
		const runs = await client.prisma.automationRun.findMany({
			orderBy: { createdAt: 'desc' },
			take: limit,
			where: {
				automationId: automation.id,
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
