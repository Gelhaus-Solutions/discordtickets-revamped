'use strict';
const { pools } = require('../../../../../lib/threads');
const { crypto } = pools;

/**
 * GET /api/admin/guilds/:guild/analytics
 *
 * Query params:
 *   since  - Unix timestamp (seconds) – start of range (default: 30 days ago)
 *   until  - Unix timestamp (seconds) – end of range (default: now)
 *   categoryId – optional filter by category ID
 *
 * Returns a comprehensive analytics object.
 */
module.exports.get = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guildId = req.params.guild;
		const { since: sinceQ, until: untilQ, categoryId: categoryIdQ } = req.query;

		const sinceDate = sinceQ
			? new Date(Number(sinceQ) * 1000)
			: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // default: 30 days

		const untilDate = untilQ
			? new Date(Number(untilQ) * 1000)
			: new Date();

		const categoryId = categoryIdQ ? Number(categoryIdQ) : undefined;

		const baseWhere = {
			guildId,
			createdAt: {
				gte: sinceDate,
				lte: untilDate,
			},
			...(categoryId ? { categoryId } : {}),
		};

		// ── 1. Fetch all tickets in range ──────────────────────────────────────
		const tickets = await client.prisma.ticket.findMany({
			select: {
				categoryId: true,
				claimedById: true,
				closedAt: true,
				closedById: true,
				createdAt: true,
				createdById: true,
				feedback: { select: { comment: true, rating: true } },
				firstResponseAt: true,
				id: true,
				messageCount: true,
				number: true,
				open: true,
				priority: true,
			},
			where: baseWhere,
		});

		// ── 2. Category breakdown ──────────────────────────────────────────────
		const categoriesRaw = await client.prisma.category.findMany({
			select: { id: true, name: true },
			where: { guildId },
		});
		const catMap = Object.fromEntries(categoriesRaw.map(c => [c.id, c.name]));

		const categoryBreakdown = {};
		for (const t of tickets) {
			const catName = catMap[t.categoryId] || 'Unknown';
			if (!categoryBreakdown[catName]) {
				categoryBreakdown[catName] = {
					avgResolutionTime: null,
					avgResponseTime: null,
					closed: 0,
					name: catName,
					open: 0,
					total: 0,
				};
			}
			categoryBreakdown[catName].total++;
			if (t.open) categoryBreakdown[catName].open++;
			else categoryBreakdown[catName].closed++;
		}

		// ── 3. Time-series: tickets per day ────────────────────────────────────
		const ticketsPerDay = {};
		for (const t of tickets) {
			const day = t.createdAt.toISOString().slice(0, 10);
			ticketsPerDay[day] = (ticketsPerDay[day] || 0) + 1;
		}

		// Fill in zero-count days between since and until
		const filledTicketsPerDay = [];
		const cursor = new Date(sinceDate);
		cursor.setUTCHours(0, 0, 0, 0);
		while (cursor <= untilDate) {
			const day = cursor.toISOString().slice(0, 10);
			filledTicketsPerDay.push({ count: ticketsPerDay[day] || 0, date: day });
			cursor.setUTCDate(cursor.getUTCDate() + 1);
		}

		// ── 4. Response & resolution times ────────────────────────────────────
		const closedTickets = tickets.filter(t => !t.open && t.closedAt);
		const respondedTickets = tickets.filter(t => t.firstResponseAt);

		let totalResponseMs = 0;
		let responsedCount = 0;
		for (const t of respondedTickets) {
			totalResponseMs += new Date(t.firstResponseAt) - new Date(t.createdAt);
			responsedCount++;
		}

		let totalResolutionMs = 0;
		let resolvedCount = 0;
		for (const t of closedTickets) {
			totalResolutionMs += new Date(t.closedAt) - new Date(t.createdAt);
			resolvedCount++;
		}

		const avgResponseTimeMs = responsedCount > 0 ? Math.round(totalResponseMs / responsedCount) : null;
		const avgResolutionTimeMs = resolvedCount > 0 ? Math.round(totalResolutionMs / resolvedCount) : null;

		// Per-category response & resolution times
		const catResponseTotals = {};
		const catResolutionTotals = {};
		for (const t of tickets) {
			const catName = catMap[t.categoryId] || 'Unknown';
			if (t.firstResponseAt) {
				catResponseTotals[catName] = catResponseTotals[catName] || { count: 0, total: 0 };
				catResponseTotals[catName].total += new Date(t.firstResponseAt) - new Date(t.createdAt);
				catResponseTotals[catName].count++;
			}
			if (!t.open && t.closedAt) {
				catResolutionTotals[catName] = catResolutionTotals[catName] || { count: 0, total: 0 };
				catResolutionTotals[catName].total += new Date(t.closedAt) - new Date(t.createdAt);
				catResolutionTotals[catName].count++;
			}
		}
		for (const [name, data] of Object.entries(categoryBreakdown)) {
			if (catResponseTotals[name]) {
				data.avgResponseTime = Math.round(catResponseTotals[name].total / catResponseTotals[name].count);
			}
			if (catResolutionTotals[name]) {
				data.avgResolutionTime = Math.round(catResolutionTotals[name].total / catResolutionTotals[name].count);
			}
		}

		// ── 5. Busiest hours ──────────────────────────────────────────────────
		const ticketsByHour = new Array(24).fill(0);
		for (const t of tickets) {
			const hour = new Date(t.createdAt).getUTCHours();
			ticketsByHour[hour]++;
		}

		// ── 6. Assignee stats ────────────────────────────────────────────────
		const assigneeStats = {};
		for (const t of tickets) {
			// Claimed
			if (t.claimedById) {
				assigneeStats[t.claimedById] = assigneeStats[t.claimedById] || {
					avgResolutionTimeMs: null,
					claimed: 0,
					closed: 0,
					resolutionTotal: 0,
					userId: t.claimedById,
				};
				assigneeStats[t.claimedById].claimed++;
				if (!t.open && t.closedAt) {
					assigneeStats[t.claimedById].resolutionTotal += new Date(t.closedAt) - new Date(t.createdAt);
				}
			}
			// Closed
			if (t.closedById) {
				assigneeStats[t.closedById] = assigneeStats[t.closedById] || {
					avgResolutionTimeMs: null,
					claimed: 0,
					closed: 0,
					resolutionTotal: 0,
					userId: t.closedById,
				};
				assigneeStats[t.closedById].closed++;
			}
		}
		// Calculate per-assignee avg resolution time
		for (const stat of Object.values(assigneeStats)) {
			if (stat.claimed > 0 && stat.resolutionTotal > 0) {
				stat.avgResolutionTimeMs = Math.round(stat.resolutionTotal / stat.claimed);
			}
			delete stat.resolutionTotal;
		}

		// ── 7. Priority breakdown ─────────────────────────────────────────────
		const priorityBreakdown = { HIGH: 0, LOW: 0, MEDIUM: 0, NONE: 0 };
		for (const t of tickets) {
			const p = t.priority || 'NONE';
			priorityBreakdown[p] = (priorityBreakdown[p] || 0) + 1;
		}

		// ── 8. Feedback / ratings ─────────────────────────────────────────────
		const feedbackTickets = tickets.filter(t => t.feedback);
		const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
		let ratingTotal = 0;
		for (const t of feedbackTickets) {
			const r = t.feedback.rating;
			ratingCounts[r] = (ratingCounts[r] || 0) + 1;
			ratingTotal += r;
		}
		const avgRating = feedbackTickets.length > 0
			? Math.round((ratingTotal / feedbackTickets.length) * 100) / 100
			: null;

		// ── 9. Summary ────────────────────────────────────────────────────────
		const summary = {
			avgResolutionTimeMs,
			avgResponseTimeMs,
			closed: closedTickets.length,
			open: tickets.filter(t => t.open).length,
			total: tickets.length,
			withFeedback: feedbackTickets.length,
		};

		return {
			assigneeStats: Object.values(assigneeStats).sort((a, b) => b.closed - a.closed),
			avgRating,
			categoryBreakdown: Object.values(categoryBreakdown),
			period: {
				since: sinceDate.toISOString(),
				until: untilDate.toISOString(),
			},
			priorityBreakdown,
			ratingCounts,
			summary,
			ticketsByHour,
			ticketsPerDay: filledTicketsPerDay,
		};
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
