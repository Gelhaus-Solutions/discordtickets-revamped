/* eslint-disable no-console */
require('dotenv').config();
const fs = require('fs-extra');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { short } = require('leeks.js');
const {
	join,
	resolve,
} = require('path');

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

// Databases created before upstream adopted migrations (its postinstall used
// `prisma db push`), or restored from a dump that excluded `_prisma_migrations`,
// have the tables but no migration history. `migrate deploy` then refuses with
// P3005 ("the database schema is not empty") and the bot never boots. The fix
// is to baseline: record the migrations the schema already satisfies as applied
// so deploy only runs the genuinely pending ones.
//
// Each entry lists the schema objects its migration introduces, keyed by the
// migration name minus its timestamp — the mysql and postgresql baselines are
// the same migration under different timestamps. Every listed object must be
// present before a migration counts as applied, so a migration that died
// half-way through is re-run rather than skipped.
const MIGRATION_PROBES = {
	'4_0_0': {
		tables: [
			'archivedChannels',
			'archivedMessages',
			'archivedRoles',
			'archivedUsers',
			'categories',
			'feedback',
			'guilds',
			'questionAnswers',
			'questions',
			'tags',
			'tickets',
			'users',
		],
	},
	// Both tables must be listed: a run that created `automations` but died
	// before `automationRuns` has to be re-run, not skipped.
	automations: { tables: ['automations', 'automationRuns'] },
	bot_customization: {
		columns: [
			['guilds', 'botAvatar'],
			['guilds', 'botBio'],
			['guilds', 'botUsername'],
			['guilds', 'closeReasonButton'],
		],
	},
	disable_dms: { columns: [['guilds', 'disableDMs']] },
	features: { columns: [['categories', 'autoAssign']] },
	// Both objects must be listed: a run that created `panels` but died before
	// adding categories.messageLayout has to be re-run, not skipped.
	panels: {
		columns: [['categories', 'messageLayout']],
		tables: ['panels'],
	},
	// The enum widening in the same migration cannot be probed portably (MySQL
	// keeps the values inline on the column, PostgreSQL in a separate type), but
	// the column is added last, so its presence implies the enum went first.
	question_types: { columns: [['questions', 'config']] },
	// This one drops guilds.botBanner and restore_bot_banner adds it back, so
	// column presence cannot distinguish "before the drop" from "after the
	// restore". Treat it as applied whenever bot_customization is: re-running it
	// on a fully upgraded database would drop a column holding real data.
	remove_bot_banner: { columns: [['guilds', 'botAvatar']] },
	reopen_window: {
		columns: [
			['guilds', 'reopenWindow'],
			['tickets', 'pendingCloseAt'],
		],
	},
	restore_bot_banner: { columns: [['guilds', 'botBanner']] },
	revamp: {
		columns: [
			['categories', 'backupCategoryId'],
			['categories', 'channelMode'],
			['categories', 'threadChannelId'],
			['tickets', 'htmlTranscript'],
		],
	},
};

function isP3005(error) {
	return `${error?.stdout || ''}${error?.stderr || ''}${error?.message || ''}`.includes('P3005');
}

/**
 * Every column in the connected database, as a set of lowercased
 * `table.column` keys. Identifier case differs between the providers (and
 * between MySQL versions), so nothing here compares case-sensitively.
 */
async function readSchema() {
	const { PrismaClient } = require('@prisma/client');
	const prisma = new PrismaClient();
	try {
		const rows = await prisma.$queryRawUnsafe(
			provider === 'mysql'
				? 'SELECT TABLE_NAME AS t, COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()'
				: 'SELECT table_name AS t, column_name AS c FROM information_schema.columns WHERE table_schema = current_schema()',
		);
		return new Set(rows.map(({
			c,
			t,
		}) => `${t}.${c}`.toLowerCase()));
	} finally {
		await prisma.$disconnect();
	}
}

function satisfies(probe, columns) {
	const tables = new Set([...columns].map(key => key.slice(0, key.indexOf('.'))));
	return (probe.tables ?? []).every(table => tables.has(table.toLowerCase())) &&
		(probe.columns ?? []).every(([table, column]) => columns.has(`${table}.${column}`.toLowerCase()));
}

/** @returns {Promise<boolean>} whether anything was marked as applied. */
async function baseline() {
	const dir = pathify('./prisma/migrations');
	const names = fs.readdirSync(dir)
		.filter(name => fs.existsSync(join(dir, name, 'migration.sql')))
		.sort();
	const columns = await readSchema();
	const applied = [];
	// Longest satisfied prefix only: once a migration is missing from the
	// database, everything after it is pending by definition.
	for (const name of names) {
		const probe = MIGRATION_PROBES[name.replace(/^\d+_/, '')];
		if (!probe) {
			log(`no baseline probe for ${name}, treating it and everything after as pending`);
			break;
		}
		if (!satisfies(probe, columns)) break;
		applied.push(name);
	}
	if (applied.length === 0) return false;
	log(`baselining ${applied.length} migration(s) already present in the database`);
	for (const name of applied) await npx(`prisma migrate resolve --applied ${name}`);
	return true;
}

// A failed generate or migration must stop the boot. Previously this IIFE had
// no rejection handler, and scripts/start.sh ignored the exit code, so the bot
// started against a half-migrated schema and sprayed P2022 errors instead.
(async () => {
	await npx('prisma generate');
	try {
		await npx('prisma migrate deploy');
	} catch (error) {
		if (!isP3005(error)) throw error;
		log('database has tables but no migration history — baselining it');
		if (!await baseline()) {
			console.error(short('&cThe database is not empty and does not look like a Discord Tickets database.&r'));
			console.error('Point DB_CONNECTION_URL at an empty database, or baseline it by hand:');
			console.error('  https://pris.ly/d/migrate-baseline');
			throw error;
		}
		await npx('prisma migrate deploy');
	}
})().catch(error => {
	console.error(short('&cDatabase preparation failed — refusing to start.&r'));
	console.error(error?.stderr || error?.message || error);
	process.exit(1);
});
