/**
 * Helpers shared by the automation routes.
 *
 * These live in `lib/` rather than beside the routes because
 * `collectRouteFiles` turns **every** `.js` file under `src/routes` into a live
 * endpoint, and every export of a route module into an HTTP method. A
 * `_shared.js` next to the handlers would register itself as a route; a helper
 * exported from `index.js` would register itself as a verb.
 */

const temporal = require('../temporal');
const { LIMITS } = require('./errors');
const { schedulesFor } = require('./schedules');
const { resolveGuildChannel } = require('../misc');
const { triggerNodes } = require('./validate');

/**
 * Load a guild's referential context for validation.
 *
 * `validateGraph` needs these to reject a node pointing at a category or
 * automation that no longer exists — the same check `validatePanelLayout` does
 * with its category set.
 */
async function loadRefs(client, guildId, selfId = null) {
	const [categories, automations] = await Promise.all([
		client.prisma.category.findMany({
			select: { id: true },
			where: { guildId },
		}),
		client.prisma.automation.findMany({
			select: {
				graph: true,
				id: true,
				key: true,
			},
			where: { guildId },
		}),
	]);

	return {
		automationKeys: automations.map(a => a.key),
		// A button can only start an automation that a button press triggers.
		buttonAutomationKeys: automations
			.filter(a => triggerNodes(a.graph).some(n => n.type === 'trigger.button.pressed'))
			.map(a => a.key),
		categoryIds: categories.map(c => c.id),
		selfKey: selfId ? automations.find(a => a.id === selfId)?.key ?? null : null,
	};
}

/**
 * Keep an automation's Temporal Schedules in step with its graph.
 *
 * A graph may hold several cron triggers, so this is a set difference rather
 * than a single upsert: everything the new graph wants is created or updated,
 * and everything the old one had that the new one does not is deleted.
 *
 * Best-effort and never awaited: a Temporal hiccup must not fail the HTTP write,
 * because `reconcileAutomationSchedules` fixes any drift at the next boot. That
 * is the whole reason the reconciler exists.
 *
 * @param {object} automation the row as it now is
 * @param {object} [previous] the row as it was, so removed nodes can be cleaned up
 */
function syncSchedule(client, automation, previous = null) {
	const wanted = schedulesFor(automation);
	const had = schedulesFor({
		...(previous ?? automation),
		enabled: true,
	});

	const keep = new Set(wanted.map(w => w.nodeId));
	const work = [
		...wanted.map(w => temporal.upsertAutomationSchedule(w)),
		...had
			.filter(h => !keep.has(h.nodeId))
			.map(h => temporal.deleteAutomationSchedule(h.guildId, h.key, h.nodeId)),
	];

	Promise.all(work).catch(error => client.log.warn(
		'Could not sync the schedules for automation %s: %s',
		automation.id,
		error?.message ?? error,
	));
}

/** Parse and clamp the run-log query string. */
function runQuery(query = {}) {
	const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
	const before = query.before ? new Date(query.before) : null;
	return {
		before: before && !Number.isNaN(before.getTime()) ? before : null,
		limit,
		status: typeof query.status === 'string' ? query.status.toUpperCase() : null,
	};
}

/** A 400 in the shape the dashboard's error rendering already understands. */
const badRequest = (type, message) => ({
	code: type,
	errors: [{
		message,
		type,
	}],
	statusCode: 400,
});

/**
 * Load an automation, refusing ids that are not this guild's.
 *
 * The `isAdmin` guard only proves "admin of `:guild`", so every handler
 * re-checks tenancy — the same manual check the tag and panel routes do.
 */
async function loadAutomation(client, req, res) {
	const id = Number(req.params.automation);
	if (!Number.isInteger(id) || id < 1) {
		res.code(400).send(badRequest('invalid_id', 'That is not a valid automation id.'));
		return null;
	}
	const automation = await client.prisma.automation.findUnique({ where: { id } });
	if (!automation || automation.guildId !== req.params.guild) {
		res.code(404).send(new Error('Not Found'));
		return null;
	}
	return automation;
}

/**
 * Resolve the ids a dry-run was asked to pretend with, refusing any that are
 * not this guild's.
 *
 * The dry run stubs out *actions*, not *conditions* — that is the point of it,
 * since "which branch does this take" is the question being asked. But
 * conditions read real data: `ticket.answer` decrypts a stored answer,
 * `message.content` fetches a real message. With the ids taken verbatim from
 * the request body, an admin of any one guild could point the run at another
 * guild's ticket and read the answer back one true/false at a time from the
 * returned trace.
 *
 * @param {import('client')} client
 * @param {import('@prisma/client').Automation} automation
 * @param {Record<string, unknown>} body
 * @param {string} fallbackUserId the caller, used when no actor is given
 * @returns {Promise<{ actorId: string, channelId: string|null, ticketId: string|null }|{ error: object }>}
 */
async function resolveTestContext(client, automation, body, fallbackUserId) {
	const guildId = automation.guildId;
	const guild = client.guilds.cache.get(guildId);
	const resolved = {
		actorId: fallbackUserId,
		channelId: null,
		ticketId: null,
	};

	if (typeof body.ticketId === 'string' && body.ticketId) {
		const ticket = await client.prisma.ticket.findFirst({
			select: { id: true },
			where: {
				guildId,
				id: body.ticketId,
			},
		});
		if (!ticket) return { error: badRequest('unknown_ticket', 'That ticket is not in this server.') };
		resolved.ticketId = ticket.id;
	}

	if (typeof body.channelId === 'string' && body.channelId) {
		const channel = resolveGuildChannel(client, guildId, body.channelId);
		if (!channel) return { error: badRequest('unknown_channel', 'That channel is not in this server.') };
		resolved.channelId = channel.id;
	}

	if (typeof body.userId === 'string' && body.userId) {
		const member = guild ? await guild.members.fetch(body.userId).catch(() => null) : null;
		if (!member) return { error: badRequest('unknown_member', 'That member is not in this server.') };
		resolved.actorId = member.id;
	}

	return resolved;
}

module.exports = {
	LIMITS,
	badRequest,
	loadAutomation,
	resolveTestContext,
	loadRefs,
	runQuery,
	syncSchedule,
};
