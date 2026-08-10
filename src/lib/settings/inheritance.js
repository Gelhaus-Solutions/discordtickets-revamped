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
 * `builtin` is a factory rather than a value for the array cases: a shared `[]`
 * handed to a caller that pushes to it would corrupt the default for every
 * category resolved afterwards, in a way that only shows up under load.
 */
const INHERITED = {
	blockedRoles: {
		builtin: () => [],
		guild: 'blockedRoles',
		json: true,
	},
	channelName: {
		builtin: () => 'ticket-{num}',
		guild: 'channelName',
	},
	// NULL is "no cooldown", which is also what 0 means to `manager.js`. The
	// difference is that 0 is a *choice* and NULL is an absence, and only the
	// choice survives a server-wide default being set later.
	cooldown: {
		builtin: () => null,
		guild: 'cooldown',
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
	ratelimit: {
		builtin: () => null,
		guild: 'ratelimit',
	},
	requiredRoles: {
		builtin: () => [],
		guild: 'requiredRoles',
		json: true,
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
		const value = guild?.[INHERITED[field].guild];
		defaults[field] = isSet(value) ? value : INHERITED[field].builtin();
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
	const defaults = guildDefaults(guild);
	const resolved = { ...category };
	for (const field of INHERITED_FIELDS) {
		if (!isSet(category[field])) resolved[field] = defaults[field];
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
	categoryOverrides,
	dbNulls,
	guildDefaults,
	resolveCategory,
};
