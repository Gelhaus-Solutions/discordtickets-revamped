/**
 * Conversion between our stored graph and Svelte Flow's node/edge shape.
 *
 * The persisted format is ours, not the library's, and nothing outside
 * `Canvas.svelte` and the node components imports `@xyflow/svelte`. Swapping the
 * canvas library later is a change to those files and this one — the data on
 * disk never moves.
 */

import { v4 as uuid } from 'uuid';
import { GRAPH_VERSION } from './nodes.js';

/** Defaults for a node type, taken from the server's parameter schema. */
export function defaultParams(type, catalogue) {
	const definition = catalogue?.types?.find((t) => t.type === type);
	const params = {};
	for (const field of definition?.params ?? []) {
		if (field.default !== undefined) params[field.key] = structuredClone(field.default);
	}
	return params;
}

export function newNode(type, catalogue, position = { x: 0, y: 0 }) {
	return {
		id: uuid().slice(0, 8),
		params: defaultParams(type, catalogue),
		position,
		type
	};
}

export function newGraph(triggerType, catalogue) {
	return {
		edges: [],
		nodes: [newNode(triggerType, catalogue, { x: 0, y: 0 })],
		version: GRAPH_VERSION
	};
}

/** Our graph -> Svelte Flow. */
export function toFlow(graph) {
	return {
		edges: (graph?.edges ?? []).map((edge) => ({
			deletable: true,
			id: edge.id,
			source: edge.from,
			sourceHandle: edge.fromHandle,
			target: edge.to,
			type: 'deletable'
		})),
		nodes: (graph?.nodes ?? []).map((node) => ({
			data: { params: node.params ?? {}, type: node.type },
			id: node.id,
			position: node.position ?? { x: 0, y: 0 },
			type: node.type.split('.')[0]
		}))
	};
}

/**
 * Svelte Flow -> our graph.
 *
 * Positions are rounded, so a drag that ends where it started does not register
 * as an unsaved change.
 */
export function fromFlow(nodes, edges) {
	return {
		edges: edges.map((edge) => ({
			from: edge.source,
			fromHandle: edge.sourceHandle ?? 'out',
			id: edge.id,
			to: edge.target
		})),
		nodes: nodes.map((node) => ({
			id: node.id,
			params: node.data.params ?? {},
			position: {
				x: Math.round(node.position.x),
				y: Math.round(node.position.y)
			},
			type: node.data.type
		})),
		version: GRAPH_VERSION
	};
}

/** Would this connection close a loop? Checked before the edge is allowed. */
export function createsCycle(edges, connection) {
	const next = new Map();
	for (const edge of edges) {
		if (!next.has(edge.source)) next.set(edge.source, []);
		next.get(edge.source).push(edge.target);
	}
	// Walk forward from the proposed target: reaching the source means the new
	// edge would complete a cycle.
	const seen = new Set();
	const stack = [connection.target];
	while (stack.length) {
		const id = stack.pop();
		if (id === connection.source) return true;
		if (seen.has(id)) continue;
		seen.add(id);
		stack.push(...(next.get(id) ?? []));
	}
	return false;
}

/**
 * A topological order of the graph, for the capability walk.
 *
 * Kahn's, and deliberately cycle-tolerant: the canvas has no cycle check and can
 * hold one mid-drag, so nodes inside a cycle are simply left out of the order
 * rather than throwing. Callers must treat "absent from the order" as "do not
 * check", or one stray edge paints the whole canvas red.
 */
export function topoOrder(graph) {
	const indegree = new Map(graph.nodes.map((n) => [n.id, 0]));
	const next = new Map(graph.nodes.map((n) => [n.id, []]));
	for (const edge of graph.edges) {
		if (!indegree.has(edge.from) || !indegree.has(edge.to)) continue;
		indegree.set(edge.to, indegree.get(edge.to) + 1);
		next.get(edge.from).push(edge.to);
	}
	const queue = graph.nodes.filter((n) => indegree.get(n.id) === 0).map((n) => n.id);
	const order = [];
	while (queue.length) {
		const id = queue.shift();
		order.push(id);
		for (const to of next.get(id)) {
			indegree.set(to, indegree.get(to) - 1);
			if (indegree.get(to) === 0) queue.push(to);
		}
	}
	return order;
}

/** Node ids reachable from the trigger, for the unreachable-node warning. */
export function reachable(graph, roots = null) {
	const starts =
		roots ?? graph.nodes.filter((n) => n.type.startsWith('trigger.')).map((n) => n.id);
	if (starts.length === 0) return new Set();
	const next = new Map();
	for (const edge of graph.edges) {
		if (!next.has(edge.from)) next.set(edge.from, []);
		next.get(edge.from).push(edge.to);
	}
	const seen = new Set(starts);
	const stack = [...starts];
	while (stack.length) {
		for (const to of next.get(stack.pop()) ?? []) {
			if (seen.has(to)) continue;
			seen.add(to);
			stack.push(to);
		}
	}
	return seen;
}
