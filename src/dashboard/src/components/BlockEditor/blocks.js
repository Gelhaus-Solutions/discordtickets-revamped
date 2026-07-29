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

/** Which block types are allowed in which kind of message. */
export const BLOCK_TYPES = {
	opening: [...STATIC_BLOCKS, 'mentions', 'answers', 'controls'],
	panel: [...STATIC_BLOCKS, 'select']
};

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
	if (kind === 'automation')
		return { kind: 'automation', automationKey: null, style: 'primary', label: '', emoji: null };
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
