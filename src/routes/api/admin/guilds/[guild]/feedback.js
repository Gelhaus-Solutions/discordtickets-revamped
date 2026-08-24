'use strict';
const { pools } = require('../../../../../lib/threads');
const { crypto } = pools;

/** Upper bound on feedback rows loaded to build the per-day trend. */
const MAX_TREND_ROWS = 20000;

/**
 * GET /api/admin/guilds/:guild/feedback
 *
 * Query params:
 *   since  - Unix timestamp in seconds (default: 30 days ago)
 *   until  - Unix timestamp in seconds (default: now)
 *   categoryId - optional filter
 *   page   - page number (default: 1)
 *   limit  - items per page (default: 25, max: 100)
 *
 * Returns paginated feedback list + aggregate stats
 */
module.exports.get = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guildId = req.params.guild;
		const {
			since: sinceQ,
			until: untilQ,
			categoryId: categoryIdQ,
			page: pageQ = '1',
			limit: limitQ = '25',
		} = req.query;

		const sinceDate = sinceQ
			? new Date(Number(sinceQ) * 1000)
			: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

		const untilDate = untilQ ? new Date(Number(untilQ) * 1000) : new Date();
		const page = Math.max(1, parseInt(pageQ) || 1);
		const limit = Math.min(100, Math.max(1, parseInt(limitQ) || 25));
		const skip = (page - 1) * limit;
		const categoryId = categoryIdQ ? Number(categoryIdQ) : undefined;

		const baseWhere = {
			createdAt: {
				gte: sinceDate,
				lte: untilDate,
			},
			guildId,
			...(categoryId
				? { ticket: { categoryId } }
				: {}),
		};

		// Total count for pagination
		const total = await client.prisma.feedback.count({ where: baseWhere });

		// Paginated feedback entries
		const feedbackEntries = await client.prisma.feedback.findMany({
			include: {
				ticket: {
					select: {
						category: { select: { name: true } },
						createdById: true,
						number: true,
					},
				},
				user: { select: { id: true } },
			},
			orderBy: { createdAt: 'desc' },
			skip,
			take: limit,
			where: baseWhere,
		});

		// Decrypt comments
		const decrypted = await Promise.all(
			feedbackEntries.map(async f => {
				let comment = null;
				if (f.comment) {
					try {
						comment = await crypto.queue(w => w.decrypt(f.comment));
					} catch {
						comment = f.comment;
					}
				}
				return {
					categoryName: f.ticket?.category?.name || null,
					comment,
					createdAt: f.createdAt.toISOString(),
					rating: f.rating,
					ticketId: f.ticketId,
					ticketNumber: f.ticket?.number || null,
					userId: f.userId,
				};
			}),
		);

		// Aggregate stats for the full period (not just current page)
		const allFeedback = await client.prisma.feedback.groupBy({
			_avg: { rating: true },
			_count: { rating: true },
			by: ['rating'],
			where: baseWhere,
		});

		const ratingCounts = {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
		};
		let totalRating = 0;
		let ratedCount = 0;
		let unratedCount = 0;
		for (const group of allFeedback) {
			// A server can build a feedback form with no rating question, so a
			// submission can be genuinely unrated. It is not a zero, and averaging
			// it as one would drag every server's score down the moment they added a
			// comment-only question. Counted separately instead, so the dashboard
			// can say how many of the responses carried a rating.
			if (typeof group.rating !== 'number') {
				unratedCount += group._count.rating;
				continue;
			}
			ratingCounts[group.rating] = group._count.rating;
			totalRating += group.rating * group._count.rating;
			ratedCount += group._count.rating;
		}
		const avgRating = ratedCount > 0 ? Math.round((totalRating / ratedCount) * 100) / 100 : null;

		// Trend: feedback per day. Bounded — this is aggregated in memory below,
		// so a guild with a very long history would otherwise load every row.
		const feedbackByDay = await client.prisma.feedback.findMany({
			orderBy: { createdAt: 'desc' },
			select: {
				createdAt: true,
				rating: true,
			},
			take: MAX_TREND_ROWS,
			where: baseWhere,
		});

		const trendMap = {};
		for (const f of feedbackByDay) {
			const day = f.createdAt.toISOString().slice(0, 10);
			if (!trendMap[day]) {
				trendMap[day] = {
					count: 0,
					day,
					rated: 0,
					totalRating: 0,
				};
			}
			// `count` is every response that day; `rated` is the ones that carried a
			// rating, and only those may reach the average. Adding `null` to
			// `totalRating` makes it NaN and the whole line vanishes from the chart.
			trendMap[day].count++;
			if (typeof f.rating === 'number') {
				trendMap[day].rated++;
				trendMap[day].totalRating += f.rating;
			}
		}
		const trend = Object.values(trendMap)
			.map(d => ({
				avgRating: d.rated > 0 ? Math.round((d.totalRating / d.rated) * 100) / 100 : null,
				count: d.count,
				date: d.day,
			}))
			.sort((a, b) => a.date.localeCompare(b.date));

		return {
			avgRating,
			feedback: decrypted,
			pagination: {
				limit,
				page,
				total,
				totalPages: Math.ceil(total / limit),
			},
			period: {
				since: sinceDate.toISOString(),
				until: untilDate.toISOString(),
			},
			// How many of `totalCount` carried a rating, so the dashboard can say
			// "12 of 30 responses included a rating" rather than implying the
			// average covers all of them.
			ratedCount,
			ratingCounts,
			totalCount: ratedCount + unratedCount,
			trend,
			unratedCount,
		};
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
