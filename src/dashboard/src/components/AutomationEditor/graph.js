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
			position: { x: Math.round(node.position.x), y: Math.round(node.position.y) },
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

/** Node ids reachable from the trigger, for the unreachable-node warning. */
export function reachable(graph) {
	const trigger = graph.nodes.find((n) => n.type.startsWith('trigger.'));
	if (!trigger) return new Set();
	const next = new Map();
	for (const edge of graph.edges) {
		if (!next.has(edge.from)) next.set(edge.from, []);
		next.get(edge.from).push(edge.to);
	}
	const seen = new Set([trigger.id]);
	const stack = [trigger.id];
	while (stack.length) {
		for (const to of next.get(stack.pop()) ?? []) {
			if (seen.has(to)) continue;
			seen.add(to);
			stack.push(to);
		}
	}
	return seen;
}
