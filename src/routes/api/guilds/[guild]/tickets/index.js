const { pools } = require('../../../../../lib/threads');
const { crypto } = pools;

/**
 * Open tickets in a guild, for the portal's staff dashboard.
 *
 * A member-level sibling of `/api/admin/guilds/:guild/tickets`, and deliberately
 * not a relaxation of it: that route lives in the admin tree beside destructive
 * endpoints and behind the elevated OAuth scope, and staff should not need
 * either to read a list. This one is behind `isStaff` (privilege >= 1) and can
 * only read open tickets.
 *
 * Closed tickets are not served here at all. They carry `closedReason` and a
 * transcript path, and transcripts are an admin concern with their own route,
 * their own CSP and their own path-confinement check.
 */

/** What the staff page needs, and nothing that would widen the blast radius. */
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
	createdAt: true,
	createdById: true,
	firstResponseAt: true,
	id: true,
	lastMessageAt: true,
	messageCount: true,
	number: true,
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
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const { query } = req;
		const guildId = req.params.guild;

		const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 25));
		const page = Math.max(1, parseInt(query.page) || 1);

		const guild = await client.prisma.guild.findUnique({
			select: { staleAfter: true },
			where: { id: guildId },
		});

		// `staleAfter` may be null or 0, meaning the guild does not track
		// staleness at all. That is not "everything is stale" — it is "this
		// bucket does not apply", so the filter matches nothing and `meta`
		// tells the page to say so rather than listing every open ticket.
		const staleAfter = Number(guild?.staleAfter ?? 0);
		const staleCutoff = staleAfter > 0 ? new Date(Date.now() - staleAfter) : null;
		// `lastMessageAt ?? createdAt`, matching how the stale workflow computes
		// last activity — a ticket nobody has ever replied in has a null there.
		const staleWhere = staleCutoff
			? {
				OR: [
					{ lastMessageAt: { lt: staleCutoff } },
					{
						createdAt: { lt: staleCutoff },
						lastMessageAt: null,
					},
				],
			}
			: null;

		const unclaimed = { claimedById: null };
		const unanswered = { firstResponseAt: null };
		const awaitingStaff = { awaitingResponseFrom: 'STAFF' };

		// The union, not `awaitingResponseFrom` alone. Nothing is backfilled, so
		// every ticket opened before that column existed reports null — defining
		// the bucket by it would empty the one view that matters most on the day
		// this ships.
		const attention = {
			OR: [
				unclaimed,
				unanswered,
				awaitingStaff,
				...(staleWhere ? [staleWhere] : []),
			],
		};

		const base = {
			guildId,
			open: true,
		};
		const filters = {
			all: {},
			attention,
			awaiting_staff: awaitingStaff,
			stale: staleWhere ?? { id: null },
			unanswered,
			unclaimed,
		};
		const filter = Object.hasOwn(filters, query.filter) ? query.filter : 'all';
		const where = {
			...base,
			...filters[filter],
		};
		if (query.categoryId) where.categoryId = Number(query.categoryId) || undefined;

		// Always over the unfiltered open set, so the page's bucket tabs and the
		// guild home page's summary strip both come from this one request.
		const [total, open, unclaimedCount, unansweredCount, staleCount, awaitingCount] = await Promise.all([
			client.prisma.ticket.count({ where }),
			client.prisma.ticket.count({ where: base }),
			client.prisma.ticket.count({
				where: {
					...base,
					...unclaimed,
				},
			}),
			client.prisma.ticket.count({
				where: {
					...base,
					...unanswered,
				},
			}),
			staleWhere
				? client.prisma.ticket.count({
					where: {
						...base,
						...staleWhere,
					},
				})
				: Promise.resolve(0),
			client.prisma.ticket.count({
				where: {
					...base,
					...awaitingStaff,
				},
			}),
		]);

		const counts = {
			awaitingStaff: awaitingCount,
			open,
			stale: staleCutoff ? staleCount : null,
			unanswered: unansweredCount,
			unclaimed: unclaimedCount,
		};
		const meta = { staleAfter: staleCutoff ? staleAfter : null };

		if (query.countsOnly === 'true') {
			return {
				counts,
				meta,
				pagination: {
					limit,
					page: 1,
					total,
					totalPages: 0,
				},
				tickets: [],
			};
		}

		const tickets = await client.prisma.ticket.findMany({
			// Never `lastMessageAt`: it is nullable, and Prisma's `nulls`
			// modifier is Postgres-only while this project ships a MySQL schema
			// too, so ordering by it throws on half the installs.
			orderBy: { createdAt: query.sort === 'newest' ? 'desc' : 'asc' },
			select: SELECT,
			skip: (page - 1) * limit,
			take: limit,
			where,
		});

		return {
			counts,
			meta,
			pagination: {
				limit,
				page,
				total,
				totalPages: Math.ceil(total / limit),
			},
			tickets: await Promise.all(tickets.map(present)),
		};
	},
	onRequest: [fastify.authenticate, fastify.isStaff],
});
