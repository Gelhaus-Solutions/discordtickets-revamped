/**
 * Checks the placeholder table: that deriving the substitution regex from it
 * did not change what `substitute` does, and that every context it advertises
 * is actually supplied with the values it promises.
 *
 * The important test here is the **oracle**. `src/lib/placeholders.js` replaced
 * a hand-written regex whose alternation order was correct only by eye, and
 * "sorting longest-first is safer" is an assertion until something compares the
 * two. So the pre-refactor regex and switch statement are embedded below,
 * verbatim, and the new implementation has to agree with them character for
 * character over a fixed corpus. Do not delete them: they are the only record of
 * what shipped.
 *
 * Everything runs with no database and no Discord connection.
 */

const assert = require('assert');
const path = require('path');

const root = path.join(__dirname, '..');
const placeholders = require(path.join(root, 'src', 'lib', 'placeholders'));
const v2 = require(path.join(root, 'src', 'lib', 'components-v2'));
const { renderChannelName } = require(path.join(root, 'src', 'lib', 'tickets', 'naming'));
const { panelVars } = require(path.join(root, 'src', 'lib', 'panels'));
const { tagVars } = require(path.join(root, 'src', 'lib', 'tags'));

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

/* ─────────────────────────────── the oracle ──────────────────────────────── */

/** The regex exactly as it was written in `components-v2.js` before the table. */
const ORACLE_PATTERN = /{+\s?(username|name|nickname|displayname|openerdisplayname|openernickname|openermention|openername|opener|number|num|avatar|avgResponseTime|avgResolutionTime|avgRating|match[1-9])\s?}+/gi;

/** ...and the switch it fed. */
const oracleOne = (token, vars) => {
	switch (token.toLowerCase()) {
	case 'name':
	case 'username':
		return vars.name ?? '';
	case 'nickname':
	case 'displayname':
		return vars.displayname ?? vars.name ?? '';
	case 'opener':
	case 'openername':
		return vars.opener ?? '';
	case 'openernickname':
	case 'openerdisplayname':
		return vars.openerdisplayname ?? vars.opener ?? '';
	case 'openermention':
		return vars.openermention ?? '';
	case 'num':
	case 'number':
		return vars.num ?? '';
	case 'avatar':
		return vars.avatar ?? '';
	case 'avgresponsetime':
		return vars.avgResponseTime ?? '';
	case 'avgresolutiontime':
		return vars.avgResolutionTime ?? '';
	case 'avgrating':
		return vars.avgRating ?? '';
	default:
		return vars[token.toLowerCase()] ?? '';
	}
};

const oracle = (str, vars = {}) => {
	if (typeof str !== 'string') return str;
	return str.replace(ORACLE_PATTERN, (_, token) => String(oracleOne(token, vars)));
};

/** The stats gate, as it was written. */
const ORACLE_STATS = /{+\s?(avgResponseTime|avgResolutionTime|avgRating)\s?}+/i;

/** The lazy gate from `Context#varsFor`, as it was written. */
const ORACLE_LAZY = /{+\s?(opener\w*|num(ber)?)\s?}+/i;

/**
 * The corpus.
 *
 * Deliberately free of `{server}` and `{members}`: those are new, so the oracle
 * has nothing to say about them and they are asserted separately below.
 */
const CORPUS = [
	'',
	'no placeholders at all',
	'{name}',
	'{ name }',
	'{{name}}',
	'{{{ name }}}',
	'{NAME} {Name} {nAmE}',
	'{username} and {name} are the same person',
	'{nickname}/{displayname}',
	'{opener} {openername} {openernickname} {openerdisplayname} {openermention}',
	'#{num} / #{number}',
	'{avatar}',
	'{avgResponseTime} {avgresolutiontime} {AVGRATING}',
	'{match1}{match2}{match9}',
	'{match0} and {match10} are not placeholders',
	'{nope} {} {  } {{}}',
	'adjacent{name}{num}tokens',
	'{name} said "{name}" twice',
	'a } stray { brace {name}',
	'{name',
	'name}',
	'{opener}{opener}',
	'{displayname} with no displayname set',
	'{openerdisplayname} with no opener display name set',
	'{avgRating} on a category with no feedback',
	'trailing {name} ',
	'  {  num  }  ',
];

/** Several var shapes, because the fallbacks (`?? vars.name`) are the subtle part. */
const VAR_SETS = [
	{},
	{ name: '@bob' },
	{
		displayname: 'Bob',
		name: '@bob',
	},
	{
		name: '@bob',
		num: 42,
		opener: 'alice',
	},
	{
		avatar: 'https://example.com/a.png',
		avgRating: '4.8',
		avgResolutionTime: '2 hours',
		avgResponseTime: '5 minutes',
		displayname: 'Bob',
		match1: 'first',
		match2: 'second',
		match9: 'ninth',
		name: '@bob',
		num: 7,
		opener: 'alice',
		openerdisplayname: 'Alice',
		openermention: '<@111>',
	},
	// The value of a placeholder must never be looked at again.
	{
		match1: '{name}',
		name: '{match1}',
	},
];

t('substitute is byte-identical to the pre-table implementation', () => {
	for (const text of CORPUS) {
		for (const vars of VAR_SETS) {
			assert.strictEqual(
				placeholders.substitute(text, vars),
				oracle(text, vars),
				`differs for ${JSON.stringify(text)} with ${JSON.stringify(vars)}`,
			);
		}
	}
});

t('components-v2 still re-exports the same substitute', () => {
	// Six modules import it from there; moving the implementation must not move
	// the import site out from under them.
	assert.strictEqual(v2.substitute, placeholders.substitute);
	assert.strictEqual(v2.substitute('{name}', { name: 'x' }), 'x');
});

t('{server} and {members} are new, and only they are', () => {
	// The two tokens the table adds. Everything else in the corpus is unchanged,
	// which is what the oracle above establishes.
	assert.strictEqual(oracle('{server} has {members}', {
		members: 5,
		server: 'Guild',
	}), '{server} has {members}');
	assert.strictEqual(placeholders.substitute('{server} has {members}', {
		members: 5,
		server: 'Guild',
	}), 'Guild has 5');
});

t('needsStats matches the gate it replaced', () => {
	for (const text of [...CORPUS, '{avgResponseTime}', 'nothing']) {
		assert.strictEqual(
			placeholders.needsStats(text),
			ORACLE_STATS.test(text),
			`needsStats differs for ${JSON.stringify(text)}`,
		);
	}
	// And over a layout document, which is how the opening message asks.
	assert.strictEqual(placeholders.needsStats({ blocks: [{ content: 'avg {avgRating}' }] }), true);
	assert.strictEqual(placeholders.needsStats({ blocks: [{ content: 'plain' }] }), false);
});

t('needsLazy matches the gate it replaced', () => {
	for (const text of CORPUS) {
		assert.strictEqual(
			placeholders.needsLazy(text),
			ORACLE_LAZY.test(text),
			`needsLazy differs for ${JSON.stringify(text)}`,
		);
	}
	// The gate exists to keep a fixed string from costing a ticket lookup.
	assert.strictEqual(placeholders.needsLazy('just text'), false);
	assert.strictEqual(placeholders.needsLazy('#{num}'), true);
	assert.strictEqual(placeholders.needsLazy('{openermention}'), true);
});

/* ───────────────────────────── the derivation ────────────────────────────── */

t('the alternation is sorted longest-first', () => {
	// The property the hand-written order had only by eye: with `name` before
	// `nickname`, `{nickname}` matches `name` and strands a `nick`.
	const alternatives = placeholders.PLACEHOLDER_PATTERN.source
		.replace(/^{\+\\s\?\(/, '')
		.replace(/\)\\s\?}\+$/, '')
		.split('|');
	assert.ok(alternatives.length > 5, 'the pattern did not parse as expected');
	for (let i = 1; i < alternatives.length; i++) {
		assert.ok(
			alternatives[i - 1].length >= alternatives[i].length,
			`${alternatives[i - 1]} should not come before the longer ${alternatives[i]}`,
		);
	}
	assert.strictEqual(placeholders.substitute('{nickname}', { displayname: 'Bob' }), 'Bob');
});

t('every alias resolves to a real token', () => {
	const tokens = new Set(placeholders.PLACEHOLDERS.map(p => p.token));
	for (const [alias, token] of placeholders.CANONICAL) {
		assert.ok(tokens.has(token), `alias "${alias}" points at unknown token "${token}"`);
		assert.strictEqual(alias, alias.toLowerCase(), 'aliases are looked up lowercased');
	}
});

t('every declared context is a real context', () => {
	const known = new Set(placeholders.CONTEXTS.map(c => c.id));
	for (const placeholder of placeholders.PLACEHOLDERS) {
		const contexts = Object.keys(placeholder.contexts);
		assert.ok(contexts.length > 0, `${placeholder.token} works nowhere`);
		for (const context of contexts) {
			assert.ok(known.has(context), `${placeholder.token} claims unknown context "${context}"`);
		}
	}
});

t('the bot\'s own presence counts are not offered to server admins', () => {
	// `{openTickets}` on a presence is a global count. Matching it in a panel
	// would put every server's ticket count in somebody's public message — and
	// a panel is rendered once and never re-rendered, so it would be wrong
	// within the minute and still wrong a year later.
	for (const token of ['guilds', 'openTickets', 'totalTickets']) {
		const entry = placeholders.PLACEHOLDERS.find(p => p.token === token);
		assert.deepStrictEqual(Object.keys(entry.contexts), ['presence'], `${token} must be presence-only`);
		assert.strictEqual(
			placeholders.substitute(`{${token}}`, { [token]: 999 }),
			`{${token}}`,
			`{${token}} must not be substituted outside a presence`,
		);
	}
	// ...and they do work there.
	assert.strictEqual(
		placeholders.substituteIn('presence', '{openTickets} open in {guilds}', {
			guilds: 3,
			openTickets: 7,
		}),
		'7 open in 3',
	);
	// A presence never gets the per-person ones: there is nobody it is about.
	assert.strictEqual(placeholders.substituteIn('presence', '{name}', { name: '@bob' }), '{name}');
});

t('sampleVars covers every token a context declares', () => {
	for (const { id } of placeholders.CONTEXTS) {
		const vars = placeholders.sampleVars(id);
		for (const token of placeholders.tokensFor(id)) {
			assert.ok(token in vars, `${id} preview has no sample for {${token}}`);
			assert.notStrictEqual(vars[token], '', `${id} preview sample for {${token}} is empty`);
		}
	}
	// The `match` family is one entry but nine tokens; a preview that expanded
	// {match1} and left {match2} would look like a bug in the bot.
	const automation = placeholders.sampleVars('automation');
	for (let i = 1; i <= 9; i++) assert.ok(automation[`match${i}`], `no sample for {match${i}}`);
});

t('the catalogue serialises without functions', () => {
	const catalogue = placeholders.placeholderCatalogue();
	// It is sent over HTTP; a `resolve` leaking in would silently vanish and the
	// dashboard would show a placeholder the server does not have.
	assert.deepStrictEqual(JSON.parse(JSON.stringify(catalogue)), catalogue);
	assert.strictEqual(catalogue.placeholders.length, placeholders.PLACEHOLDERS.length);
	assert.ok(catalogue.contexts.every(c => c.id && c.label && c.description));
});

/* ────────────────────── declared here, supplied over there ───────────────── */

// The bug class that produced "availability is declared nowhere": a context
// advertises a placeholder and the code path that renders it never puts a value
// in `vars`, so it silently becomes an empty string in somebody's server.

/** Every token a context declares that is not resolved lazily or from stats. */
const eagerTokens = context =>
	placeholders.forContext(context)
		.filter(p => !p.lazy && !p.stats)
		.map(p => p.token);

t('a panel supplies every variable it advertises', () => {
	const vars = panelVars({
		memberCount: 1234,
		name: 'Test Server',
	}, { stats: null });
	for (const token of eagerTokens('panel')) {
		assert.ok(token in vars, `a panel advertises {${token}} but never supplies it`);
	}
	assert.strictEqual(vars.server, 'Test Server');
	assert.strictEqual(vars.members, 1234);
});

t('a tag supplies every variable it advertises', () => {
	const vars = tagVars({
		guild: {
			memberCount: 5,
			name: 'Test Server',
		},
		member: {
			displayName: 'Bob',
			id: '111',
		},
	});
	for (const token of eagerTokens('tag')) {
		assert.ok(token in vars, `a tag advertises {${token}} but never supplies it`);
	}
	assert.strictEqual(vars.name, '<@111>');
	assert.strictEqual(vars.displayname, 'Bob');
});

t('a channel name substitutes every variable it advertises', () => {
	// `renderChannelName` has its own three replacements rather than going
	// through `substitute` — a channel name cannot hold a mention, so `{name}`
	// means something different there. This is what stops the table promising
	// something that file does not do.
	const creator = {
		displayName: 'Bobby',
		user: { username: 'bob' },
	};
	for (const token of placeholders.tokensFor('channelName')) {
		const rendered = renderChannelName(`x-{${token}}-y`, {
			creator,
			number: 7,
		});
		assert.ok(
			!rendered.includes('{'),
			`a channel name advertises {${token}} but renderChannelName leaves it alone`,
		);
	}
	// The documented extras, which exist only here.
	assert.strictEqual(renderChannelName('{nick}', {
		creator,
		number: 1,
	}), 'Bobby');
	assert.strictEqual(renderChannelName('{display}', {
		creator,
		number: 1,
	}), 'Bobby');
});

t('the automation context supplies the server variables itself', () => {
	// Trigger-supplied vars vary by trigger, but `{server}` and `{members}` come
	// off the cached guild and must be there whatever set the run off.
	const { Context } = require(path.join(root, 'src', 'lib', 'automations', 'context'));
	const context = new Context({
		guilds: {
			cache: new Map([['1', {
				memberCount: 9,
				name: 'Test Server',
			}]]),
		},
	}, { guildId: '1' });
	const vars = context.guildVars();
	assert.strictEqual(vars.server, 'Test Server');
	assert.strictEqual(vars.members, 9);
});

t('a user id renders as digits, wherever it is written', () => {
	assert.strictEqual(
		placeholders.substitute('!unban {userid}', { userid: '319709731168223234' }),
		'!unban 319709731168223234',
	);
	// The alias, and the tolerance for `{{ x }}` that every other token has.
	assert.strictEqual(placeholders.substitute('{memberid}', { userid: '111' }), '111');
	assert.strictEqual(placeholders.substitute('{{ USERID }}', { userid: '111' }), '111');
	// Neighbours that share a prefix must not be eaten by it.
	assert.strictEqual(placeholders.substitute('{username}', {
		name: 'bob',
		userid: '111',
	}), 'bob');
	assert.strictEqual(renderChannelName('ticket-{userid}', {
		creator: {
			id: '111',
			user: { username: 'bob' },
		},
		number: 1,
	}), 'ticket-111');
	assert.strictEqual(renderChannelName('{username}', {
		creator: {
			id: '111',
			user: { username: 'bob' },
		},
		number: 1,
	}), 'bob');
});

/* ───────────────────────── no second copy of the list ────────────────────── */

t('nothing has re-grown its own hardcoded placeholder list', () => {
	const fs = require('fs');
	// The five duplications this table replaced. A new one is how the list
	// starts disagreeing with itself again, so it fails the build rather than
	// waiting to be noticed.
	const suspects = [
		'src/dashboard/src/components/AutomationEditor/fields/TextAreaField.svelte',
		'src/dashboard/src/components/BlockEditor/BlockFields.svelte',
		'src/dashboard/src/components/BlockEditor/Preview.svelte',
		'src/dashboard/src/routes/settings/[guild]/categories/[category]/+page.svelte',
		'src/listeners/client/ready.js',
	];
	for (const file of suspects) {
		const source = fs.readFileSync(path.join(root, file), 'utf8');
		// Two or more literal `{token}` spellings in one file is a list.
		const literals = [...source.matchAll(/['"`]\{(name|displayname|num|opener|openermention|avgResponseTime|avgRating)\}['"`]/g)];
		assert.strictEqual(literals.length, 0, `${file} has re-grown a hardcoded placeholder list`);
		assert.ok(
			!/avgResponseTime\s*\|\s*avgResolutionTime/.test(source),
			`${file} has re-grown its own stats regex`,
		);
	}
});

/* ─────────────────────────── and one that awaits ─────────────────────────── */

// `varsFor` is the only supplier in this file that is async, so it gets a tail
// of its own rather than an await-aware harness for one test.
(async () => {
	try {
		// Asked for so a graph can hand another bot's command a user id: `!unban
		// {userid}`. The actor's id is on the run context already, so it must
		// arrive without opening the lazy path; `{openerid}` is the one that costs
		// a ticket read.
		const { Context } = require(path.join(root, 'src', 'lib', 'automations', 'context'));
		const context = new Context({
			guilds: {
				cache: new Map([['1', {
					memberCount: 9,
					name: 'Test Server',
				}]]),
			},
		}, {
			actorId: '319709731168223234',
			guildId: '1',
		});
		const vars = await context.varsFor('hello {userid}');
		assert.strictEqual(vars.userid, '319709731168223234');
		assert.ok(placeholders.needsLazy('{openerid}'), '{openerid} must open the ticket read');
		assert.ok(!placeholders.needsLazy('{userid}'), '{userid} must not cost a ticket read');
		pass++;
		console.log('  ok  ', 'an automation run supplies the actor id without a database read');
	} catch (e) {
		console.log('  FAIL', 'an automation run supplies the actor id without a database read', '\n       ', e.message);
		process.exitCode = 1;
	}

	console.log(`\n${pass} checks passed${process.exitCode ? ' (with failures above)' : ''}\n`);
})();
