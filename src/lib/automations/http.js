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
				id: true,
				key: true,
			},
			where: { guildId },
		}),
	]);

	return {
		automationKeys: automations.map(a => a.key),
		categoryIds: categories.map(c => c.id),
		selfKey: selfId ? automations.find(a => a.id === selfId)?.key ?? null : null,
	};
}

/** The timezone a cron automation runs in, read back off its graph. */
const timezoneOf = automation =>
	automation.graph?.nodes?.find(n => n.type === 'trigger.schedule.cron')?.params?.timezone ?? 'UTC';

/**
 * Keep an automation's Temporal Schedule in step with its row.
 *
 * Best-effort and never awaited: a Temporal hiccup must not fail the HTTP write,
 * because `reconcileAutomationSchedules` fixes any drift at the next boot. That
 * is the whole reason the reconciler exists.
 */
function syncSchedule(client, automation) {
	const shouldExist = automation.enabled && automation.triggerType === 'trigger.schedule.cron';
	const promise = shouldExist
		? temporal.upsertAutomationSchedule({
			automationId: automation.id,
			cron: automation.triggerKey,
			guildId: automation.guildId,
			key: automation.key,
			timezone: timezoneOf(automation),
		})
		: temporal.deleteAutomationSchedule(automation.guildId, automation.key);

	promise.catch(error => client.log.warn(
		'Could not sync the schedule for automation %s: %s',
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

module.exports = {
	LIMITS,
	badRequest,
	loadAutomation,
	loadRefs,
	runQuery,
	syncSchedule,
	timezoneOf,
};
