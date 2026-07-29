import paths from './lib/paths.js';
import { program } from 'commander';
import ora from 'ora';
import { PrismaClient } from '@prisma/client';

paths.loadEnv();

program
	.requiredOption('-y, --yes', 'ARE YOU SURE?')
	.option('-a, --age <number>', 'delete guilds older than <a> days', 90)
	.option('-t, --ticket <number>', 'where the most recent ticket was created over <t> days ago', 365);

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
spinner = ora(`Deleting guilds inactive for more than ${options.ticket} days`).start();
const result = await prisma.guild.deleteMany({
	where: {
		createdAt: { lt: new Date(now - (day * options.age)) },
		tickets: { none: { createdAt: { gt: new Date(now - (day * options.ticket)) } } },
	},
});
spinner.succeed(`Deleted ${result.count} guilds; ${total - result.count} remaining`);

process.exit(0);
