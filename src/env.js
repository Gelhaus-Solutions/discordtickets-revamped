/* eslint-disable no-console */

const dotenv = require('dotenv');
const { colours } = require('leeks.js');

const providers = ['mysql', 'postgresql'];

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
	OVERRIDE_ARCHIVE: () => true, // optional
	PUBLIC_BOT: () => true, // optional
	PUBLISH_COMMANDS: () => true, // optional
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
	TEMPORAL_TLS_CA_PATH: () => true, // optional (server root CA for verification)
	TEMPORAL_TLS_CERT_PATH: v => {
		const enabled = !['0', 'false', 'no', 'off'].includes((process.env.TEMPORAL_TLS_ENABLED || '').toLowerCase());
		return (!enabled || !!v) || new Error('is required for mTLS (path to client certificate); set TEMPORAL_TLS_ENABLED=false to disable');
	},
	TEMPORAL_TLS_ENABLED: () => true, // optional (default true; set false for insecure local dev)
	TEMPORAL_TLS_KEY_PATH: v => {
		const enabled = !['0', 'false', 'no', 'off'].includes((process.env.TEMPORAL_TLS_ENABLED || '').toLowerCase());
		return (!enabled || !!v) || new Error('is required for mTLS (path to client private key); set TEMPORAL_TLS_ENABLED=false to disable');
	},
	TEMPORAL_SET_CURRENT_ON_START: () => true, // optional (default true; promote this build to Current on startup)
	TEMPORAL_TLS_SERVER_NAME: () => true, // optional (SNI override)
	TEMPORAL_WORKER_BUILD_ID: () => true, // optional (defaults to injected 6-char git SHA)
};

const load = options => {
	dotenv.config(options);
	Object.entries(env).forEach(([name, validate]) => {
		const result = validate(process.env[name]); // `true` for pass, or `Error` for fail
		if (result instanceof Error) {
			console.log('\x07' + colours.redBright(`Error: The "${name}" environment variable ${result.message}.`));
			process.exit(1);
		}
	});
};

module.exports = {
	env,
	load,
};
