import { v4 as uuid } from 'uuid';

/**
 * Block-layout definitions for the editor.
 *
 * This mirrors `src/lib/components-v2.js` on the bot side. The two cannot share
 * a module — the bot is CommonJS and the dashboard is an independent ESM app
 * with its own package.json — so this copy is limits-and-shapes only: it exists
 * to keep the editor honest about what will be accepted, and the server stays
 * the authority. If you change a limit here, change it there too.
 */

export const LAYOUT_VERSION = 1;

export const LIMITS = {
	answersText: 1500,
	components: 40,
	galleryItems: 10,
	rowButtons: 5,
	sectionText: 3,
	selectOptions: 25,
	text: 4000,
	topBlocks: 10
};

/** Human-facing metadata, also used to build the "add block" menu. */
export const BLOCK_META = {
	answers: {
		description: 'The topic, or the answers to this category’s questions.',
		dynamic: true,
		icon: 'fa-list-check',
		label: 'Answers'
	},
	buttons: {
		description: 'A row of up to 5 buttons.',
		icon: 'fa-hand-pointer',
		label: 'Buttons'
	},
	container: {
		description: 'A coloured box that groups other blocks.',
		icon: 'fa-square',
		label: 'Container'
	},
	controls: {
		description: 'The Claim / Close / Edit buttons, plus any automation buttons you add.',
		dynamic: true,
		icon: 'fa-sliders',
		label: 'Ticket controls'
	},
	footer: {
		description: 'Your server’s footer text, in small print.',
		icon: 'fa-shoe-prints',
		label: 'Footer'
	},
	gallery: {
		description: 'Up to 10 images in a grid.',
		icon: 'fa-images',
		label: 'Images'
	},
	mentions: {
		description: 'The ping line: the ticket creator and your staff roles.',
		dynamic: true,
		icon: 'fa-at',
		label: 'Mentions'
	},
	section: {
		description: 'Text with an image or a button beside it.',
		icon: 'fa-align-left',
		label: 'Text with accessory'
	},
	select: {
		description: 'A dropdown of ticket categories.',
		icon: 'fa-caret-down',
		label: 'Select menu'
	},
	separator: {
		description: 'A divider or some blank space.',
		icon: 'fa-minus',
		label: 'Separator'
	},
	text: {
		description: 'Markdown text.',
		icon: 'fa-font',
		label: 'Text'
	}
};

const STATIC_BLOCKS = ['container', 'text', 'separator', 'buttons', 'section', 'gallery', 'footer'];

/**
 * Which block types are allowed in which kind of message.
 * Mirrors `BLOCK_TYPES` in src/lib/components-v2.js — the server is the authority.
 */
export const BLOCK_TYPES = {
	closeRequest: [...STATIC_BLOCKS],
	dm: [...STATIC_BLOCKS],
	ephemeral: [...STATIC_BLOCKS],
	message: [...STATIC_BLOCKS],
	opening: [...STATIC_BLOCKS, 'mentions', 'answers', 'controls'],
	panel: [...STATIC_BLOCKS, 'select']
};

/**
 * Which button kinds are allowed in which kind of message.
 * Mirrors `BUTTON_KINDS` in src/lib/components-v2.js.
 *
 * A DM is not in any server, so the bot cannot tell which server an automation
 * or ticket button belongs to; the server rejects both, and offering them here
 * would only let an admin build something that fails on save.
 *
 * A close request refuses them for a different reason: the Accept and Reject
 * buttons are added by the bot and are the whole point of the message, so a
 * second thing to press would compete with the answer it is asking for.
 */
export const BUTTON_KINDS = {
	closeRequest: ['link'],
	dm: ['link'],
	ephemeral: ['ticket', 'link', 'automation'],
	message: ['ticket', 'link', 'automation'],
	opening: ['ticket', 'link', 'automation'],
	panel: ['ticket', 'link', 'automation']
};

/** Contexts where an automation button may continue *this* graph by node id. */
export const NODE_TARGET_KINDS = ['ephemeral', 'message'];

/** A new block of the given type, with sensible defaults. */
export function newBlock(type) {
	const base = { id: uuid(), type };
	switch (type) {
		case 'container':
			return { ...base, accentColour: null, blocks: [newBlock('text')] };
		case 'text':
			return { ...base, content: '' };
		case 'separator':
			return { ...base, divider: true, spacing: 'small' };
		case 'buttons':
			return { ...base, buttons: [] };
		case 'section':
			return {
				...base,
				accessory: { kind: 'thumbnail', url: '', description: '' },
				text: ['']
			};
		case 'gallery':
			return { ...base, items: [{ url: '', description: '' }] };
		case 'select':
			return { ...base, categoryIds: null, placeholder: null };
		case 'controls':
			// The built-in Claim/Close/Edit buttons are not configurable; these are
			// the admin's own automation buttons, shown in a row under them.
			return { ...base, buttons: [] };
		default:
			return base;
	}
}

export function newButton(kind = 'ticket') {
	if (kind === 'link') return { kind: 'link', url: '', label: '', emoji: null };
	// `nodeId` continues the automation being edited; `automationKey` starts a
	// different one. Exactly one is ever set — the server rejects both at once.
	if (kind === 'automation')
		return {
			kind: 'automation',
			automationKey: null,
			nodeId: null,
			style: 'primary',
			label: '',
			emoji: null
		};
	return {
		kind: 'ticket',
		categoryId: null,
		style: null,
		label: null,
		emoji: null
	};
}

export function newLayout() {
	return { version: LAYOUT_VERSION, blocks: [] };
}

/**
 * A brand-new automation message: one empty text block, nothing else.
 *
 * Mirrors `defaultMessageLayout` in src/lib/components-v2.js, which is also what
 * the v1 → v2 upgrade produces — so a node created here and a node migrated
 * there have the same shape.
 */
export function defaultMessageLayout() {
	return { version: LAYOUT_VERSION, blocks: [newBlock('text')] };
}

/**
 * The first thing wrong with a layout, phrased for a person, or null.
 *
 * A deliberate subset of the server's `validateLayout` — the rules someone hits
 * while building, so the canvas can mark the step before a round trip. The
 * server's 400 is still what stops a bad save.
 */
export function describeLayout(layout) {
	const blocks = layout?.blocks ?? [];
	if (blocks.length === 0) return 'The message is empty.';

	let problem = null;
	const walk = (list) => {
		for (const block of list ?? []) {
			if (problem) return;
			if (block?.type === 'container') {
				if ((block.blocks ?? []).length === 0)
					problem = 'A container needs at least one block.';
				else walk(block.blocks);
			} else if (block?.type === 'text') {
				if (!block.content?.trim()) problem = 'A text block has no content.';
			} else if (block?.type === 'section') {
				if (!(block.text ?? []).some((line) => line?.trim()))
					problem = 'A section needs at least one line of text.';
			} else if (block?.type === 'buttons') {
				if ((block.buttons ?? []).length === 0) problem = 'A button row has no buttons.';
			} else if (block?.type === 'gallery') {
				if ((block.items ?? []).length === 0) problem = 'An image block has no images.';
			}
		}
	};
	walk(blocks);
	return problem;
}

/** "3 blocks · 2 buttons · 41/4000 characters", for the collapsed layout field. */
export function summariseLayout(layout) {
	const blocks = layout?.blocks ?? [];
	let buttons = 0;
	const walk = (list) => {
		for (const block of list ?? []) {
			if (block?.type === 'container') walk(block.blocks);
			else if (block?.type === 'buttons' || block?.type === 'controls')
				buttons += block.buttons?.length ?? 0;
			else if (block?.type === 'section' && block.accessory?.kind === 'button') buttons += 1;
		}
	};
	walk(blocks);

	const parts = [`${blocks.length} block${blocks.length === 1 ? '' : 's'}`];
	if (buttons) parts.push(`${buttons} button${buttons === 1 ? '' : 's'}`);
	parts.push(`${countText(layout)}/${LIMITS.text} characters`);
	return parts.join(' · ');
}

/**
 * The layout equivalent of the pre-v2 opening message, used to seed the block
 * editor from a category's existing text so switching to it changes nothing.
 *
 * Mirrors `defaultOpeningLayout` in src/lib/components-v2.js.
 */
export function defaultOpeningLayout(openingMessage = '', { image = null } = {}) {
	const inner = [
		{
			...newBlock('section'),
			accessory: {
				kind: 'thumbnail',
				url: '{avatar}',
				description: 'Ticket creator'
			},
			text: [openingMessage || ' ']
		}
	];

	if (image)
		inner.push({
			...newBlock('gallery'),
			items: [{ url: image, description: '' }]
		});

	inner.push(newBlock('answers'), newBlock('separator'), newBlock('footer'));

	return {
		version: LAYOUT_VERSION,
		blocks: [
			newBlock('mentions'),
			{ ...newBlock('container'), accentColour: null, blocks: inner },
			newBlock('controls')
		]
	};
}

/**
 * Recursive component count, matching how Discord counts them.
 * Keep in sync with `countComponents` in src/lib/components-v2.js.
 */
export function countComponents(layout) {
	const count = (block) => {
		if (!block || typeof block !== 'object') return 0;
		switch (block.type) {
			case 'container':
				return 1 + (block.blocks ?? []).reduce((n, b) => n + count(b), 0);
			case 'buttons':
				return 1 + (block.buttons?.length ?? 0);
			case 'section':
				return 1 + (block.text?.length ?? 0) + (block.accessory ? 1 : 0);
			case 'select':
				return 2;
			case 'controls': {
				const custom = Math.min(block.buttons?.length ?? 0, LIMITS.rowButtons);
				return 5 + (custom ? 1 + custom : 0);
			}
			default:
				return 1;
		}
	};
	return (layout?.blocks ?? []).reduce((n, b) => n + count(b), 0);
}

/** Total characters across everything that becomes a text display. */
export function countText(layout) {
	const count = (block) => {
		if (!block || typeof block !== 'object') return 0;
		switch (block.type) {
			case 'container':
				return (block.blocks ?? []).reduce((n, b) => n + count(b), 0);
			case 'text':
				return (block.content ?? '').length;
			case 'section':
				return (block.text ?? []).join('\n').length;
			case 'answers':
				return LIMITS.answersText;
			default:
				return 0;
		}
	};
	return (layout?.blocks ?? []).reduce((n, b) => n + count(b), 0);
}

/** Does the layout contain at least one way to open a ticket? */
export function hasEntryPoint(layout) {
	let found = false;
	const walk = (blocks) => {
		for (const block of blocks ?? []) {
			if (found) return;
			if (block.type === 'container') walk(block.blocks);
			else if (block.type === 'select') found = true;
			else if (block.type === 'buttons') {
				if ((block.buttons ?? []).some((b) => b.kind === 'ticket')) found = true;
			} else if (block.type === 'section' && block.accessory?.kind === 'button') {
				if (block.accessory.button?.kind === 'ticket') found = true;
			}
		}
	};
	walk(layout?.blocks);
	return found;
}
