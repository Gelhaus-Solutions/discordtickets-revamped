/* eslint-disable no-console */
require('dotenv').config();
const fs = require('fs-extra');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { short } = require('leeks.js');
const { resolve } = require('path');

const fallback = { prisma: './node_modules/prisma/build/index.js' };

function pathify(path) {
	return resolve(__dirname, '../', path);
}

function log(...strings) {
	console.log(short('&9[postinstall]&r'), ...strings);
}

async function npx(cmd) {
	const parts = cmd.split(' ');
	// fallback for environments with no symlink/npx support (PebbleHost)
	if (!fs.existsSync(pathify(`./node_modules/.bin/${parts[0]}`))) {
		const x = parts.shift();
		cmd = 'node ' + fallback[x] + ' ' + parts.join(' ');
	} else {
		cmd = 'npx ' + cmd;
	}
	log(`> ${cmd}`);
	const {
		stderr,
		stdout,
	} = await exec(cmd, { cwd: pathify('./') }); // { env } = process.env
	if (stdout) console.log(stdout.toString());
	if (stderr) console.log(stderr.toString());
}

const providers = ['mysql', 'postgresql'];
const provider = process.env.DB_PROVIDER;

if (!provider) {
	log('environment not set, exiting.');
	process.exit(0);
}

if (provider === 'sqlite') {
	console.error(short('&cSQLite is no longer supported by this fork.&r'));
	console.error('Your data can be moved to PostgreSQL or MySQL without loss:');
	console.error('  1. On your OLD upstream install, run:  npm run db.dump');
	console.error('  2. Note your existing ENCRYPTION_KEY — the dump stays encrypted with it.');
	console.error('  3. Set DB_PROVIDER=postgresql (or mysql), DB_CONNECTION_URL, and the SAME');
	console.error('     ENCRYPTION_KEY on this install, then start it once to create the schema.');
	console.error('  4. Restore with:  npm run db.restore -- -f <dump file> -y');
	console.error('See MIGRATING.md for the full procedure.');
	process.exit(1);
}

if (!providers.includes(provider)) throw new Error(`DB_PROVIDER must be one of: ${providers}`);

log(`provider=${provider}`);
log(`copying ${provider} schema & migrations`);

// Both branches must be pathified: in Docker the working directory is
// /home/container while the app lives in /app, so a relative `./prisma` here
// removed the wrong (non-existent) directory and left the previous provider's
// migrations in place — including its differently-named baseline.
if (fs.existsSync(pathify('./prisma'))) {
	fs.rmSync(pathify('./prisma'), {
		force: true,
		recursive: true,
	});
}
fs.mkdirSync(pathify('./prisma'), { recursive: true });
fs.copySync(pathify(`./db/${provider}`), pathify('./prisma')); // copy schema & migrations

// A failed generate or migration must stop the boot. Previously this IIFE had
// no rejection handler, and scripts/start.sh ignored the exit code, so the bot
// started against a half-migrated schema and sprayed P2022 errors instead.
(async () => {
	await npx('prisma generate');
	await npx('prisma migrate deploy');
})().catch(error => {
	console.error(short('&cDatabase preparation failed — refusing to start.&r'));
	console.error(error?.stderr || error?.message || error);
	process.exit(1);
});
