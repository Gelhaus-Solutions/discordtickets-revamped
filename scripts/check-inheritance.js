/**
 * Checks the guild-default inheritance chain in `src/lib/settings/inheritance.js`.
 *
 * The chain is built-in -> guild -> category, and the whole thing rests on one
 * distinction that is easy to write correctly and just as easy to undo: an
 * absent value inherits, but an *empty* one does not. `[]` means "ping nobody",
 * `0` means "slow mode off" and `''` means "no emoji" — all three are choices an
 * admin made, and a `||` where there should be a `??` silently replaces every
 * one of them with a server default. Most of the cases below exist to make that
 * refactor fail loudly.
 *
 * The schema assertions are the other half. A `@default` re-added to an
 * inheritable Category column makes inherit unreachable for every new category,
 * because Prisma fills the default in on create — and nothing else about the
 * system looks wrong when that happens.
 */
const assert = require('assert');
const path = require('path');
const { Prisma } = require('@prisma/client');

const root = path.join(__dirname, '..');
const I = require(path.join(root, 'src', 'lib', 'settings', 'inheritance'));
const F = require(path.join(root, 'src', 'lib', 'schemas', 'importable'));

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

const field = (model, name) => {
	const found = Prisma.dmmf.datamodel.models.find(m => m.name === model);
	assert.ok(found, `model ${model} does not exist`);
	return found.fields.find(f => f.name === name);
};

/* ────────────────────────────────── fixtures ────────────────────────────────── */

// Everything null: a category that inherits every single field.
const emptyCategory = () => {
	const category = {
		emoji: '🎫',
		id: 1,
		name: 'Support',
	};
	for (const f of I.INHERITED_FIELDS) category[f] = null;
	return category;
};

const guildWith = overrides => {
	const guild = { id: '1' };
	for (const f of I.GUILD_DEFAULT_FIELDS) guild[f] = null;
	return Object.assign(guild, overrides);
};

(() => {
	console.log('\nGuild-default inheritance\n');

	/* ───────────────────────────── the chain ───────────────────────────── */

	t('a category value wins over the guild value and the built-in', () => {
		const resolved = I.resolveCategory(
			{
				...emptyCategory(),
				memberLimit: 7,
			},
			guildWith({ memberLimit: 3 }),
		);
		assert.strictEqual(resolved.memberLimit, 7);
	});

	t('null at the category falls back to the guild', () => {
		const resolved = I.resolveCategory(emptyCategory(), guildWith({ memberLimit: 3 }));
		assert.strictEqual(resolved.memberLimit, 3);
	});

	t('null at both levels falls back to the built-in', () => {
		const resolved = I.resolveCategory(emptyCategory(), guildWith({}));
		assert.strictEqual(resolved.memberLimit, 1);
		assert.strictEqual(resolved.totalLimit, 50);
		assert.strictEqual(resolved.channelName, 'ticket-{num}');
	});

	t('a missing guild row still resolves to the built-ins', () => {
		const resolved = I.resolveCategory(emptyCategory(), undefined);
		assert.strictEqual(resolved.channelName, 'ticket-{num}');
		assert.deepStrictEqual(resolved.staffRoles, []);
	});

	t('the guild embedded by getCategory is used when none is passed', () => {
		const category = {
			...emptyCategory(),
			guild: guildWith({ totalLimit: 9 }),
		};
		assert.strictEqual(I.resolveCategory(category).totalLimit, 9);
	});

	/* ──────────────── empty values are overrides, not absences ──────────────── */

	t('an empty array at the category stops the chain for every role field', () => {
		// `merge` fields (priorityEmojis) are JSON but combine rather than replace,
		// and are covered on their own below.
		const roleFields = I.INHERITED_FIELDS.filter(f => I.INHERITED[f].json && !I.INHERITED[f].merge);
		assert.ok(roleFields.length >= 4, 'expected at least four role fields');
		for (const f of roleFields) {
			const resolved = I.resolveCategory(
				{
					...emptyCategory(),
					[f]: [],
				},
				guildWith({ [I.INHERITED[f].guild]: ['123'] }),
			);
			// This is the "replace, category wins" decision. A union here would
			// mean a category could never opt out of a server-wide role.
			assert.deepStrictEqual(resolved[f], [], `${f} inherited instead of overriding`);
		}
	});

	t('zero is an override, not an inherit', () => {
		for (const f of ['cooldown', 'memberLimit', 'ratelimit', 'totalLimit']) {
			const resolved = I.resolveCategory(
				{
					...emptyCategory(),
					[f]: 0,
				},
				guildWith({ [I.INHERITED[f].guild]: 900 }),
			);
			assert.strictEqual(resolved[f], 0, `${f} inherited instead of overriding`);
		}
	});

	t('an empty string is an override, not an inherit', () => {
		const resolved = I.resolveCategory(
			{
				...emptyCategory(),
				channelName: '',
			},
			guildWith({ channelName: 'from-the-server' }),
		);
		assert.strictEqual(resolved.channelName, '');
	});

	t('false is an override, not an inherit', () => {
		// `skipCloseRequest` is the first inheritable *boolean*, and it is the
		// shape most likely to be "simplified" into a NOT NULL column later: a
		// server that closes without asking, and one category that still wants the
		// member asked, is the whole reason there are three states.
		const resolved = I.resolveCategory(
			{
				...emptyCategory(),
				skipCloseRequest: false,
			},
			guildWith({ skipCloseRequest: true }),
		);
		assert.strictEqual(resolved.skipCloseRequest, false);
	});

	t('a boolean inherits and defaults like everything else', () => {
		assert.strictEqual(
			I.resolveCategory(emptyCategory(), guildWith({ skipCloseRequest: true })).skipCloseRequest,
			true,
			'null at the category should take the server\'s answer',
		);
		assert.strictEqual(
			I.resolveCategory(emptyCategory(), guildWith({})).skipCloseRequest,
			false,
			'unset everywhere is the close request every server has today',
		);
	});

	t('a guild value of zero stops the chain at the guild', () => {
		const resolved = I.resolveCategory(emptyCategory(), guildWith({ memberLimit: 0 }));
		assert.strictEqual(resolved.memberLimit, 0);
	});

	/* ─────────────────────── priority emojis merge per key ─────────────────────── */

	t('priority emojis fall back to the built-ins when nothing is set', () => {
		const r = I.resolveCategory(emptyCategory(), guildWith({}));
		assert.deepStrictEqual(r.priorityEmojis, I.PRIORITY_EMOJI_DEFAULTS);
	});

	t('NONE has no emoji by default', () => {
		// A ticket with no priority has never carried one, and giving NONE a
		// default would mark every ticket in every guild on upgrade.
		assert.strictEqual(I.PRIORITY_EMOJI_DEFAULTS.NONE, '');
	});

	t('a category overriding one priority still inherits the others', () => {
		const r = I.resolveCategory(
			{
				...emptyCategory(),
				priorityEmojis: { HIGH: '🚨' },
			},
			guildWith({ priorityEmojis: { MEDIUM: '🟡' } }),
		);
		assert.strictEqual(r.priorityEmojis.HIGH, '🚨', 'category key should win');
		assert.strictEqual(r.priorityEmojis.MEDIUM, '🟡', 'guild key should survive');
		assert.strictEqual(r.priorityEmojis.LOW, I.PRIORITY_EMOJI_DEFAULTS.LOW, 'built-in should survive');
	});

	t('an empty string turns one priority emoji off without inheriting it', () => {
		const r = I.resolveCategory(
			{
				...emptyCategory(),
				priorityEmojis: { HIGH: '' },
			},
			guildWith({ priorityEmojis: { HIGH: '🚨' } }),
		);
		assert.strictEqual(r.priorityEmojis.HIGH, '');
	});

	t('a junk priority map degrades to the level above rather than throwing', () => {
		for (const junk of ['nonsense', 42, ['🔴'], { HIGH: 5 }]) {
			const r = I.resolveCategory(
				{
					...emptyCategory(),
					priorityEmojis: junk,
				},
				guildWith({}),
			);
			assert.deepStrictEqual(r.priorityEmojis, I.PRIORITY_EMOJI_DEFAULTS, `junk: ${JSON.stringify(junk)}`);
		}
	});

	t('the merged map always has all four keys', () => {
		const r = I.resolveCategory(emptyCategory(), guildWith({ priorityEmojis: { HIGH: '🚨' } }));
		assert.deepStrictEqual(Object.keys(r.priorityEmojis).sort(), ['HIGH', 'LOW', 'MEDIUM', 'NONE']);
	});

	t('merging never returns the shared defaults object', () => {
		const r = I.resolveCategory(emptyCategory(), guildWith({}));
		r.priorityEmojis.HIGH = 'polluted';
		assert.strictEqual(I.PRIORITY_EMOJI_DEFAULTS.HIGH, '🔴');
	});

	/* ───────────────────────────── purity ───────────────────────────── */

	t('resolveCategory does not mutate its input', () => {
		const category = emptyCategory();
		const before = JSON.stringify(category);
		I.resolveCategory(category, guildWith({ memberLimit: 3 }));
		assert.strictEqual(JSON.stringify(category), before);
	});

	t('non-inheritable keys pass through untouched', () => {
		const resolved = I.resolveCategory(
			{
				...emptyCategory(),
				emoji: '🎫',
				name: 'Support',
			},
			guildWith({}),
		);
		assert.strictEqual(resolved.name, 'Support');
		assert.strictEqual(resolved.emoji, '🎫');
		assert.strictEqual(resolved.id, 1);
	});

	t('a null category resolves to itself rather than throwing', () => {
		assert.strictEqual(I.resolveCategory(null), null);
		assert.strictEqual(I.resolveCategory(undefined), undefined);
	});

	t('each resolve gets its own array, so a caller cannot poison the default', () => {
		const a = I.resolveCategory(emptyCategory(), guildWith({}));
		a.staffRoles.push('polluted');
		const b = I.resolveCategory(emptyCategory(), guildWith({}));
		assert.deepStrictEqual(b.staffRoles, []);
	});

	t('guildDefaults is keyed by category column name', () => {
		const defaults = I.guildDefaults(guildWith({ memberLimit: 3 }));
		assert.deepStrictEqual(Object.keys(defaults).sort(), [...I.INHERITED_FIELDS].sort());
		assert.strictEqual(defaults.memberLimit, 3);
	});

	t('categoryOverrides marks exactly the fields that are set', () => {
		const overrides = I.categoryOverrides({
			...emptyCategory(),
			pingRoles: [],
			totalLimit: 5,
		});
		assert.strictEqual(overrides.totalLimit, true);
		// `[]` is an override even though it is empty — same rule as above.
		assert.strictEqual(overrides.pingRoles, true);
		assert.strictEqual(overrides.memberLimit, false);
		assert.strictEqual(overrides.staffRoles, false);
	});

	/* ───────────────────────────── dbNulls ───────────────────────────── */

	t('dbNulls maps null to DbNull for the listed columns only', () => {
		const out = I.dbNulls({
			channelName: null,
			staffRoles: null,
		}, I.CATEGORY_JSON_NULLABLE);
		assert.strictEqual(out.staffRoles, Prisma.DbNull);
		// channelName is a nullable *string*, where a bare null is already correct.
		assert.strictEqual(out.channelName, null);
	});

	t('dbNulls leaves real values, empty arrays and absent keys alone', () => {
		const out = I.dbNulls({
			pingRoles: [],
			staffRoles: ['123'],
		}, I.CATEGORY_JSON_NULLABLE);
		assert.deepStrictEqual(out.pingRoles, []);
		assert.deepStrictEqual(out.staffRoles, ['123']);
		assert.ok(!('requiredRoles' in out), 'an absent key must stay absent, not become DbNull');
	});

	t('dbNulls does not mutate its input', () => {
		const data = { staffRoles: null };
		I.dbNulls(data, I.CATEGORY_JSON_NULLABLE);
		assert.strictEqual(data.staffRoles, null);
	});

	t('messageLayout is covered even though it does not inherit', () => {
		assert.ok(I.CATEGORY_JSON_NULLABLE.includes('messageLayout'));
	});

	/* ───────────────────────────── the schema ───────────────────────────── */

	t('every inheritable Category column is nullable with no default', () => {
		for (const f of I.INHERITED_FIELDS) {
			const column = field('Category', f);
			assert.ok(column, `Category.${f} does not exist`);
			assert.ok(!column.isRequired, `Category.${f} is NOT NULL, so it can never mean "inherit"`);
			// A default is filled in by Prisma on every create, so a new category
			// would always override. Nothing else looks wrong when this happens.
			assert.ok(!column.hasDefaultValue, `Category.${f} has a @default, so new categories can never inherit`);
		}
	});

	t('every guild-default column is nullable with no default', () => {
		for (const f of I.INHERITED_FIELDS) {
			const column = field('Guild', I.INHERITED[f].guild);
			assert.ok(column, `Guild.${I.INHERITED[f].guild} does not exist`);
			assert.ok(!column.isRequired, `Guild.${I.INHERITED[f].guild} is NOT NULL`);
			assert.ok(!column.hasDefaultValue, `Guild.${I.INHERITED[f].guild} has a @default`);
		}
	});

	t('the json flag matches the actual column type on both models', () => {
		for (const f of I.INHERITED_FIELDS) {
			const expected = Boolean(I.INHERITED[f].json);
			assert.strictEqual(field('Category', f).type === 'Json', expected, `Category.${f}`);
			assert.strictEqual(field('Guild', I.INHERITED[f].guild).type === 'Json', expected, `Guild.${I.INHERITED[f].guild}`);
		}
	});

	t('every built-in is a function, so array defaults cannot be shared', () => {
		for (const f of I.INHERITED_FIELDS) {
			assert.strictEqual(typeof I.INHERITED[f].builtin, 'function', `${f}.builtin must be a factory`);
		}
	});

	/* ─────────────────────── the export path ─────────────────────── */

	t('every inheritable field is exportable on both models', () => {
		for (const f of I.INHERITED_FIELDS) {
			assert.ok(F.CATEGORY_FIELDS.includes(f), `${f} missing from CATEGORY_FIELDS`);
			assert.ok(
				F.GUILD_SETTINGS_FIELDS.includes(I.INHERITED[f].guild),
				`${I.INHERITED[f].guild} missing from GUILD_SETTINGS_FIELDS`,
			);
		}
	});

	console.log(`\n${pass} passed\n`);
})();
