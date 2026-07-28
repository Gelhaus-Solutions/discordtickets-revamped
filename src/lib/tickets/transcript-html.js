/* eslint-disable max-lines */
'use strict';
const ms = require('ms');
const path = require('path');
const fs = require('fs');
const { formatAnswer } = require('./questions');

// Lazy-loaded: pools is only available inside the full bot process.
// The migration script uses buildHtml directly without the worker pool.
let _crypto = null;
function getCrypto() {
	if (!_crypto) {
		const { pools } = require('../threads');
		_crypto = pools.crypto;
	}
	return _crypto;
}

/**
 * Escape HTML special characters
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
	if (!str) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

/**
 * Convert Discord markdown to basic HTML
 * @param {string} text
 * @returns {string}
 */
function discordMarkdownToHtml(text) {
	if (!text) return '';
	let html = escapeHtml(text);

	// Code blocks (must be before inline code)
	html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) =>
		`<pre class="code-block"><code class="language-${escapeHtml(lang) || 'text'}">${code}</code></pre>`);
	// Inline code
	html = html.replace(/`([^`]+)`/g, (_, code) => `<code class="inline-code">${code}</code>`);
	// Bold
	html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
	// Italics
	html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
	html = html.replace(/_(.+?)_/g, '<em>$1</em>');
	// Underline
	html = html.replace(/__(.+?)__/g, '<u>$1</u>');
	// Strikethrough
	html = html.replace(/~~(.+?)~~/g, '<s>$1</s>');
	// Spoilers. Revealed with CSS (:hover/:focus) rather than an inline onclick
	// handler, which the transcript's Content-Security-Policy blocks.
	html = html.replace(/\|\|(.+?)\|\|/g, '<span class="spoiler" tabindex="0">$1</span>');
	// Mentions. These run against already-escaped text, so they must match the
	// escaped delimiters — `<@123>` is `&lt;@123&gt;` by this point, and matching
	// the raw form meant no mention ever rendered.
	html = html.replace(/&lt;@!?(\d+)&gt;/g, '<span class="mention">@$1</span>');
	html = html.replace(/&lt;@&amp;(\d+)&gt;/g, '<span class="mention role-mention">@$1</span>');
	html = html.replace(/&lt;#(\d+)&gt;/g, '<span class="mention">#$1</span>');
	// Line breaks
	html = html.replace(/\n/g, '<br>');
	// Links. Markdown links and bare URLs are matched in one pass on purpose: run
	// separately, whichever went second would find the URL the first had already
	// wrapped in an anchor and nest a second one inside it. Markdown links are how
	// file-upload answers are rendered.
	html = html.replace(
		/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>"]+)/g,
		(match, text, url, bare) => (bare
			? `<a href="${bare}" target="_blank" rel="noopener noreferrer">${bare}</a>`
			: `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`),
	);

	return html;
}

/**
 * Format a date for display
 * @param {Date|string} date
 * @returns {string}
 */
function formatDate(date) {
	if (!date) return 'Unknown';
	const d = new Date(date);
	return d.toLocaleString('en-GB', {
		day: '2-digit',
		hour: '2-digit',
		hour12: false,
		minute: '2-digit',
		month: 'short',
		second: '2-digit',
		year: 'numeric',
	});
}

/**
 * Generate a unique color from a string (for user avatar backgrounds)
 * @param {string} str
 * @returns {string}
 */
function stringToColor(str) {
	if (!str) return '#5865F2';
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	const h = Math.abs(hash) % 360;
	return `hsl(${h}, 50%, 60%)`;
}

/**
 * Render a single attachment
 * @param {object} attachment
 * @returns {string}
 */
function renderAttachment(attachment) {
	if (!attachment) return '';
	const {
		url, name, contentType,
	} = attachment;
	if (!url) return '';
	if (contentType?.startsWith('image/')) {
		return `<div class="attachment image-attachment">
			<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
				<img src="${escapeHtml(url)}" alt="${escapeHtml(name || 'image')}" loading="lazy" onerror="this.style.display='none'">
			</a>
		</div>`;
	}
	return `<div class="attachment file-attachment">
		<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="file-link">
			📎 ${escapeHtml(name || 'file')}
		</a>
	</div>`;
}

/**
 * Component type numbers, as they appear in archived message JSON.
 * @see https://discord.com/developers/docs/components/reference
 */
const COMPONENT = {
	ACTION_ROW: 1,
	BUTTON: 2,
	CONTAINER: 17,
	FILE: 13,
	MEDIA_GALLERY: 12,
	SECTION: 9,
	SELECT: 3,
	SEPARATOR: 14,
	TEXT_DISPLAY: 10,
	THUMBNAIL: 11,
};

/**
 * A colour that is safe to interpolate into a `style` attribute.
 *
 * The value reaches us from an archived message, and archives can also be
 * written by a database restore, so it is validated at the render boundary
 * rather than trusted from the point it was stored.
 *
 * @param {*} value an integer colour, as Discord sends it
 * @returns {string} `#rrggbb`
 */
function safeColour(value) {
	if (!Number.isInteger(value) || value < 0 || value > 0xffffff) return '#5865F2';
	return `#${value.toString(16).padStart(6, '0')}`;
}

/**
 * Only ever emit `src` values that are real http(s) URLs — `data:` URIs are
 * still live in `src`, and the transcript is served from the dashboard's origin.
 */
function safeMediaUrl(url) {
	if (typeof url !== 'string') return null;
	try {
		const parsed = new URL(url);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? url : null;
	} catch {
		return null;
	}
}

/**
 * Render Components v2 message components.
 *
 * Ticket opening messages and panels are Components v2, which means they carry
 * no `content` and no `embeds` at all — everything they say lives in components.
 * The archiver has always stored them, but the transcript never read them, so
 * without this the entire opening message renders as a blank gap.
 *
 * Unknown component types are skipped rather than throwing: an archive written
 * by a newer bot must still produce a readable transcript.
 *
 * @param {object[]} components
 * @returns {string}
 */
function renderComponents(components) {
	if (!Array.isArray(components) || components.length === 0) return '';

	const renderOne = component => {
		if (!component || typeof component !== 'object') return '';

		switch (component.type) {
		case COMPONENT.TEXT_DISPLAY:
			return component.content
				? `<div class="v2-text">${discordMarkdownToHtml(component.content)}</div>`
				: '';

		case COMPONENT.SEPARATOR:
			return component.divider === false
				? '<div class="v2-spacer"></div>'
				: '<hr class="v2-separator">';

		case COMPONENT.SECTION: {
			const text = (component.components || []).map(renderOne).join('');
			let accessory = '';
			const a = component.accessory;
			if (a?.type === COMPONENT.THUMBNAIL) {
				const url = safeMediaUrl(a.media?.url);
				if (url) {
					accessory = `<div class="v2-section-accessory"><img src="${escapeHtml(url)}" alt="${escapeHtml(a.description || '')}" loading="lazy"></div>`;
				}
			} else if (a?.type === COMPONENT.BUTTON) {
				accessory = `<div class="v2-section-accessory">${renderOne(a)}</div>`;
			}
			return `<div class="v2-section"><div class="v2-section-text">${text}</div>${accessory}</div>`;
		}

		case COMPONENT.MEDIA_GALLERY: {
			const items = (component.items || [])
				.map(item => {
					const url = safeMediaUrl(item?.media?.url);
					if (!url) return '';
					return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
						<img src="${escapeHtml(url)}" alt="${escapeHtml(item.description || 'image')}" loading="lazy">
					</a>`;
				})
				.join('');
			return items ? `<div class="v2-gallery">${items}</div>` : '';
		}

		case COMPONENT.BUTTON: {
			// Buttons are inert in a transcript; they are rendered so the reader
			// can see what the message offered at the time.
			const label = escapeHtml(component.label || '');
			const emoji = component.emoji?.name ? escapeHtml(component.emoji.name) + ' ' : '';
			return `<span class="v2-button v2-button-style-${Number(component.style) || 2}">${emoji}${label}</span>`;
		}

		case COMPONENT.SELECT:
			return `<span class="v2-select">${escapeHtml(component.placeholder || 'Select an option')}</span>`;

		case COMPONENT.ACTION_ROW:
			return `<div class="v2-actions">${(component.components || []).map(renderOne).join('')}</div>`;

		case COMPONENT.FILE: {
			const url = safeMediaUrl(component.file?.url);
			return url
				? `<div class="v2-file"><a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">📎 ${escapeHtml(component.name || 'file')}</a></div>`
				: '';
		}

		case COMPONENT.CONTAINER: {
			const inner = (component.components || []).map(renderOne).join('');
			const colour = safeColour(component.accent_color);
			return `<div class="v2-container" style="border-left: 4px solid ${escapeHtml(colour)}">${inner}</div>`;
		}

		default:
			return '';
		}
	};

	const html = components.map(renderOne).join('');
	return html ? `<div class="v2-components">${html}</div>` : '';
}

/**
 * Normalise an archived embed into the shape `renderEmbed` expects.
 *
 * Archives contain three different shapes, all of which must render:
 *
 *  1. `{ data: { … } }` — what `{ ...embed }` produced before the archiver was
 *     fixed. discord.js keeps an embed's fields in a private `data` object and
 *     exposes them through prototype getters, which a spread does not copy, so
 *     every embed archived this way rendered as an empty box. Every transcript
 *     written before that fix contains this shape.
 *  2. Flat API JSON (`icon_url`, `color`, …) — what `embed.toJSON()` produces,
 *     which is what is archived now.
 *  3. Flat camelCase (`iconURL`) — hand-built objects.
 *
 * @param {object} raw
 * @returns {?object}
 */
function normaliseEmbed(raw) {
	if (!raw || typeof raw !== 'object') return null;
	// Unwrap the legacy `{ data: … }` shape.
	const e = raw.data && typeof raw.data === 'object' ? raw.data : raw;

	const media = value => {
		if (!value) return null;
		const url = typeof value === 'string' ? value : value.url;
		return url ? { url } : null;
	};

	return {
		author: e.author
			? {
				iconURL: e.author.iconURL ?? e.author.icon_url ?? null,
				name: e.author.name,
				url: e.author.url ?? null,
			}
			: null,
		color: typeof e.color === 'number' ? e.color : null,
		description: e.description ?? null,
		fields: Array.isArray(e.fields) ? e.fields : [],
		footer: e.footer
			? {
				iconURL: e.footer.iconURL ?? e.footer.icon_url ?? null,
				text: e.footer.text,
			}
			: null,
		image: media(e.image),
		thumbnail: media(e.thumbnail),
		timestamp: e.timestamp ?? null,
		title: e.title ?? null,
		url: e.url ?? null,
	};
}

/**
 * Render a Discord embed
 * @param {object} raw
 * @returns {string}
 */
function renderEmbed(raw) {
	const embed = normaliseEmbed(raw);
	if (!embed) return '';

	// An embed with nothing in it would otherwise emit an empty coloured box.
	const hasContent = embed.author?.name || embed.title || embed.description ||
		embed.fields.length || embed.image || embed.thumbnail || embed.footer?.text;
	if (!hasContent) return '';

	const color = embed.color !== null ? `#${(embed.color & 0xffffff).toString(16).padStart(6, '0')}` : '#5865F2';
	let html = `<div class="embed" style="border-left: 4px solid ${escapeHtml(color)}">`;

	if (embed.author?.name) {
		html += '<div class="embed-author">';
		const authorIcon = safeMediaUrl(embed.author.iconURL);
		if (authorIcon) html += `<img class="embed-author-icon" src="${escapeHtml(authorIcon)}" loading="lazy">`;
		html += `<span>${escapeHtml(embed.author.name)}</span></div>`;
	}

	if (embed.title) {
		const titleHtml = `<div class="embed-title">${embed.url
			? `<a href="${escapeHtml(embed.url)}" target="_blank">${escapeHtml(embed.title)}</a>`
			: escapeHtml(embed.title)
		}</div>`;
		html += titleHtml;
	}

	if (embed.description) {
		html += `<div class="embed-description">${discordMarkdownToHtml(embed.description)}</div>`;
	}

	if (embed.fields?.length) {
		html += '<div class="embed-fields">';
		for (const field of embed.fields) {
			html += `<div class="embed-field${field.inline ? ' inline' : ''}">
				<div class="embed-field-name">${escapeHtml(field.name)}</div>
				<div class="embed-field-value">${discordMarkdownToHtml(field.value)}</div>
			</div>`;
		}
		html += '</div>';
	}

	const imageUrl = safeMediaUrl(embed.image?.url);
	if (imageUrl) {
		html += `<div class="embed-image"><img src="${escapeHtml(imageUrl)}" alt="embed image" loading="lazy"></div>`;
	}

	const thumbnailUrl = safeMediaUrl(embed.thumbnail?.url);
	if (thumbnailUrl) {
		html += `<div class="embed-thumbnail"><img src="${escapeHtml(thumbnailUrl)}" alt="thumbnail" loading="lazy"></div>`;
	}

	if (embed.footer?.text) {
		html += '<div class="embed-footer">';
		const footerIcon = safeMediaUrl(embed.footer.iconURL);
		if (footerIcon) html += `<img class="embed-footer-icon" src="${escapeHtml(footerIcon)}" loading="lazy">`;
		html += `<span>${escapeHtml(embed.footer.text)}</span>`;
		if (embed.timestamp) html += ` &bull; <span>${formatDate(embed.timestamp)}</span>`;
		html += '</div>';
	}

	html += '</div>';
	return html;
}

/**
 * Generate the CSS styles for the transcript
 * @returns {string}
 */
function getStyles() {
	return `
	:root {
		--bg-primary: #313338;
		--bg-secondary: #2b2d31;
		--bg-tertiary: #1e1f22;
		--bg-accent: #404249;
		--text-primary: #dbdee1;
		--text-secondary: #b5bac1;
		--text-muted: #80848e;
		--brand: #5865F2;
		--green: #57F287;
		--red: #ED4245;
		--yellow: #FEE75C;
		--link: #00a8fc;
		--mention-bg: rgba(88, 101, 242, 0.15);
		--mention-color: #c9cdfb;
		--code-bg: #2b2d31;
		--spoiler-bg: #202225;
		--radius: 4px;
	}
	* { box-sizing: border-box; margin: 0; padding: 0; }
	body {
		background: var(--bg-primary);
		color: var(--text-primary);
		font-family: 'gg sans', 'Noto Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
		font-size: 16px;
		line-height: 1.375rem;
	}
	a { color: var(--link); text-decoration: none; }
	a:hover { text-decoration: underline; }
	.container { max-width: 1000px; margin: 0 auto; padding: 0 16px 60px; }
	/* Header */
	.ticket-header {
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--bg-tertiary);
		padding: 24px 0;
		margin-bottom: 24px;
		position: sticky;
		top: 0;
		z-index: 100;
	}
	.ticket-header .container { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
	.header-icon { font-size: 2rem; }
	.header-title { flex: 1; }
	.header-title h1 { font-size: 1.4rem; font-weight: 700; color: var(--text-primary); }
	.header-title p { font-size: 0.875rem; color: var(--text-muted); margin-top: 2px; }
	.header-badges { display: flex; gap: 8px; flex-wrap: wrap; }
	.badge {
		background: var(--bg-accent);
		border-radius: 100px;
		padding: 4px 12px;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.badge.open { background: rgba(87, 242, 135, 0.1); color: var(--green); }
	.badge.closed { background: rgba(237, 66, 69, 0.1); color: var(--red); }
	.badge.priority-high { background: rgba(237, 66, 69, 0.1); color: var(--red); }
	.badge.priority-medium { background: rgba(254, 231, 92, 0.1); color: var(--yellow); }
	/* Meta info panel */
	.meta-panel {
		background: var(--bg-secondary);
		border-radius: 8px;
		padding: 20px;
		margin-bottom: 20px;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 16px;
	}
	.meta-item h3 { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 4px; }
	.meta-item p { font-size: 0.9375rem; color: var(--text-primary); }
	.meta-item .user-tag { display: flex; align-items: center; gap: 8px; }
	/* Messages */
	.messages-section h2 {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin: 20px 0 12px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--bg-accent);
	}
	.message-group {
		display: flex;
		gap: 16px;
		padding: 4px 0;
		border-radius: var(--radius);
		transition: background 0.1s;
	}
	.message-group:hover { background: var(--bg-secondary); }
	.message-group + .message-group { margin-top: 2px; }
	.message-group.new-group { margin-top: 16px; }
	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		flex-shrink: 0;
		object-fit: cover;
		margin-top: 2px;
	}
	.avatar-placeholder {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1rem;
		color: white;
		margin-top: 2px;
	}
	.avatar-spacer { width: 40px; flex-shrink: 0; }
	.message-content-wrapper { flex: 1; min-width: 0; }
	.message-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 2px; }
	.message-author { font-weight: 600; font-size: 1rem; }
	.message-author.staff { color: #5865F2; }
	.message-author.bot { color: #5865F2; }
	.role-badge {
		font-size: 0.7rem;
		font-weight: 500;
		padding: 1px 6px;
		border-radius: 100px;
		color: white;
	}
	.bot-badge {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 1px 5px;
		border-radius: 3px;
		background: var(--brand);
		color: white;
		text-transform: uppercase;
	}
	.message-timestamp { font-size: 0.75rem; color: var(--text-muted); }
	.message-text { font-size: 1rem; color: var(--text-primary); word-break: break-word; }
	.message-text p { margin-bottom: 0; }
	.message-deleted { opacity: 0.5; font-style: italic; }
	.message-edited::after { content: ' (edited)'; font-size: 0.7rem; color: var(--text-muted); }
	/* Code */
	pre.code-block {
		background: var(--code-bg);
		border: 1px solid var(--bg-accent);
		border-radius: var(--radius);
		padding: 12px;
		margin: 4px 0;
		overflow-x: auto;
		font-family: 'Consolas', 'Andale Mono WT', 'Andale Mono', 'Lucida Console', monospace;
		font-size: 0.875rem;
		line-height: 1.5;
	}
	code.inline-code {
		background: var(--code-bg);
		border-radius: 3px;
		padding: 0 4px;
		font-family: 'Consolas', monospace;
		font-size: 0.85em;
	}
	/* Mentions */
	.mention {
		background: var(--mention-bg);
		color: var(--mention-color);
		border-radius: 3px;
		padding: 0 2px;
		font-weight: 500;
		cursor: pointer;
	}
	.mention:hover { background: var(--brand); color: white; }
	/* Spoiler */
	.spoiler { background: var(--spoiler-bg); color: transparent; border-radius: 3px; padding: 0 2px; cursor: pointer; user-select: none; }
	.spoiler:hover, .spoiler:focus { color: var(--text-primary); background: var(--bg-accent); user-select: text; outline: none; }
	/* Attachments */
	.attachment { margin: 4px 0; }
	.image-attachment img { max-width: min(400px, 100%); max-height: 300px; border-radius: var(--radius); object-fit: cover; display: block; }
	.file-link { display: inline-flex; align-items: center; gap: 8px; background: var(--bg-secondary); padding: 10px 14px; border-radius: var(--radius); color: var(--text-primary); border: 1px solid var(--bg-accent); }
	.file-link:hover { text-decoration: none; border-color: var(--brand); }
	/* Embeds */
	.embed {
		background: var(--bg-secondary);
		border-radius: 0 var(--radius) var(--radius) 0;
		padding: 12px 16px;
		margin: 4px 0;
		max-width: 520px;
		font-size: 0.9375rem;
	}
	.embed-author { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 0.875rem; font-weight: 600; }
	.embed-author-icon { width: 24px; height: 24px; border-radius: 50%; }
	.embed-title { font-weight: 700; margin-bottom: 4px; }
	.embed-title a { color: var(--link); }
	.embed-description { margin-bottom: 8px; white-space: pre-wrap; }
	.embed-fields { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0; }
	.embed-field { flex: 100%; }
	.embed-field.inline { flex: 1 1 calc(50% - 4px); min-width: 130px; }
	.embed-field-name { font-size: 0.875rem; font-weight: 700; margin-bottom: 2px; color: var(--text-primary); }
	.embed-field-value { font-size: 0.9375rem; color: var(--text-secondary); }
	.embed-image img { max-width: 100%; border-radius: var(--radius); margin-top: 8px; }
	.embed-thumbnail { float: right; margin-left: 16px; }
	.embed-thumbnail img { width: 80px; height: 80px; border-radius: var(--radius); object-fit: cover; }
	.embed-footer { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--text-muted); margin-top: 8px; }
	.embed-footer-icon { width: 20px; height: 20px; border-radius: 50%; }
	/* Components v2 */
	.v2-components { max-width: 520px; margin: 4px 0; font-size: 0.9375rem; }
	.v2-container {
		background: var(--bg-secondary);
		border-radius: 0 var(--radius) var(--radius) 0;
		padding: 12px 16px;
		margin: 4px 0;
	}
	.v2-text { white-space: pre-wrap; margin: 4px 0; }
	.v2-separator { border: none; border-top: 1px solid var(--bg-accent); margin: 8px 0; }
	.v2-spacer { height: 8px; }
	.v2-section { display: flex; gap: 12px; align-items: flex-start; margin: 4px 0; }
	.v2-section-text { flex: 1; min-width: 0; }
	.v2-section-accessory { flex: 0 0 auto; }
	.v2-section-accessory img { width: 80px; height: 80px; border-radius: var(--radius); object-fit: cover; }
	.v2-gallery { display: flex; flex-wrap: wrap; gap: 4px; margin: 8px 0; }
	.v2-gallery img { max-width: 100%; max-height: 240px; border-radius: var(--radius); }
	.v2-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
	.v2-button {
		display: inline-block;
		padding: 6px 12px;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
		color: #fff;
		background: #4e5058;
		cursor: default;
	}
	.v2-button-style-1 { background: #5865f2; }
	.v2-button-style-3 { background: #248046; }
	.v2-button-style-4 { background: #da373c; }
	.v2-button-style-5 { background: #4e5058; }
	.v2-select {
		display: inline-block; padding: 6px 12px; border-radius: 4px;
		font-size: 0.875rem; color: var(--text-muted);
		background: var(--bg-accent); cursor: default;
	}
	.v2-file a { color: var(--link); }
	/* Answers section */
	.answers-panel {
		background: var(--bg-secondary);
		border-radius: 8px;
		padding: 20px;
		margin-bottom: 20px;
	}
	.answers-panel h2 { font-size: 1rem; font-weight: 700; margin-bottom: 12px; }
	.answer-item { margin-bottom: 12px; }
	.answer-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 4px; }
	.answer-value { font-size: 0.9375rem; color: var(--text-primary); background: var(--bg-accent); padding: 8px 12px; border-radius: var(--radius); white-space: pre-wrap; }
	/* Feedback */
	.feedback-panel {
		background: var(--bg-secondary);
		border-radius: 8px;
		padding: 20px;
		margin-bottom: 20px;
	}
	.feedback-panel h2 { font-size: 1rem; font-weight: 700; margin-bottom: 12px; }
	.stars { font-size: 1.5rem; color: var(--yellow); }
	.feedback-comment { font-size: 0.9375rem; color: var(--text-secondary); margin-top: 8px; font-style: italic; }
	/* Footer */
	.transcript-footer {
		text-align: center;
		padding: 24px 0;
		color: var(--text-muted);
		font-size: 0.8rem;
		border-top: 1px solid var(--bg-accent);
		margin-top: 20px;
	}
	/* Responsive */
	@media (max-width: 600px) {
		.meta-panel { grid-template-columns: 1fr 1fr; }
		.ticket-header .container { flex-direction: column; align-items: flex-start; }
		.embed { max-width: 100%; }
		.v2-components { max-width: 100%; }
		.v2-section { flex-direction: column; }
		.v2-section-accessory img { width: 100%; height: auto; max-height: 200px; }
	}
	`;
}

/**
 * Build a full HTML transcript from ticket data
 * @param {object} options
 * @param {import('@prisma/client').Ticket} options.ticket
 * @param {import('@prisma/client').Category} options.category
 * @param {import('@prisma/client').Guild} options.guild
 * @param {import('@prisma/client').ArchivedMessage[]} options.messages
 * @param {import('@prisma/client').ArchivedUser[]} options.users
 * @param {import('@prisma/client').ArchivedRole[]} options.roles
 * @param {import('@prisma/client').Feedback} options.feedback
 * @param {import('@prisma/client').QuestionAnswer[]} options.questionAnswers
 * @param {import('@prisma/client').Question[]} options.questions
 * @param {object} options.decrypted - pre-decrypted strings
 * @returns {string} HTML string
 */
function buildHtml({
	ticket,
	category,
	guild,
	messages,
	users,
	roles,
	feedback,
	questionAnswers,
	questions,
	decrypted,
}) {
	// Build user/role lookup maps
	const userMap = {};
	for (const u of users) {
		userMap[u.userId] = u;
	}
	const roleMap = {};
	for (const r of roles) {
		roleMap[r.roleId] = r;
	}

	const topic = decrypted.topic;
	const closedReason = decrypted.closedReason;
	const priority = ticket.priority || null;
	const isOpen = ticket.open;

	// Duration
	let duration = null;
	if (ticket.closedAt) {
		duration = ms(new Date(ticket.closedAt) - new Date(ticket.createdAt), { long: true });
	}

	// Response time
	let responseTime = null;
	if (ticket.firstResponseAt) {
		responseTime = ms(new Date(ticket.firstResponseAt) - new Date(ticket.createdAt), { long: true });
	}

	// Header badges
	const badges = [];
	if (isOpen) badges.push('<span class="badge open">🟢 Open</span>');
	else badges.push('<span class="badge closed">🔴 Closed</span>');
	if (priority === 'HIGH') badges.push('<span class="badge priority-high">🔴 HIGH PRIORITY</span>');
	else if (priority === 'MEDIUM') badges.push('<span class="badge priority-medium">🟡 MEDIUM PRIORITY</span>');

	// Meta panel items
	const metaItems = [
		{
			label: 'Ticket #',
			value: ticket.number,
		},
		{
			label: 'Category',
			value: escapeHtml(category?.name || 'Unknown'),
		},
		{
			label: 'Created By',
			value: userMap[ticket.createdById] ? decrypted.usernames[ticket.createdById] || `User ${ticket.createdById}` : `<@${ticket.createdById}>`,
		},
		{
			label: 'Created At',
			value: formatDate(ticket.createdAt),
		},
	];
	if (ticket.closedAt) {
		metaItems.push({
			label: 'Closed At',
			value: formatDate(ticket.closedAt),
		});
	}
	if (duration) {
		metaItems.push({
			label: 'Duration',
			value: escapeHtml(duration),
		});
	}
	if (responseTime) {
		metaItems.push({
			label: 'First Response',
			value: escapeHtml(responseTime),
		});
	}
	if (ticket.closedById) {
		const closerName = userMap[ticket.closedById] ? decrypted.usernames[ticket.closedById] || `User ${ticket.closedById}` : `User ${ticket.closedById}`;
		metaItems.push({
			label: 'Closed By',
			value: closerName,
		});
	}
	if (ticket.claimedById) {
		const claimerName = userMap[ticket.claimedById] ? decrypted.usernames[ticket.claimedById] || `User ${ticket.claimedById}` : `User ${ticket.claimedById}`;
		metaItems.push({
			label: 'Assigned To',
			value: claimerName,
		});
	}
	if (closedReason) {
		metaItems.push({
			label: 'Close Reason',
			value: escapeHtml(closedReason),
		});
	}
	if (topic) {
		metaItems.push({
			label: 'Topic',
			value: escapeHtml(topic),
		});
	}
	if (ticket.messageCount) {
		metaItems.push({
			label: 'Messages',
			value: String(ticket.messageCount),
		});
	}

	const metaHtml = metaItems
		.map(item => `<div class="meta-item"><h3>${item.label}</h3><p>${item.value}</p></div>`)
		.join('');

	// Q&A section
	let answersHtml = '';
	if (questionAnswers?.length && questions?.length) {
		const qMap = {};
		for (const q of questions) qMap[q.id] = q;
		const answerItems = questionAnswers.map(a => {
			const q = qMap[a.questionId];
			const label = q?.label || a.questionId;
			const stored = decrypted.answers?.[a.id] || a.value || '';
			// Non-text answers are stored as JSON (option values, snowflakes, upload
			// URLs), so they go through the same formatter the ticket message uses.
			// The result is Discord markdown — mentions and upload links included —
			// which is what `discordMarkdownToHtml` renders, not raw text.
			const val = q ? formatAnswer(q, stored) : stored;
			return `<div class="answer-item">
				<div class="answer-label">${escapeHtml(label)}</div>
				<div class="answer-value">${val ? discordMarkdownToHtml(val) : '—'}</div>
			</div>`;
		}).join('');
		answersHtml = `<div class="answers-panel"><h2>📋 Ticket Questions</h2>${answerItems}</div>`;
	}

	// Feedback section
	let feedbackHtml = '';
	if (feedback) {
		const stars = '⭐'.repeat(feedback.rating) + '☆'.repeat(5 - feedback.rating);
		const commentText = decrypted.feedbackComment;
		feedbackHtml = `<div class="feedback-panel">
			<h2>⭐ User Feedback</h2>
			<div class="stars">${stars}</div>
			<p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 4px;">${feedback.rating}/5 stars</p>
			${commentText ? `<p class="feedback-comment">"${escapeHtml(commentText)}"</p>` : ''}
		</div>`;
	}

	// Messages section
	let messagesHtml = '';
	if (messages?.length) {
		let lastAuthorId = null;
		let lastDate = null;
		const msgItems = [];

		for (const msg of messages) {
			const author = userMap[msg.authorId];
			const authorName = decrypted.usernames?.[msg.authorId] || (author?.username ? author.username : `User ${msg.authorId}`);
			const role = author?.roleId && roleMap[author.roleId];
			const roleColor = role ? `#${role.colour}` : stringToColor(msg.authorId);
			const msgDate = new Date(msg.createdAt);
			const isNewGroup = lastAuthorId !== msg.authorId || (lastDate && (msgDate - lastDate) > 5 * 60 * 1000);
			lastAuthorId = msg.authorId;
			lastDate = msgDate;

			// Parse message content
			let parsedContent;
			try {
				parsedContent = JSON.parse(decrypted.messages?.[msg.id] || '{}');
			} catch {
				parsedContent = { content: decrypted.messages?.[msg.id] || '' };
			}

			const {
				content, embeds = [], attachments = [], components = [], reference,
			} = parsedContent;
			const isDeleted = msg.deleted;
			const isEdited = msg.edited;
			const isBot = author?.bot;

			// Avatar
			let avatarHtml;
			const avatarUrl = author?.avatar
				? `https://cdn.discordapp.com/avatars/${msg.authorId}/${author.avatar}.webp?size=80`
				: null;
			if (!isNewGroup) {
				avatarHtml = '<div class="avatar-spacer"></div>';
			} else if (avatarUrl) {
				avatarHtml = `<img class="avatar" src="${escapeHtml(avatarUrl)}" alt="" loading="lazy" onerror="this.onerror=null;this.style.display='none';this.nextSibling?.remove?.()">`;
			} else {
				const initials = authorName.substring(0, 2).toUpperCase();
				avatarHtml = `<div class="avatar-placeholder" style="background:${roleColor}">${escapeHtml(initials)}</div>`;
			}

			// Message header (only for new groups)
			let headerHtml = '';
			if (isNewGroup) {
				const isStaffMsg = !isBot && author?.roleId && roleMap[author.roleId];
				headerHtml = `<div class="message-header">
					<span class="message-author${isBot ? ' bot' : isStaffMsg ? ' staff' : ''}" style="color:${isBot ? '' : roleColor}">
						${escapeHtml(authorName)}
					</span>
					${isBot ? '<span class="bot-badge">BOT</span>' : ''}
					${role ? `<span class="role-badge" style="background:${roleColor}">${escapeHtml(role.name)}</span>` : ''}
					<span class="message-timestamp">${formatDate(msg.createdAt)}</span>
				</div>`;
			}

			// Reply reference
			let replyHtml = '';
			if (reference) {
				replyHtml = `<div class="reply-context" style="font-size:0.8rem;color:var(--text-muted);border-left:2px solid var(--bg-accent);padding-left:8px;margin-bottom:4px;">
					↩ Replying to a message
				</div>`;
			}

			// Content
			let contentHtml = '';
			if (content) {
				contentHtml = `<div class="message-text${isDeleted ? ' message-deleted' : ''}${isEdited ? ' message-edited' : ''}">${discordMarkdownToHtml(content)}</div>`;
			}

			// Embeds
			const embedsHtml = (embeds || []).map(renderEmbed).join('');

			// Components v2. A v2 message has no content and no embeds, so this is
			// the only thing that renders it — the field was archived all along but
			// never read here.
			const componentsHtml = renderComponents(components);

			// Attachments
			const attachmentsHtml = (attachments || []).map(renderAttachment).join('');

			msgItems.push(`<div class="message-group${isNewGroup ? ' new-group' : ''}">
				${avatarHtml}
				<div class="message-content-wrapper">
					${headerHtml}
					${replyHtml}
					${contentHtml}
					${embedsHtml}
					${componentsHtml}
					${attachmentsHtml}
				</div>
			</div>`);
		}

		messagesHtml = `<div class="messages-section">
			<h2>💬 Messages (${messages.length})</h2>
			${msgItems.join('\n')}
		</div>`;
	}

	// Full HTML page
	return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Ticket #${ticket.number} — ${escapeHtml(guild?.footer || 'Discord Tickets')}</title>
	<meta name="description" content="Transcript for ticket #${ticket.number} in ${escapeHtml(category?.name || 'Unknown')}">
	<style>${getStyles()}</style>
</head>
<body>
	<header class="ticket-header">
		<div class="container">
			<span class="header-icon">🎫</span>
			<div class="header-title">
				<h1>${escapeHtml(category?.name || 'Ticket')} #${ticket.number}</h1>
				<p>${topic ? escapeHtml(topic) : `Created ${formatDate(ticket.createdAt)}`}</p>
			</div>
			<div class="header-badges">${badges.join('')}</div>
		</div>
	</header>
	<main class="container">
		<div class="meta-panel">${metaHtml}</div>
		${answersHtml}
		${feedbackHtml}
		${messagesHtml}
		<footer class="transcript-footer">
			<p>Generated on ${formatDate(new Date())} &bull; ${escapeHtml(guild?.footer || 'Discord Tickets by eartharoid')}</p>
		</footer>
	</main>
</body>
</html>`;
}

/**
 * Generate a full HTML transcript for a ticket.
 * Decrypts all encrypted fields and returns an HTML string.
 * @param {import('client')} client
 * @param {string} ticketId
 * @returns {Promise<string|null>}
 */
async function generateHtmlTranscript(client, ticketId) {
	try {
		const ticket = await client.prisma.ticket.findUnique({
			include: {
				archivedMessages: { orderBy: { createdAt: 'asc' } },
				archivedRoles: true,
				archivedUsers: true,
				category: { include: { questions: { orderBy: { order: 'asc' } } } },
				feedback: true,
				guild: true,
				questionAnswers: { include: { question: true } },
			},
			where: { id: ticketId },
		});

		if (!ticket) return null;

		// Decrypt all encrypted fields in parallel
		const decryptField = async val => {
			if (!val) return null;
			try {
				return await getCrypto().queue(w => w.decrypt(val));
			} catch {
				return val; // return as-is if decryption fails
			}
		};

		// Decrypt messages (content JSON)
		const msgDecryptions = await Promise.all(
			ticket.archivedMessages.map(async msg => [msg.id, await decryptField(msg.content)]),
		);
		const decryptedMessages = Object.fromEntries(msgDecryptions);

		// Decrypt usernames/displayNames
		const userDecryptions = await Promise.all(
			ticket.archivedUsers.map(async u => [u.userId, await decryptField(u.displayName || u.username)]),
		);
		const decryptedUsernames = Object.fromEntries(userDecryptions);

		// Decrypt Q&A answers
		const answerDecryptions = await Promise.all(
			ticket.questionAnswers.map(async a => [a.id, await decryptField(a.value)]),
		);
		const decryptedAnswers = Object.fromEntries(answerDecryptions);

		// Decrypt other fields
		const [topic, closedReason, feedbackComment] = await Promise.all([
			decryptField(ticket.topic),
			decryptField(ticket.closedReason),
			decryptField(ticket.feedback?.comment),
		]);

		const html = buildHtml({
			category: ticket.category,
			decrypted: {
				answers: decryptedAnswers,
				feedbackComment,
				closedReason,
				messages: decryptedMessages,
				topic,
				usernames: decryptedUsernames,
			},
			feedback: ticket.feedback,
			guild: ticket.guild,
			messages: ticket.archivedMessages,
			questionAnswers: ticket.questionAnswers,
			questions: ticket.category?.questions || [],
			roles: ticket.archivedRoles,
			ticket,
			users: ticket.archivedUsers,
		});

		return html;
	} catch (error) {
		client.log.error('Failed to generate HTML transcript for ticket %s', ticketId);
		client.log.error(error);
		return null;
	}
}

/**
 * Save an HTML transcript to disk and update the DB record.
 * @param {import('client')} client
 * @param {string} ticketId
 * @returns {Promise<string|null>} relative file path or null
 */
async function saveHtmlTranscript(client, ticketId) {
	const html = await generateHtmlTranscript(client, ticketId);
	if (!html) return null;

	const dir = path.join(process.cwd(), 'user', 'transcripts');
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

	const filename = `ticket-${ticketId}.html`;
	const filepath = path.join(dir, filename);
	fs.writeFileSync(filepath, html, 'utf8');

	const relativePath = `user/transcripts/${filename}`;

	// Update DB with the transcript path
	await client.prisma.ticket.update({
		data: { htmlTranscript: relativePath },
		where: { id: ticketId },
	});

	return relativePath;
}

module.exports = {
	buildHtml,
	generateHtmlTranscript,
	// Exported for `scripts/check-transcript-v2.js`.
	renderComponents,
	renderEmbed,
	saveHtmlTranscript,
};
