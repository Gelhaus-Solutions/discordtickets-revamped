/**
 * Client-side graph validation.
 *
 * The server is the authority — `src/lib/automations/validate.js` re-checks
 * everything and its 400 is what actually stops a bad save. This exists so the
 * canvas can show the problem on the offending node while it is being made,
 * rather than after a round trip.
 *
 * It is intentionally a subset: the structural rules and the capability check,
 * which are the ones a person hits while building. Per-field rules come from the
 * server's parameter schema.
 */

import { reachable } from './graph.js';

const CAPABILITY_LABELS = {
	actor: 'the person who triggered it',
	channel: 'a channel',
	guild: 'a server',
	interaction: 'a button or menu interaction',
	member: 'a server member',
	message: 'a message',
	selection: 'a menu selection',
	ticket: 'a ticket',
	ticketChannel: 'an open ticket channel'
};

const SUBJECT_NEEDS = {
	actor: 'member',
	messageAuthor: 'message',
	ticketClaimer: 'ticket',
	ticketCreator: 'ticket'
};

const definitionOf = (catalogue, type) => catalogue?.types?.find((t) => t.type === type);

/** Everything a node depends on, including the dynamic cases the server also checks. */
function needsOf(node, catalogue) {
	const definition = definitionOf(catalogue, node.type);
	const needs = new Set(definition?.needs ?? []);

	for (const clause of node.params?.clauses ?? []) {
		const field = catalogue?.clauseFields?.find((f) => f.field === clause.field);
		for (const capability of field?.needs ?? []) needs.add(capability);
	}

	const subject = node.params?.subject;
	if (subject && SUBJECT_NEEDS[subject]) needs.add(SUBJECT_NEEDS[subject]);

	if (node.type === 'action.message.send') {
		if (node.params?.target === 'ticket') needs.add('ticketChannel');
		if (node.params?.target === 'triggerChannel') needs.add('channel');
	}
	return [...needs];
}

/**
 * @returns {{nodeId: string|null, key?: string, message: string, severity: 'error'|'warning'}[]}
 */
export function validate(graph, catalogue) {
	const problems = [];
	const add = (nodeId, message, severity = 'error', key) =>
		problems.push({ key, message, nodeId, severity });

	if (!catalogue) return problems;

	const triggers = graph.nodes.filter((n) => n.type.startsWith('trigger.'));
	if (triggers.length === 0) {
		add(null, 'The automation needs at least one trigger.');
		return problems;
	}
	if (!graph.nodes.some((n) => n.type.startsWith('action.'))) {
		add(null, 'The automation does not do anything yet — add an action.');
	}

	const limits = catalogue.limits ?? {};
	if (graph.nodes.length > (limits.nodes ?? Infinity))
		add(null, `Too many steps (max ${limits.nodes}).`);
	if (graph.edges.length > (limits.edges ?? Infinity))
		add(null, `Too many connections (max ${limits.edges}).`);

	const reached = reachable(graph);
	// A node's context is only what *every* trigger that can reach it provides.
	const feedersOf = (nodeId) =>
		triggers.filter((t) =>
			reachable({ edges: graph.edges, nodes: graph.nodes }, [t.id]).has(nodeId)
		);

	for (const node of graph.nodes) {
		const definition = definitionOf(catalogue, node.type);
		if (!definition) {
			add(node.id, 'This step is not one this version of the bot understands.');
			continue;
		}

		if (!reached.has(node.id)) {
			add(node.id, 'Nothing leads to this step, so it will never run.');
			continue;
		}

		// Required parameters, from the server's own schema.
		for (const field of definition.params ?? []) {
			if (!field.required) continue;
			const value = node.params?.[field.key];
			const missing =
				value === undefined ||
				value === null ||
				value === '' ||
				(Array.isArray(value) && value.length === 0);
			if (missing) add(node.id, `${field.label} is required.`, 'error', field.key);
		}

		if (triggers.some((t) => t.id === node.id)) continue;

		const feeders = feedersOf(node.id);
		if (feeders.length === 0) continue;
		for (const capability of needsOf(node, catalogue)) {
			const missing = feeders.filter(
				(t) => !(definitionOf(catalogue, t.type)?.provides ?? []).includes(capability)
			);
			if (missing.length === 0) continue;
			const names = missing
				.map((t) => `"${definitionOf(catalogue, t.type)?.label}"`)
				.join(', ');
			add(
				node.id,
				`"${definition.label}" needs ${CAPABILITY_LABELS[capability] ?? capability}, which ${names} ${missing.length > 1 ? 'do' : 'does'} not provide.`
			);
			break;
		}
	}

	// Dead ends are worth mentioning but must not block a save: a branch that
	// deliberately does nothing is a legitimate thing to build halfway through.
	for (const node of graph.nodes) {
		const definition = definitionOf(catalogue, node.type);
		if (!definition || definition.outputs.length === 0) continue;
		if (node.type.startsWith('action.') || node.type.startsWith('trigger.')) continue;
		const hasOut = graph.edges.some((e) => e.from === node.id);
		if (!hasOut) add(node.id, 'This step does not lead anywhere.', 'warning');
	}

	return problems;
}
