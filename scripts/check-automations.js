/**
 * Checks the automations contract: what the validator rejects, how the
 * interpreter traverses a graph, and — most importantly — that a run parked on
 * a `flow.wait` can survive a round trip through JSON and carry on.
 *
 * The interpreter takes its runners as an argument, so everything here runs with
 * stub nodes and no Discord, Prisma or Temporal. That is the whole reason for
 * the injection: a state machine you can only exercise against a live Discord
 * gateway is a state machine nobody exercises.
 *
 * It also guards the two things that are duplicated on purpose and would
 * otherwise drift silently:
 *   - the dashboard's node registry mirror
 *   - the button custom_id, against Discord's 100-character limit
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const {
	GRAPH_VERSION, LIMITS, PRIVATE_LIMITS, PUBLIC_LIMITS, AutomationError, describeError,
} = require(path.join(root, 'src', 'lib', 'automations', 'errors'));
const {
	CAPABILITIES, NODE_TYPES, isValidCron, needsOf,
} = require(path.join(root, 'src', 'lib', 'automations', 'registry'));
const {
	analyse, capabilitiesFrom, deriveTriggers, entryButtonTriggers, validateGraph,
} = require(path.join(root, 'src', 'lib', 'automations', 'validate'));
const {
	RUN, STEP, runAutomation, runFrom,
} = require(path.join(root, 'src', 'lib', 'automations', 'runtime'));
const { Context } = require(path.join(root, 'src', 'lib', 'automations', 'context'));
const {
	matches, triggerVars,
} = require(path.join(root, 'src', 'lib', 'automations', 'dispatcher'));
const {
	defaultMessageLayout, substitute,
} = require(path.join(root, 'src', 'lib', 'components-v2'));
const { automationCustomId } = require(path.join(root, 'src', 'lib', 'automations', 'discord'));
const { upgradeGraph } = require(path.join(root, 'src', 'lib', 'automations', 'upgrade'));

let pass = 0;
const t = async (name, fn) => {
	try {
		await fn();
		pass++;
		console.log('  ok  ', name);
	} catch (e) {
		console.log('  FAIL', name, '\n       ', e.message);
		process.exitCode = 1;
	}
};

/* ────────────────────────────────── helpers ────────────────────────────────── */

let seq = 0;
const node = (type, params = {}, id) => ({
	id: id ?? `n${++seq}`,
	params,
	position: {
		x: 0,
		y: 0,
	},
	type,
});
const edge = (from, to, fromHandle = 'out', id) => ({
	from,
	fromHandle,
	id: id ?? `e${++seq}`,
	to,
});
const graph = (nodes, edges = []) => ({
	edges,
	nodes,
	version: GRAPH_VERSION,
});

/** The params of a message node in the plain-text format. */
const plain = (content, buttons = []) => (buttons.length ? {
	buttons,
	content,
	format: 'text',
} : {
	content,
	format: 'text',
});

/** The params of a message node in the rich Components v2 format. */
const rich = (content, buttons = []) => ({
	format: 'layout',
	layout: defaultMessageLayout(content, buttons, { idPrefix: `l${++seq}` }),
});

/** A minimal valid automation: a ticket closes, a role is added. */
function simple() {
	const a = node('trigger.ticket.closed', { categoryIds: [] }, 'a');
	const b = node('action.role.add', {
		roleId: '820000000000000001',
		subject: 'ticketCreator',
	}, 'b');
	return graph([a, b], [edge('a', 'b')]);
}

/** The code of the first error, or null if the graph validated. */
function codeOf(g, options) {
	try {
		validateGraph(g, options);
		return null;
	} catch (error) {
		assert.ok(error instanceof AutomationError, 'expected an AutomationError');
		return error.errors[0].code;
	}
}

const ctx = (state = {}) => {
	const c = new Context(null, {
		guildId: '1',
		...state,
	});
	return c;
};

/**
 * Run `fn` as if this were a public instance.
 *
 * The quota limits only exist when `PUBLIC_BOT=true`; on a private bot they are
 * Infinity, so a test that asserts "too many nodes is rejected" has to say which
 * kind of bot it is talking about.
 */
function asPublic(fn) {
	const before = process.env.PUBLIC_BOT;
	process.env.PUBLIC_BOT = 'true';
	const restore = () => {
		if (before === undefined) delete process.env.PUBLIC_BOT;
		else process.env.PUBLIC_BOT = before;
	};

	let result;
	try {
		result = fn();
	} catch (error) {
		restore();
		throw error;
	}
	// `LIMITS` is read while the run executes, not while `fn` is called, so an
	// async body has to keep the env set until it settles.
	if (result && typeof result.then === 'function') return result.finally(restore);
	restore();
	return result;
}

/** Runners that record what ran, so a trace can be asserted against intent. */
function stubRunners(overrides = {}) {
	const ran = [];
	const base = new Proxy({}, {
		get: (_, type) => {
			if (typeof type !== 'string') return undefined;
			if (overrides[type]) return overrides[type];
			return async n => {
				ran.push(n.id);
				return {};
			};
		},
		has: () => true,
	});
	return {
		ran,
		runners: base,
	};
}

(async () => {
	console.log('\nvalidation\n');

	await t('accepts a minimal trigger -> action graph', () => {
		assert.strictEqual(codeOf(simple()), null);
	});

	await t('rejects a newer graph version', () => {
		assert.strictEqual(codeOf({
			...simple(),
			version: GRAPH_VERSION + 1,
		}), 'unsupported');
	});

	await t('rejects zero triggers', () => {
		const g = graph([node('action.log', { content: 'hi' }, 'a')]);
		assert.strictEqual(codeOf(g), 'no_trigger');
	});

	// One automation, several entry points: "a ticket opens, post two buttons" and
	// the two branches answering them belong together.
	await t('accepts several triggers in one graph', () => {
		const g = graph(
			[
				node('trigger.button.pressed', { label: 'A' }, 'ta'),
				node('trigger.button.pressed', { label: 'B' }, 'tb'),
				node('action.role.add', {
					roleId: '820000000000000001',
					subject: 'actor',
				}, 'a'),
				node('action.role.remove', {
					roleId: '820000000000000002',
					subject: 'actor',
				}, 'b'),
			],
			[edge('ta', 'a'), edge('tb', 'b')],
		);
		assert.strictEqual(codeOf(g), null);
	});

	await t('a node fed by two triggers only gets what both provide', () => {
		// `action.message.reply` needs an actor. A cron trigger has none, so the
		// shared step is rejected however well the other trigger would serve it.
		const shared = () => graph(
			[
				node('trigger.message.created', { scope: 'ticket' }, 'tm'),
				node('trigger.schedule.cron', {
					cron: '0 9 * * *',
					timezone: 'UTC',
				}, 'tc'),
				node('action.message.reply', rich('hi'), 'r'),
			],
			[edge('tm', 'r'), edge('tc', 'r')],
		);
		assert.strictEqual(codeOf(shared()), 'missing_context');

		// The same step reached only by the message trigger is fine.
		const split = graph(
			[
				node('trigger.message.created', { scope: 'ticket' }, 'tm'),
				node('trigger.schedule.cron', {
					cron: '0 9 * * *',
					timezone: 'UTC',
				}, 'tc'),
				node('action.message.reply', rich('hi'), 'r'),
				node('action.log', { content: 'tick' }, 'l'),
			],
			[edge('tm', 'r'), edge('tc', 'l')],
		);
		assert.strictEqual(codeOf(split), null);
	});

	await t('a button may point at a trigger node in the same graph', () => {
		const g = graph(
			[
				node('trigger.ticket.created', {}, 't'),
				node('trigger.button.pressed', { label: 'Press me' }, 'btn'),
				node('action.message.send', {
					...rich('Here you go', [{
						label: 'Press me',
						nodeId: 'btn',
					}]),
					target: 'ticket',
				}, 's'),
				node('action.role.add', {
					roleId: '820000000000000001',
					subject: 'actor',
				}, 'r'),
			],
			[edge('t', 's'), edge('btn', 'r')],
		);
		assert.strictEqual(codeOf(g), null);

		// Pointing at something that is not a button trigger is refused.
		const bad = JSON.parse(JSON.stringify(g));
		bad.nodes[2].params.layout.blocks[1].buttons[0].nodeId = 't';
		assert.strictEqual(codeOf(bad), 'unknown_trigger');
	});

	await t('rejects a graph that does nothing', () => {
		const g = graph([node('trigger.ticket.closed', {}, 'a')]);
		assert.strictEqual(codeOf(g), 'no_action');
	});

	await t('rejects an unknown node type', () => {
		const g = simple();
		g.nodes[1].type = 'action.does.not.exist';
		assert.strictEqual(codeOf(g), 'unknown_type');
	});

	await t('rejects duplicate node ids', () => {
		const g = simple();
		g.nodes.push(node('action.log', { content: 'x' }, 'a'));
		assert.strictEqual(codeOf(g), 'duplicate_id');
	});

	await t('rejects an edge to a node that does not exist', () => {
		const g = simple();
		g.edges.push(edge('a', 'nope'));
		assert.strictEqual(codeOf(g), 'unknown_node');
	});

	await t('rejects a handle the node does not have', () => {
		const g = simple();
		g.nodes.push(node('flow.if', {
			clauses: [{
				field: 'ticket.claimed',
				op: 'is',
				value: true,
			}],
			match: 'all',
		}, 'c'));
		g.edges.push(edge('a', 'c'));
		// flow.if has true/false, not out.
		g.edges.push(edge('c', 'b', 'out'));
		assert.strictEqual(codeOf(g), 'unknown_handle');
	});

	await t('rejects an edge leading into the trigger', () => {
		const g = simple();
		g.edges.push(edge('b', 'a'));
		assert.strictEqual(codeOf(g), 'trigger_has_input');
	});

	await t('rejects a self-loop', () => {
		const g = simple();
		g.edges.push(edge('b', 'b'));
		assert.strictEqual(codeOf(g), 'self_loop');
	});

	await t('rejects a cycle a -> b -> a', () => {
		// Built past the trigger, so it is a genuine cycle rather than an edge
		// into the trigger.
		const g = graph(
			[
				node('trigger.ticket.closed', {}, 't'),
				node('flow.noop', {}, 'a'),
				node('action.log', { content: 'x' }, 'b'),
			],
			[edge('t', 'a'), edge('a', 'b'), edge('b', 'a')],
		);
		assert.strictEqual(codeOf(g), 'cycle');
	});

	await t('rejects an unreachable node', () => {
		const g = simple();
		g.nodes.push(node('action.log', { content: 'orphan' }, 'c'));
		assert.strictEqual(codeOf(g), 'unreachable');
	});

	/** A chain of `count` actions hanging off one trigger. */
	const chain = count => {
		const nodes = [node('trigger.ticket.closed', {}, 'a')];
		const edges = [];
		for (let i = 0; i < count; i++) {
			nodes.push(node('action.log', { content: 'x' }, `x${i}`));
			edges.push(edge(i === 0 ? 'a' : `x${i - 1}`, `x${i}`));
		}
		return graph(nodes, edges);
	};

	/** `count` actions all hanging off the trigger's single handle. */
	const fanOut = count => {
		const nodes = [node('trigger.ticket.closed', {}, 'a')];
		const edges = [];
		for (let i = 0; i < count; i++) {
			nodes.push(node('action.log', { content: 'x' }, `x${i}`));
			edges.push(edge('a', `x${i}`));
		}
		return graph(nodes, edges);
	};

	await t('public bot: rejects more nodes than the limit', () => {
		asPublic(() => assert.strictEqual(codeOf(chain(PUBLIC_LIMITS.nodes)), 'too_many'));
	});

	await t('public bot: rejects more branches than the limit on one handle', () => {
		asPublic(() => assert.strictEqual(codeOf(fanOut(PUBLIC_LIMITS.branches + 1)), 'too_many_branches'));
	});

	// The point of the private/public split: a self-hosted bot is not rationing
	// its own CPU, so the fair-use quotas are simply absent.
	await t('private bot: the quota limits do not apply', () => {
		assert.strictEqual(codeOf(chain(PUBLIC_LIMITS.nodes)), null, 'node count should be unlimited on a private bot');
		assert.strictEqual(codeOf(fanOut(PUBLIC_LIMITS.branches + 1)), null, 'branching should be unlimited on a private bot');
		for (const key of ['branches', 'clauses', 'edges', 'nodes', 'perGuild', 'runsPerMinute', 'steps']) {
			assert.strictEqual(PRIVATE_LIMITS[key], Infinity, `${key} should be unlimited on a private bot`);
		}
	});

	// These four are correctness, not fair use, so they survive in both modes.
	await t('the safety limits are never removed', () => {
		assert.ok(Number.isFinite(PRIVATE_LIMITS.depth), 'depth bounds automation-calls-automation recursion');
		assert.ok(PRIVATE_LIMITS.depth >= PUBLIC_LIMITS.depth);
		assert.ok(Number.isFinite(PRIVATE_LIMITS.inlineMs), 'inlineMs bounds how long the gateway event is blocked');
		assert.ok(Number.isFinite(PRIVATE_LIMITS.waitMaxMs));
		assert.ok(Number.isFinite(PRIVATE_LIMITS.waitMinMs));
	});

	await t('LIMITS follows PUBLIC_BOT at read time, not require time', () => {
		asPublic(() => assert.strictEqual(LIMITS.nodes, PUBLIC_LIMITS.nodes));
		assert.strictEqual(LIMITS.nodes, PRIVATE_LIMITS.nodes);
	});

	await t('rejects an automation that runs itself', () => {
		const g = graph(
			[node('trigger.ticket.closed', {}, 'a'), node('action.automation.run', { automationKey: 'me' }, 'b')],
			[edge('a', 'b')],
		);
		assert.strictEqual(codeOf(g, { selfKey: 'me' }), 'self_reference');
	});

	await t('rejects a per-minute cron, accepts a sane one', () => {
		assert.strictEqual(isValidCron('* * * * *'), false, 'every minute must be rejected');
		assert.strictEqual(isValidCron('*/1 * * * *'), false, 'every minute must be rejected');
		assert.strictEqual(isValidCron('*/5 * * * *'), true);
		assert.strictEqual(isValidCron('0 9 * * 1'), true);
		assert.strictEqual(isValidCron('0 9 * *'), false, 'four fields is not a schedule');
		assert.strictEqual(isValidCron('0 99 * * *'), false, 'hour 99 does not exist');
	});

	await t('rejects an invalid timezone', () => {
		const g = graph(
			[
				node('trigger.schedule.cron', {
					cron: '0 9 * * *',
					timezone: 'Mars/Olympus',
				}, 'a'),
				node('action.log', { content: 'x' }, 'b'),
			],
			[edge('a', 'b')],
		);
		assert.strictEqual(codeOf(g), 'invalid_timezone');
	});

	await t('rejects a bad regex in a message trigger', () => {
		const g = graph(
			[
				node('trigger.message.created', {
					pattern: '([',
					scope: 'ticket',
				}, 'a'),
				node('action.log', { content: 'x' }, 'b'),
			],
			[edge('a', 'b')],
		);
		assert.strictEqual(codeOf(g), 'invalid_regex');
	});

	await t('rejects the role feedback loop', () => {
		const g = graph(
			[
				node('trigger.member.roleAdded', { roleId: '820000000000000001' }, 'a'),
				node('action.role.add', {
					roleId: '820000000000000001',
					subject: 'actor',
				}, 'b'),
			],
			[edge('a', 'b')],
		);
		assert.strictEqual(codeOf(g), 'self_loop');
	});

	// The assertion that proves the capability system is actually wired up, not
	// just declared.
	await t('capabilities: reply under a cron trigger is rejected', () => {
		const g = graph(
			[
				node('trigger.schedule.cron', {
					cron: '0 9 * * *',
					timezone: 'UTC',
				}, 'a'),
				node('action.message.reply', rich('hi'), 'b'),
			],
			[edge('a', 'b')],
		);
		assert.strictEqual(codeOf(g), 'missing_context');
	});

	await t('capabilities: the same reply under a message trigger is accepted', () => {
		const g = graph(
			[
				node('trigger.message.created', { scope: 'ticket' }, 'a'),
				node('action.message.reply', rich('hi'), 'b'),
			],
			[edge('a', 'b')],
		);
		assert.strictEqual(codeOf(g), null);
	});

	await t('capabilities: needsOf sees the subject, not just the declaration', () => {
		assert.ok(needsOf(node('action.role.add', {
			roleId: '1',
			subject: 'ticketCreator',
		})).includes('ticket'));
		assert.ok(!needsOf(node('action.message.send', {
			channelId: '820000000000000001',
			...rich('x'),
			target: 'channel',
		})).includes('ticketChannel'));
		assert.ok(needsOf(node('action.message.send', {
			...rich('x'),
			target: 'ticket',
		})).includes('ticketChannel'));
	});

	/* ─────────────────── capabilities an action hands onward ─────────────────── */

	// These need a node type that provides one. Rather than pin the suite to
	// whichever real node happens to provide `channel` this month, they install a
	// synthetic one for the length of the case: the walk is what is under test,
	// not any particular node's declaration.
	const withProvider = fn => {
		NODE_TYPES['action.test.provider'] = {
			category: 'action',
			description: 'Test only.',
			label: 'Provide a channel',
			needs: ['guild'],
			outputs: ['out'],
			params: [],
			provides: ['channel'],
		};
		try {
			return fn();
		} finally {
			delete NODE_TYPES['action.test.provider'];
		}
	};

	/** A branch condition that depends on no capability, so it fits any trigger. */
	const COIN_FLIP = {
		clauses: [{
			field: 'random.percent',
			op: 'lt',
			value: 50,
		}],
		match: 'all',
	};

	/** cron -> ...middle... -> "send to the channel this happened in". */
	const sendToTriggerChannel = id => node('action.message.send', {
		...rich('hi'),
		target: 'triggerChannel',
	}, id);

	await t('capabilities: an action can provide what the trigger did not', () => withProvider(() => {
		const g = graph(
			[
				node('trigger.schedule.cron', {
					cron: '0 9 * * *',
					timezone: 'UTC',
				}, 'a'),
				node('action.test.provider', {}, 'b'),
				sendToTriggerChannel('c'),
			],
			[edge('a', 'b'), edge('b', 'c')],
		);
		assert.strictEqual(codeOf(g), null);
	}));

	await t('capabilities: a capability provided after the node does not count', () => withProvider(() => {
		// The IN/OUT distinction, and the easiest thing to get wrong: the send
		// runs first, so the channel does not exist yet.
		const g = graph(
			[
				node('trigger.schedule.cron', {
					cron: '0 9 * * *',
					timezone: 'UTC',
				}, 'a'),
				sendToTriggerChannel('b'),
				node('action.test.provider', {}, 'c'),
			],
			[edge('a', 'b'), edge('b', 'c')],
		);
		assert.strictEqual(codeOf(g), 'missing_context');
	}));

	await t('capabilities: one branch of a flow.if does not provide for the join', () => withProvider(() => {
		// The case the whole meet exists for. A join executes on first arrival, so
		// a channel made on the true arm may genuinely not exist below the branch.
		const g = graph(
			[
				node('trigger.schedule.cron', {
					cron: '0 9 * * *',
					timezone: 'UTC',
				}, 'a'),
				node('flow.if', COIN_FLIP, 'b'),
				node('action.test.provider', {}, 'c'),
				node('flow.noop', {}, 'd'),
				sendToTriggerChannel('e'),
			],
			[edge('a', 'b'), edge('b', 'c', 'true'), edge('b', 'd', 'false'), edge('c', 'e'), edge('d', 'e')],
		);
		assert.strictEqual(codeOf(g), 'missing_context');
	}));

	await t('capabilities: both branches providing does count at the join', () => withProvider(() => {
		// And the other half: this is a real intersection, not "give up after a
		// branch". If this passes and the case above fails, the meet is wrong.
		const g = graph(
			[
				node('trigger.schedule.cron', {
					cron: '0 9 * * *',
					timezone: 'UTC',
				}, 'a'),
				node('flow.if', COIN_FLIP, 'b'),
				node('action.test.provider', {}, 'c'),
				node('action.test.provider', {}, 'd'),
				sendToTriggerChannel('e'),
			],
			[edge('a', 'b'), edge('b', 'c', 'true'), edge('b', 'd', 'false'), edge('c', 'e'), edge('d', 'e')],
		);
		assert.strictEqual(codeOf(g), null);
	}));

	await t('capabilities: a provider before the branch serves both arms', () => withProvider(() => {
		const g = graph(
			[
				node('trigger.schedule.cron', {
					cron: '0 9 * * *',
					timezone: 'UTC',
				}, 'a'),
				node('action.test.provider', {}, 'b'),
				node('flow.if', COIN_FLIP, 'c'),
				sendToTriggerChannel('d'),
				sendToTriggerChannel('e'),
			],
			[edge('a', 'b'), edge('b', 'c'), edge('c', 'd', 'true'), edge('c', 'e', 'false')],
		);
		assert.strictEqual(codeOf(g), null);
	}));

	await t('capabilities: two triggers, one direct and one via an action', () => withProvider(() => {
		// The message trigger supplies `channel` itself; the cron one has to make
		// it. Both feed the same send, and both have to be satisfied.
		const nodes = () => [
			node('trigger.message.created', { scope: 'ticket' }, 'a'),
			node('trigger.schedule.cron', {
				cron: '0 9 * * *',
				timezone: 'UTC',
			}, 'b'),
			node('action.test.provider', {}, 'c'),
			sendToTriggerChannel('d'),
		];
		assert.strictEqual(codeOf(graph(nodes(), [edge('a', 'd'), edge('b', 'c'), edge('c', 'd')])), null);

		// Take the provider out of the cron path and that trigger falls short,
		// even though the other one is still fine.
		assert.strictEqual(codeOf(graph(nodes(), [edge('a', 'd'), edge('b', 'd'), edge('b', 'c')])), 'missing_context');
	}));

	await t('capabilities: a node does not satisfy its own needs', () => withProvider(() => {
		const g = graph(
			[
				node('trigger.schedule.cron', {
					cron: '0 9 * * *',
					timezone: 'UTC',
				}, 'a'),
				node('action.test.provider', {}, 'b'),
			],
			[edge('a', 'b')],
		);
		const byId = new Map(g.nodes.map(n => [n.id, n]));
		const { order } = analyse(new Set(byId.keys()), g.edges);
		const into = capabilitiesFrom(new Set(byId.keys()), order, g.edges, byId);
		assert.ok(!into.get('b').has('channel'), 'a provider must not see its own capability');
	}));

	await t('capabilities: a graph with no provider is walked exactly as before', () => {
		// The back-compat proof, pinned. While no action provides anything, every
		// node's set has to be precisely its trigger's `provides` — which is the
		// value the trigger-only walk used. If a future node breaks this, the
		// claim that stored graphs validate identically breaks with it.
		for (const g of [simple(), graph(
			[
				node('trigger.message.created', { scope: 'ticket' }, 'a'),
				node('flow.if', COIN_FLIP, 'b'),
				node('action.message.reply', rich('hi'), 'c'),
			],
			[edge('a', 'b'), edge('b', 'c', 'true')],
		)]) {
			const byId = new Map(g.nodes.map(n => [n.id, n]));
			const ids = new Set(byId.keys());
			const { order } = analyse(ids, g.edges);
			const into = capabilitiesFrom(ids, order, g.edges, byId);
			const trigger = g.nodes.find(n => n.type.startsWith('trigger.'));
			const expected = new Set(NODE_TYPES[trigger.type].provides);
			for (const n of g.nodes) {
				if (n.id === trigger.id) continue;
				assert.deepStrictEqual(into.get(n.id), expected, `${n.type} sees a different set than its trigger provides`);
			}
		}
	});

	await t('deriveTriggers lists every distinct trigger type', () => {
		assert.deepStrictEqual(deriveTriggers(simple()), { triggerTypes: ['trigger.ticket.closed'] });

		const many = graph(
			[
				node('trigger.button.pressed', { label: 'A' }, 'ta'),
				node('trigger.button.pressed', { label: 'B' }, 'tb'),
				node('trigger.ticket.created', {}, 'tc'),
				node('action.log', { content: 'x' }, 'a'),
			],
			[edge('ta', 'a'), edge('tb', 'a'), edge('tc', 'a')],
		);
		// Distinct and sorted — two button triggers are one type.
		assert.deepStrictEqual(deriveTriggers(many), { triggerTypes: ['trigger.button.pressed', 'trigger.ticket.created'] });
	});

	await t('describeError produces the panels-shaped 400 body', () => {
		let thrown;
		try {
			validateGraph({ version: 99 });
		} catch (error) {
			thrown = error;
		}
		const described = describeError(thrown);
		assert.strictEqual(described.status, 400);
		assert.strictEqual(described.body.code, 'invalid_automation');
		assert.ok(described.body.errors[0].type);
		assert.ok(described.body.errors[0].message);
		assert.strictEqual(describeError(new Error('unrelated')), null, 'a real fault must not become a 400');
	});

	// The flow the feature exists for: one automation posts a button, a second is
	// started by pressing it.
	await t('a send-message action can carry automation buttons', () => {
		const g = graph(
			[
				node('trigger.ticket.created', {}, 'a'),
				node('action.message.send', {
					...rich('Press below', [{
						automationKey: 'btn123',
						label: 'Claim your role',
						style: 'success',
					}]),
					target: 'ticket',
				}, 'b'),
			],
			[edge('a', 'b')],
		);
		assert.strictEqual(codeOf(g, {
			automationKeys: ['btn123'],
			buttonAutomationKeys: ['btn123'],
		}), null);
	});

	await t('a button must point at a button-triggered automation', () => {
		const g = graph(
			[
				node('trigger.ticket.created', {}, 'a'),
				node('action.message.send', {
					...rich('x', [{
						automationKey: 'other',
						label: 'Nope',
					}]),
					target: 'ticket',
				}, 'b'),
			],
			[edge('a', 'b')],
		);
		// Exists, but is started by something else — rendering fine and then doing
		// nothing when pressed is the worst kind of broken.
		assert.strictEqual(codeOf(g, {
			automationKeys: ['other'],
			buttonAutomationKeys: [],
		}), 'not_a_button_automation');
		// Does not exist at all.
		assert.strictEqual(codeOf(g, {
			automationKeys: [],
			buttonAutomationKeys: [],
		}), 'unknown_automation');
	});

	await t('a button needs a label and a target automation', () => {
		const build = button => graph(
			[
				node('trigger.ticket.created', {}, 'a'),
				node('action.message.send', {
					...rich('x', [button]),
					target: 'ticket',
				}, 'b'),
			],
			[edge('a', 'b')],
		);
		assert.strictEqual(codeOf(build({ automationKey: 'btn123' })), 'required');
		assert.strictEqual(codeOf(build({ label: 'Hi' })), 'required');
		assert.strictEqual(codeOf(build({
			automationKey: 'btn123',
			label: 'Hi',
			style: 'rainbow',
		})), 'invalid');
	});

	console.log('\ninterpreter\n');

	await t('a linear graph runs in order', async () => {
		const g = graph(
			[
				node('trigger.ticket.closed', {}, 'a'),
				node('action.log', { content: 'x' }, 'b'),
				node('action.log', { content: 'y' }, 'c'),
			],
			[edge('a', 'b'), edge('b', 'c')],
		);
		const {
			ran, runners,
		} = stubRunners();
		const result = await runAutomation(g, ctx(), { runners });
		assert.deepStrictEqual(ran, ['a', 'b', 'c']);
		assert.strictEqual(result.status, RUN.success);
		assert.strictEqual(result.steps.length, 3);
	});

	await t('flow.if false does not run the true branch', async () => {
		const g = graph(
			[
				node('trigger.ticket.closed', {}, 'a'),
				node('flow.if', {
					clauses: [{
						field: 'ticket.claimed',
						op: 'is',
						value: true,
					}],
					match: 'all',
				}, 'i'),
				node('action.log', { content: 'yes' }, 'yes'),
				node('action.log', { content: 'no' }, 'no'),
			],
			[edge('a', 'i'), edge('i', 'yes', 'true'), edge('i', 'no', 'false')],
		);
		const {
			ran, runners,
		} = stubRunners({ 'flow.if': async () => ({ handle: 'false' }) });
		await runAutomation(g, ctx(), { runners });
		assert.ok(ran.includes('no'), 'the false branch should run');
		assert.ok(!ran.includes('yes'), 'the true branch should not run');
	});

	// The semantic most likely to surprise someone, so it is pinned here.
	await t('converging edges run the join exactly once', async () => {
		const g = graph(
			[
				node('trigger.ticket.closed', {}, 'a'),
				node('flow.noop', {}, 'l'),
				node('flow.noop', {}, 'r'),
				node('action.log', { content: 'join' }, 'j'),
			],
			[edge('a', 'l'), edge('a', 'r'), edge('l', 'j'), edge('r', 'j')],
		);
		const {
			ran, runners,
		} = stubRunners();
		const result = await runAutomation(g, ctx(), { runners });
		assert.strictEqual(ran.filter(id => id === 'j').length, 1, 'the join ran more than once');
		const skipped = result.steps.filter(s => s.s === STEP.skip && s.r === 'already_ran');
		assert.strictEqual(skipped.length, 1, 'the second arrival should be traced as already_ran');
	});

	await t('public bot: a long chain stops at the step budget', async () => {
		const nodes = [node('trigger.ticket.closed', {}, 'a')];
		const edges = [];
		for (let i = 0; i < PUBLIC_LIMITS.steps + 10; i++) {
			nodes.push(node('action.log', { content: 'x' }, `x${i}`));
			edges.push(edge(i === 0 ? 'a' : `x${i - 1}`, `x${i}`));
		}
		const g = graph(nodes, edges);
		const { runners } = stubRunners();

		const capped = await asPublic(() => runAutomation(g, ctx(), { runners }));
		assert.strictEqual(capped.status, RUN.failed);
		assert.strictEqual(capped.error, 'step_budget_exceeded');

		// Unbounded on a private bot, and it still terminates — the graph is a DAG
		// and a node runs at most once, so the counter was never what stopped it.
		const uncapped = await runAutomation(g, ctx(), { runners });
		assert.strictEqual(uncapped.status, RUN.success);
	});

	await t('a throwing action stops its branch but not a parallel one', async () => {
		const g = graph(
			[
				node('trigger.ticket.closed', {}, 'a'),
				node('action.log', { content: 'boom' }, 'bad'),
				node('action.log', { content: 'after' }, 'after'),
				node('action.log', { content: 'other' }, 'other'),
			],
			[edge('a', 'bad'), edge('a', 'other'), edge('bad', 'after')],
		);
		const {
			ran, runners,
		} = stubRunners({
			'action.log': async n => {
				if (n.id === 'bad') throw new Error('nope');
				ran.push(n.id);
				return {};
			},
		});
		const result = await runAutomation(g, ctx(), { runners });
		assert.ok(!ran.includes('after'), 'the failed branch must not continue');
		assert.ok(ran.includes('other'), 'a parallel branch must still run');
		assert.strictEqual(result.status, RUN.failed);
	});

	await t('flow.stop ends only its own branch', async () => {
		const g = graph(
			[
				node('trigger.ticket.closed', {}, 'a'),
				node('flow.stop', {}, 's'),
				node('action.log', { content: 'never' }, 'never'),
				node('action.log', { content: 'other' }, 'other'),
			],
			// `flow.stop` has no outputs, so the edge out of it is unreachable by
			// construction — build it via a noop to keep the graph well-formed.
			[edge('a', 's'), edge('a', 'other')],
		);
		const {
			ran, runners,
		} = stubRunners();
		await runAutomation(g, ctx(), { runners });
		assert.ok(!ran.includes('never'));
		assert.ok(ran.includes('other'));
	});

	console.log('\ndurability\n');

	const waitGraph = () => graph(
		[
			node('trigger.ticket.closed', {}, 'a'),
			node('flow.wait', { ms: 60_000 }, 'w'),
			node('action.log', { content: 'sibling' }, 'sib'),
			node('action.log', { content: 'after' }, 'after'),
		],
		[edge('a', 'w'), edge('a', 'sib'), edge('w', 'after')],
	);

	await t('flow.wait suspends and carries the whole queue, siblings included', async () => {
		const { runners } = stubRunners();
		const result = await runAutomation(waitGraph(), ctx(), { runners });
		assert.strictEqual(result.status, RUN.suspended);
		assert.strictEqual(result.waitMs, 60_000);
		assert.ok(result.state.queue.includes('after'), 'the node after the wait must be queued');
		assert.ok(result.state.queue.includes('sib'), 'a sibling branch must not be lost');
	});

	await t('the parked state survives a JSON round trip', async () => {
		const { runners } = stubRunners();
		const result = await runAutomation(waitGraph(), ctx(), { runners });
		const round = JSON.parse(JSON.stringify(result.state));
		assert.deepStrictEqual(round, result.state, 'the state holds something JSON cannot represent');
	});

	await t('resuming from the round-tripped state finishes the run', async () => {
		const g = waitGraph();
		const { runners } = stubRunners();
		const parked = await runAutomation(g, ctx(), { runners });
		const state = JSON.parse(JSON.stringify(parked.state));

		const resumed = new Context(null, state);
		resumed.durable = true;
		resumed.executed = state.executed;
		resumed.trace = state.trace;
		const {
			ran, runners: runners2,
		} = stubRunners();
		const result = await runFrom(g, resumed, state.queue, { runners: runners2 });

		assert.ok(ran.includes('after'), 'the run must continue past the wait');
		assert.strictEqual(result.status, RUN.success);
	});

	await t('resuming against a graph missing the node is cancelled, not failed', async () => {
		const g = waitGraph();
		const { runners } = stubRunners();
		const parked = await runAutomation(g, ctx(), { runners });
		const state = JSON.parse(JSON.stringify(parked.state));

		const edited = graph(g.nodes.filter(n => n.id !== 'after'), g.edges.filter(e => e.to !== 'after'));
		const resumed = new Context(null, state);
		resumed.executed = state.executed;
		const result = await runFrom(edited, resumed, state.queue, { runners });

		assert.strictEqual(result.status, RUN.cancelled);
		assert.ok(result.error.startsWith('graph_changed'));
	});

	/* ────────────── the channel an action hands to the rest of a run ────────── */

	/** A client whose channel fetches are counted, so a memo can be proven. */
	const countingClient = (channels = {}) => {
		const fetched = [];
		return {
			channels: {
				fetch: async id => {
					fetched.push(id);
					return channels[id] ?? null;
				},
			},
			fetched,
		};
	};

	await t('a created channel becomes the run\'s channel, for every later step', async () => {
		const g = graph(
			[
				node('trigger.ticket.closed', {}, 'a'),
				node('action.log', { content: 'make' }, 'make'),
				node('action.log', { content: 'after' }, 'after'),
			],
			[edge('a', 'make'), edge('make', 'after')],
		);
		let seenByLater = null;
		const { runners } = stubRunners({
			'action.log': async (n, c) => {
				if (n.id === 'make') {
					c.setChannel({
						guildId: '1',
						id: '999',
					});
				} else {
					seenByLater = c.channelId;
				}
				return {};
			},
		});
		const context = ctx({ channelId: '111' });
		await runAutomation(g, context, { runners });
		assert.strictEqual(seenByLater, '999');
		assert.strictEqual(context.serialize().channelId, '999');
	});

	await t('the created channel survives a park and a resume', async () => {
		// `channelId` was always serialized, so this costs nothing new — but it is
		// the whole reason the capability is safe to hand across a `flow.wait`, and
		// nothing else asserts it.
		const g = graph(
			[
				node('trigger.ticket.closed', {}, 'a'),
				node('action.log', { content: 'make' }, 'make'),
				node('flow.wait', { ms: 60_000 }, 'w'),
				node('action.log', { content: 'after' }, 'after'),
			],
			[edge('a', 'make'), edge('make', 'w'), edge('w', 'after')],
		);
		const { runners } = stubRunners({
			'action.log': async (n, c) => {
				if (n.id === 'make') c.setChannel('999');
				return {};
			},
		});
		const parked = await runAutomation(g, ctx({ channelId: '111' }), { runners });
		const state = JSON.parse(JSON.stringify(parked.state));
		assert.strictEqual(state.channelId, '999', 'the parked run forgot the channel it made');

		let seenAfterResume = null;
		const resumed = new Context(null, state);
		resumed.durable = true;
		resumed.executed = state.executed;
		resumed.trace = state.trace;
		const { runners: runners2 } = stubRunners({
			'action.log': async (n, c) => {
				seenAfterResume = c.channelId;
				return {};
			},
		});
		await runFrom(g, resumed, state.queue, { runners: runners2 });
		assert.strictEqual(seenAfterResume, '999');
	});

	await t('setChannel moves the memo rather than leaving a stale one', async () => {
		const first = {
			guildId: '1',
			id: '111',
		};
		const second = {
			guildId: '1',
			id: '999',
		};
		const client = countingClient({
			111: first,
			999: second,
		});
		const context = new Context(client, {
			channelId: '111',
			guildId: '1',
		});

		assert.strictEqual(await context.getChannel(), first);
		context.setChannel('999');
		assert.strictEqual(await context.getChannel(), second, 'the old channel was still memoised');
		assert.deepStrictEqual(client.fetched, ['111', '999']);
	});

	await t('a nested automation\'s channel does not leak back to its caller', async () => {
		// `descend()` shares the cache by reference, so a bare cache key would let
		// a child's creation overwrite what the parent resolves next.
		const parentChannel = {
			guildId: '1',
			id: '111',
		};
		const childChannel = {
			guildId: '1',
			id: '999',
		};
		const client = countingClient({
			111: parentChannel,
			999: childChannel,
		});
		const parent = new Context(client, {
			channelId: '111',
			guildId: '1',
		});
		const child = parent.descend(2, 'r2');
		child.setChannel('999');

		assert.strictEqual(await child.getChannel(), childChannel);
		assert.strictEqual(await parent.getChannel(), parentChannel, 'the parent saw the child\'s channel');
		assert.strictEqual(parent.channelId, '111');
	});

	await t('the trigger message still resolves after the channel is rewritten', async () => {
		// The bug this guards: `getMessage` used to resolve through `getChannel`,
		// so once a node moved the run's channel it hunted the trigger message
		// inside a channel created seconds ago and quietly found nothing.
		const message = { id: 'm1' };
		const origin = {
			guildId: '1',
			id: '111',
			messages: { fetch: async id => (id === 'm1' ? message : null) },
		};
		const created = {
			guildId: '1',
			id: '999',
			messages: { fetch: async () => null },
		};
		const client = countingClient({
			111: origin,
			999: created,
		});
		const context = new Context(client, {
			channelId: '111',
			guildId: '1',
			messageId: 'm1',
		});
		context.setChannel('999');

		assert.strictEqual(await context.getMessage(), message);
		assert.strictEqual(context.serialize().messageChannelId, '111');
	});

	console.log('\nsubstitution\n');

	/** Just enough client for the ticket placeholders. */
	const varsClient = ({
		member = null, user = null,
	} = {}) => ({
		guilds: { cache: new Map([['1', { members: { fetch: async id => (member?.id === id ? member : Promise.reject(new Error('unknown'))) } }]]) },
		tickets: {
			getTicket: async () => ({
				createdById: '111',
				guildId: '1',
				number: 7,
			}),
		},
		users: { fetch: async () => (user ?? Promise.reject(new Error('unknown'))) },
	});

	await t('{opener} is the ticket creator, not whoever set the run off', async () => {
		const member = {
			displayName: 'Member Nick',
			id: '111',
			user: { username: 'member' },
		};
		const c = new Context(varsClient({ member }), {
			actorId: '999',
			guildId: '1',
			ticketId: '2',
			vars: {
				displayname: 'Staffy',
				name: 'staff',
			},
		});
		const vars = await c.varsFor('{name} for {opener} ({openerdisplayname}) {openermention} #{num}');
		assert.strictEqual(vars.name, 'staff', 'the actor still wins {name}');
		assert.strictEqual(vars.opener, 'member');
		assert.strictEqual(vars.openerdisplayname, 'Member Nick');
		assert.strictEqual(vars.openermention, '<@111>');
		assert.strictEqual(vars.num, 7);
	});

	await t('an opener who left the guild still resolves', async () => {
		const c = new Context(varsClient({ user: { username: 'gone' } }), {
			guildId: '1',
			ticketId: '2',
			vars: { name: 'staff' },
		});
		const vars = await c.varsFor('{opener} {openermention}');
		assert.strictEqual(vars.opener, 'gone');
		assert.strictEqual(vars.openerdisplayname, 'gone', 'falls back to the username, never to the actor');
		assert.strictEqual(vars.openermention, '<@111>');
	});

	await t('text with no ticket placeholder costs no lookup', async () => {
		let looked = false;
		const client = {
			...varsClient(),
			tickets: {
				getTicket: async () => {
					looked = true;
					return null;
				},
			},
		};
		const c = new Context(client, {
			guildId: '1',
			ticketId: '2',
			vars: { name: 'staff' },
		});
		const vars = await c.varsFor('Hello {name}');
		assert.strictEqual(looked, false, 'a fixed string must not read the ticket');
		assert.strictEqual(vars.name, 'staff');
	});

	console.log('\nguards\n');

	await t('the button custom_id fits in Discord\'s 100 characters', () => {
		// The real one, so this cannot pass while the shipped format differs.
		const id = automationCustomId('aB3xY9');
		// With a trigger node, which is what a multi-trigger graph's buttons carry.
		const withNode = automationCustomId('aB3xY9', '1a2b3c4d');
		assert.ok(withNode.length <= 100, `custom_id with a node is ${withNode.length} characters`);
		assert.ok(id.length <= 100, `custom_id is ${id.length} characters`);
		// Headroom for a future version field, since the id is stored in messages
		// that outlive the code that wrote them.
		assert.ok(id.length <= 60, 'leave room to add a field later');
	});

	await t('the recursion depth guard trips at the limit', () => {
		const deep = ctx({ depth: LIMITS.depth });
		assert.strictEqual(deep.atMaxDepth, true);
		assert.strictEqual(ctx({ depth: LIMITS.depth - 1 }).atMaxDepth, false);
	});

	await t('every node type is internally consistent', () => {
		for (const [type, definition] of Object.entries(NODE_TYPES)) {
			assert.strictEqual(type.split('.')[0], definition.category, `${type} prefix disagrees with its category`);
			assert.ok(Array.isArray(definition.outputs), `${type} has no outputs`);
			assert.ok(definition.label && definition.description, `${type} is missing its labels`);
			if (definition.category === 'trigger') {
				assert.ok(definition.provides?.length, `${type} provides nothing`);
				assert.deepStrictEqual(definition.outputs, ['out'], `${type} should have one output`);
			} else if (definition.provides) {
				// An action may hand a capability to the steps after it. Nothing
				// else may: a condition or a flow node creates nothing, and one
				// claiming otherwise would silently widen what validates.
				assert.strictEqual(definition.category, 'action', `${type} is not an action but declares provides`);
				assert.ok(definition.provides.length, `${type} declares an empty provides`);
			}
			for (const capability of definition.provides ?? []) {
				assert.ok(CAPABILITIES.includes(capability), `${type} provides unknown capability ${capability}`);
			}
			for (const field of definition.params) {
				assert.ok(field.key && field.label && field.type, `${type} has a malformed param`);
				if (field.type === 'select') assert.ok(field.options?.length, `${type}.${field.key} has no options`);
			}
		}
	});

	// A trigger that nothing emits is a node an admin can place on the canvas and
	// wait forever for. The registry cannot know its own call sites, so this
	// greps for them.
	await t('every trigger has an emit site', () => {
		/** Triggers whose emit site is not a plain `emit(...)` call. */
		const exempt = {
			'trigger.button.pressed': 'src/buttons/auto.js dispatches it directly',
			'trigger.menu.selected': 'src/menus/auto.js dispatches it directly',
			'trigger.schedule.cron': 'started by a Temporal schedule, not an event',
		};

		const roots = ['src/lib', 'src/listeners', 'src/modals', 'src/buttons', 'src/menus', 'src/commands'];
		const sources = [];
		const walk = dir => {
			if (!fs.existsSync(dir)) return;
			for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
				const full = path.join(dir, entry.name);
				if (entry.isDirectory()) walk(full);
				else if (entry.name.endsWith('.js')) sources.push(fs.readFileSync(full, 'utf8'));
			}
		};
		for (const root of roots) walk(path.join(__dirname, '..', root));
		const haystack = sources.join('\n');

		const missing = Object.keys(NODE_TYPES)
			.filter(type => NODE_TYPES[type].category === 'trigger')
			.filter(type => !exempt[type] && !haystack.includes(`'${type}'`));
		assert.deepStrictEqual(missing, [], `these triggers are never emitted: ${missing.join(', ')}`);
	});

	// `collectRouteFiles` turns every .js under src/routes into an endpoint and
	// every export into an HTTP verb, so a stray helper export becomes a live
	// route that 500s on the first request.
	await t('the automation routes export only HTTP verbs', () => {
		const verbs = new Set(['delete', 'get', 'head', 'options', 'patch', 'post', 'put']);
		const dir = path.join(root, 'src', 'routes', 'api', 'admin', 'guilds', '[guild]', 'automations');
		const files = [];
		const walk = at => {
			for (const entry of fs.readdirSync(at, { withFileTypes: true })) {
				const full = path.join(at, entry.name);
				if (entry.isDirectory()) walk(full);
				else if (entry.name.endsWith('.js')) files.push(full);
			}
		};
		walk(dir);
		assert.ok(files.length >= 6, `expected the six automation routes, found ${files.length}`);

		for (const file of files) {
			for (const key of Object.keys(require(file))) {
				assert.ok(verbs.has(key), `${path.basename(file)} exports "${key}", which would register as an HTTP method`);
			}
		}
	});

	console.log('\nmessage triggers\n');

	// Reading another bot's messages: the filters that decide whether a message
	// belongs to a trigger at all, evaluated for every message in every guild.
	const message = (params, payload) => matches(node('trigger.message.created', params), {
		channelId: 'c1',
		content: 'hello',
		guildId: 'g1',
		userId: 'u1',
		...payload,
	});

	await t('bots are ignored by default and opt-in-able', () => {
		assert.strictEqual(message({ scope: 'any' }, { isBot: true }), false);
		assert.strictEqual(message({
			ignoreBots: false,
			scope: 'any',
		}, { isBot: true }), true);
	});

	await t('this bot\'s own messages never match, whatever the parameters say', () => {
		assert.strictEqual(message({
			ignoreBots: false,
			scope: 'any',
		}, {
			isBot: true,
			isSelf: true,
		}), false);
	});

	await t('a named bot excludes every other author', () => {
		const params = {
			botId: '999',
			ignoreBots: false,
			scope: 'any',
		};
		assert.strictEqual(message(params, {
			isBot: true,
			userId: '999',
		}), true);
		assert.strictEqual(message(params, {
			isBot: true,
			userId: '111',
		}), false);
	});

	await t('a pattern matches embed text as well as content', () => {
		const params = {
			ignoreBots: false,
			pattern: 'banned',
			scope: 'any',
		};
		const payload = {
			content: '',
			embedText: 'Member banned\nReason: spam',
			isBot: true,
		};
		assert.strictEqual(message(params, payload), true);
		assert.strictEqual(message({
			...params,
			searchEmbeds: false,
		}, payload), false);
	});

	await t('capture groups become {matchN} for the rest of the run', () => {
		const trigger = node('trigger.message.created', {
			ignoreBots: false,
			pattern: 'banned <@(\\d+)> for (.+)',
			scope: 'any',
		});
		const vars = triggerVars(trigger, {
			content: '',
			embedText: 'banned <@1234567890123456> for spam',
		});
		assert.deepStrictEqual(vars, {
			match1: '1234567890123456',
			match2: 'spam',
		});
		assert.strictEqual(
			substitute('Handled {match2} by {match1}', vars),
			'Handled spam by 1234567890123456',
		);
	});

	await t('a trigger with no pattern contributes no variables', () => {
		assert.strictEqual(triggerVars(node('trigger.message.created', { scope: 'any' }), { content: 'x' }), null);
	});

	// Bot-to-bot: every one of these is a way in if it is not checked, so each
	// gets its own case rather than one happy-path assertion.
	const BOT_COMMAND = {
		botId: '999',
		channelId: 'ops',
		prefix: '!dt-',
	};
	const command = (params, payload) => matches(node('trigger.bot.command', {
		...BOT_COMMAND,
		...params,
	}), {
		channelId: 'ops',
		content: '!dt-close 42',
		guildId: 'g1',
		isBot: true,
		userId: '999',
		...payload,
	});

	await t('a bot command matches only the nominated bot, channel and prefix', () => {
		assert.strictEqual(command({}, {}), true);
		assert.strictEqual(command({}, { userId: '111' }), false, 'another bot');
		assert.strictEqual(command({}, { channelId: 'general' }), false, 'another channel');
		assert.strictEqual(command({}, { content: 'close 42' }), false, 'no prefix');
		assert.strictEqual(command({}, { content: '!dt close 42' }), false, 'near-miss prefix');
	});

	await t('a bot command refuses humans, webhooks and this bot itself', () => {
		assert.strictEqual(command({}, { isBot: false }), false, 'a human posting the prefix');
		assert.strictEqual(command({}, { webhookId: 'w1' }), false, 'a webhook wearing the bot\'s name');
		assert.strictEqual(command({}, { isSelf: true }), false, 'our own message');
	});

	await t('a bot command with a parameter missing matches nothing', () => {
		for (const missing of ['botId', 'channelId', 'prefix']) {
			assert.strictEqual(command({ [missing]: undefined }, {}), false, `no ${missing}`);
		}
		assert.strictEqual(command({ prefix: '   ' }, {}), false, 'whitespace prefix');
	});

	await t('a bot command\'s embed cannot satisfy its prefix', () => {
		assert.strictEqual(command({}, {
			content: '',
			embedText: '!dt-close 42',
		}), false);
	});

	await t('a bot command captures the arguments after its prefix', () => {
		const trigger = node('trigger.bot.command', {
			...BOT_COMMAND,
			pattern: '^close (\\d+)$',
		});
		const payload = {
			channelId: 'ops',
			content: '!dt-close 42',
			isBot: true,
			userId: '999',
		};
		assert.strictEqual(matches(trigger, payload), true);
		assert.deepStrictEqual(triggerVars(trigger, payload), { match1: '42' });
		assert.strictEqual(matches(node('trigger.bot.command', {
			...BOT_COMMAND,
			pattern: '^open (\\d+)$',
		}), payload), false);
	});

	console.log('\ngraph upgrade\n');

	/* ─────────────────────────── GRAPH_VERSION 1 → 2 ─────────────────────────── */

	// `action.message.send` posts publicly, so this transform runs over nodes
	// whose output is already visible to every member of every affected server.
	// The property being pinned is that it changes *nothing* anybody can see: the
	// rich format is opt-in per node, and the upgrade only writes down which
	// format each node was already using.

	/** One v1 graph holding all four legacy message nodes. */
	const legacy = () => ({
		edges: [
			edge('t', 'send', 'out', 'e1'),
			edge('send', 'dm', 'out', 'e2'),
			edge('dm', 'eph', 'out', 'e3'),
			edge('eph', 'rep', 'out', 'e4'),
		],
		nodes: [
			node('trigger.button.pressed', { label: 'Go' }, 't'),
			node('action.message.send', {
				buttons: [{
					automationKey: 'abc123',
					label: 'Elsewhere',
					style: 'success',
				}],
				channelId: '820000000000000001',
				content: 'Hello {name}',
				target: 'channel',
			}, 'send'),
			node('action.message.dm', {
				content: 'Psst',
				subject: 'ticketCreator',
			}, 'dm'),
			node('action.message.ephemeral', {
				buttons: [{
					label: 'Yes',
					nodeId: 't',
				}],
				content: 'Are you sure?',
			}, 'eph'),
			node('action.message.reply', {
				content: 'Done',
				ephemeral: true,
			}, 'rep'),
		],
		version: 1,
	});

	await t('the upgrade stamps a format and changes nothing else', () => {
		const before = legacy();
		const after = upgradeGraph(before);
		assert.strictEqual(after.version, GRAPH_VERSION);

		for (const original of before.nodes.slice(1)) {
			const upgraded = after.nodes.find(n => n.id === original.id);
			assert.strictEqual(upgraded.params.format, 'text', `${original.id} was already plain text`);
			// Every other param is untouched — this is the whole safety argument.
			assert.deepStrictEqual({
				...upgraded.params,
				format: undefined,
			}, {
				...original.params,
				format: undefined,
			});
		}
		// A node that is not a message node is returned by identity.
		assert.strictEqual(after.nodes[0], before.nodes[0]);
	});

	await t('a node that already has a layout is stamped as rich', () => {
		const g = {
			edges: [edge('t', 's', 'out', 'e1')],
			nodes: [
				node('trigger.ticket.created', {}, 't'),
				node('action.message.send', {
					...rich('Rich'),
					format: undefined,
					target: 'ticket',
				}, 's'),
			],
			version: 1,
		};
		// Overwriting this with 'text' would silently discard the message the node
		// is actually meant to post.
		assert.strictEqual(upgradeGraph(g).nodes[1].params.format, 'layout');
	});

	await t('the upgrade is idempotent and never mutates its input', () => {
		const before = legacy();
		const snapshot = JSON.stringify(before);
		const once = upgradeGraph(before);
		assert.strictEqual(JSON.stringify(before), snapshot, 'the stored graph must not be touched');
		assert.deepStrictEqual(upgradeGraph(once), once);
		// The same row read twice must produce the same document, or the
		// dashboard's unsaved-changes guard fires on a freshly loaded page.
		assert.strictEqual(JSON.stringify(upgradeGraph(legacy())), JSON.stringify(once));
	});

	await t('an upgraded graph validates, and an un-upgraded one is refused', () => {
		const refs = {
			automationKeys: ['abc123'],
			buttonAutomationKeys: ['abc123'],
		};
		assert.strictEqual(codeOf(upgradeGraph(legacy()), refs), null);
		// Both routes upgrade `body.graph` before validating, so reaching the
		// validator at v1 means something skipped that step.
		assert.strictEqual(codeOf(legacy(), refs), 'not_upgraded');
	});

	console.log('\nmessage formats\n');

	/* ──────────────────────── plain text and rich, per node ──────────────────── */

	/** A `trigger.ticket.created` → one message node graph. */
	const messageGraph = (type, params) => graph(
		[
			node('trigger.ticket.created', {}, 'ta'),
			node(type, params, 'a'),
		],
		[edge('ta', 'a')],
	);

	await t('the plain-text format still needs its content', () => {
		assert.strictEqual(codeOf(messageGraph('action.message.send', {
			...plain('Hi'),
			target: 'ticket',
		})), null);
		assert.strictEqual(codeOf(messageGraph('action.message.send', {
			format: 'text',
			target: 'ticket',
		})), 'required');
		// Absent means plain text: every node stored before the switch existed.
		assert.strictEqual(codeOf(messageGraph('action.message.send', { target: 'ticket' })), 'required');
		assert.strictEqual(codeOf(messageGraph('action.message.send', {
			content: 'Hi',
			target: 'ticket',
		})), null);
	});

	await t('the rich format needs its layout, not its content', () => {
		// A node switched to rich keeps its old `content` in the row — that is what
		// makes switching back non-destructive — so an empty one is not an error.
		assert.strictEqual(codeOf(messageGraph('action.message.send', {
			...rich('Rich'),
			content: '',
			target: 'ticket',
		})), null);
		assert.strictEqual(codeOf(messageGraph('action.message.send', {
			format: 'layout',
			layout: {
				blocks: [{
					content: '',
					id: 'x',
					type: 'text',
				}],
				version: 1,
			},
			target: 'ticket',
		})), 'required');
	});

	await t('the two formats validate their buttons through their own rules', () => {
		// Legacy: a flat list, checked by `validateButtons`.
		assert.strictEqual(codeOf(messageGraph('action.message.send', {
			...plain('Hi', [{ automationKey: 'nope' }]),
			target: 'ticket',
		})), 'required');
		// Rich: blocks, checked by `validateLayout`. A DM takes link buttons only,
		// which the legacy format never had a way to express at all.
		assert.strictEqual(codeOf(messageGraph('action.message.dm', {
			...rich('Hi', [{
				automationKey: 'abc123',
				label: 'Press',
			}]),
			subject: 'actor',
		}), {
			automationKeys: ['abc123'],
			buttonAutomationKeys: ['abc123'],
		}), 'not_allowed');
	});

	await t('a layout error names the block it came from', () => {
		const g = messageGraph('action.message.send', {
			...rich('Hello'),
			target: 'ticket',
		});
		g.nodes[1].params.layout.blocks[0].content = '';

		let thrown;
		try {
			validateGraph(g);
		} catch (error) {
			thrown = error;
		}
		assert.ok(thrown instanceof AutomationError);
		const problem = thrown.errors.find(e => e.path.includes('layout'));
		// The whole point of re-basing the layout validator's paths: an admin is
		// told which block of which step, not "the layout is invalid".
		assert.match(problem.path, /^nodes\[\d+\]\.params\.layout\.blocks\[0\]\.content$/);
		assert.strictEqual(problem.code, 'required');
	});

	await t('a hidden field is never a reason to refuse a save', () => {
		// `showWhen` is the one declaration both ends read: the editor hides the
		// field, and nothing validates it. A rule that lived only in the editor
		// would let the server refuse a save for a field nobody was shown.
		const send = NODE_TYPES['action.message.send'].params;
		assert.deepStrictEqual(send.find(f => f.key === 'content').showWhen, {
			in: ['text', null],
			key: 'format',
		});
		assert.deepStrictEqual(send.find(f => f.key === 'layout').showWhen, {
			in: ['layout'],
			key: 'format',
		});
		assert.deepStrictEqual(send.find(f => f.key === 'channelId').showWhen, {
			in: ['channel'],
			key: 'target',
		});
		// Nothing hidden may also be `required`, or the generic check in
		// `validateParams` would fire on a field the editor never showed.
		for (const [type, definition] of Object.entries(NODE_TYPES)) {
			for (const field of definition.params) {
				if (!field.showWhen) continue;
				assert.ok(!field.required, `${type}.${field.key} is both hidden and required`);
				assert.ok(Array.isArray(field.showWhen.in) && field.showWhen.key, `${type}.${field.key} has a malformed showWhen`);
			}
		}
	});

	await t('entryButtonTriggers sees continuations in either format', () => {
		// Before layouts, a continuation was `node.params.buttons[].nodeId`. A scan
		// that only knows one of the two shapes finds nothing for the other, every
		// button trigger looks like an entry point, and live panel buttons in every
		// server start answering "no longer connected to anything".
		const build = messageParams => upgradeGraph({
			edges: [edge('entry', 'eph', 'out', 'e1'), edge('yes', 'log', 'out', 'e2')],
			nodes: [
				node('trigger.button.pressed', { label: 'Start' }, 'entry'),
				node('trigger.button.pressed', { label: 'Yes' }, 'yes'),
				node('action.message.ephemeral', messageParams, 'eph'),
				node('action.log', { content: 'confirmed' }, 'log'),
			],
			version: 1,
		});

		const continuation = [{
			label: 'Yes',
			nodeId: 'yes',
		}];
		assert.deepStrictEqual(entryButtonTriggers(build(plain('Sure?', continuation))).map(n => n.id), ['entry']);
		assert.deepStrictEqual(entryButtonTriggers(build(rich('Sure?', continuation))).map(n => n.id), ['entry']);

		// And nested inside a container, which is what an admin gets the moment
		// they wrap the message in a coloured box.
		const nested = build(rich('Sure?', continuation));
		const layout = nested.nodes.find(n => n.id === 'eph').params.layout;
		layout.blocks = [{
			blocks: layout.blocks,
			id: 'c1',
			type: 'container',
		}];
		assert.deepStrictEqual(entryButtonTriggers(nested).map(n => n.id), ['entry']);
	});

	console.log('\ndashboard mirror\n');

	// The comment in nodes.js asks people to keep the two in sync; this is what
	// makes that request enforceable.
	/* ─────────────────── action.ticket.setEmoji ─────────────────── */

	// `emoji` cannot be marked `required`, because clearing has none — so the
	// dependency lives in the node's own `validate`. `validateParams` collapses
	// undefined, null and '' into one "absent" branch, which is why the mode is a
	// three-way select rather than a nullable emoji: otherwise "clear it" and
	// "the admin forgot to pick one" would be the same saved graph.
	const emojiGraph = params => graph(
		[
			node('trigger.ticket.created', {}, 'ta'),
			node('action.ticket.setEmoji', params, 'a'),
		],
		[edge('ta', 'a')],
	);

	await t('setting an emoji without one is rejected', () => {
		assert.strictEqual(codeOf(emojiGraph({ mode: 'state' })), 'required');
		assert.strictEqual(codeOf(emojiGraph({ mode: 'all' })), 'required');
	});

	await t('clearing needs no emoji', () => {
		assert.strictEqual(codeOf(emojiGraph({ mode: 'clear' })), null);
	});

	await t('clearing with a stray emoji is still valid', () => {
		// Harmless: the executor ignores it. Worth pinning so nobody "fixes" it
		// into an error that breaks graphs saved by an earlier dashboard.
		assert.strictEqual(codeOf(emojiGraph({
			emoji: '🔥',
			mode: 'clear',
		})), null);
	});

	await t('both set modes accept an emoji', () => {
		for (const mode of ['state', 'all']) {
			assert.strictEqual(codeOf(emojiGraph({
				emoji: '🔥',
				mode,
			})), null, mode);
		}
	});

	await t('setEmoji needs a ticket, not a ticket channel', () => {
		// The override is stored on the row and re-applied by every later name
		// write, so it is still worth doing when the channel is unreachable.
		assert.deepStrictEqual(needsOf(node('action.ticket.setEmoji', {
			emoji: '🔥',
			mode: 'state',
		})), ['ticket']);
	});

	await t('setEmoji is rejected under a trigger with no ticket', () => {
		const g = graph(
			[
				node('trigger.member.joined', {}, 'ta'),
				node('action.ticket.setEmoji', {
					emoji: '🔥',
					mode: 'state',
				}, 'a'),
			],
			[edge('ta', 'a')],
		);
		assert.strictEqual(codeOf(g), 'missing_context');
	});

	/* ────────────────────────── creating a channel ────────────────────────── */

	// `access` is required-with-a-default, the same shape as `subject` and
	// `setSlowmode.ms`: the dashboard seeds it from the schema, so a graph
	// arriving without it was not authored by the editor.
	const createNode = (params = {}, id = 'c') => node('action.channel.create', {
		access: 'write',
		format: 'text',
		name: 'war-room-{num}',
		roleIds: ['820000000000000001'],
		...params,
	}, id);

	/** cron -> create -> whatever comes next. */
	const underCron = (rest, edges = []) => graph(
		[
			node('trigger.schedule.cron', {
				cron: '0 9 * * *',
				timezone: 'UTC',
			}, 'a'),
			...rest,
		],
		[edge('a', rest[0].id), ...edges],
	);

	await t('creating a channel needs only a server', () => {
		// The default `includeStaff` is what would otherwise drag a ticket
		// dependency in, so the fixture has to turn it off to mean "only a
		// server". That is the behaviour, not an inconvenience.
		assert.strictEqual(codeOf(underCron([createNode({ includeStaff: false })])), null);
	});

	await t('a private channel nobody can see is refused at save time', () => {
		assert.strictEqual(codeOf(underCron([createNode({
			includeStaff: false,
			roleIds: [],
		})])), 'required');

		// Not private, so there is nobody to require: everyone can see it.
		assert.strictEqual(codeOf(underCron([createNode({
			includeStaff: false,
			private: false,
			roleIds: [],
		})])), null);
	});

	await t('who a create node lets in decides what it needs', () => {
		assert.deepStrictEqual(needsOf(createNode({ includeStaff: false })), ['guild']);
		assert.ok(needsOf(createNode({ includeStaff: true })).includes('ticket'));
		assert.ok(needsOf(createNode({ includeOpener: true })).includes('ticket'));
		assert.ok(needsOf(createNode({ includeActor: true })).includes('member'));
	});

	await t('adding the staff roles is rejected under a trigger with no ticket', () => {
		assert.strictEqual(codeOf(underCron([createNode({ includeStaff: true })])), 'missing_context');
	});

	await t('a created channel satisfies a later "send to the channel this happened in"', () => {
		// The end-to-end version of the capability walk: a real node, a real
		// downstream need, no synthetic type involved.
		const send = node('action.message.send', {
			...rich('hi'),
			target: 'triggerChannel',
		}, 'd');
		assert.strictEqual(
			codeOf(underCron([createNode({ includeStaff: false }), send], [edge('c', 'd')])),
			null,
		);

		// And without the create in front of it, the same send is refused.
		assert.strictEqual(codeOf(graph(
			[
				node('trigger.schedule.cron', {
					cron: '0 9 * * *',
					timezone: 'UTC',
				}, 'a'),
				send,
			],
			[edge('a', 'd')],
		)), 'missing_context');
	});

	await t('a create node with no starter message needs no message', () => {
		// The message is optional here, unlike a message node's: "make a war room"
		// is a complete thing to want. But a half-authored one still validates.
		assert.strictEqual(codeOf(underCron([createNode({
			content: '',
			includeStaff: false,
		})])), null);
		assert.strictEqual(codeOf(underCron([createNode({
			...rich('welcome'),
			includeStaff: false,
		})])), null);
	});

	await t('every node type has a runner', () => {
		// The interpreter dispatches with `runners[node.type]?.(...)`, so a type in
		// the registry with no runner does not throw: it returns `{}` and traces as
		// a success. A node that silently does nothing is the worst outcome
		// available, and nothing else in this suite would notice.
		const { makeRunners } = require(path.join(root, 'src', 'lib', 'automations', 'actions'));
		const runners = makeRunners({ user: { id: 'bot' } }, async () => {});
		const missing = Object.keys(NODE_TYPES).filter(type => typeof runners[type] !== 'function');
		assert.deepStrictEqual(missing, [], `no runner for: ${missing.join(', ')}`);
	});

	await t('the editor registry mirrors the bot registry', () => {
		const mirror = path.join(root, 'src', 'dashboard', 'src', 'components', 'AutomationEditor', 'nodes.js');
		if (!fs.existsSync(mirror)) {
			console.log('       (skipped: the editor registry does not exist yet)');
			return;
		}
		const source = fs.readFileSync(mirror, 'utf8');

		for (const type of Object.keys(NODE_TYPES)) {
			assert.ok(source.includes(`'${type}'`), `the editor is missing ${type}`);
		}
		const declared = [...source.matchAll(/'((?:trigger|condition|action|flow)\.[\w.]+)':\s*{/g)].map(m => m[1]);
		for (const type of new Set(declared)) {
			assert.ok(NODE_TYPES[type], `the editor declares ${type}, which the bot does not have`);
		}
		const version = source.match(/GRAPH_VERSION\s*=\s*(\d+)/);
		assert.ok(version, 'the editor does not declare GRAPH_VERSION');
		assert.strictEqual(Number(version[1]), GRAPH_VERSION, 'GRAPH_VERSION differs between the bot and the editor');

		// Compared against the *public* numbers: those are the canonical ones the
		// editor ships as its fallback. At runtime the editor uses whatever
		// `catalogue()` reports, which is the private set on a self-hosted bot.
		for (const key of ['nodes', 'edges', 'branches', 'steps', 'perGuild']) {
			const found = source.match(new RegExp(`${key}:\\s*(\\d+)`));
			assert.ok(found, `the editor does not declare the ${key} limit`);
			assert.strictEqual(Number(found[1]), PUBLIC_LIMITS[key], `the ${key} limit differs between the bot and the editor`);
		}
	});

	await t('the editor mirrors the capability walk', () => {
		// The editor's validator is ESM and never runs under `npm test`, so the
		// two walks cannot be driven against each other. A text assertion is weak,
		// but the failure it guards against is expensive: if the two disagree the
		// canvas either blocks a save the server would take, or offers one it
		// answers with a 400.
		const mirror = path.join(root, 'src', 'dashboard', 'src', 'components', 'AutomationEditor', 'validate.js');
		if (!fs.existsSync(mirror)) {
			console.log('       (skipped: the editor validator does not exist yet)');
			return;
		}
		const source = fs.readFileSync(mirror, 'utf8');
		assert.ok(source.includes('function capabilitiesFrom('), 'the editor has no capability walk');
		assert.ok(!source.includes('feedersOf'), 'the editor still uses the trigger-only walk');
		assert.ok(source.includes('topoOrder'), 'the editor walk is not ordered');
	});

	console.log(`\n${pass} checks passed${process.exitCode ? ' (with failures above)' : ''}\n`);
})();
