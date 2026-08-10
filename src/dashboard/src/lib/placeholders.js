import { getContext, setContext } from 'svelte';

/**
 * The dashboard half of the placeholder catalogue.
 *
 * The table itself lives on the bot, in `src/lib/placeholders.js`, and is served
 * by `GET /api/placeholders`. Nothing is mirrored here — that endpoint exists
 * precisely so this file has no list of its own to fall out of step with.
 *
 * The catalogue is fetched once in the `settings/[guild]` layout and put into
 * Svelte context. Every editor with a placeholder-accepting field lives under
 * that layout, so nothing has to be drilled through props.
 */

const KEY = Symbol('placeholders');

export function setPlaceholders(catalogue) {
	setContext(KEY, catalogue ?? { contexts: [], placeholders: [] });
}

/** @returns {{contexts: any[], placeholders: any[]}} */
export const placeholders = () => getContext(KEY) ?? { contexts: [], placeholders: [] };

/** Everything available in one context, and everything that is not, with the reason. */
export function groupsFor(catalogue, context) {
	const all = catalogue?.placeholders ?? [];
	return {
		available: all.filter((p) => context in (p.contexts ?? {})),
		// Shown greyed rather than hidden: that is what stops somebody typing
		// {name} into a panel and watching it vanish when the panel is posted.
		unavailable: all.filter((p) => !(context in (p.contexts ?? {})))
	};
}

/** The per-context note, falling back to the general description. */
export const noteFor = (placeholder, context) =>
	placeholder?.contexts?.[context] || placeholder?.description || '';

/**
 * Insert text at the caret of an input or textarea.
 *
 * Takes **only the element**, never a setter. `setRangeText` writes straight to
 * the DOM value, and dispatching a real `input` event is what makes that visible
 * to Svelte: `bind:value` is an input listener that reads `element.value`, so
 * one routine serves both the `bind:value` fields and the hand-written
 * `oninput` ones without either knowing the other exists.
 */
export function insertAtCaret(element, text) {
	if (!element) return;
	const start = element.selectionStart ?? element.value.length;
	const end = element.selectionEnd ?? start;
	element.setRangeText(text, start, end, 'end');
	element.dispatchEvent(new Event('input', { bubbles: true }));
	element.focus();
}

/**
 * The preview substitution, from the catalogue's own sample values.
 *
 * Three places used to reimplement this with their own regex and their own
 * made-up values, so a panel preview and an opening-message preview disagreed
 * about what `{num}` looked like.
 */
export function preview(catalogue, context, text) {
	if (typeof text !== 'string' || !text) return text ?? '';
	const available = (catalogue?.placeholders ?? []).filter((p) => context in (p.contexts ?? {}));
	let out = text;
	for (const placeholder of available) {
		const spellings = [placeholder.token, ...(placeholder.aliases ?? [])];
		// Longest first, for the same reason the bot's pattern is sorted that way:
		// `name` before `nickname` would strand a `nick`.
		for (const spelling of spellings.sort((a, b) => b.length - a.length)) {
			// The `match` family is one entry standing for nine tokens.
			const source = spelling === 'match1' ? 'match[1-9]' : escape(spelling);
			out = out.replace(
				new RegExp(`{+\\s?(${source})\\s?}+`, 'gi'),
				placeholder.sample ?? ''
			);
		}
	}
	return out;
}

const escape = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
