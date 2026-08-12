'use strict';

/** Widest reportable window (~2 years). Bounds the per-day loop below. */
const MAX_RANGE_MS = 730 * 24 * 60 * 60 * 1000;
/** Default window when `since` is not supplied. */
const DEFAULT_RANGE_MS = 30 * 24 * 60 * 60 * 1000;
/** Upper bound on tickets loaded into memory for a single report. */
const MAX_TICKETS = 20000;

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
		const {
			since: sinceQ, until: untilQ, categoryId: categoryIdQ,
		} = req.query;

		// `since`/`until` are client-supplied. They feed a per-day loop below, so
		// an out-of-range value (most easily: milliseconds passed where seconds
		// are expected, which lands in the year ~56000) would spin for millions
		// of iterations and block the event loop — stopping the Discord gateway
		// heartbeat and disconnecting the bot. Parse defensively and cap the span.
		const parseTimestamp = (value, fallback) => {
			if (value === undefined || value === '') return fallback;
			const seconds = Number(value);
			if (!Number.isFinite(seconds)) return fallback;
			const date = new Date(seconds * 1000);
			return Number.isNaN(date.getTime()) ? fallback : date;
		};

		const now = new Date();
		let untilDate = parseTimestamp(untilQ, now);
		if (untilDate > now) untilDate = now;

		const defaultSince = new Date(untilDate.getTime() - DEFAULT_RANGE_MS);
		let sinceDate = parseTimestamp(sinceQ, defaultSince);
		if (sinceDate > untilDate) sinceDate = defaultSince;
		if (untilDate - sinceDate > MAX_RANGE_MS) sinceDate = new Date(untilDate.getTime() - MAX_RANGE_MS);

		const categoryId = Number.isFinite(Number(categoryIdQ)) ? Number(categoryIdQ) : undefined;

		const baseWhere = {
			guildId,
			createdAt: {
				gte: sinceDate,
				lte: untilDate,
			},
			...(categoryId ? { categoryId } : {}),
		};

		// ── 1. Fetch all tickets in range ──────────────────────────────────────
		// Bounded: a busy guild can hold hundreds of thousands of tickets, and
		// this whole set (plus its feedback relation) is held in memory to build
		// the report.
		const tickets = await client.prisma.ticket.findMany({
			orderBy: { createdAt: 'desc' },
			select: {
				categoryId: true,
				claimedById: true,
				closedAt: true,
				closedById: true,
				createdAt: true,
				createdById: true,
				feedback: {
					select: {
						comment: true,
						rating: true,
					},
				},
				firstResponseAt: true,
				id: true,
				messageCount: true,
				number: true,
				open: true,
				priority: true,
			},
			take: MAX_TICKETS,
			where: baseWhere,
		});

		// ── 2. Category breakdown ──────────────────────────────────────────────
		const categoriesRaw = await client.prisma.category.findMany({
			select: {
				id: true,
				name: true,
			},
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
			filledTicketsPerDay.push({
				count: ticketsPerDay[day] || 0,
				date: day,
			});
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
				catResponseTotals[catName] = catResponseTotals[catName] || {
					count: 0,
					total: 0,
				};
				catResponseTotals[catName].total += new Date(t.firstResponseAt) - new Date(t.createdAt);
				catResponseTotals[catName].count++;
			}
			if (!t.open && t.closedAt) {
				catResolutionTotals[catName] = catResolutionTotals[catName] || {
					count: 0,
					total: 0,
				};
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
					resolvedCount: 0,
					userId: t.claimedById,
				};
				assigneeStats[t.claimedById].claimed++;
				if (!t.open && t.closedAt) {
					assigneeStats[t.claimedById].resolutionTotal += new Date(t.closedAt) - new Date(t.createdAt);
					assigneeStats[t.claimedById].resolvedCount++;
				}
			}
			// Closed
			if (t.closedById) {
				assigneeStats[t.closedById] = assigneeStats[t.closedById] || {
					avgResolutionTimeMs: null,
					claimed: 0,
					closed: 0,
					resolutionTotal: 0,
					resolvedCount: 0,
					userId: t.closedById,
				};
				assigneeStats[t.closedById].closed++;
			}
		}
		// Calculate per-assignee avg resolution time.
		//
		// Divided by the claims that actually closed, not by every claim: the
		// total only accumulates over closed tickets, so dividing by `claimed`
		// understated anyone still holding open claims in proportion to how many
		// they were holding — the busiest staff looked like the fastest.
		for (const stat of Object.values(assigneeStats)) {
			if (stat.resolvedCount > 0) {
				stat.avgResolutionTimeMs = Math.round(stat.resolutionTotal / stat.resolvedCount);
			}
			delete stat.resolutionTotal;
			delete stat.resolvedCount;
		}

		// ── 6b. Assignee display names ───────────────────────────────────────
		// Resolved here rather than in the dashboard, whose only other option is
		// `data?query=members.cache` — the entire member cache, every member's
		// roles, nickname and three avatar URLs, shipped to label a couple of
		// dozen table rows.
		//
		// Cache first, then one bounded fetch for what is missing. An unbounded
		// `members.fetch()` on a request-driven route is a gateway amplifier, so
		// the batch is capped and time-limited, and a failure is not fatal: the
		// table falls back to the id, which is all it ever had before.
		const guild = client.guilds.cache.get(guildId);
		const assignees = Object.values(assigneeStats);
		if (guild) {
			const missing = assignees.map(s => s.userId).filter(id => !guild.members.cache.has(id));
			if (missing.length > 0 && missing.length <= 100) {
				try {
					await guild.members.fetch({
						time: 5000,
						user: missing,
					});
				} catch (error) {
					client.log.debug('Could not resolve every assignee for the analytics report: %s', error?.message ?? error);
				}
			}
			for (const stat of assignees) {
				const member = guild.members.cache.get(stat.userId);
				stat.avatarURL = member?.displayAvatarURL({ size: 32 }) ?? null;
				stat.displayName = member?.displayName ?? client.users.cache.get(stat.userId)?.username ?? null;
			}
		}

		// ── 7. Priority breakdown ─────────────────────────────────────────────
		const priorityBreakdown = {
			HIGH: 0,
			LOW: 0,
			MEDIUM: 0,
			NONE: 0,
		};
		for (const t of tickets) {
			const p = t.priority || 'NONE';
			priorityBreakdown[p] = (priorityBreakdown[p] || 0) + 1;
		}

		// ── 8. Feedback / ratings ─────────────────────────────────────────────
		const feedbackTickets = tickets.filter(t => t.feedback);
		const ratingCounts = {
			1: 0,
			2: 0,
			3: 0,
			4: 0,
			5: 0,
		};
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
			assigneeStats: assignees.sort((a, b) => b.closed - a.closed),
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
