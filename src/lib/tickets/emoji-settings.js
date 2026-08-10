/**
 * The emoji half of a category's settings, resolved down the whole chain.
 *
 * This is the seam between `src/lib/settings/inheritance.js`, which knows how
 * built-in -> guild -> category resolution works, and `naming.js`, which knows
 * how a channel name is built. Everything below the seam sees final values and
 * never learns which level supplied them.
 *
 * @typedef {object} EmojiSettings
 * @property {string} claimedEmoji    '' means no emoji
 * @property {string} closedEmoji
 * @property {string} unclaimedEmoji
 * @property {Record<'HIGH'|'MEDIUM'|'LOW'|'NONE', string>} priorityEmojis all four keys, always
 * @property {string[]} historical every emoji any level configures or defaults
 *   to. Used only to strip an existing name, never to build one.
 */

const { displayEmoji } = require('../emoji');
const {
	PRIORITY_EMOJI_DEFAULTS,
	guildDefaults,
	resolveCategory,
} = require('../settings/inheritance');

const STATE_FIELDS = ['claimedEmoji', 'closedEmoji', 'unclaimedEmoji'];

/**
 * Everything that could be sitting on the front of an existing channel name.
 *
 * Deliberately wider than the resolved settings. A channel created before a
 * category overrode the guild's emoji is still wearing the *guild's* value, and
 * a candidate list built only from what is in force today would never strip it —
 * so the raw value at every level goes in, along with the built-ins and the
 * legacy neutral-priority 🔵 that older channels may carry.
 *
 * @param {?object} category raw category row
 * @param {?object} guild raw guild row
 * @returns {string[]}
 */
function historicalEmojis(category, guild) {
	const values = [];
	for (const level of [guild, category]) {
		if (!level) continue;
		for (const field of STATE_FIELDS) values.push(level[field]);
		const priorities = level.priorityEmojis;
		if (priorities && typeof priorities === 'object' && !Array.isArray(priorities)) {
			values.push(...Object.values(priorities));
		}
	}
	values.push(
		...Object.values(PRIORITY_EMOJI_DEFAULTS),
		'✅', // the claim tick, back when it was the only one
		'🔵', // the old neutral-priority emoji, no longer a default
	);
	return [...new Set(values.map(v => displayEmoji(v ?? '')).filter(Boolean))];
}

/**
 * Resolve a category's emoji settings.
 *
 * @param {{category?: object, guild?: object}} input raw rows
 * @returns {EmojiSettings}
 */
function resolveEmojiSettings({
	category, guild,
} = {}) {
	const resolvedGuild = guild ?? category?.guild ?? null;
	// A ticket whose category was deleted still has a name to maintain, so a
	// missing category resolves to the guild's defaults rather than throwing.
	const resolved = category
		? resolveCategory(category, resolvedGuild)
		: guildDefaults(resolvedGuild);

	const settings = { historical: historicalEmojis(category, resolvedGuild) };
	for (const field of STATE_FIELDS) settings[field] = displayEmoji(resolved[field] ?? '');
	settings.priorityEmojis = Object.fromEntries(
		Object.keys(PRIORITY_EMOJI_DEFAULTS)
			.map(key => [key, displayEmoji(resolved.priorityEmojis?.[key] ?? '')]),
	);
	return settings;
}

module.exports = {
	historicalEmojis,
	resolveEmojiSettings,
};
