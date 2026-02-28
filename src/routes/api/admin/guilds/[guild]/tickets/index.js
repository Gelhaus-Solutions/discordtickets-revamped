const { pools } = require('../../../../../../lib/threads');
const { crypto } = pools;

module.exports.get = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const { query } = req;
		const tickets = await client.prisma.ticket.findMany({
			orderBy: { createdAt: 'asc' },
			select: {
				categoryId: true,
				claimedById: true,
				closedAt: true,
				closedById: true,
				closedReason: true,
				createdAt: true,
				createdById: true,
				firstResponseAt: true,
				guildId: true,
				htmlTranscript: true,
				id: true,
				messageCount: true,
				number: true,
				open: true,
				priority: true,
				topic: true,
			},
			where: {
				createdAt: { gte: query.since && new Date((Number(query.since) * 1000) || query.since) },
				guildId: req.params.guild,
			},
		});

		const base = process.env.HTTP_EXTERNAL;
		return Promise.all(
			tickets.map(async ticket => {
				ticket.closedReason &&= await crypto.queue(w => w.decrypt(ticket.closedReason));
				ticket.topic &&= await crypto.queue(w => w.decrypt(ticket.topic));
				// Build absolute transcript URL when the path exists
				if (ticket.htmlTranscript && base) {
					ticket.transcriptUrl = `${base}/api/admin/guilds/${ticket.guildId}/tickets/${ticket.id}/transcript`;
				}
				return ticket;
			}),
		);
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

