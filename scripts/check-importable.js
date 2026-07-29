/**
 * Checks the guild-import allow-lists in `src/lib/schemas/importable.js`.
 *
 * The importer rebuilds every Prisma payload from an explicit column list
 * instead of spreading the uploaded archive, because Prisma's create inputs
 * accept nested relation operations — `tickets: { connect: [...] }` in a
 * `settings.json` was enough to move another guild's tickets into the
 * importing guild and read them decrypted.
 *
 * Two things have to stay true, and both break silently:
 *
 *   - every scalar column an export can contain is allowed or explicitly
 *     ignored, or a legitimate round-trip fails with "unexpected field";
 *   - relation keys are still rejected.
 *
 * The column lists come from the generated Prisma client, so adding a column
 * to the schema without updating the allow-list fails here rather than in
 * production.
 */
const assert = require('assert');
const path = require('path');
const { Prisma } = require('@prisma/client');
const F = require(path.join(__dirname, '..', 'src', 'lib', 'schemas', 'importable'));

let pass = 0;
const t = (name, fn) => {
	try {
		fn();
		pass++;
		console.log('  ok  ', name);
	} catch (e) {
		console.log('  FAIL', name, '\n       ', e.message);
		process.exitCode = 1;
	}
};

const scalars = model => {
	const found = Prisma.dmmf.datamodel.models.find(m => m.name === model);
	assert.ok(found, `model ${model} does not exist`);
	return found.fields.filter(f => f.kind !== 'object').map(f => f.name);
};

// [model, allow-list, keys the importer handles itself]
const MODELS = [
	['Guild', F.GUILD_FIELDS, ['categories', 'createdAt', 'id', 'tags']],
	['Category', F.CATEGORY_FIELDS, ['backupCategoryId', 'createdAt', 'guildId', 'id', 'questions']],
	['Question', F.QUESTION_FIELDS, ['categoryId', 'createdAt']],
	['Tag', F.TAG_FIELDS, ['createdAt', 'guildId', 'id']],
	['Ticket', F.TICKET_FIELDS, [
		'archivedChannels',
		'archivedMessages',
		'archivedRoles',
		'archivedUsers',
		'categoryId',
		'feedback',
		'guildId',
		'htmlTranscript',
		'questionAnswers',
	]],
	['ArchivedChannel', F.ARCHIVED_CHANNEL_FIELDS, ['ticketId']],
	['ArchivedMessage', F.ARCHIVED_MESSAGE_FIELDS, []],
	['ArchivedRole', F.ARCHIVED_ROLE_FIELDS, ['ticketId']],
	['ArchivedUser', F.ARCHIVED_USER_FIELDS, ['ticketId']],
	['Feedback', F.FEEDBACK_FIELDS, ['guildId', 'ticketId']],
	['QuestionAnswer', F.QUESTION_ANSWER_FIELDS, ['id', 'ticketId']],
];

const GUILD_IGNORE = MODELS[0][2];

(() => {
	console.log('\nImport allow-lists\n');

	for (const [model, allowed, ignored] of MODELS) {
		t(`${model} covers every scalar column`, () => {
			const covered = new Set([...allowed, ...ignored]);
			const missing = scalars(model).filter(f => !covered.has(f));
			assert.deepStrictEqual(missing, [], `not allowed or ignored: ${missing.join(', ')}`);
		});
		t(`${model} allow-list has no phantom columns`, () => {
			const columns = new Set(scalars(model));
			const bogus = allowed.filter(f => !columns.has(f));
			assert.deepStrictEqual(bogus, [], `not columns of ${model}: ${bogus.join(', ')}`);
		});
	}

	t('the settings route and the importer share one guild field list', () => {
		for (const field of F.GUILD_SETTINGS_FIELDS) assert.ok(F.GUILD_FIELDS.includes(field), `${field} missing from GUILD_FIELDS`);
	});

	t('a guild relation payload is rejected', () => {
		for (const relation of ['automations', 'feedback', 'panels', 'tickets']) {
			assert.throws(
				() => F.pick({
					[relation]: {
						connect: [{
							guildId_number: {
								guildId: '1',
								number: 1,
							},
						}],
					},
					locale: 'en-GB',
				}, F.GUILD_FIELDS, 'guild setting', GUILD_IGNORE),
				new RegExp(`unexpected guild setting field "${relation}"`),
			);
		}
	});

	t('htmlTranscript never survives an import', () => {
		const picked = F.pick({
			htmlTranscript: '../../../../etc/passwd',
			id: '1234567890',
		}, F.TICKET_FIELDS, 'ticket', ['htmlTranscript']);
		assert.strictEqual(picked.htmlTranscript, undefined);
		assert.strictEqual(picked.id, '1234567890');
	});

	t('question ids are preserved so answers stay linked', () => {
		assert.ok(F.QUESTION_FIELDS.includes('id'));
	});

	t('a non-object is rejected', () => {
		assert.throws(() => F.pick(null, F.TAG_FIELDS, 'tag'), /invalid tag/);
		assert.throws(() => F.pick([], F.TAG_FIELDS, 'tag'), /invalid tag/);
	});

	console.log(`\n${pass} checks passed${process.exitCode ? ' (with failures above)' : ''}\n`);
})();
