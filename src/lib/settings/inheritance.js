/**
 * Server-wide defaults that a category can override.
 *
 * Every one of these settings used to live only on `Category`, NOT NULL with a
 * default baked into the schema — which made "use whatever the server says"
 * inexpressible: a category always held a concrete value, so there was nothing
 * for a guild-level default to fall back *from*. Both levels are nullable now,
 * and the chain is:
 *
 *     built-in default  ->  Guild column  ->  Category column
 *
 * NULL means "not set here, ask the level above". The built-ins live in this
 * file rather than in the DDL on purpose: a default in the schema is filled in
 * by Prisma on every create, so a new category would always override rather than
 * inherit, and changing a built-in later would reach only new installs.
 *
 * The columns are named identically on both models, so this table is a field
 * list rather than a mapping — but each entry still records its guild-side name,
 * so renaming one side later is an edit here instead of a sweep.
 *
 * Note `blockedRoles` (a per-category role deny list, inheritable) is not
 * `Guild.blocklist` (a guild-wide user/role blocklist that has never been a
 * category setting and is not part of this chain).
 */

const { Prisma } = require('@prisma/client');

/**
 * The channel-name emoji for each priority.
 *
 * `NONE` is `''`, not a colour. The old `getEmoji` returned 🔵 for an
 * *unrecognised* priority, which `/priority`'s three fixed choices made
 * unreachable — a ticket with no priority has never had an emoji, and giving
 * `NONE` a default would put one on every ticket in every guild on upgrade.
 */
const PRIORITY_EMOJI_DEFAULTS = {
	HIGH: '🔴',
	LOW: '🟢',
	MEDIUM: '🟠',
	NONE: '',
};

/**
 * Merge the priority maps level by level.
 *
 * Per *key*, not wholesale: its three scalar siblings resolve one setting at a
 * time, and a whole-map replace would mean setting `{HIGH: '🚨'}` on a category
 * silently detached MEDIUM and LOW from the server default — a change nobody
 * asked for and nothing shows.
 *
 * Presence-based rather than a `||` chain, so `''` (no emoji for that priority)
 * overrides instead of falling through.
 */
const mergePriorityEmojis = (...levels) => {
	const out = { ...PRIORITY_EMOJI_DEFAULTS };
	for (const level of levels) {
		if (!level || typeof level !== 'object' || Array.isArray(level)) continue;
		for (const key of Object.keys(PRIORITY_EMOJI_DEFAULTS)) {
			if (typeof level[key] === 'string') out[key] = level[key];
		}
	}
	return out;
};

/**
 * Every setting a category can inherit.
 *
 * `builtin` is a factory rather than a value: a shared `[]` handed to a caller
 * that pushes to it would corrupt the default for every category resolved
 * afterwards, in a way that only shows up under load.
 *
 * `merge`, where present, combines the levels instead of picking one of them —
 * see `priorityEmojis`.
 */
const INHERITED = {
	// Wins over the claimed/unclaimed emoji while the last message is from the
	// ticket author. The built-in is '' — i.e. off — and `naming.js#stateEmoji`
	// reads an unconfigured value as "this guild does not use the feature" and
	// falls back to what the ticket would otherwise have shown, rather than
	// stripping the claim tick from every install that never sets this.
	awaitingStaffEmoji: {
		builtin: () => '',
		guild: 'awaitingStaffEmoji',
	},
	blockedRoles: {
		builtin: () => [],
		guild: 'blockedRoles',
		json: true,
	},
	channelName: {
		builtin: () => 'ticket-{num}',
		guild: 'channelName',
	},
	// The claim tick, as it has always been. '' turns it off.
	claimedEmoji: {
		builtin: () => '✅',
		guild: 'claimedEmoji',
	},
	// Nothing by default: a channel-mode ticket's channel is deleted on close, so
	// this only ever shows on threads and forums, and it did not exist before.
	closedEmoji: {
		builtin: () => '',
		guild: 'closedEmoji',
	},
	// NULL is "no cooldown", which is also what 0 means to `manager.js`. The
	// difference is that 0 is a *choice* and NULL is an absence, and only the
	// choice survives a server-wide default being set later.
	cooldown: {
		builtin: () => null,
		guild: 'cooldown',
	},
	// The feedback form, as a question set of the same shape `Category.questions`
	// uses. The built-in is NULL rather than the default form, for the same
	// reason `closeRequestLayout`'s is: this file has no locale in scope and the
	// built-in questions are translated. `feedbackQuestionsFor` in
	// `src/lib/tickets/feedback.js` turns the NULL into the real default, where
	// `getMessage` exists.
	//
	// `[]` is a category that deliberately asks nothing, and must not fall back.
	feedbackQuestions: {
		builtin: () => null,
		guild: 'feedbackQuestions',
		json: true,
	},
	memberLimit: {
		builtin: () => 1,
		guild: 'memberLimit',
	},
	pingRoles: {
		builtin: () => [],
		guild: 'pingRoles',
		json: true,
	},
	priorityEmojis: {
		builtin: () => ({ ...PRIORITY_EMOJI_DEFAULTS }),
		guild: 'priorityEmojis',
		json: true,
		merge: mergePriorityEmojis,
	},
	ratelimit: {
		builtin: () => null,
		guild: 'ratelimit',
	},
	requiredRoles: {
		builtin: () => [],
		guild: 'requiredRoles',
		json: true,
	},
	// Close without asking the member. `false` is the behaviour every server has
	// had until now — staff ask, the member accepts — and it is also a *choice* a
	// guild can make against a category that skips, which is the whole reason
	// both columns are nullable rather than NOT NULL DEFAULT false.
	skipCloseRequest: {
		builtin: () => false,
		guild: 'skipCloseRequest',
	},
	staffRoles: {
		builtin: () => [],
		guild: 'staffRoles',
		json: true,
	},
	totalLimit: {
		builtin: () => 50,
		guild: 'totalLimit',
	},
	// Nothing while a ticket is open and unclaimed, which is what the bot did
	// before the prefix was configurable.
	unclaimedEmoji: {
		builtin: () => '',
		guild: 'unclaimedEmoji',
	},
};

/** Category column names that participate in the chain. */
const INHERITED_FIELDS = Object.keys(INHERITED);

/** The matching Guild column names. */
const GUILD_DEFAULT_FIELDS = INHERITED_FIELDS.map(field => INHERITED[field].guild);

/**
 * Nullable `Json` columns, which need `dbNulls()` before they reach Prisma.
 * `messageLayout` is not inheritable but is nullable JSON and is written by the
 * same routes, so it belongs on the list.
 */
const CATEGORY_JSON_NULLABLE = [
	...INHERITED_FIELDS.filter(field => INHERITED[field].json),
	'messageLayout',
];

const GUILD_JSON_NULLABLE = INHERITED_FIELDS
	.filter(field => INHERITED[field].json)
	.map(field => INHERITED[field].guild);

/** Is this value an override, or an "ask the level above"? */
const isSet = value => value !== null && value !== undefined;

/**
 * The value a category inherits for each field — the guild's setting, or the
 * built-in when the guild has not set one either. Keyed by *category* column
 * name, so it lines up with the row it is about to be merged into.
 *
 * @param {object} [guild] the guild row; a missing one yields the built-ins
 * @returns {object}
 */
function guildDefaults(guild) {
	const defaults = {};
	for (const field of INHERITED_FIELDS) {
		const {
			builtin, guild: column, merge,
		} = INHERITED[field];
		const value = guild?.[column];
		// A merging field combines the levels rather than picking one, so a guild
		// that sets a single key still inherits the rest.
		defaults[field] = merge ? merge(value) : isSet(value) ? value : builtin();
	}
	return defaults;
}

/**
 * A category with every inheritable field resolved to the value the bot should
 * actually use.
 *
 * Pure: the row that goes in is never modified, because it comes out of the keyv
 * cache and out of Prisma and both are shared. The cache keeps storing the raw
 * row and resolution happens on the way out, which is what stops a guild
 * settings change needing its own invalidation pass.
 *
 * `isSet`, not a truthiness test: `[]` (ping nobody), `0` (slow mode off) and
 * `''` (no emoji) are all deliberate overrides that must stop the chain. Only
 * null and undefined mean inherit.
 *
 * @param {object} category the stored row
 * @param {object} [guild] defaults to the guild embedded by `getCategory`
 * @returns {object}
 */
function resolveCategory(category, guild = category?.guild) {
	if (!category) return category;
	const resolved = { ...category };
	for (const field of INHERITED_FIELDS) {
		const {
			builtin, guild: column, merge,
		} = INHERITED[field];
		if (merge) {
			resolved[field] = merge(guild?.[column], category[field]);
		} else if (!isSet(category[field])) {
			const value = guild?.[column];
			resolved[field] = isSet(value) ? value : builtin();
		}
	}
	return resolved;
}

/**
 * Which fields this category overrides, for a dashboard that has to show
 * "inherited" differently from "set to the same value by hand".
 *
 * @param {object} category
 * @returns {Record<string, boolean>}
 */
function categoryOverrides(category) {
	const overrides = {};
	for (const field of INHERITED_FIELDS) overrides[field] = isSet(category?.[field]);
	return overrides;
}

/**
 * Replace `null` with `Prisma.DbNull` for the given nullable `Json` columns.
 *
 * Prisma accepts a bare `null` here without complaint and then stores the JSON
 * `null` *literal* rather than SQL NULL — verified on both Postgres 16 and
 * MySQL 8. Every form reads back as JS `null`, so the resolver above cannot tell
 * the difference and nothing appears to be wrong; but the column a migration
 * added holds SQL NULL while a column the dashboard cleared holds `'null'`, and
 * the two diverge for raw SQL, `IS NULL` filters, the exporter and any
 * `{equals: DbNull}` query. One meaning, one value.
 *
 * Returns a new object — the caller's `data` is usually the parsed request body
 * and is used again afterwards.
 *
 * @param {object} data
 * @param {string[]} fields
 * @returns {object}
 */
function dbNulls(data, fields) {
	const out = { ...data };
	for (const field of fields) {
		if (field in out && out[field] === null) out[field] = Prisma.DbNull;
	}
	return out;
}

module.exports = {
	CATEGORY_JSON_NULLABLE,
	GUILD_DEFAULT_FIELDS,
	GUILD_JSON_NULLABLE,
	INHERITED,
	INHERITED_FIELDS,
	PRIORITY_EMOJI_DEFAULTS,
	categoryOverrides,
	dbNulls,
	guildDefaults,
	mergePriorityEmojis,
	resolveCategory,
};
