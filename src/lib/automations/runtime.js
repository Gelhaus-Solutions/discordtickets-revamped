/**
 * The automation interpreter.
 *
 * A note on vocabulary, because this codebase already uses the obvious word for
 * something else: "workflow" here always means a *Temporal* workflow. The thing
 * a server admin builds on the canvas is an **automation**, its JSON is a
 * **graph**, and one execution of it is a **run**.
 *
 * ## Semantics, chosen for predictability over expressiveness
 *
 * 1. **Entry** is whichever trigger fired. A graph may hold several — two
 *    "button pressed" nodes answering two buttons the same graph posted — so
 *    the caller says which one, and the branch hanging off it is what runs. A
 *    resumed run enters at a serialized queue instead.
 * 2. **Traversal** is an explicit FIFO queue, never recursion. Successors are
 *    enqueued in `edges[]` order, which is the order the editor writes them, so
 *    the run log reads top-to-bottom like the canvas looks.
 * 3. **Fan-out** enqueues every edge on the handle that was returned, and the
 *    branches run **sequentially**. Concurrency would buy nothing here and cost
 *    Discord rate limits, a deterministic step budget, and a readable trace.
 * 4. **A node runs at most once per run, and there is no join.** A second
 *    arrival is traced as `already_ran`. Converging edges therefore behave the
 *    way a canvas user expects — the join fires once, on first arrival — and a
 *    runaway loop is structurally impossible even if a cycle somehow got stored.
 *    This is the one semantic that could surprise someone, so it is also stated
 *    in the node catalogue.
 * 5. **Suspension**: reaching a `durable` node ends the inline run and returns
 *    the whole remaining queue as serializable state. The caller decides whether
 *    that means "start a Temporal workflow" (inline) or "tell the workflow to
 *    sleep" (already durable) — the interpreter behaves identically either way.
 */

const { LIMITS } = require('./errors');
const { NODE_TYPES } = require('./registry');
const { triggerNodes } = require('./validate');

/** Per-node outcomes recorded in `AutomationRun.steps`. */
const STEP = {
	error: 'error',
	ok: 'ok',
	skip: 'skip',
	stop: 'stop',
	suspend: 'suspend',
};

const RUN = {
	cancelled: 'CANCELLED',
	failed: 'FAILED',
	skipped: 'SKIPPED',
	success: 'SUCCESS',
	suspended: 'SUSPENDED',
};

/** Successors of `nodeId` on `handle`, in the order the editor stored them. */
function successors(graph, nodeId, handle) {
	return graph.edges
		.filter(edge => edge.from === nodeId && edge.fromHandle === handle)
		.map(edge => edge.to);
}

/**
 * Run a graph from a queue of node ids.
 *
 * Takes `runners` rather than reaching for them, which is what lets
 * `scripts/check-automations.js` drive the whole state machine with stub nodes
 * and no Discord, Prisma or Temporal — the same trick `check-panels.js` uses
 * with its fake client.
 *
 * @param {object} graph
 * @param {import('./context').Context} ctx
 * @param {string[]} queue node ids still to execute
 * @param {object} options
 * @param {Record<string, (node, ctx) => Promise<{handle?: string, status?: string, reason?: string}>>} options.runners
 * @param {() => number} [options.clock] injectable, so the wall-clock guard is testable
 * @returns {Promise<{status: string, steps: object[], error?: string, waitMs?: number, state?: object}>}
 */
async function runFrom(graph, ctx, queue, {
	clock = Date.now,
	runners,
}) {
	const started = clock();
	const work = [...queue];
	const trace = ctx.trace ?? [];
	const executed = new Set(ctx.executed ?? []);

	let ranAnAction = false;
	let failure = null;

	while (work.length > 0) {
		const nodeId = work.shift();
		const node = graph.nodes.find(n => n.id === nodeId);

		// The graph was edited while the run was parked. Ending here is the only
		// honest option: the alternative is running a stale graph.
		if (!node) {
			return {
				error: `graph_changed:${nodeId}`,
				status: RUN.cancelled,
				steps: trace,
			};
		}

		if (executed.has(nodeId)) {
			trace.push({
				n: nodeId,
				r: 'already_ran',
				s: STEP.skip,
				t: node.type,
			});
			continue;
		}

		if (ctx.budget.steps >= LIMITS.steps) {
			return {
				error: 'step_budget_exceeded',
				status: RUN.failed,
				steps: trace,
			};
		}
		// Not a suspend: an automation that takes ten seconds without a wait node
		// is misconfigured, and quietly deferring it would hide that.
		if (clock() - started > LIMITS.inlineMs) {
			return {
				error: 'timeout',
				status: RUN.failed,
				steps: trace,
			};
		}

		const type = NODE_TYPES[node.type];
		executed.add(nodeId);
		ctx.budget.steps++;

		// Durable nodes end the inline run. The *whole* remaining queue is carried
		// over, not just this node's successors — otherwise a fan-out with one
		// waiting branch would silently lose its siblings.
		if (type.durable) {
			trace.push({
				n: nodeId,
				s: STEP.suspend,
				t: node.type,
			});
			const remaining = [...successors(graph, nodeId, type.outputs[0]), ...work];
			return {
				state: {
					...ctx.serialize(),
					executed: [...executed],
					queue: remaining,
					trace,
				},
				status: RUN.suspended,
				steps: trace,
				waitMs: Number(node.params?.ms) || 0,
			};
		}

		const at = clock();
		let result;
		try {
			result = (await runners[node.type]?.(node, ctx)) ?? {};
		} catch (error) {
			failure ??= `${error?.code ?? 'error'}:${nodeId}`;
			trace.push({
				e: String(error?.message ?? error).slice(0, 200),
				m: clock() - at,
				n: nodeId,
				s: STEP.error,
				t: node.type,
			});
			// Stops this branch only; anything already queued still runs.
			if ((type.onError ?? 'stop') === 'stop') continue;
			result = { handle: type.outputs[0] };
		}

		if (result.status !== STEP.error) {
			// Undefined keys are omitted rather than written: `JSON.stringify`
			// drops them, so a parked run would come back subtly different from
			// the one that was saved.
			const step = {
				m: clock() - at,
				n: nodeId,
				s: result.status ?? STEP.ok,
				t: node.type,
			};
			if (result.reason) step.r = result.reason;
			trace.push(step);
		}
		if (type.category === 'action' && (result.status ?? STEP.ok) === STEP.ok) ranAnAction = true;

		// `flow.stop` has no outputs, and a runner may decline to continue by
		// returning no handle at all.
		const handle = result.handle ?? type.outputs[0];
		if (!handle || result.status === STEP.stop) continue;

		for (const next of successors(graph, nodeId, handle)) {
			if (!executed.has(next)) work.push(next);
		}
	}

	if (failure) {
		return {
			error: failure,
			status: RUN.failed,
			steps: trace,
		};
	}
	return {
		status: ranAnAction ? RUN.success : RUN.skipped,
		steps: trace,
	};
}

/**
 * Run a graph from one of its triggers.
 *
 * `startNodeId` says which one fired — a graph may have several, and the branch
 * that runs is the one hanging off that node. Omitted, it falls back to the
 * only trigger, which is what a resumed run or a single-trigger graph wants.
 */
function runAutomation(graph, ctx, options = {}) {
	const triggers = triggerNodes(graph);
	const start = options.startNodeId
		? triggers.find(t => t.id === options.startNodeId)
		: (triggers.length === 1 ? triggers[0] : null);

	if (!start) {
		return Promise.resolve({
			error: options.startNodeId ? `graph_changed:${options.startNodeId}` : 'no_trigger',
			status: options.startNodeId ? RUN.cancelled : RUN.failed,
			steps: [],
		});
	}
	return runFrom(graph, ctx, [start.id], options);
}

module.exports = {
	RUN,
	STEP,
	runAutomation,
	runFrom,
	successors,
};
