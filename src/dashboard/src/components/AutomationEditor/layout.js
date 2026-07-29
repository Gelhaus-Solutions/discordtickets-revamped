/**
 * Automatic placement for graphs that arrive without positions — imported
 * automations, templates, and anything hand-written.
 *
 * Deliberately not dagre: that is 200 KB+ for what is, on a graph capped at a
 * few dozen nodes, a longest-path rank and a stack per rank.
 */

export const NODE_W = 260;
export const NODE_H = 110;
export const GAP_X = 120;
export const GAP_Y = 40;

/** Place every node left-to-right by its distance from the trigger. */
export function autoLayout(graph) {
	const rank = new Map(graph.nodes.map((n) => [n.id, 0]));
	const incoming = new Map(graph.nodes.map((n) => [n.id, 0]));
	const next = new Map(graph.nodes.map((n) => [n.id, []]));

	for (const edge of graph.edges) {
		if (!next.has(edge.from) || !incoming.has(edge.to)) continue;
		next.get(edge.from).push(edge.to);
		incoming.set(edge.to, incoming.get(edge.to) + 1);
	}

	// Topological walk, taking the longest path so a node always sits to the
	// right of everything that can reach it.
	const queue = graph.nodes.filter((n) => incoming.get(n.id) === 0).map((n) => n.id);
	const order = [];
	while (queue.length) {
		const id = queue.shift();
		order.push(id);
		for (const to of next.get(id) ?? []) {
			rank.set(to, Math.max(rank.get(to), rank.get(id) + 1));
			incoming.set(to, incoming.get(to) - 1);
			if (incoming.get(to) === 0) queue.push(to);
		}
	}
	// A cycle would leave nodes unvisited; place them after everything else
	// rather than at the origin, so they are findable.
	for (const node of graph.nodes) if (!order.includes(node.id)) order.push(node.id);

	const perRank = new Map();
	for (const id of order) {
		const node = graph.nodes.find((n) => n.id === id);
		const r = rank.get(id) ?? 0;
		const row = perRank.get(r) ?? 0;
		perRank.set(r, row + 1);
		node.position = { x: r * (NODE_W + GAP_X), y: row * (NODE_H + GAP_Y) };
	}
	return graph;
}

export const needsLayout = (graph) =>
	(graph?.nodes ?? []).some(
		(n) => !Number.isFinite(n.position?.x) || !Number.isFinite(n.position?.y)
	);
