import paths from './lib/paths.js';
import fse from 'fs-extra';
import ora from 'ora';
import { PrismaClient } from '@prisma/client';
import DTF from '@eartharoid/dtf';

paths.loadEnv();

const dtf = new DTF('en-GB');

let spinner = ora('Connecting').start();

// DATA_DIR, not the working directory: a dump taken from the wrong directory
// is one nobody finds again.
fse.ensureDirSync(paths.dataPath('user', 'dumps'));
const file_path = paths.dataPath('user', 'dumps', `${dtf.fill('YYYY-MM-DD-HH-mm-ss')}-db.json`);

// SQLite is no longer supported by this fork; the provider-specific branches
// that used to live here could not run at all (no SQLite Prisma client can be
// generated). To move a SQLite install across, run this script on the OLD
// upstream instance and restore the dump here. See MIGRATING.md.
const prisma = new PrismaClient();

spinner.succeed('Connected');

// Order matters: restore.mjs replays these as createMany in list order, so a
// model must come after anything it has a foreign key to. `panel` follows
// `guild` for that reason.
const models = [
	'user',
	'guild',
	'panel',
	'tag',
	'category',
	'question',
	'ticket',
	'feedback',
	'questionAnswer',
	'archivedChannel',
	'archivedRole',
	'archivedUser',
	'archivedMessage',
];

const dump = await Promise.all(
	models.map(async model => {
		spinner = ora(`Exporting ${model}`).start();
		const data = await prisma[model].findMany();
		spinner.succeed(`Exported ${data.length} from ${model}`);
		return [model, data];
	}),
);

spinner = ora('Writing').start();
await fse.promises.writeFile(file_path, JSON.stringify(dump));
spinner.succeed(`Written to "${file_path}"`);
process.exit(0);
