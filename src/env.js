/* eslint-disable no-console */

const { existsSync } = require('fs');
const { colours } = require('leeks.js');
const {
	APP_DIR, DATA_DIR, ENV_FILE, dataDirProblem, envFileIsExposed, loadEnv,
} = require('./lib/paths');

const providers = ['mysql', 'postgresql'];

// Must stay in step with src/temporal/config.ts. These used to disagree: this
// file treated anything not in the falsy list as "on", while config.ts treated
// anything not in the truthy list as "off". A value like `enabled` therefore
// passed validation as TLS-on (demanding certificate paths) while the Temporal
// client connected in plaintext — a silent fail-open.
const TRUTHY_VALUES = ['1', 'true', 'yes', 'on'];
const FALSY_VALUES = ['0', 'false', 'no', 'off'];

/**
 * @param {string|undefined} v
 * @param {boolean} dflt
 * @returns {boolean|Error} the parsed value, or an Error if unrecognised
 */
const parseBool = (v, dflt) => {
	if (v === undefined || v === '') return dflt;
	const value = v.trim().toLowerCase();
	if (TRUTHY_VALUES.includes(value)) return true;
	if (FALSY_VALUES.includes(value)) return false;
	return new Error(`must be one of: ${[...TRUTHY_VALUES, ...FALSY_VALUES].map(s => `"${s}"`).join(', ')}`);
};

/** @returns {boolean} whether Temporal mTLS is on, defaulting to true. */
const temporalTlsEnabled = () => parseBool(process.env.TEMPORAL_TLS_ENABLED, true) === true;

// ideally the defaults would be set here too, but the pre-install script may run when `src/` is not available
const env = {
	DB_CONNECTION_URL: v =>
		!!v ||
		new Error('is required'),
	DB_PROVIDER: v =>
		(!!v && providers.includes(v)) ||
		new Error(`must be one of: ${providers.map(v => `"${v}"`).join(', ')}`),
	DISCORD_SECRET: v =>
		!!v ||
		new Error('is required'),
	DISCORD_TOKEN: v =>
		!!v ||
		new Error('is required'),
	ENCRYPTION_KEY: v =>
		(!!v && v.length >= 48) ||
		new Error('is required and must be at least 48 characters long; run "npm run keygen" to generate a key'),
	HTTP_EXTERNAL: v => {
		if (v?.endsWith('/')) {
			v = v.slice(0, -1);
			process.env.HTTP_EXTERNAL = v;
		}
		return (!!v && v.startsWith('http')) ||
			new Error('must be a valid URL without a trailing slash');
	},
	HTTP_HOST: v =>
		(!!v && !v.startsWith('http')) ||
		new Error('is required and must be an address, not a URL'),
	HTTP_INTERNAL: () => true, // optional
	HTTP_PORT: v =>
		!!v ||
		new Error('is required'),
	HTTP_TRUST_PROXY: () => true, // optional
	INVALIDATE_TOKENS: () => true, // optional
	// Optional. When unset, the JWT signing key is derived from ENCRYPTION_KEY
	// via HKDF so signing and at-rest encryption don't share key material — but
	// that derived key differs from the raw ENCRYPTION_KEY this used to sign
	// with, so upgrading invalidates existing sessions and service API keys.
	// Set JWT_SECRET to your ENCRYPTION_KEY value to keep them working.
	JWT_SECRET: () => true,
	OVERRIDE_ARCHIVE: () => true, // optional
	PUBLIC_BOT: () => true, // optional
	PUBLISH_COMMANDS: () => true, // optional
	// Sentry — all optional; nothing is sent unless SENTRY_DSN is set.
	// Deliberately not validated beyond existence: the rates are parsed
	// defensively in src/sentry-init.js, because a typo'd sample rate must
	// degrade to the default rather than refuse to boot the bot.
	SENTRY_DSN: () => true, // optional (enables Sentry when set)
	SENTRY_ENVIRONMENT: () => true, // optional (default: NODE_ENV)
	SENTRY_LOGGING: () => true, // optional (default false; required for the log bridge)
	SENTRY_LOG_LEVEL: () => true, // optional (minimum level forwarded to Sentry Logs, default "info")
	SENTRY_METRICS: () => true, // optional (default true)
	SENTRY_PROFILING_RATE: () => true, // optional (default 1.0)
	SENTRY_RELEASE: () => true, // optional (default: version+build id)
	SENTRY_SAMPLE_RATE: () => true, // optional (traces, default 0.1)
	SENTRY_SEND_PII: () => true, // optional (default false)
	STATS_URL: () => true, // optional (Houston-compatible endpoint; stats are not reported when unset)
	SUPER: () => true, // optional
	// Temporal — required (durable execution backs all async/scheduled work)
	TEMPORAL_ADDRESS: v =>
		!!v ||
		new Error('is required (host/IP of the Temporal frontend)'),
	TEMPORAL_DEPLOYMENT_NAME: () => true, // optional (default "discord-tickets")
	TEMPORAL_NAMESPACE: () => true, // optional (default "default")
	TEMPORAL_PORT: v =>
		!!v ||
		new Error('is required (Temporal frontend port, e.g. 7233)'),
	TEMPORAL_TASK_QUEUE: () => true, // optional (default "discord-tickets")
	TEMPORAL_TLS_CA_PATH: v => !v || existsSync(v) ||
		new Error(`points at a file that does not exist ("${v}")`), // optional (server root CA for verification)
	// A path that does not exist used to fail deep inside Temporal's native
	// addon, with an error that named neither the variable nor the file.
	TEMPORAL_TLS_CERT_PATH: v => {
		if (!temporalTlsEnabled()) return true;
		if (!v) return new Error('is required for mTLS (path to client certificate); set TEMPORAL_TLS_ENABLED=false to disable');
		return existsSync(v) || new Error(`points at a file that does not exist ("${v}")`);
	},
	// Optional (default true; set false for insecure local dev), but an
	// unrecognised value is rejected rather than silently disabling TLS.
	TEMPORAL_TLS_ENABLED: v => {
		const parsed = parseBool(v, true);
		return parsed instanceof Error ? parsed : true;
	},
	TEMPORAL_TLS_KEY_PATH: v => {
		if (!temporalTlsEnabled()) return true;
		if (!v) return new Error('is required for mTLS (path to client private key); set TEMPORAL_TLS_ENABLED=false to disable');
		return existsSync(v) || new Error(`points at a file that does not exist ("${v}")`);
	},
	TEMPORAL_SET_CURRENT_ON_START: () => true, // optional (default true; promote this build to Current on startup)
	TEMPORAL_TLS_SERVER_NAME: () => true, // optional (SNI override)
	TEMPORAL_WORKER_BUILD_ID: () => true, // optional (defaults to injected 6-char git SHA)
};

const load = options => {
	loadEnv(options);

	// State has to go somewhere writable, and finding that out here — with the
	// path in the message — beats an ENOENT from whichever component happens to
	// write first.
	const problem = dataDirProblem();
	if (problem) {
		console.log('\x07' + colours.redBright(`Error: The data directory "${DATA_DIR}" ${problem}.`));
		console.log(colours.yellowBright('Set DT_DATA_DIR to a writable directory, or fix its permissions.'));
		process.exit(1);
	}

	Object.entries(env).forEach(([name, validate]) => {
		const result = validate(process.env[name]); // `true` for pass, or `Error` for fail
		if (result instanceof Error) {
			console.log('\x07' + colours.redBright(`Error: The "${name}" environment variable ${result.message}.`));
			console.log(colours.gray(`  (environment file: ${ENV_FILE})`));
			process.exit(1);
		}
	});

	if (envFileIsExposed()) {
		console.log(colours.yellowBright(`Warning: ${ENV_FILE} is readable by other users on this machine. It holds your bot token and encryption key; "chmod 600" it.`));
	}
};

module.exports = {
	APP_DIR,
	DATA_DIR,
	ENV_FILE,
	env,
	load,
};
