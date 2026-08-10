/* eslint-disable no-console */
const {
	appPath, loadEnv,
} = require('./lib/paths');

loadEnv();

const fs = require('fs-extra');
const crypto = require('crypto');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { buildDashboard } = require('./lib/build-dashboard');
const { short } = require('leeks.js');
const { join } = require('path');

const fallback = { prisma: './node_modules/prisma/build/index.js' };

// Everything is resolved against the application directory, never the working
// directory: in Docker the cwd is /home/container while the app is /app, so a
// relative `./prisma` here removed the wrong (non-existent) directory and left
// the previous provider's migrations in place — including its differently
// named baseline.
const pathify = path => appPath(path);

// `--required` is passed by scripts/start.sh: at boot an unset DB_PROVIDER is
// fatal, but during `npm ci` (where no environment exists yet) it is normal.
const REQUIRED = process.argv.includes('--required');

function log(...strings) {
	console.log(short('&9[postinstall]&r'), ...strings);
}

// The dashboard bundle is build output rather than something committed, so a
// fresh clone has to produce it. See scripts/lib/build-dashboard.js for which
// installations skip it and why. Deliberately above the DB_PROVIDER check
// below: a first `npm ci` has no environment yet and exits there.
//
// Install time only. scripts/start.sh runs this same file with `--required` on
// every boot, and a restart must not be able to block for two minutes on `npm
// ci` — least of all on a host that has lost its route to the registry, where
// the attempt is doomed and repeats on every restart. A bundle missing at boot
// is reported by src/http.js instead, with the command to fix it.
if (!REQUIRED) buildDashboard(log);

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
	if (REQUIRED) {
		console.error(short('&cDB_PROVIDER is not set.&r'));
		console.error('Set it to "mysql" or "postgresql", along with DB_CONNECTION_URL.');
		process.exit(1);
	}
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

/**
 * A fingerprint of the provider's schema + migrations, so an unchanged install
 * does not re-copy the tree and re-run `prisma generate` on every boot. That
 * matters on panels and bare metal, where the app directory may be read-only
 * after the first run and where boot time is visible to the operator.
 *
 * It hashes file *contents*, so a change to the generator block counts too —
 * not just migrations. That is what makes `previewFeatures` edits (which have
 * no migration of their own) reach an existing install: without a regenerate
 * the client is silently built without them. `npm start` runs this via
 * `prestart` for exactly that reason, mirroring what scripts/start.sh does in
 * containers.
 */
function fingerprint(dir) {
	const hash = crypto.createHash('sha256');
	const walk = current => {
		for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
			const full = join(current, entry.name);
			if (entry.isDirectory()) walk(full);
			else hash.update(entry.name).update(fs.readFileSync(full));
		}
	};
	walk(dir);
	return hash.digest('hex');
}

const marker = pathify('./prisma/.provider');
const expected = `${provider}\n${fingerprint(pathify(`./db/${provider}`))}\n`;
const current = fs.existsSync(marker) ? fs.readFileSync(marker, 'utf8') : null;
const generated = fs.existsSync(pathify('./node_modules/.prisma/client/index.js'));
const upToDate = current === expected && generated;

if (upToDate) {
	log('schema & client are up to date');
} else {
	log(`copying ${provider} schema & migrations`);
	if (fs.existsSync(pathify('./prisma'))) {
		fs.rmSync(pathify('./prisma'), {
			force: true,
			recursive: true,
		});
	}
	fs.mkdirSync(pathify('./prisma'), { recursive: true });
	fs.copySync(pathify(`./db/${provider}`), pathify('./prisma')); // copy schema & migrations
}

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
	automation_triggers: { columns: [['automations', 'triggerTypes']] },
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
	if (!upToDate) {
		await npx('prisma generate');
		fs.writeFileSync(marker, expected);
	}

	// For operators who migrate out of band, or run more than one replica —
	// `prisma migrate deploy` is not safe to run concurrently.
	if (process.env.DT_SKIP_MIGRATIONS === 'true') {
		log('DT_SKIP_MIGRATIONS is set, skipping migrations');
		return;
	}

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
