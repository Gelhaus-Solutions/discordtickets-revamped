import emojiNames from 'emoji-name-map';

/**
 * The dashboard's half of emoji resolution.
 *
 * Deliberately mirrors `src/lib/emoji.js` in the bot, because the two disagreeing
 * is the bug this exists to prevent: the dashboard previewed shortcodes with
 * `emoji-name-map` while the bot resolved them with node-emoji, whose dataset is
 * missing 502 of those names. An admin saw the emoji here and a blank space in
 * Discord.
 *
 * Every preview in the dashboard goes through `displayEmoji`, so what is shown
 * is what `resolveEmoji` will send.
 */

const SNOWFLAKE = /^\d{17,20}$/;
const CUSTOM_TAG = /^<(a)?:(\w+):(\d{17,20})>$/;
const SHORTCODE = /^:?[a-z0-9_+-]+:?$/i;

/**
 * The custom emoji this value refers to, or null if it is not one.
 *
 * @param {?string} value
 * @returns {?{animated: boolean, id: string, name: ?string, url: string}}
 */
export function customEmoji(value) {
	const raw = (value ?? '').trim();
	if (!raw) return null;
	const tag = raw.match(CUSTOM_TAG);
	const animated = Boolean(tag?.[1]);
	const id = tag?.[3] ?? (SNOWFLAKE.test(raw) ? raw : null);
	if (!id) return null;
	return {
		animated,
		id,
		name: tag?.[2] ?? null,
		url: `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}?size=32`
	};
}

/**
 * The character to render for a stored emoji value, for previews that can only
 * show text. Custom emoji have no textual form, so those give '' — use
 * `customEmoji` to render an image for those.
 *
 * @param {?string} value
 * @returns {string}
 */
export function displayEmoji(value) {
	const raw = (value ?? '').trim();
	if (!raw) return '';
	if (CUSTOM_TAG.test(raw) || SNOWFLAKE.test(raw)) return '';
	const expanded = emojiNames.get(raw.replace(/^:|:$/g, ''));
	if (expanded) return expanded;
	// An unexpandable shortcode is a typo, not an exotic emoji. Showing nothing
	// matches what Discord draws for it.
	if (SHORTCODE.test(raw)) return '';
	return raw;
}
