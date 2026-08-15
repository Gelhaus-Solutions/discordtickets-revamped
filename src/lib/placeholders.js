/**
 * Every `{placeholder}` this bot understands, declared once.
 *
 * Before this file the list existed in seven places — the substitution regex,
 * the lazy-lookup gate in the automation context, the presence renderer, a chip
 * row in the automation editor, an `{avatar}` tip in the block editor, and two
 * hand-written preview substitutions in the dashboard — and no two of them
 * agreed. Worse, *which placeholders work where* was written down nowhere at
 * all, so the only way to find out that `{opener}` renders empty on a panel was
 * to publish one.
 *
 * So: one table. The substitution regex, the lazy gate, the stats gate, the
 * alias map, the preview samples and the dashboard's picker are all derived
 * from it, which is what makes "declared but not supplied" a test failure
 * rather than an empty string in someone's server.
 *
 * ## Deliberately not in `components-v2.js`
 *
 * Six modules consume this and several of them must not pull in discord.js's
 * builders. This file requires nothing at all, so it can be imported from
 * anywhere without a cycle.
 *
 * ## Deliberately not covering the transcript template
 *
 * `src/lib/transcript*` renders with Mustache, whose `{{tag}}` syntax is a
 * different language with a different escaping story. Adding it here would
 * suggest `{name}` works in a transcript, which it does not.
 *
 * ## Contexts
 *
 * | id            | where                                                    |
 * |---------------|----------------------------------------------------------|
 * | `opening`     | a category's ticket opening message                       |
 * | `panel`       | a ticket panel                                            |
 * | `channelName` | a category's channel-name template                        |
 * | `automation`  | any `action.message.*` layout, and the text params        |
 * | `tag`         | a tag's content                                           |
 * | `presence`    | the bot's presence activity names, from `config.yml`      |
 *
 * A context appears as a **key** of an entry's `contexts` map when the
 * placeholder works there; its value is the note the picker shows, or `null`
 * when the general description is enough. A map rather than a list so the note
 * lives beside the context it belongs to — that is what lets the picker say
 * "here `{name}` is a mention, not plain text".
 */

const CONTEXTS = [
	{
		description: 'The message posted inside a new ticket.',
		id: 'opening',
		label: 'Opening message',
	},
	{
		description: 'A ticket panel. Rendered once when you save it, not per person.',
		id: 'panel',
		label: 'Panel',
	},
	{
		description: 'The name given to a new ticket channel.',
		id: 'channelName',
		label: 'Channel name',
	},
	{
		description: 'Anything an automation posts, plus its text fields.',
		id: 'automation',
		label: 'Automation',
	},
	{
		description: 'The content of a tag.',
		id: 'tag',
		label: 'Tag',
	},
	{
		description: 'The bot\'s status, set in config.yml.',
		id: 'presence',
		label: 'Presence',
	},
];

/**
 * @typedef {object} Placeholder
 * @property {string} token         the canonical spelling, and the `vars` key
 * @property {string[]} [aliases]   other spellings that mean the same thing
 * @property {string} label
 * @property {string} description
 * @property {Record<string, ?string>} contexts  where it works → the note to show
 * @property {boolean} [lazy]       costs a database read, so the automation
 *   context only resolves it when the text asks for it
 * @property {boolean} [stats]      costs a stats aggregation, likewise
 * @property {string} [pattern]     a regex fragment, for a family like `match1..9`
 * @property {string} [sample]      what the dashboard preview substitutes
 * @property {(vars: object) => *} [resolve]  non-obvious lookups only
 */

/** @type {Placeholder[]} */
const PLACEHOLDERS = [
	{
		aliases: ['username'],
		contexts: {
			automation: 'Whoever set the automation off. On a button press that is the staff member who pressed it, not the person the ticket belongs to — use {opener} for them.',
			channelName: 'Their username. A channel name cannot contain a mention.',
			opening: 'A mention of the person who opened the ticket.',
			tag: 'A mention of whoever used the tag.',
		},
		description: 'The person this is about.',
		label: 'Name',
		sample: '@you',
		token: 'name',
	},
	{
		aliases: ['nickname'],
		contexts: {
			automation: null,
			channelName: 'Also accepts {nick} and {display} here.',
			opening: null,
			tag: null,
		},
		description: 'Their nickname in this server, or their username if they have none.',
		label: 'Display name',
		// The pre-v2 behaviour, kept: a member with no nickname still gets a name
		// rather than an empty string.
		resolve: vars => vars.displayname ?? vars.name ?? '',
		sample: 'You',
		token: 'displayname',
	},
	{
		aliases: ['memberid'],
		contexts: {
			automation: 'Whoever set the automation off. This is what another bot\'s commands usually want — most of them take an id, not a mention.',
			channelName: 'Their Discord id, digits only.',
			opening: 'The id of the person who opened the ticket.',
			tag: 'The id of whoever used the tag.',
		},
		description: 'The Discord user id of the person this is about.',
		label: 'User ID',
		sample: '319709731168223234',
		token: 'userid',
	},
	{
		aliases: ['openername'],
		contexts: { automation: 'The person the ticket belongs to, whoever set this off.' },
		description: 'The username of whoever opened the ticket.',
		label: 'Ticket opener',
		lazy: true,
		sample: 'someone',
		token: 'opener',
	},
	{
		aliases: ['openernickname'],
		contexts: { automation: null },
		description: 'The ticket opener\'s nickname in this server.',
		label: 'Opener display name',
		lazy: true,
		resolve: vars => vars.openerdisplayname ?? vars.opener ?? '',
		sample: 'Someone',
		token: 'openerdisplayname',
	},
	{
		contexts: { automation: 'Pings them. Use {opener} for their name in plain text.' },
		description: 'A mention of whoever opened the ticket.',
		label: 'Opener mention',
		lazy: true,
		sample: '@someone',
		token: 'openermention',
	},
	{
		contexts: { automation: 'The person the ticket belongs to, as an id — {userid} is whoever set this off, which on a staff button is not the same person.' },
		description: 'The Discord user id of whoever opened the ticket.',
		label: 'Opener ID',
		lazy: true,
		sample: '319709731168223234',
		token: 'openerid',
	},
	{
		aliases: ['number'],
		contexts: {
			automation: null,
			channelName: null,
			opening: null,
		},
		description: 'The ticket\'s number in this server.',
		label: 'Ticket number',
		lazy: true,
		sample: '1',
		token: 'num',
	},
	{
		contexts: { opening: 'Only useful as an image URL — put it in a thumbnail or an image block.' },
		description: 'The URL of the ticket creator\'s avatar.',
		label: 'Avatar URL',
		sample: 'https://cdn.discordapp.com/embed/avatars/0.png',
		token: 'avatar',
	},
	{
		contexts: {
			automation: null,
			opening: null,
			panel: null,
			tag: null,
		},
		description: 'The name of this server.',
		label: 'Server name',
		sample: 'Your server',
		token: 'server',
	},
	{
		contexts: {
			automation: null,
			opening: null,
			panel: null,
			tag: null,
		},
		description: 'How many members this server has.',
		label: 'Member count',
		sample: '1,234',
		token: 'members',
	},
	{
		contexts: {
			opening: 'Averaged across this category\'s closed tickets.',
			panel: 'Averaged across the categories this panel opens. Worked out when you save the panel, so it does not tick over on its own.',
			presence: 'Averaged across every server.',
		},
		description: 'How long staff take to send the first reply.',
		label: 'Average response time',
		sample: '5 minutes',
		stats: true,
		token: 'avgResponseTime',
	},
	{
		contexts: {
			opening: null,
			panel: null,
			presence: null,
		},
		description: 'How long a ticket takes to be closed.',
		label: 'Average resolution time',
		sample: '2 hours',
		stats: true,
		token: 'avgResolutionTime',
	},
	{
		contexts: {
			opening: null,
			panel: null,
			presence: null,
		},
		description: 'The average feedback rating, out of 5.',
		label: 'Average rating',
		sample: '4.8',
		stats: true,
		token: 'avgRating',
	},
	{
		contexts: { automation: 'From the (brackets) in the trigger\'s pattern: {match1} is the first, {match2} the second, and so on up to {match9}.' },
		description: 'A capture group from the message that set the automation off.',
		label: 'Pattern match',
		// A fixed, known set rather than open-ended: this is the only placeholder
		// whose value is someone else's message text.
		pattern: 'match[1-9]',
		sample: 'matched text',
		token: 'match1',
	},

	/* ── presence only ──────────────────────────────────────────────────────── */
	// These never go through `substitute`: the presence renderer has its own
	// pass in `listeners/client/ready.js`, over a string from config.yml rather
	// than from a guild. Listing them here is what makes them discoverable
	// without letting them look available in a panel.
	{
		contexts: { presence: null },
		description: 'How many servers the bot is in.',
		label: 'Server count',
		sample: '42',
		token: 'guilds',
	},
	{
		contexts: { presence: null },
		description: 'How many tickets are open right now, across every server.',
		label: 'Open tickets',
		sample: '7',
		token: 'openTickets',
	},
	{
		contexts: { presence: null },
		description: 'How many tickets have ever been opened, across every server.',
		label: 'Total tickets',
		sample: '1,024',
		token: 'totalTickets',
	},
];

/** Contexts whose text is rendered by {@link substitute}. Presence is not one. */
const SUBSTITUTED_CONTEXTS = ['opening', 'panel', 'channelName', 'automation', 'tag'];

const isSubstituted = placeholder =>
	Object.keys(placeholder.contexts).some(id => SUBSTITUTED_CONTEXTS.includes(id));

const BY_TOKEN = new Map(PLACEHOLDERS.map(p => [p.token, p]));

/**
 * Every spelling that resolves to a canonical token, lowercased.
 *
 * Aliases are global rather than per-context: `{username}` has always meant
 * `{name}` everywhere, and making that vary by context would be a new rule to
 * learn for no benefit.
 */
const CANONICAL = new Map();
for (const placeholder of PLACEHOLDERS) {
	CANONICAL.set(placeholder.token.toLowerCase(), placeholder.token);
	for (const alias of placeholder.aliases ?? []) CANONICAL.set(alias.toLowerCase(), placeholder.token);
}

/**
 * Build the alternation for a regex, longest first.
 *
 * The order is load-bearing and was previously maintained by eye: with `name`
 * before `nickname`, `{nickname}` matches `name` and leaves a stray `nick`. A
 * length sort makes that impossible to get wrong, which is the whole reason the
 * pattern is derived rather than written out.
 */
function alternation(placeholders) {
	return placeholders
		.map(p => p.pattern ?? p.token)
		.concat(placeholders.flatMap(p => (p.pattern ? [] : (p.aliases ?? []))))
		.sort((a, b) => b.length - a.length || a.localeCompare(b))
		.join('|');
}

/** A `{token}` matcher over the given placeholders, with the same tolerance for `{{ x }}`. */
const patternFor = placeholders => new RegExp(`{+\\s?(${alternation(placeholders)})\\s?}+`, 'gi');

/** Every placeholder `substitute` knows, in one pass. */
const PLACEHOLDER_PATTERN = patternFor(PLACEHOLDERS.filter(isSubstituted));

/**
 * The placeholders that cost a database read.
 *
 * `Context#varsFor` tests text against this before resolving anything: an
 * automation posting a fixed string should not pay for a ticket lookup to find
 * that out.
 */
const LAZY_PATTERN = patternFor(PLACEHOLDERS.filter(p => p.lazy));

/** The placeholders that cost a stats aggregation. */
const STATS_PATTERN = patternFor(PLACEHOLDERS.filter(p => p.stats));

/** Does this text (or JSON document) reference anything that needs stats? */
const needsStats = value =>
	new RegExp(STATS_PATTERN.source, 'i').test(typeof value === 'string' ? value : JSON.stringify(value ?? ''));

/** Does this text reference anything that needs a database read? */
const needsLazy = value =>
	new RegExp(LAZY_PATTERN.source, 'i').test(typeof value === 'string' ? value : JSON.stringify(value ?? ''));

/**
 * One placeholder to one value.
 *
 * Unknown tokens fall through to a direct `vars` lookup, which is what makes
 * `{match1}`..`{match9}` work from one table entry.
 */
function substituteOne(token, vars) {
	const key = CANONICAL.get(String(token).toLowerCase()) ?? String(token).toLowerCase();
	const resolve = BY_TOKEN.get(key)?.resolve;
	if (resolve) return resolve(vars);
	return vars[key] ?? '';
}

/**
 * Fill in every `{placeholder}` in a string.
 *
 * One pass on purpose: a chain of `.replace()` calls substitutes into text it
 * has already substituted, so a member nicknamed `{match1}` would pick up
 * whatever a message pattern captured. Nothing a placeholder expands to is
 * looked at again.
 */
function substitute(str, vars = {}) {
	if (typeof str !== 'string') return str;
	return str.replace(PLACEHOLDER_PATTERN, (_, token) => String(substituteOne(token, vars)));
}

/** The placeholders available in one context, in table order. */
const forContext = context => PLACEHOLDERS.filter(p => context in p.contexts);

const contextPatterns = new Map();

/**
 * Fill in only the placeholders that actually work in one context.
 *
 * Used by the presence renderer, whose tokens (`{guilds}`, `{openTickets}`,
 * `{totalTickets}`) are the bot's own and must never be matched anywhere a
 * server admin can type — a guild-authored `{openTickets}` in a panel would
 * otherwise expand to a global count.
 */
function substituteIn(context, str, vars = {}) {
	if (typeof str !== 'string') return str;
	if (!contextPatterns.has(context)) contextPatterns.set(context, patternFor(forContext(context)));
	return str.replace(contextPatterns.get(context), (_, token) => String(substituteOne(token, vars)));
}

/** The canonical tokens available in one context. */
const tokensFor = context => forContext(context).map(p => p.token);

/**
 * Stand-in values for a dashboard preview, so the preview shows what the
 * message will look like rather than the raw braces.
 */
function sampleVars(context = null) {
	const vars = {};
	for (const placeholder of context ? forContext(context) : PLACEHOLDERS) {
		vars[placeholder.token] = placeholder.sample ?? '';
	}
	// The family entry only carries `match1`; a preview that shows one and drops
	// the rest is worse than showing none of them.
	if (vars.match1 !== undefined) for (let i = 2; i <= 9; i++) vars[`match${i}`] = vars.match1;
	return vars;
}

/**
 * What `GET /api/placeholders` serves.
 *
 * An endpoint rather than a mirrored ESM module because — unlike the automation
 * editor's `nodes.js` — this table holds nothing instance-specific, so a copy in
 * the dashboard would buy a drift surface and nothing else.
 */
function placeholderCatalogue() {
	return {
		contexts: CONTEXTS,
		placeholders: PLACEHOLDERS.map(p => ({
			aliases: p.aliases ?? [],
			contexts: p.contexts,
			description: p.description,
			label: p.label,
			sample: p.sample ?? '',
			token: p.token,
		})),
	};
}

module.exports = {
	CANONICAL,
	CONTEXTS,
	LAZY_PATTERN,
	PLACEHOLDER_PATTERN,
	PLACEHOLDERS,
	STATS_PATTERN,
	SUBSTITUTED_CONTEXTS,
	forContext,
	needsLazy,
	needsStats,
	placeholderCatalogue,
	sampleVars,
	substitute,
	substituteIn,
	substituteOne,
	tokensFor,
};
