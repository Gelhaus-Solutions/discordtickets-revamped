import crypto from 'crypto';
import { ao as attr, au as bind_props, _ as derived } from './index2-B7lo9Ma0.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';
import './root-tBuNxqOs.js';
import './exports-7ECo9oy7.js';
import './state.svelte-D5lsa5ep.js';
import { e as emojiNames } from './index-BgrcMwvp.js';

const rnds8Pool = new Uint8Array(256); // # of random values to pre-allocate

let poolPtr = rnds8Pool.length;
function rng() {
  if (poolPtr > rnds8Pool.length - 16) {
    crypto.randomFillSync(rnds8Pool);
    poolPtr = 0;
  }

  return rnds8Pool.slice(poolPtr, poolPtr += 16);
}

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

const byteToHex = [];

for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).slice(1));
}

function unsafeStringify(arr, offset = 0) {
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  return byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]];
}

var native = {
  randomUUID: crypto.randomUUID
};

function v4(options, buf, offset) {
  if (native.randomUUID && true && !options) {
    return native.randomUUID();
  }

  options = options || {};
  const rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  return unsafeStringify(rnds);
}

function EmojiPicker($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { value = void 0, required = false, placeholder = "None" } = $$props;
    let guildEmojis = [];
    Object.entries(emojiNames.emoji);
    const CUSTOM_TAG = /^<(a)?:(\w+):(\d{17,20})>$/;
    const SNOWFLAKE = /^\d{17,20}$/;
    const current = derived(() => {
      const raw = (value ?? "").trim();
      if (!raw) return null;
      const tag = raw.match(CUSTOM_TAG);
      if (tag) {
        return {
          kind: "custom",
          name: tag[2],
          url: `https://cdn.discordapp.com/emojis/${tag[3]}.${tag[1] ? "gif" : "png"}?size=32`
        };
      }
      if (SNOWFLAKE.test(raw)) {
        return {
          kind: "custom",
          name: guildEmojis.find((e) => e.id === raw)?.name ?? "emoji",
          url: `https://cdn.discordapp.com/emojis/${raw}.png?size=32`
        };
      }
      const expanded = emojiNames.get(raw.replace(/^:|:$/g, ""));
      if (expanded) return { kind: "unicode", char: expanded, stale: raw !== expanded };
      if (/^:?[a-z0-9_+-]+:?$/i.test(raw)) return { kind: "broken", raw };
      return { kind: "unicode", char: raw };
    });
    $$renderer2.push(`<div class="relative inline-block w-full"><button type="button" class="input form-input flex w-full items-center gap-2 text-left">`);
    if (current()?.kind === "unicode") {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="text-2xl leading-none">${escape_html(current().char)}</span>`);
    } else if (current()?.kind === "custom") {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<img${attr("src", current().url)}${attr("alt", current().name)} class="h-6 w-6"/> <span class="text-sm text-gray-500 dark:text-slate-400">:${escape_html(current().name)}:</span>`);
    } else if (current()?.kind === "broken") {
      $$renderer2.push("<!--[2-->");
      $$renderer2.push(`<i class="fa-solid fa-triangle-exclamation text-yellow-500"></i> <span class="text-sm text-yellow-600 dark:text-yellow-400">“${escape_html(current().raw)}” is not an emoji Discord recognises — pick one below</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<span class="text-sm text-gray-500 dark:text-slate-400">${escape_html(placeholder)}</span>`);
    }
    $$renderer2.push(`<!--]--> <i class="fa-solid fa-angle-down ml-auto text-gray-500 dark:text-slate-400"></i></button> <input type="text" class="sr-only" tabindex="-1" aria-hidden="true"${attr("required", required, true)}${attr("value", value ?? "")} readonly=""/> `);
    if (current() && !required) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button type="button" class="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 transition duration-300 hover:text-red-500" title="Remove emoji"><i class="fa-solid fa-xmark"></i></button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { value });
  });
}

export { EmojiPicker as E, v4 as v };
//# sourceMappingURL=EmojiPicker-7yzMrmFf.js.map
