#!/usr/bin/env node
/**
 * scripts/migrate-revamp.mjs
 *
 * Post-revamp migration helper.
 *
 * What it does:
 *   1. Sets channelMode = 'CHANNEL' on every Category that has no channelMode set
 *      (safety net – the DB default handles new rows, but old rows may be NULL in
 *      databases that don't apply defaults to existing rows).
 *   2. For every closed ticket whose guild has `archive = true` AND that does not
 *      yet have an htmlTranscript, generates and saves an HTML transcript to
 *      user/transcripts/ticket-<id>.html and records the path in the DB.
 *   3. For every closed ticket with no Feedback record, scans its ArchivedMessages
 *      for bot messages containing a star rating pattern (e.g. "⭐⭐⭐ (3/5)") and
 *      creates missing Feedback rows.
 *
 * Usage:
 *   node scripts/migrate-revamp.mjs
 *   node scripts/migrate-revamp.mjs --dry-run          # preview only, no writes
 *   node scripts/migrate-revamp.mjs --only-transcripts # skip category migration
 *   node scripts/migrate-revamp.mjs --only-feedback    # run Step 3 only
 *   node scripts/migrate-revamp.mjs --skip-feedback    # skip Step 3
 *   node scripts/migrate-revamp.mjs --concurrency 4    # parallel workers (default 3)
 *   node scripts/migrate-revamp.mjs --guild <id>       # restrict to one guild
 */

import { config } from 'dotenv';
import { createRequire } from 'module';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { parseArgs } from 'util';

config();

// ─── Parse CLI args ──────────────────────────────────────────────────────────
const { values: args } = parseArgs({
	options: {
		'concurrency': { type: 'string', default: '3' },
		'dry-run': { type: 'boolean', default: false },
		'guild': { type: 'string' },
		'only-feedback': { type: 'boolean', default: false },
		'only-transcripts': { type: 'boolean', default: false },
		'skip-feedback': { type: 'boolean', default: false },
	},
	strict: false,
});

const DRY_RUN = args['dry-run'];
const ONLY_TRANSCRIPTS = args['only-transcripts'];
const ONLY_FEEDBACK = args['only-feedback'];
const SKIP_FEEDBACK = args['skip-feedback'];
const GUILD_ID = args['guild'];
const CONCURRENCY = Math.max(1, parseInt(args['concurrency']) || 3);

// ─── Paths ────────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const require = createRequire(import.meta.url);

// ─── Logging helpers ─────────────────────────────────────────────────────────
const cyan = s => `\x1b[36m${s}\x1b[0m`;
const green = s => `\x1b[32m${s}\x1b[0m`;
const yellow = s => `\x1b[33m${s}\x1b[0m`;
const red = s => `\x1b[31m${s}\x1b[0m`;
const bold = s => `\x1b[1m${s}\x1b[0m`;

function log(...args2) { console.log(...args2); }
function info(msg) { log(` ${cyan('ℹ')} ${msg}`); }
function ok(msg) { log(` ${green('✔')} ${msg}`); }
function warn(msg) { log(` ${yellow('⚠')} ${msg}`); }
function fail(msg) { log(` ${red('✖')} ${msg}`); }
function header(msg) { log(`\n${bold(msg)}`); }

function progress(done, total, label) {
	const pct = total ? Math.round((done / total) * 100) : 100;
	const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
	process.stdout.write(`\r  [${bar}] ${pct}% — ${done}/${total} ${label}   `);
	if (done === total) process.stdout.write('\n');
}

// ─── Prisma setup ─────────────────────────────────────────────────────────────
header('Connecting to database…');

const { PrismaClient } = await import('@prisma/client');
const prismaOptions = {};

if (process.env.DB_PROVIDER === 'sqlite' && !process.env.DB_CONNECTION_URL) {
	prismaOptions.datasources = { db: { url: 'file:' + join(ROOT, 'user', 'database.db') } };
}

const prisma = new PrismaClient(prismaOptions);

if (process.env.DB_PROVIDER === 'sqlite') {
	const { default: sqliteMiddleware } = await import('../src/lib/middleware/prisma-sqlite.js');
	prisma.$use(sqliteMiddleware);
	await prisma.$queryRaw`PRAGMA journal_mode=WAL;`;
	await prisma.$queryRaw`PRAGMA synchronous=normal;`;
}

ok('Connected');

// ─── Crypto helper (standalone, no worker threads) ────────────────────────────
// src/lib/crypto.js is CommonJS and reads process.env.ENCRYPTION_KEY / DISABLE_ENCRYPTION
const cryptoLib = require(join(ROOT, 'src', 'lib', 'crypto.js'));
const decryptField = val => {
	if (!val) return null;
	try {
		return cryptoLib.decrypt(val);
	} catch {
		return val; // return raw if not encrypted / wrong key
	}
};

// ─── Import the HTML builder (CommonJS module via createRequire) ──────────────
// buildHtml doesn't use worker pools – it's pure synchronous string manipulation
const { buildHtml } = require(join(ROOT, 'src', 'lib', 'tickets', 'transcript-html.js'));

// ─── Helper: build + save transcript for one ticket ──────────────────────────
async function processTicket(ticket) {
	try {
		const full = await prisma.ticket.findUnique({
			include: {
				archivedMessages: { orderBy: { createdAt: 'asc' } },
				archivedRoles: true,
				archivedUsers: true,
				category: {
					include: { questions: { orderBy: { order: 'asc' } } },
				},
				feedback: true,
				guild: true,
				questionAnswers: {
					include: { question: true },
				},
			},
			where: { id: ticket.id },
		});

		if (!full) return { id: ticket.id, status: 'skip', reason: 'not found' };

		// Decrypt all fields synchronously (no worker pool in migration context)
		const decryptedMessages = Object.fromEntries(
			full.archivedMessages.map(msg => [msg.id, decryptField(msg.content)]),
		);

		const decryptedUsernames = Object.fromEntries(
			full.archivedUsers.map(u => [u.userId, decryptField(u.displayName || u.username)]),
		);

		const decryptedAnswers = Object.fromEntries(
			full.questionAnswers.map(a => [a.id, decryptField(a.value)]),
		);

		const topic = decryptField(full.topic);
		const closedReason = decryptField(full.closedReason);
		const feedbackComment = decryptField(full.feedback?.comment);

		const html = buildHtml({
			category: full.category,
			decrypted: {
				answers: decryptedAnswers,
				feedbackComment,
				closedReason,
				messages: decryptedMessages,
				topic,
				usernames: decryptedUsernames,
			},
			feedback: full.feedback,
			guild: full.guild,
			messages: full.archivedMessages,
			questionAnswers: full.questionAnswers,
			questions: full.category?.questions || [],
			roles: full.archivedRoles,
			ticket: full,
			users: full.archivedUsers,
		});

		if (!html) return { id: ticket.id, status: 'skip', reason: 'buildHtml returned null' };

		const dir = join(ROOT, 'user', 'transcripts');
		if (!DRY_RUN) {
			if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
			const filename = `ticket-${ticket.id}.html`;
			writeFileSync(join(dir, filename), html, 'utf8');
			await prisma.ticket.update({
				data: { htmlTranscript: `user/transcripts/${filename}` },
				where: { id: ticket.id },
			});
		}

		return { id: ticket.id, status: 'ok' };
	} catch (err) {
		return { id: ticket.id, status: 'error', reason: String(err.message) };
	}
}

// ─── Helper: run tasks with limited concurrency ───────────────────────────────
async function runWithConcurrency(tasks, concurrency) {
	const results = [];
	let idx = 0;

	async function worker() {
		while (idx < tasks.length) {
			const task = tasks[idx++];
			results.push(await task());
		}
	}

	const workers = Array.from({ length: concurrency }, () => worker());
	await Promise.all(workers);
	return results;
}

// ─── STEP 1: Backfill channelMode ─────────────────────────────────────────────
if (!ONLY_TRANSCRIPTS && !ONLY_FEEDBACK) {
	header('Step 1 — Backfill Category.channelMode');

	const categoriesWithoutMode = await prisma.category.findMany({
		select: { id: true, name: true },
		where: { channelMode: null },
	});

	if (categoriesWithoutMode.length === 0) {
		ok('All categories already have channelMode set — nothing to do.');
	} else {
		info(`Found ${categoriesWithoutMode.length} categor${categoriesWithoutMode.length === 1 ? 'y' : 'ies'} without channelMode.`);
		for (const cat of categoriesWithoutMode) {
			info(`  • [${cat.id}] ${cat.name}`);
		}
		if (DRY_RUN) {
			warn(`DRY RUN — would set channelMode = 'CHANNEL' on ${categoriesWithoutMode.length} categories.`);
		} else {
			await prisma.category.updateMany({
				data: { channelMode: 'CHANNEL' },
				where: { channelMode: null },
			});
			ok(`Updated ${categoriesWithoutMode.length} categories.`);
		}
	}
} else {
	info('Skipping Step 1 (--only-transcripts / --only-feedback).');
}

// ─── STEP 2: Generate missing HTML transcripts ────────────────────────────────
if (!ONLY_FEEDBACK) {
	header('Step 2 — Generate missing HTML transcripts');

	const where = {
		guild: { archive: true },
		htmlTranscript: null,
		open: false,
		...(GUILD_ID ? { guildId: GUILD_ID } : {}),
	};

	const totalClosed = await prisma.ticket.count({ where });

	if (totalClosed === 0) {
		ok('No tickets require transcript generation — nothing to do.');
	} else {
		info(`Found ${totalClosed} closed ticket${totalClosed === 1 ? '' : 's'} without an HTML transcript.`);
		if (DRY_RUN) {
			warn(`DRY RUN — would generate ${totalClosed} transcripts.`);
		} else {
			// Process in batches to avoid loading all into memory
			const BATCH_SIZE = 50;
			let offset = 0;
			let done = 0;
			let errors = 0;

			while (offset < totalClosed) {
				const batch = await prisma.ticket.findMany({
					select: { id: true, number: true },
					skip: offset,
					take: BATCH_SIZE,
					where,
				});

				if (batch.length === 0) break;

				const tasks = batch.map(ticket => () => processTicket(ticket));
				const results = await runWithConcurrency(tasks, CONCURRENCY);

				for (const result of results) {
					if (result.status === 'ok') {
						done++;
					} else if (result.status === 'error') {
						errors++;
						fail(`Ticket ${result.id}: ${result.reason}`);
					} else {
						warn(`Ticket ${result.id} skipped: ${result.reason}`);
					}
				}

				offset += batch.length;
				progress(Math.min(offset, totalClosed), totalClosed, 'transcripts');
			}

			ok(`Generated ${done} transcript${done === 1 ? '' : 's'}.`);
			if (errors > 0) warn(`${errors} ticket${errors === 1 ? '' : 's'} failed — see errors above.`);
		}
	}
} else {
	info('Skipping Step 2 (--only-feedback).');
}

// ─── STEP 3: Backfill missing Feedback records from archived messages ─────────

/**
 * Extract a rating (1-5) from a decrypted message content JSON string.
 * The bot may have sent a non-ephemeral feedback confirmation embed with
 * a star rating in the description or a field value (e.g. "⭐⭐⭐ (3/5)").
 * @param {string|null} decryptedContent
 * @returns {number|null}
 */
function extractRatingFromMessage(decryptedContent) {
	if (!decryptedContent) return null;
	let parsed;
	try {
		parsed = JSON.parse(decryptedContent);
	} catch {
		// may be a plain string if it was stored unencrypted / old format
		parsed = { content: decryptedContent };
	}

	const textParts = [
		parsed.content,
		...(parsed.embeds?.flatMap(e => [
			e.description,
			e.title,
			e.footer?.text,
			...(e.fields?.flatMap(f => [f.name, f.value]) ?? []),
		]) ?? []),
	].filter(Boolean);

	const combined = textParts.join(' ');

	// Strategy 1: explicit "X/5" pattern (most reliable)
	const slashMatch = combined.match(/\b([1-5])\s*\/\s*5\b/);
	if (slashMatch) return parseInt(slashMatch[1]);

	// Strategy 2: count ⭐ star emojis (must be 1–5 and accompanied by feedback-related text)
	const starCount = (combined.match(/⭐/g) || []).length;
	if (starCount >= 1 && starCount <= 5) {
		// Only trust this if the message looks like a feedback embed
		const looksLikeFeedback = /feedback|rating|stars?|review/i.test(combined);
		if (looksLikeFeedback) return starCount;
	}

	return null;
}

if (!ONLY_TRANSCRIPTS && !SKIP_FEEDBACK) {
	header('Step 3 — Backfill Feedback records from archived messages');

	const feedbackWhere = {
		feedback: null,
		open: false,
		...(GUILD_ID ? { guildId: GUILD_ID } : {}),
	};

	const totalNeedFeedback = await prisma.ticket.count({
		where: {
			...feedbackWhere,
			archivedMessages: { some: {} },
		},
	});

	if (totalNeedFeedback === 0) {
		ok('No closed tickets with missing Feedback records — nothing to do.');
	} else {
		info(`Found ${totalNeedFeedback} closed ticket${totalNeedFeedback === 1 ? '' : 's'} with no Feedback record — scanning archived messages…`);
		if (DRY_RUN) {
			warn(`DRY RUN — would scan and backfill up to ${totalNeedFeedback} Feedback records.`);
		} else {
			const BATCH_SIZE = 50;
			let offset = 0;
			let created = 0;
			let skipped = 0;
			let errors = 0;

			while (offset < totalNeedFeedback) {
				const batch = await prisma.ticket.findMany({
					include: {
						archivedMessages: {
							orderBy: { createdAt: 'asc' },
							select: { authorId: true, content: true, id: true },
						},
						archivedUsers: {
							select: { bot: true, userId: true },
						},
					},
					skip: offset,
					take: BATCH_SIZE,
					where: {
						...feedbackWhere,
						archivedMessages: { some: {} },
					},
				});

				if (batch.length === 0) break;

				for (const ticket of batch) {
					try {
						// Build a set of bot author IDs for this ticket
						const botUserIds = new Set(
							ticket.archivedUsers.filter(u => u.bot).map(u => u.userId),
						);

						let foundRating = null;
						let foundUserId = null;

						// Prefer bot messages — they carry feedback-confirmation embeds
						for (const msg of ticket.archivedMessages) {
							if (!botUserIds.has(msg.authorId)) continue;
							const decrypted = decryptField(msg.content);
							const rating = extractRatingFromMessage(decrypted);
							if (rating !== null) {
								foundRating = rating;
								break;
							}
						}

						// Fallback: non-bot messages (e.g. user typed "3/5" or "⭐⭐⭐")
						if (foundRating === null) {
							for (const msg of ticket.archivedMessages) {
								if (botUserIds.has(msg.authorId)) continue;
								const decrypted = decryptField(msg.content);
								const rating = extractRatingFromMessage(decrypted);
								if (rating !== null) {
									foundRating = rating;
									foundUserId = msg.authorId;
									break;
								}
							}
						}

						if (foundRating === null) {
							skipped++;
							continue;
						}

						await prisma.feedback.create({
							data: {
								guild: { connect: { id: ticket.guildId } },
								rating: foundRating,
								ticket: { connect: { id: ticket.id } },
								...(foundUserId
									? { user: { connect: { id: foundUserId } } }
									: ticket.createdById
										? { user: { connect: { id: ticket.createdById } } }
										: {}),
							},
						});
						created++;
					} catch (err) {
						errors++;
						fail(`Ticket ${ticket.id}: ${err.message}`);
					}
				}

				offset += batch.length;
				progress(Math.min(offset, totalNeedFeedback), totalNeedFeedback, 'tickets');
			}

			ok(`Created ${created} Feedback record${created === 1 ? '' : 's'}.`);
			if (skipped > 0) info(`${skipped} ticket${skipped === 1 ? '' : 's'} had no detectable rating in archived messages.`);
			if (errors > 0) warn(`${errors} ticket${errors === 1 ? '' : 's'} failed — see errors above.`);
		}
	}
} else {
	info('Skipping Step 3 (--only-transcripts / --skip-feedback).');
}

// ─── Done ─────────────────────────────────────────────────────────────────────
header('Migration complete.');
if (DRY_RUN) warn('This was a dry run — no changes were written.');

await prisma.$disconnect();
process.exit(0);
