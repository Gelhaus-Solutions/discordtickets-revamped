const { pools } = require('../../../../../lib/threads');
const { crypto } = pools;

/**
 * The caller's own tickets in a guild, for the portal's guild home page.
 *
 * This used to be a bare `findMany` with no `select`, which returned every
 * column — including `htmlTranscript`, the on-disk path to the ticket's
 * rendered transcript, and an encrypted `closedReason`. Neither has any
 * business in a member-facing payload, and the transcript path in particular
 * is the input to a route that joins it onto the data directory.
 *
 * Returns a bare array rather than a paginated envelope: one member's tickets
 * in one guild is a naturally small list, and the shape is what the existing
 * callers expect.
 */

const SELECT = {
	awaitingResponseFrom: true,
	category: {
		select: {
			emoji: true,
			name: true,
		},
	},
	categoryId: true,
	claimedById: true,
	closedAt: true,
	createdAt: true,
	firstResponseAt: true,
	id: true,
	lastMessageAt: true,
	number: true,
	open: true,
	priority: true,
	topic: true,
};

module.exports.get = fastify => ({
	handler: async (req, res) => {
		const { client } = req.routeOptions.config;
		/** @type {import("@prisma/client").PrismaClient} */
		const prisma = client.prisma;
		const guild = client.guilds.cache.get(req.params.guild);
		const { query } = req;

		const where = {
			createdById: req.user.id,
			guildId: guild.id,
		};
		if (query.status === 'open') where.open = true;
		else if (query.status === 'closed') where.open = false;

		const tickets = await prisma.ticket.findMany({
			// Open first, then newest — a member opening this page is almost
			// always looking for something still in progress.
			orderBy: [{ open: 'desc' }, { createdAt: 'desc' }],
			select: SELECT,
			take: Math.min(100, Math.max(1, parseInt(query.limit) || 50)),
			where,
		});

		res.send(await Promise.all(tickets.map(async ticket => {
			if (ticket.topic) {
				try {
					ticket.topic = await crypto.queue(w => w.decrypt(ticket.topic));
				} catch {
					ticket.topic = '[Decryption failed]';
				}
			}
			ticket.categoryName = ticket.category?.name ?? null;
			ticket.categoryEmoji = ticket.category?.emoji ?? null;
			delete ticket.category;
			return ticket;
		})));
	},
	onRequest: [fastify.authenticate, fastify.isMember],
});
