const emoji = require('node-emoji');

/**
 * Emoji resolution for message components.
 *
 * The bot stores a category's emoji as a single opaque string that can be any of:
 *   - a custom emoji ID          `123456789012345678`
 *   - a full custom emoji tag    `<:name:123…>` / `<a:name:123…>`
 *   - a shortcode                `question` / `:question:`
 *   - a literal Unicode emoji    `💁`
 *
 * The previous idiom everywhere was
 *
 *     emoji.hasEmoji(value) ? emoji.get(value) : { id: value }
 *
 * which used node-emoji as the *decider*. node-emoji 1.11's dataset is
 * incomplete — `hasEmoji('💁')` is false because it only maps the gendered
 * `💁‍♀️` under `:information_desk_person:`, and every skin-tone sequence
 * (`👍🏽`) misses too. Those emoji therefore fell into the `{ id: … }` branch and
 * Discord rejected the whole message with
 * `Value "💁" is not snowflake` — which is what the panel route's error parser
 * existed to translate.
 *
 * The fix is to decide by *shape*: only a snowflake is a custom emoji. Anything
 * else is Unicode, and node-emoji is used solely to expand shortcodes.
 */

const SNOWFLAKE = /^\d{17,20}$/;
const CUSTOM_TAG = /^<(a)?:(\w+):(\d{17,20})>$/;

/**
 * Resolve a stored emoji string into the shape `setEmoji()` expects.
 *
 * @param {?string} value
 * @returns {?({id: string, animated?: boolean, name?: string}|{name: string})} null when there is nothing usable
 */
const resolveEmoji = value => {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (trimmed === '') return null;

	// <:name:id> / <a:name:id>
	const tag = trimmed.match(CUSTOM_TAG);
	if (tag) {
		return {
			animated: Boolean(tag[1]),
			id: tag[3],
			name: tag[2],
		};
	}

	// A bare custom emoji ID.
	if (SNOWFLAKE.test(trimmed)) return { id: trimmed };

	// A shortcode such as `question` or `:question:`. node-emoji returns the
	// input wrapped in colons when it doesn't know it, so check first.
	if (emoji.hasEmoji(trimmed)) {
		const unicode = emoji.get(trimmed);
		if (unicode && !unicode.startsWith(':')) return { name: unicode };
	}

	// Anything else is taken to be a literal Unicode emoji. Discord validates it
	// for us, and unlike the old code an unknown-but-valid emoji now works.
	return { name: trimmed };
};

/**
 * Is this a plausible emoji at all? Used to reject junk in the dashboard before
 * it reaches Discord, where it would otherwise fail the whole message send.
 *
 * Deliberately permissive about Unicode: node-emoji's dataset cannot be trusted
 * as an allow-list (see above), so anything short and non-alphanumeric passes.
 *
 * @param {?string} value
 * @returns {boolean}
 */
const isValidEmoji = value => {
	if (typeof value !== 'string') return false;
	const trimmed = value.trim();
	if (trimmed === '') return false;
	if (SNOWFLAKE.test(trimmed) || CUSTOM_TAG.test(trimmed)) return true;
	if (emoji.hasEmoji(trimmed)) return true;
	// A literal emoji: no ASCII letters/digits, and short. This rejects
	// `not-an-emoji` and stray IDs while accepting 💁, 👍🏽 and 🏳️‍🌈.
	return !/[a-z0-9]/i.test(trimmed) && [...trimmed].length <= 8;
};

/**
 * The display form of an emoji, for places that concatenate it into a string
 * (channel names, autocomplete labels) rather than passing it to `setEmoji()`.
 * Custom emoji have no textual form, so those yield an empty string.
 *
 * @param {?string} value
 * @returns {string}
 */
const displayEmoji = value => {
	const resolved = resolveEmoji(value);
	if (!resolved || !resolved.name || resolved.id) return '';
	return resolved.name;
};

module.exports = {
	displayEmoji,
	isValidEmoji,
	resolveEmoji,
};
