const { pools } = require('../../../../../../lib/threads');
const { parseRef } = require('../../../../../../lib/storage');
const { crypto } = pools;

/**
 * How big a ticket's stored transcript is, or null if that cannot be answered.
 *
 * Null rather than zero: "no transcript", "the object has gone" and "storage is
 * unreachable" are all genuinely unknown, and a confident 0.00 KB is worse than
 * an honest dash.
 *
 * @param {import('client')} client
 * @param {string|null} value the raw `htmlTranscript` column
 * @returns {Promise<number|null>}
 */
async function transcriptSize(client, value) {
	const ref = parseRef(value);
	if (!ref) return null;
	// A row still holding the HTML itself: its size is its length.
	if (ref.kind === 'inline') return Buffer.byteLength(ref.html);
	try {
		const stat = await client.storage.for(ref.driver).stat(ref.key);
		return stat?.size ?? null;
	} catch {
		return null;
	}
}

module.exports.get = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const { query } = req;
		const withSizes = query.transcriptSize === 'true';

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
				// The column is a storage reference — which driver, which key — and
				// the dashboard has no business knowing either. It gets the fact
				// that a transcript exists and the URL that serves it.
				ticket.hasTranscript = Boolean(ticket.htmlTranscript);
				if (ticket.hasTranscript && base) {
					ticket.transcriptUrl = `${base}/api/admin/guilds/${ticket.guildId}/tickets/${ticket.id}/transcript`;
				}

				// Sizes are opt-in because they cost a `stat` per row — on S3 that
				// is a HeadObject each, which is not a tax worth paying on every
				// listing for a number most callers ignore.
				if (withSizes) {
					ticket.transcriptBytes = await transcriptSize(client, ticket.htmlTranscript);
				}

				delete ticket.htmlTranscript;
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

