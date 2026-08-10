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
const { collectLayoutButtons } = require('../components-v2');

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
 * Every trigger node in a graph.
 *
 * An automation may have more than one: "ticket opened, post two buttons" and
 * the two "button pressed" branches that answer them belong in one automation,
 * not three. Tolerates a malformed graph rather than assuming validation has
 * already run, because `deriveTriggers` and the dispatcher both call it on
 * stored data.
 */
function triggerNodes(graph) {
	const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
	return nodes.filter(n => NODE_TYPES[n?.type]?.category === 'trigger');
}

/**
 * The one trigger a graph has, when it has exactly one.
 *
 * Kept for the places that legitimately mean "the only one" — a button with no
 * node id in its custom_id, which is every button posted before multi-trigger
 * automations existed.
 */
function triggerNode(graph) {
	const triggers = triggerNodes(graph);
	return triggers.length === 1 ? triggers[0] : null;
}

/**
 * The button triggers in a graph that nothing inside the graph points at.
 *
 * An in-graph button — the Confirm/Cancel pair on an ephemeral reply, say —
 * carries the id of the trigger it continues (`spec.nodeId`). A trigger named
 * that way is the middle of a conversation, never its start. Whatever is left is
 * where the graph is entered from outside: a panel button, or a ticket-controls
 * button. `src/buttons/auto.js` uses it to resolve a press whose custom_id names
 * no node.
 *
 * **The scan must look inside layouts.** Buttons used to live in a flat
 * `node.params.buttons` array; since GRAPH_VERSION 2 they are blocks in
 * `node.params.layout`, which may nest them in a container or hang one off a
 * section. A scan that only knew the old shape would find no continuations at
 * all, every button trigger would look like an entry point, and live panel
 * buttons in every server would start answering "That button is no longer
 * connected to anything." The old shape is still read, so a graph in flight —
 * one cached before the upgrade landed, or handed straight from a request body —
 * behaves the same.
 *
 * @param {object} graph
 * @returns {object[]} the entry button triggers
 */
function entryButtonTriggers(graph) {
	const triggers = triggerNodes(graph).filter(n => n.type === 'trigger.button.pressed');
	if (triggers.length < 2) return triggers;

	const continuations = new Set();
	for (const node of Array.isArray(graph?.nodes) ? graph.nodes : []) {
		const specs = [
			...(Array.isArray(node?.params?.buttons) ? node.params.buttons : []),
			...collectLayoutButtons(node?.params?.layout).map(found => found.button),
		];
		for (const spec of specs) if (spec?.nodeId) continuations.add(spec.nodeId);
	}

	return triggers.filter(n => !continuations.has(n.id));
}

/**
 * The value of `Automation.triggerTypes` for a graph.
 *
 * The exact analogue of `panels.js#collectCategoryIds`: the client never sends
 * this, it is recomputed from the graph on every write, so it cannot drift from
 * what the canvas contains. Only used for display and coarse filtering — the
 * dispatcher matches against the graph's own trigger nodes, so this is never
 * load-bearing for whether an automation fires.
 *
 * @returns {{triggerTypes: string[]}} distinct, sorted
 */
function deriveTriggers(graph) {
	const triggers = triggerNodes(graph);
	if (triggers.length === 0) {
		throw new AutomationError([{
			code: 'no_trigger',
			message: 'The automation needs at least one trigger',
			path: 'nodes',
		}]);
	}
	return { triggerTypes: [...new Set(triggers.map(n => n.type))].sort() };
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

/** Node ids reachable from any of `startIds`, following every handle. */
function reachableFrom(startIds, edges) {
	const roots = Array.isArray(startIds) ? startIds : [startIds];
	const next = adjacency(edges);
	const seen = new Set(roots);
	const queue = [...roots];
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
	// Everything that reaches a validator has been through `upgrade.js` first —
	// both routes upgrade `body.graph` before calling this. Refusing an older
	// version here is what makes "a stored graph is exactly GRAPH_VERSION" an
	// invariant the interpreter and the renderers can rely on, rather than a
	// hope.
	if (graph.version < GRAPH_VERSION) {
		push('version', 'not_upgraded', 'This automation is in an older format that was not upgraded. Reload the page and try again.');
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
		type.validate?.(node.params, push, at, {
			...options,
			// Which nodes in *this* graph a button may point at. Computed here
			// because only the validator has the whole graph in hand.
			buttonNodeIds: nodes
				.filter(n => n?.type === 'trigger.button.pressed')
				.map(n => n.id),
		});

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

	/* ── triggers ──────────────────────────────────────────────────────────── */

	const triggers = nodes.filter(n => NODE_TYPES[n.type].category === 'trigger');
	if (triggers.length === 0) push('nodes', 'no_trigger', 'The automation needs at least one trigger');
	if (!nodes.some(n => NODE_TYPES[n.type].category === 'action')) {
		push('nodes', 'no_action', 'The automation does not do anything yet');
	}
	if (errors.length) fail();

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

	const reachable = reachableFrom(triggers.map(t => t.id), edges);
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

	// With several triggers, a node's context is only what *every* trigger that
	// can reach it provides. A step fed by both "a ticket is closed" and "a button
	// is pressed" gets the intersection — anything else would work when one fired
	// and fail when the other did, which is the worst way to find out.
	const reachSets = triggers.map(t => ({
		provides: new Set(NODE_TYPES[t.type].provides ?? []),
		reaches: reachableFrom([t.id], edges),
		trigger: t,
	}));

	nodes.forEach((node, i) => {
		if (!reachable.has(node.id)) return;
		if (triggers.some(t => t.id === node.id)) return;

		const feeders = reachSets.filter(r => r.reaches.has(node.id));
		if (feeders.length === 0) return;

		for (const capability of needsOf(node)) {
			const missing = feeders.filter(f => !f.provides.has(capability));
			if (missing.length === 0) continue;
			const names = missing.map(f => `"${NODE_TYPES[f.trigger.type].label}"`).join(', ');
			push(
				`nodes[${i}]`,
				'missing_context',
				`"${NODE_TYPES[node.type].label}" needs ${CAPABILITY_LABELS[capability] ?? capability}, which ${names} ${missing.length > 1 ? 'do' : 'does'} not provide`,
			);
			break;
		}
	});

	/* ── the role feedback loop ────────────────────────────────────────────── */

	// `trigger.member.roleAdded` + `action.role.add` on the same role re-triggers
	// itself no matter how the interpreter behaves. The depth counter and the
	// suppression key both catch it at runtime; rejecting it here means nobody has
	// to find out that way.
	for (const trigger of triggers) {
		if (trigger.type !== 'trigger.member.roleAdded' && trigger.type !== 'trigger.member.roleRemoved') continue;
		const mirror = trigger.type === 'trigger.member.roleAdded' ? 'action.role.add' : 'action.role.remove';
		const downstream = reachableFrom([trigger.id], edges);
		nodes.forEach((node, i) => {
			if (!downstream.has(node.id) || node.type !== mirror) return;
			if (node.params?.roleId === trigger.params?.roleId) {
				push(`nodes[${i}].params.roleId`, 'self_loop', 'This would re-trigger the automation forever. Use a different role.');
			}
		});
	}

	if (errors.length) fail();
}

module.exports = {
	deriveTriggers,
	entryButtonTriggers,
	reachableFrom,
	triggerNode,
	triggerNodes,
	validateGraph,
};
