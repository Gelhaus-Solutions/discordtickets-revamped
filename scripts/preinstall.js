/* eslint-disable no-console */
const { randomBytes } = require('crypto');
const fs = require('fs');
const { resolve } = require('path');
const { short } = require('leeks.js');

function log (...strings) {
	console.log(short('&9[preinstall]&r'), ...strings);
}

if (process.env.CI) {
	log('CI detected, skipping');
	process.exit(0);
}

const env = {
	CPU_LIMIT: '',
	DB_CONNECTION_URL: '',
	DB_PROVIDER: '', // don't default to sqlite, postinstall checks if empty
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
	NODE_ENV: 'production', // not bot-specific
	OVERRIDE_ARCHIVE: '',
	PUBLIC_BOT: false,
	PUBLISH_COMMANDS: false,
	SUPER: '319467558166069248',
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

// The .env path must be resolved against the repository, not the working
// directory. In Docker the cwd is /home/container while the app lives in /app,
// so a relative './.env' was written somewhere ephemeral — meaning a brand new
// ENCRYPTION_KEY was generated on every container recreate, permanently
// orphaning every encrypted ticket topic, close reason, feedback comment and
// archived message.
const envPath = resolve(__dirname, '../.env');
const ephemeral = process.env.DOCKER === 'true' || process.env.PTERODACTYL === 'true';

// check ENCRYPTION_KEY because we don't want to force use of the .env file
if (process.env.ENCRYPTION_KEY || fs.existsSync(envPath)) {
	log('nothing to do');
} else if (ephemeral) {
	// Never silently mint a key in a container: it would differ on every
	// recreate, and the previous one is unrecoverable.
	console.error(short('&cENCRYPTION_KEY is not set.&r'));
	console.error('Set it explicitly in your compose file / container environment before starting.');
	console.error('Generate one with:  openssl rand -hex 24');
	console.error(short('&e&lIf this instance already has data, you MUST reuse its original key or that data becomes unreadable.&r'));
	process.exit(1);
} else {
	log('generating ENCRYPTION_KEY');
	fs.writeFileSync(envPath, Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\n'));
	log(`created .env file at ${envPath}`);
	log(short('&r&0&!e WARNING &r &e&lkeep your environment variables safe, don\'t lose your encryption key or you will lose data'));
}
