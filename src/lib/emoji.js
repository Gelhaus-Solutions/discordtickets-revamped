const emoji = require('node-emoji');
const nameMap = require('emoji-name-map');

/**
 * Emoji resolution for message components.
 *
 * The bot stores a category's emoji as a single opaque string that can be any of:
 *   - a custom emoji ID          `123456789012345678`
 *   - a full custom emoji tag    `<:name:123…>` / `<a:name:123…>`
 *   - a shortcode                `question` / `:question:`
 *   - a literal Unicode emoji    `💁`
 *
 * The original idiom everywhere was
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
 * So resolution decides by *shape*: only a snowflake is a custom emoji, and the
 * shortcode datasets are used solely to expand shortcodes.
 *
 * The subsequent fix, and the reason there are two datasets: an unrecognised
 * shortcode used to fall through to `{ name: 'rofl' }`. Discord accepts an
 * arbitrary `emoji.name` with no `id`, so the message sent, the button or option
 * worked — and the client rendered nothing at all. "Works but doesn't display."
 *
 * That bit constantly because the two halves of this project disagreed about
 * what a shortcode is: the dashboard previewed with `emoji-name-map` while the
 * bot resolved with node-emoji 1.11, and 502 of emoji-name-map's 1570 names are
 * missing from node-emoji (`rofl`, `thinking`, `star_struck`, `robot`,
 * `man_technologist`…). The dashboard showed the emoji; Discord showed a blank.
 *
 * Both datasets are consulted now, and a shortcode neither knows resolves to
 * `null` — no emoji at all, which is at least honest — rather than to a name
 * that renders as a silent gap.
 */

const SNOWFLAKE = /^\d{17,20}$/;
const CUSTOM_TAG = /^<(a)?:(\w+):(\d{17,20})>$/;
/**
 * Anything that could only have been *meant* as a shortcode: ASCII word
 * characters, optionally colon-wrapped. No real Unicode emoji matches this, so
 * failing to expand one of these means the value is wrong, not exotic.
 */
const SHORTCODE = /^:?[a-z0-9_+-]+:?$/i;

/**
 * Expand a shortcode to its Unicode character, or null if neither dataset knows
 * it. `emoji-name-map` is the dashboard's dataset and the larger of the two;
 * node-emoji is kept because it accepts the `:colon:` form directly and has a
 * handful of aliases the other lacks.
 *
 * @param {string} value
 * @returns {?string}
 */
function expandShortcode(value) {
	if (emoji.hasEmoji(value)) {
		const unicode = emoji.get(value);
		// node-emoji echoes `:unknown:` back rather than returning nothing.
		if (unicode && !unicode.startsWith(':')) return unicode;
	}
	const bare = value.replace(/^:|:$/g, '');
	const mapped = nameMap.get(bare);
	return mapped || null;
}

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

	// A shortcode such as `question` or `:question:`.
	const unicode = expandShortcode(trimmed);
	if (unicode) return { name: unicode };

	// A shortcode neither dataset knows. Passing it through as `name` is what
	// made emoji "work but not display": Discord accepts any name, so the
	// component sent successfully and rendered a blank. No emoji is better.
	if (SHORTCODE.test(trimmed)) return null;

	// Anything else is taken to be a literal Unicode emoji. Discord validates it
	// for us, so an emoji too new for either dataset still works.
	return { name: trimmed };
};

/**
 * Is this a plausible emoji at all? Used to reject junk at the API boundary,
 * before it reaches Discord — where a bad value either fails the whole message
 * send or, worse, sends fine and renders as a blank space.
 *
 * Deliberately permissive about Unicode: neither shortcode dataset can be
 * trusted as an allow-list (see above), so anything short and non-alphanumeric
 * passes. It is exactly as strict as `resolveEmoji`: a value it accepts is one
 * `resolveEmoji` can turn into something Discord will draw.
 *
 * @param {?string} value
 * @returns {boolean}
 */
const isValidEmoji = value => {
	if (typeof value !== 'string') return false;
	const trimmed = value.trim();
	if (trimmed === '') return false;
	if (SNOWFLAKE.test(trimmed) || CUSTOM_TAG.test(trimmed)) return true;
	if (expandShortcode(trimmed)) return true;
	// A shortcode that could not be expanded is a typo, not an emoji.
	if (SHORTCODE.test(trimmed)) return false;
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

/**
 * Is this an emoji that can appear in a *channel name*?
 *
 * Stricter than `isValidEmoji` in one way that matters: a custom server emoji
 * has no textual form, so `<:urgent:123…>` in a channel-name field renders as
 * nothing at all. Rejecting it at the API boundary is the difference between an
 * error an admin can act on and a setting that silently does nothing.
 *
 * @param {?string} value
 * @returns {boolean}
 */
const isValidChannelEmoji = value => isValidEmoji(value) && displayEmoji(value) !== '';

module.exports = {
	displayEmoji,
	isValidChannelEmoji,
	isValidEmoji,
	resolveEmoji,
};
