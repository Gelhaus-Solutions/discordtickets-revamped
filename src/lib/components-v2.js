/**
 * Components v2 block layouts.
 *
 * A "layout" is a JSON document describing a Components v2 message. It is stored
 * verbatim in `Panel.layout` and `Category.messageLayout`, edited by the dashboard
 * block editor, and rendered here into a discord.js message payload.
 *
 * The same format serves five contexts, one per place a layout can be authored:
 *   - `panel`     — a ticket panel (a standalone message with ticket entry points)
 *   - `opening`   — a category's ticket opening message
 *   - `message`   — `action.message.send` and `action.message.reply`
 *   - `ephemeral` — `action.message.ephemeral`
 *   - `dm`        — `action.message.dm`
 *
 * Five named kinds rather than one `automation` kind because the kind is
 * interpolated into every validation error: "not allowed in an automation
 * message" tells an admin nothing, "not allowed in a dm message" tells them
 * which of their four nodes to open.
 *
 * Blocks whose content is per-ticket (the ping line, question answers, the
 * claim/close controls) cannot be baked into stored JSON, so they are represented
 * by field-less "dynamic" blocks that are filled in from the render context.
 */

const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	MessageFlags,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextDisplayBuilder,
	ThumbnailBuilder,
	resolveColor,
} = require('discord.js');
const {
	isValidEmoji,
	resolveEmoji,
} = require('./emoji');
const {
	needsStats,
	substitute,
} = require('./placeholders');
const { automationCustomId } = require('./automations/discord');

const LAYOUT_VERSION = 1;

/**
 * Discord's own limits, plus two of ours.
 *
 * `answerChars`/`answersText` are ours: a single `Question.maxLength` defaults to
 * 4000, which is the entire per-message text budget, so an unclamped answer would
 * make ticket creation throw. The full value is always kept in
 * `QuestionAnswer.value` and in the transcript.
 */
const LIMITS = {
	answerChars: 500,
	answersText: 1500,
	components: 40,
	galleryItems: 10,
	rowButtons: 5,
	sectionText: 3,
	selectOptions: 25,
	text: 4000,
	topBlocks: 10,
};

const STATIC_BLOCKS = ['container', 'text', 'separator', 'buttons', 'section', 'gallery', 'footer'];

/**
 * Which block types may appear in which context. Drives both validation and the editor.
 *
 * `select` is deliberately absent everywhere but `panel`. A ticket *button* names
 * one category in its `custom_id` and is stateless, so a stale one behaves like a
 * stale panel button. A *select*'s options are computed at render time from
 * `ctx.categories` behind a bare `{"action":"create"}` id, which makes an
 * automation-posted select a panel in everything but bookkeeping: no `Panel` row,
 * no `syncPanel`, and no way to re-render or delete it from the panels page.
 */
const BLOCK_TYPES = {
	dm: [...STATIC_BLOCKS],
	ephemeral: [...STATIC_BLOCKS],
	message: [...STATIC_BLOCKS],
	opening: [...STATIC_BLOCKS, 'mentions', 'answers', 'controls'],
	panel: [...STATIC_BLOCKS, 'select'],
};

/**
 * Which button kinds may appear in which context. A separate table from
 * {@link BLOCK_TYPES} because the two axes are genuinely independent: `dm` and
 * `ephemeral` share a block set but not a button set, and `panel` and `opening`
 * the other way round.
 *
 * A DM carries no `guildId`, so `src/buttons/auto.js` cannot resolve which
 * server's automation a press belongs to and a ticket button has no category
 * namespace to look up. Both render perfectly and then report themselves broken,
 * which is why this is refused at save time with a message an admin can act on.
 * A link button produces no interaction at all and is the one kind that is inert.
 */
const BUTTON_KINDS = {
	dm: ['link'],
	ephemeral: ['ticket', 'link', 'automation'],
	message: ['ticket', 'link', 'automation'],
	opening: ['ticket', 'link', 'automation'],
	panel: ['ticket', 'link', 'automation'],
};

/** Why a DM only takes link buttons. Named so the test can assert the wording. */
const DM_BUTTON_HELP = 'Only link buttons work in a DM: a direct message is not in any server, so the bot cannot tell which server the button belongs to.';

/**
 * Contexts where an automation button may continue *this* graph by node id
 * rather than naming another automation by key. Nowhere else has a graph in
 * hand, so a `nodeId` there would render a custom_id with no automation in it.
 */
const NODE_TARGET_KINDS = ['ephemeral', 'message'];

/** Blocks that may only appear inside a container, or at the top level, but never nested twice. */
const BUTTON_STYLES = {
	danger: ButtonStyle.Danger,
	primary: ButtonStyle.Primary,
	secondary: ButtonStyle.Secondary,
	success: ButtonStyle.Success,
};

class LayoutError extends Error {
	/** @param {{path: string, code: string, message: string}[]} errors */
	constructor(errors) {
		super(`Invalid layout: ${errors.map(e => `${e.path}: ${e.message}`).join('; ')}`);
		this.name = 'LayoutError';
		this.errors = errors;
	}
}

const isHttpUrl = u => {
	if (typeof u !== 'string') return false;
	try {
		const parsed = new URL(u);
		return parsed.protocol === 'http:' || parsed.protocol === 'https:';
	} catch {
		return false;
	}
};

/**
 * Whether a string contains a `{variable}` placeholder. Such strings can't be
 * URL-validated at save time because they only become real URLs after substitution,
 * so they are checked again at the render boundary instead.
 */
const hasPlaceholder = s => typeof s === 'string' && /{[^{}]*}/.test(s);

/**
 * `Guild.primaryColour` defaults to `#009999`, but its siblings `errorColour` and
 * `successColour` default to the *names* `Red`/`Green`, so a colour reaching us can
 * be either. `ContainerBuilder#setAccentColor` only takes an integer or an RGB tuple.
 */
const resolveColour = (value, fallback = null) => {
	for (const candidate of [value, fallback]) {
		if (candidate === null || candidate === undefined || candidate === '') continue;
		if (typeof candidate === 'number') return candidate;
		try {
			return resolveColor(candidate);
		} catch {
			continue;
		}
	}
	return null;
};

/**
 * Placeholder substitution lives in `src/lib/placeholders.js`, which is the one
 * declaration of what `{name}` and its dozen siblings mean and where each of
 * them works. Re-exported from here because six modules already import it from
 * this file, and moving the implementation should not move the import site.
 */

let idCounter = 0;
const blockId = prefix => `${prefix}-${(idCounter++).toString(36)}`;

const newLayout = () => ({
	blocks: [],
	version: LAYOUT_VERSION,
});

/**
 * Build the layout equivalent of a legacy panel (title/description/image/thumbnail
 * + BUTTON or MENU entry points), used to seed the editor when creating a panel.
 */
const defaultPanelLayout = ({
	categories = [],
	description = '',
	image = null,
	thumbnail = null,
	title = '',
	type = 'BUTTON',
} = {}) => {
	const text = [title ? `## ${title}` : null, description || null].filter(Boolean).join('\n');
	const inner = [];

	if (thumbnail) {
		inner.push({
			accessory: {
				kind: 'thumbnail',
				url: thumbnail,
			},
			id: blockId('section'),
			text: [text || ' '],
			type: 'section',
		});
	} else if (text) {
		inner.push({
			content: text,
			id: blockId('text'),
			type: 'text',
		});
	}

	if (image) {
		inner.push({
			id: blockId('gallery'),
			items: [{ url: image }],
			type: 'gallery',
		});
	}

	inner.push({
		divider: true,
		id: blockId('separator'),
		spacing: 'small',
		type: 'separator',
	});

	if (type === 'MENU' && categories.length > 1) {
		inner.push({
			categoryIds: null,
			id: blockId('select'),
			placeholder: null,
			type: 'select',
		});
	} else {
		inner.push({
			buttons: categories.map(id => ({
				categoryId: id,
				emoji: null,
				kind: 'ticket',
				label: null,
				style: null,
			})),
			id: blockId('buttons'),
			type: 'buttons',
		});
	}

	inner.push({
		id: blockId('footer'),
		type: 'footer',
	});

	return {
		blocks: [{
			accentColour: null,
			blocks: inner,
			id: blockId('container'),
			type: 'container',
		}],
		version: LAYOUT_VERSION,
	};
};

/**
 * The layout equivalent of the pre-v2 opening message: a ping line, then a coloured
 * block holding the (substituted) opening message beside the creator's avatar, the
 * category image, the topic/answers, a separator and the guild footer, then the
 * controls row.
 *
 * `Category.messageLayout` is nullable and this is the fallback, so a guild that
 * never opens the editor keeps exactly the message it had before.
 */
const defaultOpeningLayout = (openingMessage = '', { image = null } = {}) => {
	const inner = [{
		accessory: {
			description: 'Ticket creator',
			kind: 'thumbnail',
			url: '{avatar}',
		},
		id: blockId('section'),
		text: [openingMessage || ' '],
		type: 'section',
	}];

	if (image) {
		inner.push({
			id: blockId('gallery'),
			items: [{ url: image }],
			type: 'gallery',
		});
	}

	inner.push(
		{
			id: blockId('answers'),
			type: 'answers',
		},
		{
			divider: true,
			id: blockId('separator'),
			spacing: 'small',
			type: 'separator',
		},
		{
			id: blockId('footer'),
			type: 'footer',
		},
	);

	return {
		blocks: [
			{
				id: blockId('mentions'),
				type: 'mentions',
			},
			{
				accentColour: null,
				blocks: inner,
				id: blockId('container'),
				type: 'container',
			},
			{
				id: blockId('controls'),
				type: 'controls',
			},
		],
		version: LAYOUT_VERSION,
	};
};

/**
 * The layout equivalent of a legacy automation message: `content` as one bare
 * text block, `buttons` as one bare button row.
 *
 * **No container, no separator, no footer.** This is what `upgrade.js` runs over
 * every stored `action.message.*` node, and the whole acceptability of doing that
 * to messages that are already posted in thousands of servers rests on the
 * conversion being shape-only — the rendered message must be byte-identical to
 * what the old code produced. `check-components-v2.js` pins that.
 *
 * @param {string} content
 * @param {object[]} buttons legacy `{nodeId|automationKey, label, style, emoji}`
 * @param {{idPrefix?: string}} [opts] a prefix makes the block ids deterministic,
 *   so re-reading the same stored node twice does not produce two different
 *   layouts and arm the dashboard's unsaved-changes guard.
 */
const defaultMessageLayout = (content = '', buttons = [], { idPrefix = null } = {}) => {
	const id = suffix => (idPrefix ? `${idPrefix}-${suffix}` : blockId(suffix));
	const blocks = [];
	const text = String(content ?? '');

	if (text !== '') {
		blocks.push({
			content: text,
			id: id('text'),
			type: 'text',
		});
	}

	const specs = (Array.isArray(buttons) ? buttons : [])
		.filter(b => b && typeof b === 'object')
		.map(b => ({
			automationKey: b.nodeId ? null : (b.automationKey ?? null),
			emoji: b.emoji ?? null,
			kind: 'automation',
			label: b.label ?? null,
			nodeId: b.nodeId ?? null,
			style: b.style ?? 'primary',
		}));

	if (specs.length) {
		blocks.push({
			buttons: specs,
			id: id('buttons'),
			type: 'buttons',
		});
	}

	// A layout with no blocks is not a layout. A node whose content was empty was
	// already invalid (`content` was `required`), so surface it as an empty text
	// block the validator will name rather than as a shapeless document.
	if (blocks.length === 0) {
		blocks.push({
			content: '',
			id: id('text'),
			type: 'text',
		});
	}

	return {
		blocks,
		version: LAYOUT_VERSION,
	};
};

/**
 * Every button spec in a layout, wherever it is nested, paired with the path it
 * was found at.
 *
 * Two callers need it, and both need the path: `src/buttons/auto.js` to tell an
 * entry button from a continuation — once buttons live in layouts, a scan of
 * `node.params.buttons` finds nothing and live panel buttons start answering "no
 * longer connected to anything" — and the automation registry, to report a rule
 * `validateLayout` cannot know about against the exact button that broke it.
 *
 * @returns {{button: object, path: string}[]}
 */
const collectLayoutButtons = layout => {
	const found = [];
	const walk = (blocks, prefix) => {
		(blocks ?? []).forEach((block, i) => {
			if (!block || typeof block !== 'object') return;
			const at = `${prefix}[${i}]`;
			if (block.type === 'container') {
				walk(block.blocks, `${at}.blocks`);
			} else if (block.type === 'buttons' || block.type === 'controls') {
				(block.buttons ?? []).forEach((button, j) => {
					if (button && typeof button === 'object') {
						found.push({
							button,
							path: `${at}.buttons[${j}]`,
						});
					}
				});
			} else if (block.type === 'section' && block.accessory?.kind === 'button' && block.accessory.button) {
				found.push({
					button: block.accessory.button,
					path: `${at}.accessory.button`,
				});
			}
		});
	};
	walk(layout?.blocks, 'blocks');
	return found;
};

/* -------------------------------------------------------------------------- */
/*                                 validation                                  */
/* -------------------------------------------------------------------------- */

// Emoji shape is validated up front so a bad category emoji is a 400 with a
// field path, rather than Discord rejecting the entire message send. See
// `lib/emoji.js` for why node-emoji cannot be used as the allow-list.

/**
 * A membership test over a Set, Map or array of known values.
 *
 * `null` means "the caller has no list", which is not the same as "the list is
 * empty" — the catalogue endpoint and the tests validate shape without a guild's
 * data, and must not have every reference rejected for it.
 */
const membership = collection => {
	if (collection === null || collection === undefined) return () => true;
	if (typeof collection.has === 'function') return value => collection.has(value);
	if (Array.isArray(collection)) return value => collection.includes(value);
	return () => false;
};

/**
 * Validate a layout before anything is sent to Discord, so a bad layout is a 400
 * with field paths rather than a 500 from a builder assertion (builders throw a
 * plain Error from `toJSON()`, which is indistinguishable from a server fault).
 *
 * @param {object} layout
 * @param {object} [opts]
 * @param {'panel'|'opening'|'message'|'ephemeral'|'dm'} [opts.kind]
 * @param {Set<number>|Map<number, any>|number[]} [opts.categoryIds]
 * @param {Set<string>|Map<string, any>|string[]} [opts.automationKeys]
 * @param {string[]|Set<string>} [opts.buttonNodeIds] `trigger.button.pressed`
 *   nodes in the graph being saved, which a button may continue by id.
 */
const validateLayout = (layout, {
	automationKeys = null, buttonNodeIds = null, categoryIds = null, kind = 'panel',
} = {}) => {
	const errors = [];
	const push = (path, code, message) => errors.push({
		code,
		message,
		path,
	});
	const knownCategory = membership(categoryIds);
	const knownAutomation = membership(automationKeys);
	const knownNode = membership(buttonNodeIds);
	const allowedButtons = BUTTON_KINDS[kind] ?? BUTTON_KINDS.panel;
	const allowsNodeTargets = NODE_TARGET_KINDS.includes(kind);

	if (!layout || typeof layout !== 'object') {
		throw new LayoutError([{
			code: 'invalid',
			message: 'Layout must be an object',
			path: '',
		}]);
	}

	if (typeof layout.version !== 'number' || !Number.isInteger(layout.version)) {
		push('version', 'invalid', 'Layout version must be an integer');
	} else if (layout.version > LAYOUT_VERSION) {
		push('version', 'unsupported', `Layout version ${layout.version} is newer than this bot supports (${LAYOUT_VERSION}). Update the bot.`);
	}

	if (!Array.isArray(layout.blocks)) {
		throw new LayoutError([{
			code: 'invalid',
			message: 'Layout blocks must be an array',
			path: 'blocks',
		}]);
	}

	if (layout.blocks.length < 1) push('blocks', 'empty', 'A layout needs at least one block');
	if (layout.blocks.length > LIMITS.topBlocks) {
		push('blocks', 'too_many', `A layout may have at most ${LIMITS.topBlocks} top-level blocks`);
	}

	const allowed = BLOCK_TYPES[kind] ?? BLOCK_TYPES.panel;
	let entryPoints = 0;

	const url = (value, path) => {
		if (hasPlaceholder(value)) return; // re-checked after substitution at render time
		if (!isHttpUrl(value)) push(path, 'invalid_url', 'Must be an http(s) URL');
	};

	const validateButton = (button, path) => {
		if (!button || typeof button !== 'object') return push(path, 'invalid', 'Invalid button');
		if (button.style && !BUTTON_STYLES[button.style]) {
			push(`${path}.style`, 'invalid', `Unknown button style '${button.style}'`);
		}
		if (typeof button.kind === 'string' && BUTTON_KINDS.panel.includes(button.kind) && !allowedButtons.includes(button.kind)) {
			return push(
				`${path}.kind`,
				'not_allowed',
				`A ${button.kind} button is not allowed in a ${kind} message. ${kind === 'dm' ? DM_BUTTON_HELP : ''}`.trim(),
			);
		}
		if (button.kind === 'link') {
			url(button.url, `${path}.url`);
			if (!button.label) push(`${path}.label`, 'required', 'Link buttons need a label');
		} else if (button.kind === 'ticket') {
			entryPoints++;
			if (!Number.isInteger(button.categoryId)) {
				push(`${path}.categoryId`, 'required', 'Ticket buttons need a category');
			} else if (!knownCategory(button.categoryId)) {
				push(`${path}.categoryId`, 'unknown_category', `Category ${button.categoryId} does not exist in this server`);
			}
		} else if (button.kind === 'automation') {
			// Deliberately does *not* count as an entry point: a panel made only of
			// automation buttons still fails `no_entry_point`, which is correct —
			// it opens no tickets.
			//
			// A button either continues *this* graph (`nodeId`, the confirm/cancel
			// case, and why one automation can own several buttons) or starts
			// another automation (`automationKey`). Never both: a button runs one
			// thing, and a pair that named two would have to pick one silently.
			const hasNode = typeof button.nodeId === 'string' && Boolean(button.nodeId);
			const hasKey = typeof button.automationKey === 'string' && Boolean(button.automationKey);

			if (hasNode && hasKey) {
				push(`${path}.nodeId`, 'ambiguous_target', 'A button runs one thing, not two');
			} else if (hasNode && !allowsNodeTargets) {
				push(`${path}.nodeId`, 'not_allowed', `A ${kind} message has no automation to continue — pick an automation instead`);
			} else if (hasNode) {
				if (!knownNode(button.nodeId)) {
					push(`${path}.nodeId`, 'unknown_trigger', 'That step is not a "button is pressed" trigger in this automation');
				}
			} else if (!hasKey) {
				push(`${path}.automationKey`, 'required', 'Automation buttons need an automation');
			} else if (!knownAutomation(button.automationKey)) {
				push(`${path}.automationKey`, 'unknown_automation', 'That automation does not exist in this server');
			}
			if (!button.label) push(`${path}.label`, 'required', 'Automation buttons need a label');
		} else {
			push(`${path}.kind`, 'invalid', `Unknown button kind '${button.kind}'`);
		}
		if (button.emoji && !isValidEmoji(button.emoji)) {
			push(`${path}.emoji`, 'invalid_emoji', `\`${button.emoji}\` is not a valid emoji. Use a standard emoji or a custom emoji ID.`);
		}
	};

	const validateBlock = (block, path, { nested }) => {
		if (!block || typeof block !== 'object') return push(path, 'invalid', 'Invalid block');
		if (!allowed.includes(block.type)) {
			return push(`${path}.type`, 'not_allowed', `Block type '${block.type}' is not allowed in a ${kind} message`);
		}

		switch (block.type) {
		case 'container':
			if (nested) return push(path, 'nested_container', 'Containers cannot be nested');
			if (block.accentColour !== null && block.accentColour !== undefined && !/^#[0-9a-fA-F]{6}$/.test(block.accentColour)) {
				push(`${path}.accentColour`, 'invalid_colour', 'Accent colour must be a #RRGGBB hex colour');
			}
			if (!Array.isArray(block.blocks) || block.blocks.length < 1) {
				push(`${path}.blocks`, 'empty', 'A container needs at least one block');
			} else {
				block.blocks.forEach((child, i) => validateBlock(child, `${path}.blocks[${i}]`, { nested: true }));
			}
			break;

		case 'text':
			if (typeof block.content !== 'string' || block.content.trim() === '') {
				push(`${path}.content`, 'required', 'Text blocks need content');
			}
			break;

		case 'separator':
			if (block.spacing && !['small', 'large'].includes(block.spacing)) {
				push(`${path}.spacing`, 'invalid', 'Spacing must be \'small\' or \'large\'');
			}
			break;

		case 'buttons':
			if (!Array.isArray(block.buttons) || block.buttons.length < 1) {
				push(`${path}.buttons`, 'empty', 'A button row needs at least one button');
			} else if (block.buttons.length > LIMITS.rowButtons) {
				push(`${path}.buttons`, 'too_many', `A row may have at most ${LIMITS.rowButtons} buttons`);
			} else {
				block.buttons.forEach((b, i) => validateButton(b, `${path}.buttons[${i}]`));
			}
			break;

		case 'section':
			if (!Array.isArray(block.text) || block.text.length < 1) {
				push(`${path}.text`, 'empty', 'A section needs at least one line of text');
			} else if (block.text.length > LIMITS.sectionText) {
				push(`${path}.text`, 'too_many', `A section may have at most ${LIMITS.sectionText} lines of text`);
			}
			if (!block.accessory || typeof block.accessory !== 'object') {
				push(`${path}.accessory`, 'required', 'A section needs a thumbnail or button accessory');
			} else if (block.accessory.kind === 'thumbnail') {
				url(block.accessory.url, `${path}.accessory.url`);
			} else if (block.accessory.kind === 'button') {
				validateButton(block.accessory.button, `${path}.accessory.button`);
			} else {
				push(`${path}.accessory.kind`, 'invalid', 'Accessory must be \'thumbnail\' or \'button\'');
			}
			break;

		case 'gallery':
			if (!Array.isArray(block.items) || block.items.length < 1) {
				push(`${path}.items`, 'empty', 'A gallery needs at least one image');
			} else if (block.items.length > LIMITS.galleryItems) {
				push(`${path}.items`, 'too_many', `A gallery may have at most ${LIMITS.galleryItems} images`);
			} else {
				block.items.forEach((item, i) => url(item?.url, `${path}.items[${i}].url`));
			}
			break;

		case 'select': {
			entryPoints++;
			const ids = block.categoryIds;
			if (ids !== null && ids !== undefined) {
				if (!Array.isArray(ids) || ids.length < 1) {
					push(`${path}.categoryIds`, 'empty', 'A select menu needs at least one category');
				} else if (ids.length > LIMITS.selectOptions) {
					push(`${path}.categoryIds`, 'too_many', `A select menu may have at most ${LIMITS.selectOptions} options`);
				} else {
					ids.forEach((id, i) => {
						if (!knownCategory(id)) {
							push(`${path}.categoryIds[${i}]`, 'unknown_category', `Category ${id} does not exist in this server`);
						}
					});
				}
			}
			break;
		}

		case 'controls':
			// The built-in Claim/Close/Edit buttons are not configurable, but an
			// admin may add their own automation buttons under them.
			if (block.buttons !== undefined && block.buttons !== null) {
				if (!Array.isArray(block.buttons)) {
					push(`${path}.buttons`, 'invalid', 'Ticket controls buttons must be a list');
				} else if (block.buttons.length > LIMITS.rowButtons) {
					push(`${path}.buttons`, 'too_many', `Ticket controls may have at most ${LIMITS.rowButtons} extra buttons`);
				} else {
					block.buttons.forEach((b, i) => {
						// A ticket or link button here would be meaningless: the message
						// is already inside the ticket it would open.
						if (b?.kind !== 'automation') {
							push(`${path}.buttons[${i}].kind`, 'invalid', 'Ticket controls can only hold automation buttons');
						} else {
							validateButton(b, `${path}.buttons[${i}]`);
						}
					});
				}
			}
			break;

		case 'footer':
		case 'mentions':
		case 'answers':
			break;

		default:
			push(`${path}.type`, 'unknown', `Unknown block type '${block.type}'`);
		}
	};

	layout.blocks.forEach((block, i) => validateBlock(block, `blocks[${i}]`, { nested: false }));

	if (kind === 'panel' && entryPoints === 0) {
		push('blocks', 'no_entry_point', 'A panel needs at least one ticket button or select menu');
	}

	const components = countComponents(layout);
	if (components > LIMITS.components) {
		push('blocks', 'too_many_components', `This layout uses ${components} components; Discord allows ${LIMITS.components}`);
	}

	const text = countText(layout);
	if (text > LIMITS.text) {
		push('blocks', 'too_much_text', `This layout uses ${text} characters; Discord allows ${LIMITS.text}`);
	}

	if (errors.length) throw new LayoutError(errors);
	return true;
};

/* -------------------------------------------------------------------------- */
/*                                  budgets                                    */
/* -------------------------------------------------------------------------- */

/** Recursive component count, matching how Discord counts them (a container counts itself). */
const countComponents = layout => {
	const count = block => {
		if (!block || typeof block !== 'object') return 0;
		switch (block.type) {
		case 'container':
			return 1 + (Array.isArray(block.blocks) ? block.blocks.reduce((n, b) => n + count(b), 0) : 0);
		case 'buttons':
			return 1 + (Array.isArray(block.buttons) ? block.buttons.length : 0);
		case 'section':
			return 1 + (Array.isArray(block.text) ? block.text.length : 0) + (block.accessory ? 1 : 0);
		case 'select':
			return 2; // a select occupies a whole action row
		case 'controls': {
			// Worst case: edit + claim + close + close-reason, plus a second row
			// for the admin's own automation buttons.
			const custom = Array.isArray(block.buttons) ? Math.min(block.buttons.length, LIMITS.rowButtons) : 0;
			return 1 + 4 + (custom ? 1 + custom : 0);
		}
		case 'answers':
			return 1;
		default:
			return 1;
		}
	};
	return (layout?.blocks ?? []).reduce((n, b) => n + count(b), 0);
};

/** Total characters across everything that becomes a TextDisplay. */
const countText = layout => {
	const count = block => {
		if (!block || typeof block !== 'object') return 0;
		switch (block.type) {
		case 'container':
			return (Array.isArray(block.blocks) ? block.blocks.reduce((n, b) => n + count(b), 0) : 0);
		case 'text':
			return (block.content ?? '').length;
		case 'section':
			return (Array.isArray(block.text) ? block.text.join('\n').length : 0);
		case 'answers':
			return LIMITS.answersText; // budget for the worst case, since content is per-ticket
		default:
			return 0;
		}
	};
	return (layout?.blocks ?? []).reduce((n, b) => n + count(b), 0);
};

/* -------------------------------------------------------------------------- */
/*                                  rendering                                  */
/* -------------------------------------------------------------------------- */

const truncate = (str, max) => (str.length > max ? str.slice(0, max - 1) + '…' : str);

const toEmoji = value => resolveEmoji(value);

/**
 * @param {object} spec
 * @param {object} ctx
 * @returns {ButtonBuilder|null} null when the button refers to a category that no longer exists
 */
const buildButton = (spec, ctx) => {
	const button = new ButtonBuilder();

	if (spec.kind === 'link') {
		const url = substitute(spec.url, ctx.vars);
		if (!isHttpUrl(url)) return null;
		button.setURL(url).setStyle(ButtonStyle.Link).setLabel(truncate(substitute(spec.label, ctx.vars), 80));
		const e = toEmoji(spec.emoji);
		if (e) button.setEmoji(e);
		return button;
	}

	if (spec.kind === 'automation') {
		// A `nodeId` continues the automation currently rendering, so the key comes
		// from the render context; anything else names another automation outright.
		const key = spec.nodeId ? ctx.automationKey : spec.automationKey;
		if (!key) return null;
		// Orphaned automation — skip rather than throw mid-panel, exactly the rule
		// already applied to a deleted category below.
		if (!spec.nodeId && ctx.automations && !ctx.automations.has(spec.automationKey)) return null;
		button
			.setCustomId(automationCustomId(key, spec.nodeId ?? null))
			.setStyle(BUTTON_STYLES[spec.style] ?? ButtonStyle.Primary)
			.setLabel(truncate(substitute(spec.label, ctx.vars), 80));
		const e = toEmoji(spec.emoji);
		if (e) button.setEmoji(e);
		return button;
	}

	const category = ctx.categories?.get(spec.categoryId);
	if (!category) return null; // orphaned category — skip rather than throw mid-ticket

	// The button spec first, then the category. There used to be a third rule: a
	// panel referencing exactly one category ignored both and used the generic
	// localised "🎟 Create a ticket" instead, to match the pre-block-editor panel.
	//
	// Nothing in the dashboard said so. Its preview and its placeholder text both
	// promised the category's name and emoji, so an admin who configured a
	// one-category panel approved one thing and Discord posted another — and no
	// amount of editing the category changed it. Now the two agree.
	//
	// The generic label survives only as a fallback for a category with no name,
	// which the API does not allow but old rows may have.
	const label = spec.label ?? category.name ?? ctx.getMessage('buttons.create.text');
	const emojiValue = spec.emoji ?? category.emoji ?? null;
	const style = BUTTON_STYLES[spec.style] ?? ButtonStyle.Primary;

	button
		// Byte-identical to the pre-v2 custom_id so panels created before this
		// change keep working with the same handlers.
		.setCustomId(JSON.stringify({
			action: 'create',
			target: category.id,
		}))
		.setStyle(style)
		.setLabel(truncate(substitute(label, ctx.vars), 80));

	const e = toEmoji(emojiValue);
	if (e) button.setEmoji(e);

	return button;
};

const buildSelect = (block, ctx) => {
	const ids = block.categoryIds ?? [...(ctx.categories?.keys() ?? [])];
	const options = ids
		.map(id => ctx.categories?.get(id))
		.filter(Boolean)
		.slice(0, LIMITS.selectOptions)
		.map(category => {
			const option = new StringSelectMenuOptionBuilder()
				.setValue(String(category.id))
				.setLabel(truncate(category.name, 100));
			if (category.description) option.setDescription(truncate(category.description, 100));
			const e = toEmoji(category.emoji);
			if (e) option.setEmoji(e);
			return option;
		});

	if (options.length === 0) return null;

	return new StringSelectMenuBuilder()
		.setCustomId(JSON.stringify({ action: 'create' }))
		.setPlaceholder(truncate(substitute(block.placeholder ?? ctx.getMessage('menus.category.placeholder'), ctx.vars), 150))
		.setOptions(options);
};

/**
 * The claim/close controls. This is the single source of truth: `manager.js`
 * builds the opening message from it, and claim()/release()/the edit modals
 * re-render the whole layout through it rather than rebuilding a bare row.
 *
 * An admin may hang their own automation buttons off the block. Those go in a
 * **second row** rather than alongside Claim/Close: how many built-in buttons
 * there are depends on the guild's settings and on whether the ticket is
 * claimed, so packing both into one row would silently drop custom buttons past
 * Discord's five-per-row limit on some tickets and not others.
 *
 * @returns {ActionRowBuilder[]} zero, one or two rows
 */
const buildControls = (block, ctx) => {
	const o = ctx.opening ?? {};
	const getMessage = ctx.getMessage;
	const buttons = [];

	if (o.showEdit) {
		buttons.push(new ButtonBuilder()
			.setCustomId(JSON.stringify({ action: 'edit' }))
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(getMessage('buttons.edit.emoji'))
			.setLabel(getMessage('buttons.edit.text')));
	}

	if (o.showClaim) {
		const action = o.claimed ? 'unclaim' : 'claim';
		buttons.push(new ButtonBuilder()
			.setCustomId(JSON.stringify({ action }))
			.setStyle(ButtonStyle.Secondary)
			.setEmoji(getMessage(`buttons.${action}.emoji`))
			.setLabel(getMessage(`buttons.${action}.text`)));
	}

	if (o.showClose) {
		buttons.push(new ButtonBuilder()
			.setCustomId(JSON.stringify({ action: 'close' }))
			.setStyle(ButtonStyle.Danger)
			.setEmoji(getMessage('buttons.close.emoji'))
			.setLabel(getMessage('buttons.close.text')));
	}

	if (o.showCloseReason) {
		buttons.push(new ButtonBuilder()
			.setCustomId(JSON.stringify({ action: 'close-reason' }))
			.setStyle(ButtonStyle.Secondary)
			.setEmoji('📝')
			.setLabel('Close with Reason'));
	}

	const rows = [];
	if (buttons.length) rows.push(new ActionRowBuilder().setComponents(buttons.slice(0, LIMITS.rowButtons)));

	const custom = (block?.buttons ?? [])
		.map(b => buildButton(b, ctx))
		.filter(Boolean)
		.slice(0, LIMITS.rowButtons);
	if (custom.length) rows.push(new ActionRowBuilder().setComponents(custom));

	return rows;
};

/** The topic / question answers that used to be a second embed's fields. */
const buildAnswersText = ctx => {
	const o = ctx.opening ?? {};
	let out = '';

	if (Array.isArray(o.answers) && o.answers.length) {
		out = o.answers
			.map(a => `**${a.label}**\n${truncate(a.value || ctx.getMessage('ticket.answers.no_value'), LIMITS.answerChars)}`)
			.join('\n\n');
	} else if (o.topic) {
		out = `**${ctx.getMessage('ticket.opening_message.fields.topic')}**\n${truncate(o.topic, LIMITS.answerChars)}`;
	}

	return out ? truncate(out, LIMITS.answersText) : null;
};

const buildMentionsText = ctx => {
	const o = ctx.opening ?? {};
	const pings = (o.pingRoles ?? []).map(r => `<@&${r}>`).join(' ');
	return ctx.getMessage('ticket.opening_message.content', {
		creator: o.creatorId ? `<@${o.creatorId}>` : '',
		staff: pings ? pings + ',' : '',
	});
};

const buildThumbnail = (accessory, ctx) => {
	const url = substitute(accessory.url, ctx.vars);
	if (!isHttpUrl(url)) return null; // placeholder didn't resolve to a real URL
	const thumb = new ThumbnailBuilder().setURL(url);
	if (accessory.description) thumb.setDescription(truncate(substitute(accessory.description, ctx.vars), 1024));
	if (accessory.spoiler) thumb.setSpoiler(true);
	return thumb;
};

const buildGallery = (block, ctx) => {
	const items = block.items
		.map(item => {
			const url = substitute(item.url, ctx.vars);
			if (!isHttpUrl(url)) return null;
			const built = new MediaGalleryItemBuilder().setURL(url);
			if (item.description) built.setDescription(truncate(substitute(item.description, ctx.vars), 1024));
			if (item.spoiler) built.setSpoiler(true);
			return built;
		})
		.filter(Boolean)
		.slice(0, LIMITS.galleryItems);

	return items.length ? new MediaGalleryBuilder().addItems(items) : null;
};

const buildSection = (block, ctx) => {
	const section = new SectionBuilder();
	const texts = block.text
		.map(t => substitute(t, ctx.vars))
		.filter(t => typeof t === 'string' && t.trim() !== '')
		.slice(0, LIMITS.sectionText);

	if (!texts.length) return null;
	section.addTextDisplayComponents(texts.map(t => new TextDisplayBuilder().setContent(t)));

	if (block.accessory?.kind === 'thumbnail') {
		const thumb = buildThumbnail(block.accessory, ctx);
		// A section is invalid without an accessory, so degrade to plain text displays.
		if (!thumb) return texts.map(t => new TextDisplayBuilder().setContent(t));
		section.setThumbnailAccessory(thumb);
	} else if (block.accessory?.kind === 'button') {
		const button = buildButton(block.accessory.button, ctx);
		if (!button) return texts.map(t => new TextDisplayBuilder().setContent(t));
		section.setButtonAccessory(button);
	} else {
		return texts.map(t => new TextDisplayBuilder().setContent(t));
	}

	return section;
};

/**
 * Render one block into zero or more builders.
 * @returns {Array} builders (empty when the block renders to nothing)
 */
const buildBlock = (block, ctx) => {
	switch (block.type) {
	case 'text': {
		const content = substitute(block.content, ctx.vars);
		return content?.trim() ? [new TextDisplayBuilder().setContent(content)] : [];
	}

	case 'separator': {
		const separator = new SeparatorBuilder()
			.setDivider(block.divider !== false)
			.setSpacing(block.spacing === 'large' ? SeparatorSpacingSize.Large : SeparatorSpacingSize.Small);
		return [separator];
	}

	case 'buttons': {
		const buttons = block.buttons.map(b => buildButton(b, ctx)).filter(Boolean).slice(0, LIMITS.rowButtons);
		return buttons.length ? [new ActionRowBuilder().setComponents(buttons)] : [];
	}

	case 'section': {
		const built = buildSection(block, ctx);
		if (!built) return [];
		return Array.isArray(built) ? built : [built];
	}

	case 'gallery': {
		const gallery = buildGallery(block, ctx);
		return gallery ? [gallery] : [];
	}

	case 'select': {
		const select = buildSelect(block, ctx);
		return select ? [new ActionRowBuilder().setComponents([select])] : [];
	}

	case 'footer': {
		if (!ctx.guild?.footer) return [];
		return [new TextDisplayBuilder().setContent(`-# ${ctx.guild.footer}`)];
	}

	case 'mentions': {
		const content = buildMentionsText(ctx);
		return content?.trim() ? [new TextDisplayBuilder().setContent(content)] : [];
	}

	case 'answers': {
		const content = buildAnswersText(ctx);
		return content ? [new TextDisplayBuilder().setContent(content)] : [];
	}

	case 'controls':
		return buildControls(block, ctx);

	case 'container': {
		const container = new ContainerBuilder();
		const colour = resolveColour(block.accentColour, ctx.guild?.primaryColour);
		if (colour !== null) container.setAccentColor(colour);
		if (block.spoiler) container.setSpoiler(true);

		let added = 0;
		for (const child of block.blocks ?? []) {
			for (const built of buildBlock(child, ctx)) {
				if (built instanceof ActionRowBuilder) container.addActionRowComponents(built);
				else if (built instanceof SectionBuilder) container.addSectionComponents(built);
				else if (built instanceof SeparatorBuilder) container.addSeparatorComponents(built);
				else if (built instanceof MediaGalleryBuilder) container.addMediaGalleryComponents(built);
				else if (built instanceof TextDisplayBuilder) container.addTextDisplayComponents(built);
				else continue;
				added++;
			}
		}

		return added ? [container] : [];
	}

	default:
		// Forward compatibility: a layout written by a newer bot renders degraded
		// rather than failing outright (which, for an opening message, would mean
		// no ticket at all).
		return [];
	}
};

/**
 * Render a layout into a message payload.
 *
 * @param {object} layout
 * @param {object} ctx
 * @param {'panel'|'opening'} ctx.kind
 * @param {Function} ctx.getMessage from `client.i18n.getLocale(settings.locale)`
 * @param {{primaryColour: string, footer: ?string}} ctx.guild
 * @param {Map<number, object>} ctx.categories categories this message may reference
 * @param {object} [ctx.vars] substitution variables
 * @param {object} [ctx.opening] per-ticket context for the dynamic blocks
 * @returns {{components: Array, flags: number, allowedMentions: object}}
 */
const buildMessage = (layout, ctx) => {
	if (layout?.version > LAYOUT_VERSION) {
		throw new LayoutError([{
			code: 'unsupported',
			message: `Layout version ${layout.version} is newer than this bot supports (${LAYOUT_VERSION}). Update the bot.`,
			path: 'version',
		}]);
	}

	// A ticket button's label, emoji and colour used to depend on how many
	// categories the whole message referenced, which meant walking the tree to
	// count them first. `buildButton` no longer cares — see the comment there —
	// so the walk is gone with it.
	const renderCtx = {
		...ctx,
		vars: ctx.vars ?? {},
	};

	const components = [];
	for (const block of layout?.blocks ?? []) {
		components.push(...buildBlock(block, renderCtx));
	}

	// Mention parsing is normally derived from `content`, which a Components v2
	// message cannot have — without this, role pings in a TextDisplay are inert
	// and staff silently stop being notified.
	const allowedMentions = {
		roles: [...new Set(ctx.opening?.pingRoles ?? [])].map(String),
		users: ctx.opening?.creatorId ? [String(ctx.opening.creatorId)] : [],
	};

	return {
		allowedMentions,
		components,
		flags: MessageFlags.IsComponentsV2,
	};
};

module.exports = {
	BLOCK_TYPES,
	BUTTON_KINDS,
	DM_BUTTON_HELP,
	LAYOUT_VERSION,
	LIMITS,
	LayoutError,
	NODE_TARGET_KINDS,
	buildMessage,
	collectLayoutButtons,
	countComponents,
	countText,
	defaultMessageLayout,
	defaultOpeningLayout,
	defaultPanelLayout,
	hasPlaceholder,
	isHttpUrl,
	needsStats,
	newLayout,
	resolveColour,
	substitute,
	validateLayout,
};
