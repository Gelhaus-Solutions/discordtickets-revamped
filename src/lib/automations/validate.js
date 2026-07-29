/**
 * Automation graph validation, and the derivation of the columns the dispatcher
 * indexes on.
 *
 * Modelled on `components-v2.js#validateLayout`: walk the whole document
 * collecting `{path, code, message}` and throw once, so the dashboard can show
 * every problem at once instead of one per save.
 *
 * The graph is a DAG, and this file is what guarantees it. The interpreter
 * relies on three properties established here and nowhere else:
 *
 *   1. exactly one trigger node, so the entry point is unambiguous;
 *   2. no cycles, so a run terminates without needing a visited-set to be correct;
 *   3. every reachable node's capability `needs` are satisfied by the trigger's
 *      `provides`, so a node cannot fail at 3am for a reason that was knowable
 *      at save time.
 */

const {
	AutomationError,
	GRAPH_VERSION,
	LIMITS,
} = require('./errors');
const {
	NODE_TYPES,
	needsOf,
	validateParams,
} = require('./registry');

const ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Human names for the capabilities, for the `missing_context` message. */
const CAPABILITY_LABELS = {
	actor: 'the person who triggered it',
	channel: 'a channel',
	guild: 'a server',
	interaction: 'a button or menu interaction',
	member: 'a server member',
	message: 'a message',
	selection: 'a menu selection',
	ticket: 'a ticket',
	ticketChannel: 'an open ticket channel',
};

/**
 * The single trigger node, or null.
 *
 * Used by `deriveTrigger` and by the validator, which is why it tolerates a
 * malformed graph rather than assuming validation has already run.
 */
function triggerNode(graph) {
	const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
	const triggers = nodes.filter(n => NODE_TYPES[n?.type]?.category === 'trigger');
	return triggers.length === 1 ? triggers[0] : null;
}

/**
 * The values of `Automation.triggerType` / `triggerKey` for a graph.
 *
 * The exact analogue of `panels.js#collectCategoryIds`: the client never sends
 * these, they are recomputed from the graph on every write, so they cannot drift
 * from what the canvas actually contains.
 *
 * @returns {{triggerType: string, triggerKey: string|null}}
 */
function deriveTrigger(graph) {
	const node = triggerNode(graph);
	if (!node) {
		throw new AutomationError([{
			code: 'no_trigger',
			message: 'The automation needs exactly one trigger',
			path: 'nodes',
		}]);
	}
	return {
		// Only cron needs a second-level discriminator: it lets the schedule
		// reconciler diff the database against Temporal without parsing graphs.
		triggerKey: node.type === 'trigger.schedule.cron' ? String(node.params?.cron ?? '') : null,
		triggerType: node.type,
	};
}

/** Adjacency, keyed by node id, in `edges[]` order. */
function adjacency(edges) {
	const out = new Map();
	for (const edge of edges) {
		if (!out.has(edge.from)) out.set(edge.from, []);
		out.get(edge.from).push(edge);
	}
	return out;
}

/** Node ids reachable from `startId`, following every handle. */
function reachableFrom(startId, edges) {
	const next = adjacency(edges);
	const seen = new Set([startId]);
	const queue = [startId];
	while (queue.length) {
		for (const edge of next.get(queue.shift()) ?? []) {
			if (seen.has(edge.to)) continue;
			seen.add(edge.to);
			queue.push(edge.to);
		}
	}
	return seen;
}

/**
 * Kahn's algorithm over the reachable subgraph.
 *
 * @returns {{cycle: string[]|null, longestPath: number}} `cycle` lists the nodes
 * left with incoming edges, which is what the canvas highlights.
 */
function analyse(nodeIds, edges) {
	const indegree = new Map([...nodeIds].map(id => [id, 0]));
	const next = new Map([...nodeIds].map(id => [id, []]));
	for (const edge of edges) {
		if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) continue;
		indegree.set(edge.to, indegree.get(edge.to) + 1);
		next.get(edge.from).push(edge.to);
	}

	const depth = new Map([...nodeIds].map(id => [id, 1]));
	const queue = [...nodeIds].filter(id => indegree.get(id) === 0);
	let visited = 0;
	while (queue.length) {
		const id = queue.shift();
		visited++;
		for (const to of next.get(id)) {
			depth.set(to, Math.max(depth.get(to), depth.get(id) + 1));
			indegree.set(to, indegree.get(to) - 1);
			if (indegree.get(to) === 0) queue.push(to);
		}
	}

	return {
		cycle: visited === nodeIds.size ? null : [...nodeIds].filter(id => indegree.get(id) > 0),
		longestPath: Math.max(0, ...depth.values()),
	};
}

/**
 * Validate a stored graph.
 *
 * @param {object} graph
 * @param {object} [options]
 * @param {string[]} [options.automationKeys] keys that `action.automation.run`
 *   may reference. Omitted ⇒ the reference is not checked (the catalogue
 *   endpoint and the tests do not need it).
 * @param {number[]} [options.categoryIds] the guild's ticket categories.
 * @param {string} [options.selfKey] this automation's own key, so it cannot call itself.
 * @throws {AutomationError}
 */
function validateGraph(graph, options = {}) {
	const errors = [];
	const push = (path, code, message) => errors.push({
		code,
		message,
		path,
	});
	const fail = () => {
		throw new AutomationError(errors);
	};

	if (!graph || typeof graph !== 'object' || Array.isArray(graph)) {
		push('', 'not_an_object', 'The automation is not valid');
		fail();
	}

	if (!Number.isInteger(graph.version)) {
		push('version', 'invalid_version', 'The automation is missing a version');
		fail();
	}
	if (graph.version > GRAPH_VERSION) {
		push('version', 'unsupported', 'This automation was made with a newer version of the bot. Update the bot to use it.');
		fail();
	}

	const nodes = graph.nodes;
	const edges = graph.edges;
	if (!Array.isArray(nodes)) push('nodes', 'not_an_array', 'The automation has no nodes');
	if (!Array.isArray(edges)) push('edges', 'not_an_array', 'The automation has no connections');
	if (errors.length) fail();

	if (nodes.length === 0) push('nodes', 'empty', 'The automation is empty');
	if (nodes.length > LIMITS.nodes) push('nodes', 'too_many', `Too many steps (max ${LIMITS.nodes})`);
	if (edges.length > LIMITS.edges) push('edges', 'too_many', `Too many connections (max ${LIMITS.edges})`);
	if (errors.length) fail();

	/* ── nodes ─────────────────────────────────────────────────────────────── */

	const byId = new Map();
	nodes.forEach((node, i) => {
		const at = `nodes[${i}]`;
		if (!node || typeof node !== 'object') {
			push(at, 'not_an_object', 'This step is not valid');
			return;
		}
		if (!ID.test(String(node.id))) {
			push(`${at}.id`, 'invalid_id', 'This step has an invalid id');
			return;
		}
		if (byId.has(node.id)) {
			push(`${at}.id`, 'duplicate_id', 'Two steps share an id');
			return;
		}
		byId.set(node.id, node);

		const type = NODE_TYPES[node.type];
		if (!type) {
			push(`${at}.type`, 'unknown_type', `"${node.type}" is not a step this version of the bot understands`);
			return;
		}
		// The id prefix and the registry category must agree. This can only fail
		// if the registry itself is inconsistent, but the catalogue endpoint hands
		// that prefix to the editor as a grouping key, so it is worth asserting.
		if (node.type.split('.')[0] !== type.category) {
			push(`${at}.type`, 'category_mismatch', `"${node.type}" is registered as a ${type.category}`);
		}

		if (!Number.isFinite(node.position?.x) || !Number.isFinite(node.position?.y)) {
			push(`${at}.position`, 'invalid_position', 'This step has no position on the canvas');
		}

		validateParams(node.params, type.params, push, at);
		// Options are passed through so a node can validate against the guild's
		// own data (which categories exist, which automations a button may run).
		type.validate?.(node.params, push, at, options);

		if (options.categoryIds) {
			const referenced = [
				...(node.params?.categoryIds ?? []),
				...(node.params?.categoryId === undefined ? [] : [node.params.categoryId]),
			];
			for (const id of referenced) {
				if (!options.categoryIds.includes(id)) {
					push(`${at}.params`, 'unknown_category', 'This step refers to a category that no longer exists');
					break;
				}
			}
		}

		if (node.type === 'action.automation.run') {
			const key = node.params?.automationKey;
			if (key && options.selfKey && key === options.selfKey) {
				push(`${at}.params.automationKey`, 'self_reference', 'An automation cannot run itself');
			} else if (key && options.automationKeys && !options.automationKeys.includes(key)) {
				push(`${at}.params.automationKey`, 'unknown_automation', 'This step refers to an automation that no longer exists');
			}
		}
	});
	if (errors.length) fail();

	/* ── the single trigger ────────────────────────────────────────────────── */

	const triggers = nodes.filter(n => NODE_TYPES[n.type].category === 'trigger');
	if (triggers.length === 0) push('nodes', 'no_trigger', 'The automation needs a trigger');
	if (triggers.length > 1) push('nodes', 'multiple_triggers', 'An automation can only have one trigger. Make a second automation instead.');
	if (!nodes.some(n => NODE_TYPES[n.type].category === 'action')) {
		push('nodes', 'no_action', 'The automation does not do anything yet');
	}
	if (errors.length) fail();

	const trigger = triggers[0];

	/* ── edges ─────────────────────────────────────────────────────────────── */

	const edgeIds = new Set();
	const seenPairs = new Set();
	const perHandle = new Map();
	edges.forEach((edge, i) => {
		const at = `edges[${i}]`;
		if (!edge || typeof edge !== 'object') {
			push(at, 'not_an_object', 'This connection is not valid');
			return;
		}
		if (!ID.test(String(edge.id))) {
			push(`${at}.id`, 'invalid_id', 'This connection has an invalid id');
			return;
		}
		if (edgeIds.has(edge.id)) {
			push(`${at}.id`, 'duplicate_id', 'Two connections share an id');
			return;
		}
		edgeIds.add(edge.id);

		const from = byId.get(edge.from);
		const to = byId.get(edge.to);
		if (!from) {
			push(`${at}.from`, 'unknown_node', 'This connection starts from a step that does not exist');
			return;
		}
		if (!to) {
			push(`${at}.to`, 'unknown_node', 'This connection leads to a step that does not exist');
			return;
		}
		if (edge.from === edge.to) {
			push(at, 'self_loop', 'A step cannot connect to itself');
			return;
		}
		if (NODE_TYPES[to.type].category === 'trigger') {
			push(`${at}.to`, 'trigger_has_input', 'Nothing can lead into a trigger');
			return;
		}

		const outputs = NODE_TYPES[from.type].outputs;
		if (!outputs.includes(edge.fromHandle)) {
			push(
				`${at}.fromHandle`,
				'unknown_handle',
				outputs.length === 0
					? `"${NODE_TYPES[from.type].label}" does not lead anywhere`
					: `"${edge.fromHandle}" is not an output of "${NODE_TYPES[from.type].label}"`,
			);
			return;
		}

		const pair = `${edge.from} ${edge.fromHandle} ${edge.to}`;
		if (seenPairs.has(pair)) {
			push(at, 'duplicate_edge', 'These two steps are already connected');
			return;
		}
		seenPairs.add(pair);

		const handleKey = `${edge.from} ${edge.fromHandle}`;
		perHandle.set(handleKey, (perHandle.get(handleKey) ?? 0) + 1);
		if (perHandle.get(handleKey) > LIMITS.branches) {
			push(at, 'too_many_branches', `A step can only lead to ${LIMITS.branches} others`);
		}
	});
	if (errors.length) fail();

	/* ── shape of the whole graph ──────────────────────────────────────────── */

	const reachable = reachableFrom(trigger.id, edges);
	nodes.forEach((node, i) => {
		if (!reachable.has(node.id)) {
			push(`nodes[${i}]`, 'unreachable', 'Nothing leads to this step, so it will never run');
		}
	});
	if (errors.length) fail();

	const {
		cycle, longestPath,
	} = analyse(reachable, edges);
	if (cycle) {
		push('edges', 'cycle', `These steps lead back into each other: ${cycle.join(', ')}`);
		fail();
	}
	if (longestPath > LIMITS.steps) {
		push('nodes', 'too_long', `The longest path through the automation is more than ${LIMITS.steps} steps`);
	}

	/* ── capabilities ──────────────────────────────────────────────────────── */

	const available = new Set(NODE_TYPES[trigger.type].provides ?? []);
	nodes.forEach((node, i) => {
		if (!reachable.has(node.id) || node.id === trigger.id) return;
		for (const capability of needsOf(node)) {
			if (available.has(capability)) continue;
			push(
				`nodes[${i}]`,
				'missing_context',
				`"${NODE_TYPES[node.type].label}" needs ${CAPABILITY_LABELS[capability] ?? capability}, which "${NODE_TYPES[trigger.type].label}" does not provide`,
			);
			break;
		}
	});

	/* ── the role feedback loop ────────────────────────────────────────────── */

	// `trigger.member.roleAdded` + `action.role.add` on the same role is the one
	// graph that re-triggers itself no matter how the interpreter behaves. The
	// depth counter and the suppression key in `discord.js` both catch it at
	// runtime; rejecting it here means nobody has to find out that way.
	if (trigger.type === 'trigger.member.roleAdded' || trigger.type === 'trigger.member.roleRemoved') {
		const mirror = trigger.type === 'trigger.member.roleAdded' ? 'action.role.add' : 'action.role.remove';
		nodes.forEach((node, i) => {
			if (!reachable.has(node.id) || node.type !== mirror) return;
			if (node.params?.roleId === trigger.params?.roleId) {
				push(`nodes[${i}].params.roleId`, 'self_loop', 'This would re-trigger the automation forever. Use a different role.');
			}
		});
	}

	if (errors.length) fail();
}

module.exports = {
	deriveTrigger,
	reachableFrom,
	triggerNode,
	validateGraph,
};
