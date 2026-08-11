/**
 * Discord-flavoured markdown, for the previews.
 *
 * Every preview in the dashboard shows what a *Discord* message will look like,
 * so this renders Discord's dialect rather than a general-purpose one. That is
 * why `marked` is gone: it speaks GFM, which agrees with Discord on the easy
 * things and quietly disagrees on the rest. `__underline__` came out bold,
 * `||spoilers||` and `-# subtext` rendered as literal punctuation, `<@123>` was
 * escaped into visible angle brackets, and tables, images and `---` rules
 * rendered happily in a preview of a message that cannot contain them.
 *
 * Escaping still happens first and exactly once. Discord does not render HTML —
 * it prints the tags as text — so escaping is not a safety tax paid against
 * fidelity, it is what makes the preview honest: `<img src=x onerror=…>` comes
 * out as the literal characters an admin typed, which is what their members will
 * see in the channel. It is also the fix for a real hole: admin-authored text
 * used to reach `{@html}` through a parser that does not sanitise, so any guild
 * admin could store a script in a panel body and run it in the browser of the
 * next admin who opened the editor.
 *
 * The consequence to keep in mind when editing the rules below: **every pattern
 * runs against already-escaped text.** A mention arrives here as
 * `&lt;@123&gt;`, not `<@123>`, and matching the raw form means matching
 * nothing. The bot's transcript renderer learned this the hard way; see the
 * comment in `src/lib/tickets/transcript-html.js`.
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
const escapeHtml = (value) =>
	String(value ?? '')
		// Before anything else, so a typed NUL cannot impersonate the code-span
		// markers used further down. The lint rule against control characters in
		// regexes exists to catch ones written by accident; this one is the point.
		// eslint-disable-next-line no-control-regex
		.replace(/\u0000/g, '')
		.replace(/[&<>"']/g, (c) => ESCAPES[c]);

/**
 * Placeholders for code spans, so their contents are not re-parsed as markdown.
 *
 * `` `**not bold**` `` is literal in Discord. Without this, the bold rule would
 * reach inside the code span and mark it up. The token is deliberately made of
 * characters that survive escaping unchanged and that no rule below matches.
 *
 * NUL delimits it: escaping leaves it alone, no rule matches it, and it is
 * stripped from the source below so a marker cannot be forged by typing one.
 * Written as an escape sequence rather than the character itself — a literal NUL
 * in the source would make this file binary to git, grep and every diff tool.
 */
const PLACEHOLDER = '\u0000CODE';

/**
 * Turn a mention into a chip, resolving the name when we have been given a list
 * to resolve it against.
 *
 * @param {string} prefix `@` or `#`
 * @param {string} id
 * @param {any[]} list
 * @param {string} extraClass
 */
function chip(prefix, id, list, extraClass = '') {
	const name = list?.find?.((entry) => String(entry.id) === id)?.name;
	// Falls back to the raw id rather than "unknown": an id is at least
	// something the admin can search for.
	return `<span class="mention ${extraClass}">${prefix}${escapeHtml(name ?? id)}</span>`;
}

/**
 * Render Discord markdown to HTML, with any HTML in the source neutralised.
 *
 * Safe to hand to `{@html}` — which still has to be silenced at each call site,
 * because the lint rule flags the directive itself and cannot see that the input
 * was escaped.
 *
 * @param {?string} source
 * @param {object} [options]
 * @param {boolean} [options.breaks] treat single newlines as line breaks, as
 *   Discord does. On by default; the call sites used to work around its absence
 *   by doubling every newline in the source.
 * @param {{roles?: any[], channels?: any[]}} [options.mentions] lists to resolve
 *   `<@&id>` and `<#id>` against
 * @returns {string}
 */
export function renderMarkdown(source, { breaks = true, mentions = {} } = {}) {
	let html = escapeHtml(source);

	// Code first, and stashed away, so nothing below can reach inside it.
	const code = [];
	const stash = (markup) => {
		code.push(markup);
		return `${PLACEHOLDER}${code.length - 1}\u0000`;
	};
	html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, body) =>
		stash(
			`<pre class="code-block"><code class="language-${lang ? escapeHtml(lang) : 'text'}">${body}</code></pre>`
		)
	);
	html = html.replace(/`([^`\n]+)`/g, (_, body) =>
		stash(`<code class="inline-code">${body}</code>`)
	);

	// Order matters: `__` before `_`, and `***` before `**` before `*`, or the
	// shorter rule eats the opening characters of the longer one.
	html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
	html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
	html = html.replace(/__(.+?)__/g, '<u>$1</u>');
	html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
	html = html.replace(/_(.+?)_/g, '<em>$1</em>');
	html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');
	// Revealed on hover/focus with CSS rather than a click handler, which the
	// transcript's Content-Security-Policy would block.
	html = html.replace(/\|\|([\s\S]+?)\|\|/g, '<span class="spoiler" tabindex="0">$1</span>');

	// Block-level rules, line by line. Discord has three heading levels and a
	// subtext level; `####` and below are not headings to it, they are text.
	html = html
		.split('\n')
		.map((line) => {
			const subtext = /^-# (.*)$/.exec(line);
			if (subtext) return `<span class="subtext">${subtext[1]}</span>`;
			const heading = /^(#{1,3}) (.*)$/.exec(line);
			if (heading) {
				const level = heading[1].length;
				return `<span class="heading heading-${level}">${heading[2]}</span>`;
			}
			const quote = /^&gt; (.*)$/.exec(line);
			if (quote) return `<span class="quote">${quote[1]}</span>`;
			const bullet = /^\s*[-*] (.*)$/.exec(line);
			if (bullet) return `<span class="bullet">${bullet[1]}</span>`;
			const numbered = /^\s*(\d+)\. (.*)$/.exec(line);
			if (numbered) return `<span class="bullet">${numbered[1]}. ${numbered[2]}</span>`;
			return line;
		})
		.join('\n');

	// Mentions, against the escaped forms. `<@id>` stays an id: the dashboard has
	// no user list to resolve it against anywhere it renders a preview.
	html = html.replace(/&lt;@&amp;(\d+)&gt;/g, (_, id) =>
		chip('@', id, mentions.roles, 'role-mention')
	);
	html = html.replace(/&lt;@!?(\d+)&gt;/g, (_, id) => `<span class="mention">@${id}</span>`);
	html = html.replace(/&lt;#(\d+)&gt;/g, (_, id) => chip('#', id, mentions.channels));
	// Custom emoji. The id is digits only, so nothing user-controlled reaches the
	// URL; the name is escaped for the alt text.
	html = html.replace(
		/&lt;(a)?:(\w+):(\d+)&gt;/g,
		(_, animated, name, id) =>
			`<img class="emoji" src="https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}" alt=":${escapeHtml(name)}:" title=":${escapeHtml(name)}:">`
	);
	// Timestamps. Discord renders these in the reader's own timezone and format;
	// the browser's locale is the closest a preview can get.
	html = html.replace(/&lt;t:(-?\d+)(?::([tTdDfFR]))?&gt;/g, (match, seconds) => {
		const date = new Date(Number(seconds) * 1000);
		if (Number.isNaN(date.getTime())) return match;
		return `<span class="timestamp">${escapeHtml(date.toLocaleString())}</span>`;
	});

	// Masked links and bare URLs in one pass, on purpose: run separately,
	// whichever went second would find the URL the first had already wrapped in
	// an anchor and nest a second one inside it. Only http(s) can reach an href,
	// so `javascript:` and `data:` cannot be smuggled through a masked link.
	html = html.replace(
		/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"]+)/g,
		(match, text, url, bare) =>
			bare
				? `<a href="${bare}" target="_blank" rel="noopener noreferrer">${bare}</a>`
				: `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`
	);

	if (breaks) html = html.replace(/\n/g, '<br>');

	// Code spans go back in last, so their contents were never markdown.
	return html.replace(
		new RegExp(`${PLACEHOLDER}(\\d+)\\u0000`, 'g'),
		(_, index) => code[Number(index)]
	);
}
