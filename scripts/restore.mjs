import paths from './lib/paths.js';
import { program } from 'commander';
import fse from 'fs-extra';
import ora from 'ora';
import { PrismaClient } from '@prisma/client';
import inheritance from '../src/lib/settings/inheritance.js';

const {
	CATEGORY_JSON_NULLABLE, GUILD_JSON_NULLABLE, dbNulls,
} = inheritance;

paths.loadEnv();

program
	.requiredOption('-f, --file <path>', 'the path of the dump to import')
	.requiredOption('-y, --yes', 'yes, DELETE EVERYTHING in the database');

program.parse();

const options = program.opts();

let spinner = ora('Connecting').start();

// SQLite is no longer supported by this fork; the provider-specific branches
// that used to live here could not run at all (no SQLite Prisma client can be
// generated). Dumps from a SQLite install are still restorable — take them on
// the old instance and restore here. See MIGRATING.md.
const prisma = new PrismaClient();

spinner.succeed('Connected');

spinner = ora(`Reading ${options.file}`).start();
const dump = JSON.parse(await fse.promises.readFile(options.file, 'utf8'));
spinner.succeed(`Parsed ${options.file}`);

// `categories.backupCategoryId` is a self-reference added by this fork. A
// multi-row insert where one category points at another that hasn't been
// inserted yet violates the constraint on MySQL (InnoDB checks foreign keys
// per row), so the links are stripped here and reapplied afterwards.
const backupLinks = [];

// ! this order is important
const queries = [
	prisma.guild.deleteMany(),
	prisma.user.deleteMany(),
];

// A dump taken after guild-level category defaults exist carries `null` for
// every setting the guild or category inherits. Written back as a bare `null`,
// a nullable Json column stores the JSON `null` literal instead of SQL NULL —
// which reads back identically through Prisma and so looks fine, while leaving
// the database holding two different values for "inherit".
for (const [model, data] of dump) {
	if (model === 'category') {
		const rows = data.map(category => {
			if (category.backupCategoryId !== null && category.backupCategoryId !== undefined) {
				backupLinks.push({
					backupCategoryId: category.backupCategoryId,
					id: category.id,
				});
			}
			return dbNulls({
				...category,
				backupCategoryId: null,
			}, CATEGORY_JSON_NULLABLE);
		});
		queries.push(prisma.category.createMany({ data: rows }));
	} else if (model === 'guild') {
		queries.push(prisma.guild.createMany({ data: data.map(guild => dbNulls(guild, GUILD_JSON_NULLABLE)) }));
	} else {
		queries.push(prisma[model].createMany({ data }));
	}
}

spinner = ora('Importing').start();
const [,, ...results] = await prisma.$transaction(queries);
for (const idx in results) spinner.succeed(`Imported ${results[idx].count} into ${dump[idx][0]}`);

if (backupLinks.length) {
	spinner = ora('Relinking backup categories').start();
	await prisma.$transaction(
		backupLinks.map(({
			id, backupCategoryId,
		}) =>
			prisma.category.update({
				data: { backupCategoryId },
				where: { id },
			}),
		),
	);
	spinner.succeed(`Relinked ${backupLinks.length} backup categories`);
}

process.exit(0);
