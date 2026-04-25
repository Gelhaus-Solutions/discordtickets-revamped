const { pools } = require('../../../../../../lib/threads');
const { crypto } = pools;

module.exports.get = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const { query } = req;

		// Pagination support
		const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 50));
		const page = Math.max(1, parseInt(query.page) || 1);
		const skip = (page - 1) * limit;

		// Build where clause
		const where = { guildId: req.params.guild };

		// Optional: filter by date range
		if (query.since) {
			where.createdAt = { gte: new Date(Number(query.since) * 1000 || query.since) };
		}

		// Optional: filter by status
		if (query.status === 'open') {
			where.open = true;
		} else if (query.status === 'closed') {
			where.open = false;
		}

		// Optional: filter by transcript existence
		if (query.hasTranscript === 'true') {
			where.htmlTranscript = { not: null };
		}

		// Get total count for pagination
		const total = await client.prisma.ticket.count({ where });

		const tickets = await client.prisma.ticket.findMany({
			orderBy: { createdAt: 'desc' },
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
			where,
			skip,
			take: limit,
		});

		const base = process.env.HTTP_EXTERNAL;
		const decrypted = await Promise.all(
			tickets.map(async ticket => {
				if (ticket.closedReason) {
					try {
						ticket.closedReason = await crypto.queue(w => w.decrypt(ticket.closedReason));
					} catch (error) {
						ticket.closedReason = '[Decryption failed]';
					}
				}
				if (ticket.topic) {
					try {
						ticket.topic = await crypto.queue(w => w.decrypt(ticket.topic));
					} catch (error) {
						ticket.topic = '[Decryption failed]';
					}
				}
				// Build absolute transcript URL when the path exists
				if (ticket.htmlTranscript && base) {
					ticket.transcriptUrl = `${base}/api/admin/guilds/${ticket.guildId}/tickets/${ticket.id}/transcript`;
				}
				return ticket;
			}),
		);

		return {
			tickets: decrypted,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

