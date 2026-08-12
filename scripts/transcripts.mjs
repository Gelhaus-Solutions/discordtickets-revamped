/**
 * Transcript storage maintenance: move transcripts between drivers, tidy up
 * rows that predate the current reference format, and delete objects belonging
 * to tickets that no longer exist.
 *
 * Deliberately a script rather than a Prisma migration. `prestart` runs
 * `migrate deploy` unattended on every boot, and an unbounded UPDATE over
 * `tickets` at that moment is a bad thing to discover during an outage. Nothing
 * in the application requires this to have been run: old reference formats are
 * understood forever, and a transcript that cannot be found is regenerated.
 */
import paths from './lib/paths.js';
import { program } from 'commander';
import ora from 'ora';
import { PrismaClient } from '@prisma/client';

paths.loadEnv();

const { loadConfig } = await import('../src/lib/config.js').then(m => m.default ?? m);
const {
	createStorage, formatRef, keyFor, parseRef, ticketIdFromKey,
} = await import('../src/lib/storage/index.js').then(m => m.default ?? m);

program
	.option('-y, --yes', 'actually make changes (otherwise this is a dry run)')
	.option('--to <driver>', 'move transcripts to this driver (local or s3)')
	.option('--delete-source', 'after moving, delete the object from the old driver')
	.option('--prune-missing', 'clear the reference when the object has gone, so it regenerates')
	.option('--gc', 'delete stored objects that no ticket refers to')
	.option('--batch <number>', 'rows per page', 200);

program.parse();

const options = program.opts();
const commit = Boolean(options.yes);
const batchSize = Math.max(1, Number(options.batch) || 200);

if (options.to && !['local', 's3'].includes(options.to)) {
	console.error(`--to must be "local" or "s3", not ${JSON.stringify(options.to)}`);
	process.exit(1);
}

const prisma = new PrismaClient();
const storage = createStorage({ config: loadConfig() });
const target = options.to ?? storage.name;

if (!commit) console.log('Dry run. Nothing will be changed — add -y to commit.\n');

/**
 * Every ticket with something in `htmlTranscript`, a page at a time.
 *
 * Cursor-paginated rather than offset-paginated because the script rewrites the
 * rows it walks, and an offset would skip rows as the result set shifts.
 */
async function* rows() {
	let cursor;
	for (;;) {
		const page = await prisma.ticket.findMany({
			cursor,
			orderBy: { id: 'asc' },
			select: {
				htmlTranscript: true,
				id: true,
			},
			skip: cursor ? 1 : 0,
			take: batchSize,
			where: { htmlTranscript: { not: null } },
		});
		if (page.length === 0) return;
		for (const row of page) yield row;
		cursor = { id: page[page.length - 1].id };
	}
}

const stats = {
	converted: 0,
	failed: 0,
	missing: 0,
	moved: 0,
	normalised: 0,
	pruned: 0,
	skipped: 0,
	unreadable: 0,
};

if (!options.gc) {
	const spinner = ora('Reading tickets').start();
	let seen = 0;

	for await (const row of rows()) {
		seen++;
		spinner.text = `Checked ${seen} transcripts`;
		const ref = parseRef(row.htmlTranscript);

		try {
			// A row still holding the HTML itself, from before transcripts moved
			// out of the database.
			if (ref?.kind === 'inline') {
				const key = keyFor(row.id);
				if (commit) {
					await storage.for(target).put(key, ref.html);
					await prisma.ticket.update({
						data: { htmlTranscript: formatRef(target, key) },
						where: { id: row.id },
					});
				}
				stats.converted++;
				continue;
			}

			// Not a reference we recognise, and not markup either. Nothing can be
			// done with it but drop it, and only when asked.
			if (!ref) {
				if (options.pruneMissing) {
					if (commit) {
						await prisma.ticket.update({
							data: { htmlTranscript: null },
							where: { id: row.id },
						});
					}
					stats.pruned++;
				} else {
					stats.unreadable++;
				}
				continue;
			}

			if (ref.driver === target) {
				// Already on the right driver. Two things are still worth doing:
				// confirming the object is there, and rewriting the reference if it
				// is in the older unqualified format.
				const stat = await storage.for(ref.driver).stat(ref.key);

				if (!stat) {
					if (options.pruneMissing) {
						if (commit) {
							await prisma.ticket.update({
								data: { htmlTranscript: null },
								where: { id: row.id },
							});
						}
						stats.pruned++;
					} else {
						stats.missing++;
					}
					continue;
				}

				const canonical = formatRef(ref.driver, ref.key);
				if (row.htmlTranscript !== canonical) {
					if (commit) {
						await prisma.ticket.update({
							data: { htmlTranscript: canonical },
							where: { id: row.id },
						});
					}
					stats.normalised++;
				} else {
					stats.skipped++;
				}
				continue;
			}

			// A different driver: copy, verify, then repoint. In that order, so an
			// interruption leaves an orphaned object rather than a reference to
			// bytes that were never written.
			const source = storage.for(ref.driver);
			const body = await source.get(ref.key);
			const key = keyFor(row.id);
			if (commit) {
				await storage.for(target).put(key, body);
				const written = await storage.for(target).stat(key);
				if (!written) throw new Error('the object was not there after writing it');
				await prisma.ticket.update({
					data: { htmlTranscript: formatRef(target, key) },
					where: { id: row.id },
				});
				if (options.deleteSource) await source.delete(ref.key);
			}
			stats.moved++;
		} catch (error) {
			if (error.code === 'NOT_FOUND' && options.pruneMissing) {
				if (commit) {
					await prisma.ticket.update({
						data: { htmlTranscript: null },
						where: { id: row.id },
					});
				}
				stats.pruned++;
				continue;
			}
			stats.failed++;
			spinner.warn(`${row.id}: ${error.message}`);
			spinner.start();
		}
	}

	spinner.succeed(`Checked ${seen} transcripts`);
	console.log(`\n  moved      ${stats.moved}`);
	console.log(`  converted  ${stats.converted} (were still in the database)`);
	console.log(`  normalised ${stats.normalised} (older reference format)`);
	console.log(`  pruned     ${stats.pruned}`);
	console.log(`  skipped    ${stats.skipped} (already on ${target})`);
	if (stats.missing) console.log(`  missing    ${stats.missing} (the object has gone; --prune-missing clears these so they regenerate)`);
	if (stats.unreadable) console.log(`  unreadable ${stats.unreadable} (unrecognised value; --prune-missing clears these too)`);
	if (stats.failed) console.log(`  failed     ${stats.failed}`);
}

if (options.gc) {
	const spinner = ora('Listing stored transcripts').start();

	// If the database looks empty, stop. A mistyped DB_CONNECTION_URL would
	// otherwise mean "no ticket refers to any of these" and empty the bucket.
	const total = await prisma.ticket.count();
	if (total === 0) {
		spinner.fail('There are no tickets in this database at all — refusing to run in case it is the wrong one.');
		process.exit(1);
	}

	const driver = storage.for(target);
	const cutoff = Date.now() - (24 * 60 * 60 * 1000);
	let checked = 0;
	let deleted = 0;
	let kept = 0;

	for await (const key of driver.list('transcripts/')) {
		checked++;
		spinner.text = `Checked ${checked} objects`;

		// Only ever our own key shape. Anything else in the directory or bucket
		// belongs to someone else and is not ours to delete.
		const ticketId = ticketIdFromKey(key);
		if (!ticketId) {
			kept++;
			continue;
		}

		// A transcript written between the listing and this read would otherwise
		// look like an orphan.
		const stat = await driver.stat(key);
		if (stat && stat.modifiedAt.getTime() > cutoff) {
			kept++;
			continue;
		}

		// The test is whether the *ticket* exists, not whether its reference
		// happens to point here: a ticket that has been moved to another driver
		// still owns its history, and its old object is the migration's business
		// (--delete-source), not the collector's.
		const ticket = await prisma.ticket.findUnique({
			select: { id: true },
			where: { id: ticketId },
		});
		if (ticket) {
			kept++;
			continue;
		}

		if (commit) await driver.delete(key);
		deleted++;
		spinner.info(`${commit ? 'deleted' : 'would delete'} ${key}`);
		spinner.start();
	}

	spinner.succeed(`Checked ${checked} objects on ${target}`);
	console.log(`\n  ${commit ? 'deleted' : 'would delete'}  ${deleted}`);
	console.log(`  kept     ${kept}`);
}

if (!commit) console.log('\nDry run — nothing was changed. Add -y to commit.');

await prisma.$disconnect();
process.exit(0);
