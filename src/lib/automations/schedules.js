/**
 * Which Temporal Schedules an automation's graph implies.
 *
 * A graph may hold several `trigger.schedule.cron` nodes — "every morning do X"
 * and "every Monday do Y" are one automation's worth of intent — so each node
 * gets its own schedule, keyed by node id.
 *
 * Kept apart from `http.js` because the boot-time reconciler needs it too, and
 * `http.js` may only be required from route handlers.
 */

const { triggerNodes } = require('./validate');

/** The `trigger.schedule.cron` nodes in a graph. */
function cronNodes(graph) {
	return triggerNodes(graph).filter(node => node.type === 'trigger.schedule.cron');
}

/**
 * The schedules an automation should have right now.
 *
 * Empty when it is disabled, which is what makes "disable an automation" tear
 * its schedules down without a separate code path.
 *
 * @returns {{automationId: number, guildId: string, key: string, nodeId: string, cron: string, timezone: string}[]}
 */
function schedulesFor(automation) {
	if (!automation?.enabled) return [];
	return cronNodes(automation.graph).map(node => ({
		automationId: automation.id,
		cron: String(node.params?.cron ?? ''),
		guildId: automation.guildId,
		key: automation.key,
		nodeId: node.id,
		timezone: String(node.params?.timezone ?? 'UTC'),
	}));
}

module.exports = {
	cronNodes,
	schedulesFor,
};
