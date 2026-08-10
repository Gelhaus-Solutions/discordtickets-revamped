/**
 * Sentry bootstrap.
 *
 * Required as early as possible in `src/index.js` — directly after the
 * environment is loaded and *before* anything that Sentry auto-instruments
 * (leekslazylogger, Prisma, discord.js, Fastify) is required. Loading it later
 * leaves those modules unpatched.
 */
const {
	existsSync,
	readFileSync,
} = require('fs');
const { join } = require('path');
const { nodeProfilingIntegration } = require('@sentry/profiling-node');
const Sentry = require('@sentry/node');
const pkg = require('../package.json');

/**
 * Panel eggs (Pterodactyl/Pelican) and docker-compose export declared variables
 * as empty strings rather than leaving them unset, and `parseFloat('')` is NaN.
 * A NaN sample rate disables tracing silently, so every rate goes through here
 * instead of `parseFloat(x ?? default)`, which only catches undefined/null.
 * @param {string|undefined} v
 * @param {number} dflt
 * @returns {number}
 */
const num = (v, dflt) => {
	const n = parseFloat(v);
	return Number.isFinite(n) ? n : dflt;
};

/** @returns {boolean} whether an explicitly-truthy env var is set. */
const bool = (v, dflt = false) => (v === undefined || v === '' ? dflt : v === 'true' || v === '1');

/**
 * Mirrors `resolveBuildId()` in src/temporal/config.ts, but without requiring
 * dist/temporal — that would drag @temporalio/* into the process before Sentry
 * has finished initialising, and dist/ does not exist on a fresh checkout.
 * @returns {string}
 */
const resolveBuildId = () => {
	if (process.env.TEMPORAL_WORKER_BUILD_ID) return process.env.TEMPORAL_WORKER_BUILD_ID.slice(0, 6);
	const buildIdFile = join(__dirname, '..', 'dist', 'temporal', 'build-id.txt');
	if (existsSync(buildIdFile)) {
		const sha = readFileSync(buildIdFile, 'utf8').trim();
		if (sha) return sha.slice(0, 6);
	}
	return 'dev';
};

const REDACTED = '[redacted]';

/**
 * Values that must never leave the process. Collected once at init: these are
 * all set before Sentry loads, and re-reading them per event would be wasted
 * work on a hot path.
 */
const secrets = [
	process.env.DISCORD_TOKEN,
	process.env.DISCORD_SECRET,
	process.env.ENCRYPTION_KEY,
	process.env.JWT_SECRET,
	process.env.DB_CONNECTION_URL,
	process.env.SENTRY_AUTH_TOKEN,
].filter(v => typeof v === 'string' && v.length >= 8);

/** Header/cookie names dropped wholesale, regardless of value. */
const SENSITIVE_KEYS = /^(authorization|cookie|set-cookie|x-api-key|token)$/i;

/**
 * Recursively replace known secret values and drop sensitive keys. Depth is
 * bounded because Sentry events can carry deeply nested user data, and a
 * `beforeSend` that throws drops the event entirely.
 * @param {unknown} value
 * @param {number} depth
 * @returns {unknown}
 */
const scrub = (value, depth = 0) => {
	if (depth > 8) return value;
	if (typeof value === 'string') {
		let out = value;
		for (const secret of secrets) {
			if (out.includes(secret)) out = out.split(secret).join(REDACTED);
		}
		return out;
	}
	if (Array.isArray(value)) return value.map(v => scrub(v, depth + 1));
	if (value && typeof value === 'object') {
		// Anything exotic (Error, Buffer, Date, class instance) is left alone:
		// rewriting it would change its shape and break Sentry's own handling.
		if (Object.getPrototypeOf(value) !== Object.prototype) return value;
		const out = {};
		for (const [key, v] of Object.entries(value)) {
			out[key] = SENSITIVE_KEYS.test(key) ? REDACTED : scrub(v, depth + 1);
		}
		return out;
	}
	return value;
};

const enabled = !!process.env.SENTRY_DSN;

if (enabled) {
	Sentry.init({
		beforeSend(event) {
			try {
				return scrub(event);
			} catch {
				// Never let the scrubber be the reason an event is dropped
				// silently; dropping it deliberately is safer than shipping
				// something that may not have been scrubbed.
				return null;
			}
		},
		beforeSendLog(log) {
			try {
				return scrub(log);
			} catch {
				return null;
			}
		},
		beforeSendMetric(metric) {
			try {
				return scrub(metric);
			} catch {
				return null;
			}
		},
		dsn: process.env.SENTRY_DSN,
		// Structured logs, fed by the transport in src/lib/logger.js. Without
		// this the whole log bridge is inert.
		enableLogs: bool(process.env.SENTRY_LOGGING),
		enableMetrics: bool(process.env.SENTRY_METRICS, true),
		// `production` unless told otherwise; NODE_ENV is defaulted in index.js.
		environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'production',
		// A Prisma query with no trace around it — cache warming, the stats
		// schedule, automation retention — makes prismaIntegration start a
		// *transaction* of its own, one per query. That buries the traces that
		// matter under thousands of `prisma:client:operation` entries. Dropping
		// them by name only affects the standalone ones: inside a real trace
		// these are child spans, not transactions, so the engine-level detail
		// (`prisma:engine:connection` and friends) is kept where it is useful.
		ignoreTransactions: [/^prisma:/],
		integrations: [
			// Neither is a v10 default, and both are needed here: the bot is a
			// Fastify server in front of Prisma.
			Sentry.fastifyIntegration(),
			Sentry.prismaIntegration(),
			nodeProfilingIntegration(),
		],
		profileLifecycle: 'trace',
		profileSessionSampleRate: num(process.env.SENTRY_PROFILING_RATE, 1.0),
		// Ties errors to a deployable artifact. The build id is the 6-char git
		// SHA baked in at image build time; `dev` for source installs.
		release: process.env.SENTRY_RELEASE || `discord-tickets@${pkg.version}+${resolveBuildId()}`,
		// Off by default. This is a self-hosted multi-tenant bot: "default PII"
		// here means the Discord IDs and IP addresses of the *operator's users*,
		// who never agreed to anything. Operators can opt back in.
		sendDefaultPii: bool(process.env.SENTRY_SEND_PII),
		tracesSampleRate: num(process.env.SENTRY_SAMPLE_RATE, 0.1),
	});

	// A version-independent handle for code that cannot import @sentry/node.
	// The dashboard's SvelteKit server hooks are bundled by Rollup into
	// src/dashboard/build/ with no node_modules alongside them, so they reach
	// the SDK through this rather than an import. Using our own global (rather
	// than globalThis.__SENTRY__, which is keyed by exact SDK version) means an
	// SDK upgrade cannot quietly disconnect them.
	globalThis.__DT_SENTRY__ = Sentry; // eslint-disable-line no-underscore-dangle
}

module.exports = {
	Sentry,
	/** @returns {boolean} whether Sentry was configured and initialised. */
	isEnabled: () => enabled,
};
