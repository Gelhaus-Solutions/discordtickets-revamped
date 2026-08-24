'use strict';

/**
 * Aggregate feedback for a guild, for the portal's feedback page.
 *
 * A member-level sibling of `/api/admin/guilds/:guild/feedback`, and
 * deliberately not a relaxation of it: that route lives in the admin tree
 * behind the elevated OAuth scope and returns, per response, the `userId` who
 * left it, the ticket it belongs to, and the decrypted free-text comment. None
 * of that can be shown to the room.
 *
 * So this one returns numbers only — an average, a distribution, a total and a
 * per-day trend. `comment` and `userId` are never selected, which is also why
 * the crypto pool is not touched here at all: there is nothing to decrypt, and
 * therefore nothing to leak.
 */

/** Upper bound on rows loaded to build the per-day trend, as on the admin route. */
const MAX_TREND_ROWS = 20000;

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

module.exports.get = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guildId = req.params.guild;
		const {
			since: sinceQ,
			until: untilQ,
		} = req.query;

		// A garbage `since` yields NaN, and `new Date(NaN)` makes Prisma throw
		// rather than 400. Fall back to the default window instead.
		const sinceMs = sinceQ ? Number(sinceQ) * 1000 : NaN;
		const untilMs = untilQ ? Number(untilQ) * 1000 : NaN;
		const sinceDate = Number.isFinite(sinceMs) ? new Date(sinceMs) : new Date(Date.now() - THIRTY_DAYS);
		const untilDate = Number.isFinite(untilMs) ? new Date(untilMs) : new Date();

		const where = {
			createdAt: {
				gte: sinceDate,
				lte: untilDate,
			},
			guildId,
		};

		const [groups, rows, collecting] = await Promise.all([
			client.prisma.feedback.groupBy({
				_count: { rating: true },
				by: ['rating'],
				where,
			}),
			// Aggregated in memory below, so bounded — a guild with a very long
			// history would otherwise load every row it has ever collected.
			client.prisma.feedback.findMany({
				orderBy: { createdAt: 'desc' },
				select: {
					createdAt: true,
					rating: true,
				},
				take: MAX_TREND_ROWS,
				where,
			}),
			// "Nobody has rated anything" and "this server never asks" both come
			// out as an empty chart, and they are not the same thing. The page
			// says which, so it needs to be told.
			client.prisma.category.count({
				where: {
					enableFeedback: true,
					guildId,
				},
			}),
		]);

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
		for (const group of groups) {
			// A server's feedback form need not contain a rating question, so a
			// submission can be genuinely unrated. Counting it as a zero would drag
			// the public average down; counting it in `totalCount` but not in the
			// average is what the numbers actually mean.
			if (typeof group.rating !== 'number') {
				unratedCount += group._count.rating;
				continue;
			}
			ratingCounts[group.rating] = group._count.rating;
			totalRating += group.rating * group._count.rating;
			ratedCount += group._count.rating;
		}
		const avgRating = ratedCount > 0 ? Math.round((totalRating / ratedCount) * 100) / 100 : null;

		const trendMap = {};
		for (const row of rows) {
			const day = row.createdAt.toISOString().slice(0, 10);
			if (!trendMap[day]) {
				trendMap[day] = {
					count: 0,
					day,
					rated: 0,
					totalRating: 0,
				};
			}
			// `count` is every response that day, `rated` only the ones that carried
			// a rating. Adding `null` to `totalRating` makes it NaN, and a NaN point
			// takes the whole line off the chart.
			trendMap[day].count++;
			if (typeof row.rating === 'number') {
				trendMap[day].rated++;
				trendMap[day].totalRating += row.rating;
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
			collecting: collecting > 0,
			period: {
				since: sinceDate.toISOString(),
				until: untilDate.toISOString(),
			},
			ratedCount,
			ratingCounts,
			totalCount: ratedCount + unratedCount,
			trend,
		};
	},
	onRequest: [fastify.authenticate, fastify.isMember],
});
