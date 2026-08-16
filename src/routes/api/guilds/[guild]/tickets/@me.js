const { pools } = require('../../../../../lib/threads');
const { crypto } = pools;

/**
 * The caller's own tickets in a guild, for the portal.
 *
 * This used to be a bare `findMany` with no `select`, which returned every
 * column — including `htmlTranscript`, the on-disk path to the ticket's
 * rendered transcript, and an encrypted `closedReason`. Neither has any
 * business in a member-facing payload, and the transcript path in particular
 * is the input to a route that joins it onto the data directory.
 *
 * It also used to return a bare array, on the reasoning that one member's
 * tickets in one guild is a naturally small list. That held while the only
 * caller was the guild home page's teaser; the tickets page pages through the
 * whole archive and needs a total, so this returns the same
 * `{ pagination, ... }` envelope as every other list route.
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

/** Flatten the category join and decrypt the topic. */
async function present(ticket) {
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
}

module.exports.get = fastify => ({
	handler: async req => {
		const { client } = req.routeOptions.config;
		/** @type {import("@prisma/client").PrismaClient} */
		const prisma = client.prisma;
		const guild = client.guilds.cache.get(req.params.guild);
		const { query } = req;

		const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 25));
		const page = Math.max(1, parseInt(query.page) || 1);

		// Everything the caller has ever opened here, before `status` and
		// `categoryId` narrow it. The category list below is built over this so
		// the dropdown does not change as the filters do.
		const mine = {
			createdById: req.user.id,
			guildId: guild.id,
		};

		const where = { ...mine };
		if (query.status === 'open') where.open = true;
		else if (query.status === 'closed') where.open = false;
		if (query.categoryId) where.categoryId = Number(query.categoryId) || undefined;

		const [total, tickets, groups] = await Promise.all([
			prisma.ticket.count({ where }),
			prisma.ticket.findMany({
				// Open first, then newest — a member opening this page is almost
				// always looking for something still in progress.
				orderBy: [{ open: 'desc' }, { createdAt: 'desc' }],
				select: SELECT,
				skip: (page - 1) * limit,
				take: limit,
				where,
			}),
			// The categories the caller actually has tickets in, over their whole
			// set rather than the current page: a dropdown built from one page
			// would drop options as you page, and offering a category with no
			// results is worse than not offering it at all.
			prisma.ticket.groupBy({
				by: ['categoryId'],
				where: mine,
			}),
		]);

		// A ticket whose category was deleted keeps a null `categoryId`, which is
		// not something anyone can filter by.
		const categoryIds = groups.map(g => g.categoryId).filter(id => id !== null);
		const categories = categoryIds.length
			? await prisma.category.findMany({
				orderBy: { name: 'asc' },
				select: {
					emoji: true,
					id: true,
					name: true,
				},
				where: { id: { in: categoryIds } },
			})
			: [];

		return {
			categories,
			pagination: {
				limit,
				page,
				total,
				totalPages: Math.ceil(total / limit),
			},
			tickets: await Promise.all(tickets.map(present)),
		};
	},
	onRequest: [fastify.authenticate, fastify.isMember],
});
