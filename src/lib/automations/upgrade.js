/**
 * Read-time migration of stored automation graphs.
 *
 * `Automation.graph` is a JSON column, so there is no DDL to change and nothing
 * to backfill: a graph is upgraded the moment it enters memory, and written back
 * the next time the automation is saved. That makes the upgrade **idempotent and
 * non-destructive** — rolling the code back leaves untouched rows exactly as they
 * were, right up until a guild saves in the new dashboard, at which point that
 * row is at the new version for good.
 *
 * Applied at every point a stored graph is read: `getForGuild`, `resume`,
 * `runScheduled`, `loadAutomation`, and on `body.graph` in the POST/PATCH routes
 * — that last one is what lets a dashboard tab left open on the old code save
 * cleanly instead of failing validation.
 *
 * ## Adding a step
 *
 * Bump `GRAPH_VERSION` in `errors.js` and add `UPGRADES[n]`, converting a graph
 * *at* version n into one at version n+1. Never edit an existing step: rows
 * already at the newer version never see it again, so a change there only
 * affects the guilds that have not been read since, which is the worst kind of
 * partial migration.
 */

const { GRAPH_VERSION } = require('./errors');
const { defaultMessageLayout } = require('../components-v2');

/** The node types that carried `content` (and, for two of them, `buttons`) at v1. */
const V1_MESSAGE_NODES = [
	'action.message.dm',
	'action.message.ephemeral',
	'action.message.reply',
	'action.message.send',
];

/**
 * v1 → v2: `content` + `buttons` become one Components v2 `layout`.
 *
 * All four node types at once rather than staged, because `send` and `ephemeral`
 * share the legacy button shape — doing them separately would mean writing the
 * button conversion twice and keeping two button models alive in between.
 *
 * The conversion is deliberately shape-only: one bare text block and one bare
 * button row, with no container, separator or footer, so the message Discord
 * receives is identical to the one the old renderer produced. `action.message.send`
 * posts publicly in every guild that uses it, so "nothing looks different" is the
 * property this whole step is judged on.
 */
function toV2(graph) {
	return {
		...graph,
		nodes: (graph.nodes ?? []).map(node => {
			if (!V1_MESSAGE_NODES.includes(node?.type)) return node;

			const params = { ...(node.params ?? {}) };
			// Already converted by hand, or by a newer dashboard writing into an
			// older row: leave it be rather than overwriting real work.
			if (params.layout) {
				delete params.content;
				delete params.buttons;
				return {
					...node,
					params,
				};
			}

			// Block ids are derived from the node id rather than generated, so
			// reading the same stored row twice produces the same layout — a fresh
			// uuid each time would make the dashboard's unsaved-changes guard fire
			// on a page it had only just loaded.
			const layout = defaultMessageLayout(params.content, params.buttons, { idPrefix: String(node.id) });
			delete params.content;
			delete params.buttons;

			return {
				...node,
				params: {
					...params,
					layout,
				},
			};
		}),
		version: 2,
	};
}

/** Keyed by the version each step upgrades *from*. */
const UPGRADES = { 1: toV2 };

/**
 * Bring a stored graph up to {@link GRAPH_VERSION}.
 *
 * Never mutates its argument: the same object is held in the per-guild cache and
 * handed to the dispatcher on the hot path of every message in every guild.
 *
 * A graph that is already current is returned as-is, so this is cheap enough to
 * call on every read. A graph from a *newer* bot is also returned untouched —
 * `validateGraph` is the one place that refuses it, with a message saying to
 * update the bot.
 *
 * @param {object} graph
 * @returns {object} the graph at the current version
 */
function upgradeGraph(graph) {
	if (!graph || typeof graph !== 'object' || Array.isArray(graph)) return graph;

	let current = graph;
	let version = Number.isInteger(current.version) ? current.version : 1;

	while (version < GRAPH_VERSION && UPGRADES[version]) {
		current = UPGRADES[version](current);
		version = current.version;
	}

	return current;
}

/** Upgrade an automation row's graph in place on a shallow copy of the row. */
function upgradeAutomation(automation) {
	if (!automation?.graph) return automation;
	const graph = upgradeGraph(automation.graph);
	if (graph === automation.graph) return automation;
	return {
		...automation,
		graph,
	};
}

module.exports = {
	GRAPH_VERSION,
	UPGRADES,
	upgradeAutomation,
	upgradeGraph,
};
