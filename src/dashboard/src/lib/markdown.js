import { marked } from 'marked';

/**
 * Markdown rendering for the previews, with HTML escaped first.
 *
 * Every preview in the dashboard shows what a *Discord* message will look like,
 * and Discord does not render HTML — it prints the tags as text. So escaping is
 * not a safety tax paid against fidelity; it is what makes the preview honest.
 * `**bold**` still comes out bold, and `<img src=x onerror=…>` comes out as the
 * literal characters an admin typed, which is exactly what their members will
 * see in the channel.
 *
 * It is also the fix for the real hole. `marked` does not sanitize — its
 * `sanitize` option was deprecated in v4 and removed in v5 precisely because it
 * gave people false confidence — so the raw output of `marked.parse` on
 * admin-authored text was going straight into `{@html}`. Any guild admin could
 * store a category opening message, tag or panel body containing a script and
 * have it run in the browser of the next admin who opened the editor.
 *
 * Escaping ahead of `marked` rather than sanitizing afterwards avoids adding a
 * DOM-sanitizer dependency, and cannot be defeated by a parser quirk: there is
 * no HTML left in the input for the parser to disagree about.
 */

const ESCAPES = {
	'"': '&quot;',
	'&': '&amp;',
	"'": '&#39;',
	'<': '&lt;',
	'>': '&gt;'
};

/**
 * @param {?string} value
 * @returns {string}
 */
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

/**
 * Render markdown to HTML, with any HTML in the source neutralised.
 *
 * Safe to hand to `{@html}` — which still has to be silenced at each call site,
 * because the lint rule flags the directive itself and cannot see that the
 * input was escaped.
 *
 * @param {?string} source
 * @param {object} [options] passed through to `marked`
 * @returns {string}
 */
export function renderMarkdown(source, options = {}) {
	// `marked`'s own text escaping skips sequences that are already entities
	// (`&(?!#?\w+;)`), so it does not re-encode what this has escaped.
	//
	// An `&amp;` the admin literally typed does become `&amp;amp;` here, and so
	// renders as the visible text `&amp;`. That is correct rather than a
	// rounding error: Discord shows that message as `&amp;` too.
	return marked.parse(escapeHtml(source), options);
}
