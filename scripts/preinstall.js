/* eslint-disable no-console */
/**
 * Make sure this installation has an environment file with an encryption key.
 *
 * Runs from npm's `preinstall` hook *and* from `scripts/start.sh`, which is why
 * it has **no dependencies**: npm runs `preinstall` before `node_modules`
 * exists, so `require('leeks.js')` here used to abort a fresh `npm install`
 * with MODULE_NOT_FOUND before anything else could happen.
 */
const { randomBytes } = require('crypto');
const fs = require('fs');
const {
	DATA_DIR, ENV_FILE, dataDirProblem,
} = require('./lib/paths');

const colour = (code, string) => (process.stdout.isTTY ? `\x1b[${code}m${string}\x1b[0m` : string);
const log = (...strings) => console.log(colour(34, '[preinstall]'), ...strings);
const error = (...strings) => console.error(colour(31, '[preinstall]'), ...strings);

if (process.env.CI) {
	log('CI detected, skipping');
	process.exit(0);
}

const env = {
	CPU_LIMIT: '',
	DB_CONNECTION_URL: '',
	DB_PROVIDER: '', // postinstall checks if this is empty
	DISABLE_ENCRYPTION: false,
	DISCORD_SECRET: '',
	DISCORD_TOKEN: '',
	ENCRYPTION_KEY: randomBytes(24).toString('hex'),
	HTTP_EXTERNAL: 'http://127.0.0.1:8169',
	HTTP_HOST: '0.0.0.0',
	HTTP_INTERNAL: '',
	HTTP_PORT: 8169,
	HTTP_TRUST_PROXY: false,
	INVALIDATE_TOKENS: '',
	OVERRIDE_ARCHIVE: '',
	PUBLIC_BOT: false,
	PUBLISH_COMMANDS: false,
	SUPER: '',
	// Temporal is required — the bot refuses to start without an address/port
	// (see src/env.js). These defaults assume an insecure local cluster; for
	// production set TEMPORAL_TLS_ENABLED=true and the TEMPORAL_TLS_*_PATH vars.
	TEMPORAL_ADDRESS: '127.0.0.1',
	TEMPORAL_PORT: 7233,
	TEMPORAL_NAMESPACE: 'default',
	TEMPORAL_TASK_QUEUE: 'discord-tickets',
	TEMPORAL_DEPLOYMENT_NAME: 'discord-tickets',
	TEMPORAL_TLS_ENABLED: false,
};

// A key generated here has to survive restarts, or every ticket topic, close
// reason, feedback comment and archived message encrypted with the old one
// becomes unreadable. So it is only ever written to DATA_DIR — the volume the
// operator persists — and never when that directory is missing or read-only.
const problem = dataDirProblem();

if (process.env.ENCRYPTION_KEY || fs.existsSync(ENV_FILE)) {
	log('nothing to do');
} else if (process.env.DOCKER === 'true' || problem) {
	error('ENCRYPTION_KEY is not set.');
	if (problem) error(`(the data directory ${DATA_DIR} ${problem}, so one cannot be saved here)`);
	console.error('Set it explicitly in your container environment / panel variables before starting.');
	console.error('Generate one with:  openssl rand -hex 24');
	console.error(colour(33, 'If this instance already has data, you MUST reuse its original key or that data becomes unreadable.'));
	process.exit(1);
} else {
	log('generating ENCRYPTION_KEY');
	// 0600: this file holds the bot token and the encryption key.
	fs.writeFileSync(ENV_FILE, Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n') + '\n', { mode: 0o600 });
	log(`created .env file at ${ENV_FILE}`);
	log(colour(33, 'keep your environment variables safe — losing the encryption key means losing data'));
}
