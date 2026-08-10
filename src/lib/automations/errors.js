/**
 * Version, limits and the error type shared by every automations module.
 *
 * Kept in its own file because `registry.js` and `validate.js` both need it and
 * import each other's neighbours — putting LIMITS in either one makes the cycle
 * real.
 *
 * A note on vocabulary, because this codebase already uses the obvious word for
 * something else: "workflow" here always means a *Temporal* workflow. The thing
 * a server admin builds on the dashboard canvas is an **automation**, its JSON
 * is a **graph**, and one execution of it is a **run**.
 */

/**
 * The stored graph format.
 *
 * 2 — the four `action.message.*` nodes gained a `format`, choosing between the
 *     plain `content` + `buttons` they have always had and a Components v2
 *     `layout`. The upgrade only stamps the format they were already using; it
 *     never rewrites a message, so what those nodes post is unchanged.
 */
const GRAPH_VERSION = 2;

/**
 * Guard rails for a **public** bot.
 *
 * These are ours, not Discord's. A public instance hosts guilds that did not pay
 * for the process they are running in, so quotas are fair-use limits: they stop
 * one server's automations from spending everyone else's CPU and rate limit
 * budget.
 *
 * The dashboard mirrors these numbers in
 * `src/dashboard/src/components/AutomationEditor/nodes.js`; `npm test` runs
 * `scripts/check-automations.js`, which fails if the two drift.
 */
const PUBLIC_LIMITS = {
	/** Edges allowed out of a single handle. */
	branches: 5,
	/** Clauses in one flow.if / condition.filter node. */
	clauses: 10,
	/** automation-triggers-automation nesting. */
	depth: 3,
	edges: 80,
	/** Longest a run may block the event that fired it, before it is a bug. */
	inlineMs: 10_000,
	/** A wait this short is done with setTimeout if Temporal is unreachable. */
	inlineWaitMs: 15_000,
	/** Buttons on one legacy-format message. Discord's action-row cap. */
	messageButtons: 5,
	messageLength: 2000,
	nameLength: 100,
	nodes: 40,
	perGuild: 25,
	/** Run rows kept per guild by the retention sweep, on top of the age window. */
	runsPerGuild: 500,
	runsPerMinute: 60,
	/** Nodes executed in one run. */
	steps: 50,
	waitMaxMs: 30 * 24 * 60 * 60 * 1000,
	waitMinMs: 1000,
};

/**
 * The same rails on a **private** (self-hosted) bot, where the quotas are
 * pointless: it is your process, your database and your rate limit budget, and
 * being told you may only have 25 automations in your own server is just an
 * obstacle. This follows what the rest of the codebase already does with
 * `PUBLIC_BOT` — stale handling, presence intents and the API key route all
 * branch on it.
 *
 * Four of them are *not* removed, because they are correctness, not fair use:
 *
 *   - `depth` — cycles inside one graph are rejected at save time, but
 *     automation A calling B calling A is not detectable there. Without a depth
 *     bound that recurses until the process dies. Raised, never removed.
 *   - `inlineMs` — a run blocks the gateway event that fired it. Removing this
 *     means one slow automation stalls the bot's event loop. Raised, not removed.
 *   - `waitMinMs`/`waitMaxMs` — the bounds of what Temporal will schedule.
 *
 * `steps` becomes unbounded safely: the graph is a DAG and a node runs at most
 * once per run, so termination is guaranteed by the shape of the graph rather
 * than by the counter.
 */
const PRIVATE_LIMITS = {
	...PUBLIC_LIMITS,
	branches: Infinity,
	clauses: Infinity,
	depth: 10,
	edges: Infinity,
	inlineMs: 60_000,
	nodes: Infinity,
	perGuild: Infinity,
	runsPerGuild: 10_000,
	runsPerMinute: Infinity,
	steps: Infinity,
};

const isPublicBot = () => process.env.PUBLIC_BOT === 'true';

/**
 * The limits actually enforced by this instance.
 *
 * Read through the getter rather than captured at require time, so a test (or a
 * process that reads its env late) sees the right set. `catalogue()` hands these
 * to the dashboard, so the editor shows the real numbers rather than the
 * public-bot defaults.
 */
const LIMITS = new Proxy({}, {
	get: (_, key) => (isPublicBot() ? PUBLIC_LIMITS : PRIVATE_LIMITS)[key],
	getOwnPropertyDescriptor: (_, key) => ({
		configurable: true,
		enumerable: true,
		value: (isPublicBot() ? PUBLIC_LIMITS : PRIVATE_LIMITS)[key],
	}),
	has: (_, key) => key in PUBLIC_LIMITS,
	ownKeys: () => Reflect.ownKeys(PUBLIC_LIMITS),
});

/** How long a run row is kept before the retention sweep deletes it. */
const RUN_RETENTION_DAYS = 14;

class AutomationError extends Error {
	/** @param {{path: string, code: string, message: string}[]} errors */
	constructor(errors) {
		super(`Invalid automation: ${errors.map(e => `${e.path}: ${e.message}`).join('; ')}`);
		this.name = 'AutomationError';
		this.errors = errors;
	}
}

/**
 * Map an error thrown while saving an automation onto an HTTP response.
 *
 * The body is deliberately the same shape `panels.js#describeError` produces for
 * layouts, so the dashboard's existing error rendering works unchanged.
 *
 * @returns {{status: number, body: object}|null} null when it is not ours, in
 * which case the route should rethrow rather than turn a real fault into a 400.
 */
function describeError(error) {
	if (error instanceof AutomationError) {
		return {
			body: {
				code: 'invalid_automation',
				errors: error.errors.map(e => ({
					message: e.path ? `${e.path}: ${e.message}` : e.message,
					type: e.code,
				})),
				statusCode: 400,
			},
			status: 400,
		};
	}
	return null;
}

module.exports = {
	AutomationError,
	GRAPH_VERSION,
	LIMITS,
	PRIVATE_LIMITS,
	PUBLIC_LIMITS,
	RUN_RETENTION_DAYS,
	describeError,
	isPublicBot,
};
