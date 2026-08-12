import paths from './lib/paths.js';
import { program } from 'commander';
import ora from 'ora';
import { PrismaClient } from '@prisma/client';

paths.loadEnv();

const { loadConfig } = await import('../src/lib/config.js').then(m => m.default ?? m);
const {
	createStorage, parseRef,
} = await import('../src/lib/storage/index.js').then(m => m.default ?? m);

program
	.requiredOption('-y, --yes', 'ARE YOU SURE?')
	.option('-a, --age <number>', 'delete guilds older than <a> days', 90)
	.option('-t, --ticket <number>', 'where the most recent ticket was created over <t> days ago', 365)
	.option('--keep-files', 'leave the stored transcripts of deleted guilds on disk');

program.parse();

const options = program.opts();

let spinner = ora('Connecting').start();

// SQLite is no longer supported by this fork; the provider-specific branches
// that used to live here could not run at all (no SQLite Prisma client can be
// generated, and the middleware they imported has been removed). See
// MIGRATING.md for moving a SQLite install to PostgreSQL or MySQL.
const prisma = new PrismaClient();

spinner.succeed('Connected');

const now = Date.now();
const day = 1000 * 60 * 60 * 24;

spinner = ora('Counting total guilds').start();
const total = await prisma.guild.count();
spinner.succeed(`Found ${total} total guilds`);

// ! the bot might still be in these guilds
const where = {
	createdAt: { lt: new Date(now - (day * options.age)) },
	tickets: { none: { createdAt: { gt: new Date(now - (day * options.ticket)) } } },
};

// Collected first: transcripts live outside the database, so a cascade takes
// the references with it and leaves the files behind with nothing pointing at
// them. (`node scripts/transcripts.mjs --gc` also cleans these up later.)
const doomed = options.keepFiles ? [] : await prisma.ticket.findMany({
	select: {
		htmlTranscript: true,
		id: true,
	},
	where: {
		guild: where,
		htmlTranscript: { not: null },
	},
});

spinner = ora(`Deleting guilds inactive for more than ${options.ticket} days`).start();
const result = await prisma.guild.deleteMany({ where });
spinner.succeed(`Deleted ${result.count} guilds; ${total - result.count} remaining`);

if (doomed.length > 0) {
	spinner = ora(`Deleting ${doomed.length} stored transcripts`).start();
	const storage = createStorage({ config: loadConfig() });
	let deleted = 0;
	for (const ticket of doomed) {
		const ref = parseRef(ticket.htmlTranscript);
		if (ref?.kind !== 'object') continue;
		try {
			if (await storage.for(ref.driver).delete(ref.key)) deleted++;
		} catch (error) {
			spinner.warn(`Could not delete the transcript for ${ticket.id}: ${error.message}`);
			spinner.start();
		}
	}
	spinner.succeed(`Deleted ${deleted} stored transcripts`);
}

process.exit(0);
