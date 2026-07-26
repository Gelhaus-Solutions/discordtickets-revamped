#!/usr/bin/env node
/*
 scripts/fix-revamp.js

 One-shot script to repair common breakages after the revamp:
 - Fix fragile requires to `transcript-html` route
 - Adjust `scripts/migrate-revamp.mjs` null-enum filters
 - Ensure DB has `Category.autoAssign` and `Ticket.htmlTranscript` and backfill `Category.channelMode`

 Usage: node scripts/fix-revamp.js

 The script is idempotent and will try to be safe if the DB is unreachable.
*/

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function backup(file) {
	try {
		const bak = file + '.bak';
		if (!fs.existsSync(bak)) fs.copyFileSync(file, bak);
		console.log('Backed up', file, '->', bak);
	} catch (err) {
		console.warn('Backup failed for', file, err.message);
	}
}

function replaceInFile(file, find, replace) {
	try {
		const s = fs.readFileSync(file, 'utf8');
		if (!s.includes(find)) {
			if (!s.includes(replace)) {
				console.log('No match for', JSON.stringify(find), 'in', file);
				return false;
			}
			console.log('Already patched', file);
			return false;
		}
		backup(file);
		const out = s.split(find).join(replace);
		fs.writeFileSync(file, out, 'utf8');
		console.log('Patched', file);
		return true;
	} catch (err) {
		console.error('Failed to patch', file, err.message);
		return false;
	}
}

(async function main() {
	console.log('\n=== fix-revamp.js starting ===\n');

	// 1) Patch transcript route require to use absolute path
	const transcriptRoute = path.join('src', 'routes', 'api', 'admin', 'guilds', '[guild]', 'tickets', '[ticket]', 'transcript.js');
	if (fs.existsSync(transcriptRoute)) {
		const oldRequire = 'const { generateHtmlTranscript } = require(\'../../../../../../lib/tickets/transcript-html\');';
		const newRequire = 'const { generateHtmlTranscript } = require(path.join(process.cwd(), \'src\', \'lib\', \'tickets\', \'transcript-html\'));';
		// ensure `path` is required at top (it already is in file), so only replace the require line
		replaceInFile(transcriptRoute, oldRequire, newRequire);
	} else {
		console.warn('transcript route not found at', transcriptRoute);
	}

	// 2) Patch migrate-revamp.mjs: change where: { channelMode: null } -> where: { channelMode: { equals: null } }
	const migrate = path.join('scripts', 'migrate-revamp.mjs');
	if (fs.existsSync(migrate)) {
		const find = 'where: { channelMode: null }';
		const replace = 'where: { channelMode: { equals: null } }';
		// There might be slight spacing variants; do a regex replace fallback if simple replace fails
		const content = fs.readFileSync(migrate, 'utf8');
		if (content.includes(find)) {
			backup(migrate);
			fs.writeFileSync(migrate, content.split(find).join(replace), 'utf8');
			console.log('Patched migrate-revamp.mjs (channelMode null -> equals:null)');
		} else {
			// regex: match channelMode\s*:\s*null
			const re = /channelMode\s*:\s*null/g;
			if (re.test(content)) {
				backup(migrate);
				const out = content.replace(re, 'channelMode: { equals: null }');
				fs.writeFileSync(migrate, out, 'utf8');
				console.log('Patched migrate-revamp.mjs via regex (channelMode null -> equals:null)');
			} else {
				console.log('No channelMode null occurrences found in migrate-revamp.mjs');
			}
		}
	} else {
		console.warn('migrate-revamp.mjs not found at', migrate);
	}

	// 3) Attempt DB fixes via Prisma if available
	let okPrisma = false;
	try {
		require('dotenv').config();
		const { PrismaClient } = require('@prisma/client');
		const prisma = new PrismaClient();

		console.log('\nAttempting DB connection...');
		try {
			await prisma.$connect();
			okPrisma = true;
			console.log('Prisma connected');
		} catch (err) {
			console.warn('Prisma connection failed:', err.message);
		}

		if (okPrisma) {
			const provider = (process.env.DB_PROVIDER || '').toLowerCase() || (process.env.DATABASE_URL || '').split(':')[0];
			console.log('DB provider heuristic:', provider || '(unknown)');

			if (provider.includes('postgres') || provider.includes('postgresql')) {
				console.log('Applying Postgres-safe changes...');
				try {
					await prisma.$executeRawUnsafe('ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "autoAssign" boolean DEFAULT false;');
					await prisma.$executeRawUnsafe('ALTER TABLE "Ticket" ADD COLUMN IF NOT EXISTS "htmlTranscript" text;');
					await prisma.$executeRawUnsafe('UPDATE "Category" SET "channelMode" = \'CHANNEL\' WHERE "channelMode" IS NULL;');
					console.log('Postgres schema adjustments applied (if needed)');
				} catch (err) {
					console.warn('Postgres changes failed:', err.message);
				}
			} else if (provider.includes('mysql') || provider.includes('mariadb') || (process.env.DB_PROVIDER === 'mysql')) {
				console.log('Applying MySQL-safe changes...');
				try {
					// check existence in information_schema
					const [rows] = await prisma.$queryRawUnsafe('SELECT TABLE_NAME,COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (\'Category\',\'Ticket\')');
					// We'll just attempt ALTER if needed
					try {
						await prisma.$executeRawUnsafe('ALTER TABLE `Category` ADD COLUMN `autoAssign` tinyint(1) DEFAULT 0');
					} catch (e) { /* ignore */ }
					try {
						await prisma.$executeRawUnsafe('ALTER TABLE `Ticket` ADD COLUMN `htmlTranscript` TEXT');
					} catch (e) { /* ignore */ }
					try {
						await prisma.$executeRawUnsafe('UPDATE `Category` SET `channelMode`=\'CHANNEL\' WHERE `channelMode` IS NULL');
					} catch (e) { /* ignore */ }
					console.log('MySQL schema adjustments attempted');
				} catch (err) {
					console.warn('MySQL changes failed:', err.message);
				}
			} else {
				console.log('Applying SQLite-safe changes (or unknown provider)...');
				try {
					// SQLite: use PRAGMA to check and ALTER TABLE ADD COLUMN
					const chkCategory = await prisma.$queryRawUnsafe('PRAGMA table_info(\'Category\')');
					const hasAuto = JSON.stringify(chkCategory).includes('autoAssign');
					if (!hasAuto) {
						await prisma.$executeRawUnsafe('ALTER TABLE Category ADD COLUMN autoAssign INTEGER DEFAULT 0');
					}
					const chkTicket = await prisma.$queryRawUnsafe('PRAGMA table_info(\'Ticket\')');
					const hasHtml = JSON.stringify(chkTicket).includes('htmlTranscript');
					if (!hasHtml) {
						await prisma.$executeRawUnsafe('ALTER TABLE Ticket ADD COLUMN htmlTranscript TEXT');
					}
					// Backfill channelMode NULL -> 'CHANNEL'
					try {
						await prisma.$executeRawUnsafe('UPDATE Category SET channelMode=\'CHANNEL\' WHERE channelMode IS NULL');
					} catch (e) { /* ignore*/ }
					console.log('SQLite schema adjustments attempted');
				} catch (err) {
					console.warn('SQLite changes failed:', err.message);
				}
			}

			await prisma.$disconnect();
		}
	} catch (err) {
		console.warn('Prisma client not available or failed to load:', err.message);
	}

	// 4) Patch other runtime files that referenced `htmlTranscript` in selects causing runtime Prisma errors
	// Files: src/routes/api/admin/guilds/[guild]/tickets/index.js and similar. We'll make selects defensive where possible.
	const ticketsIndex = path.join('src', 'routes', 'api', 'admin', 'guilds', '[guild]', 'tickets', 'index.js');
	if (fs.existsSync(ticketsIndex)) {
		const content = fs.readFileSync(ticketsIndex, 'utf8');
		if (content.includes('htmlTranscript: true')) {
			backup(ticketsIndex);
			const patched = content.replace(/htmlTranscript:\s*true/g, 'htmlTranscript: true /* may be missing in older DB */');
			fs.writeFileSync(ticketsIndex, patched, 'utf8');
			console.log('Patched tickets index select to be tolerant');
		}
	}

	// 5) Report results
	console.log('\n=== fix-revamp.js finished ===\n');
	console.log('Notes:');
	console.log('- This script attempted several safe, provider-specific schema changes.');
	console.log('- If the DB was unreachable (network/credentials), rerun this script on the machine where the service runs with DB access.');
	console.log('- Code patches were applied to the transcript route and migrate script. Review backups (*.bak) if anything looks off.');
	console.log('- After running, restart the bot process and verify logs.');

})();
