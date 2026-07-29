import { e as emojiNames } from './index-BgrcMwvp.js';

const SNOWFLAKE = /^\d{17,20}$/;
const CUSTOM_TAG = /^<(a)?:(\w+):(\d{17,20})>$/;
const SHORTCODE = /^:?[a-z0-9_+-]+:?$/i;
function displayEmoji(value) {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  if (CUSTOM_TAG.test(raw) || SNOWFLAKE.test(raw)) return "";
  const expanded = emojiNames.get(raw.replace(/^:|:$/g, ""));
  if (expanded) return expanded;
  if (SHORTCODE.test(raw)) return "";
  return raw;
}

export { displayEmoji as d };
//# sourceMappingURL=emoji-B0PYNJPu.js.map
