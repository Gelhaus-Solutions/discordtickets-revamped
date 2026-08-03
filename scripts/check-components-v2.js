const assert = require('assert');
const path = require('path');
const djs = require('discord.js');
const v2 = require(path.join(__dirname, '..', 'src', 'lib', 'components-v2'));
const emojiLib = require(path.join(__dirname, '..', 'src', 'lib', 'emoji'));

const messages = {
	'buttons.claim.emoji': '🙌',
	'buttons.claim.text': 'Claim',
	'buttons.close.emoji': '✖️',
	'buttons.close.text': 'Close',
	'buttons.create.emoji': '🎫',
	'buttons.create.text': 'Create a ticket',
	'buttons.edit.emoji': '✏️',
	'buttons.edit.text': 'Edit',
	'buttons.unclaim.emoji': '🙌',
	'buttons.unclaim.text': 'Unclaim',
	'menus.category.placeholder': 'Select a category',
	'ticket.answers.no_value': '*No response*',
	'ticket.opening_message.fields.topic': 'Topic',
};
const getMessage = (key, vars = {}) => {
	if (key === 'ticket.opening_message.content') return `${vars.staff}\n${vars.creator} has created a new ticket`;
	return messages[key] ?? `<<${key}>>`;
};

const categories = new Map([
	[1, {
		description: 'Get help',
		emoji: 'question',
		id: 1,
		name: 'Support',
	}],
	[2, {
		description: 'Report a bug',
		emoji: '123456789012345678',
		id: 2,
		name: 'Bugs',
	}],
]);

const guild = {
	footer: 'Discord Tickets',
	primaryColour: '#009999',
};
const baseCtx = {
	categories,
	getMessage,
	guild,
};

let pass = 0;
const t = (name, fn) => {
	try {
		fn();
		pass++;
		console.log('  ok  ', name);
	} catch (e) {
		console.log('  FAIL', name, '\n       ', e.message);
		process.exitCode = 1;
	}
};

console.log('\n== panel: every block type ==');
const fullPanel = {
	blocks: [{
		accentColour: '#ff0000',
		blocks: [
			{
				content: '## Support\nPick a category',
				id: 'a',
				type: 'text',
			},
			{
				accessory: {
					kind: 'thumbnail',
					url: 'https://example.com/t.png',
				},
				id: 'b',
				text: ['Side text'],
				type: 'section',
			},
			{
				id: 'c',
				items: [{ url: 'https://example.com/1.png' }, { url: 'https://example.com/2.png' }],
				type: 'gallery',
			},
			{
				divider: true,
				id: 'd',
				spacing: 'large',
				type: 'separator',
			},
			{
				buttons: [{
					categoryId: 1,
					kind: 'ticket',
				}, {
					categoryId: 2,
					kind: 'ticket',
				}],
				id: 'e',
				type: 'buttons',
			},
			{
				id: 'f',
				type: 'footer',
			},
		],
		id: 'root',
		type: 'container',
	}],
	version: 1,
};

t('validates', () => v2.validateLayout(fullPanel, {
	categoryIds: categories,
	kind: 'panel',
}));

let built;
t('builds', () => {
	built = v2.buildMessage(fullPanel, {
		...baseCtx,
		kind: 'panel',
	});
	assert.strictEqual(built.flags, djs.MessageFlags.IsComponentsV2);
	assert.strictEqual(built.components.length, 1);
});

t('serialises to a valid API payload', () => {
	const json = built.components.map(c => c.toJSON());
	assert.strictEqual(json[0].type, 17, 'container type 17');
	assert.strictEqual(json[0].accent_color, 0xff0000);
	const kids = json[0].components.map(c => c.type);
	assert.deepStrictEqual(kids, [10, 9, 12, 14, 1, 10], 'text, section, gallery, separator, row, footer text');
	console.log('       child types:', JSON.stringify(kids));
});

t('custom_id is byte-identical to the legacy format', () => {
	const row = built.components[0].toJSON().components.find(c => c.type === 1);
	assert.strictEqual(row.components[0].custom_id, JSON.stringify({
		action: 'create',
		target: 1,
	}));
	assert.strictEqual(row.components[1].custom_id, JSON.stringify({
		action: 'create',
		target: 2,
	}));
});

t('buttons use category names + emoji', () => {
	const row = built.components[0].toJSON().components.find(c => c.type === 1);
	assert.strictEqual(row.components[0].label, 'Support');
	assert.strictEqual(row.components[0].style, 1, 'primary');
	assert.strictEqual(row.components[0].emoji.name, '❓');
	assert.strictEqual(row.components[1].emoji.id, '123456789012345678');
});

// Regression: a panel referencing exactly one category used to ignore the
// category's name, emoji and the dashboard's own preview, and post the generic
// localised "🎫 Create a ticket" instead — with no way to override it short of
// typing a label. The count of referenced categories no longer changes anything.
t('a single-category panel still uses the category name and emoji', () => {
	const one = {
		blocks: [{
			buttons: [{
				categoryId: 1,
				kind: 'ticket',
			}],
			id: 'x',
			type: 'buttons',
		}],
		version: 1,
	};
	const out = v2.buildMessage(one, {
		...baseCtx,
		kind: 'panel',
	});
	const row = out.components[0].toJSON();
	assert.strictEqual(row.components[0].label, 'Support');
	assert.strictEqual(row.components[0].emoji.name, '❓');
	assert.strictEqual(row.components[0].style, 1, 'primary');
});

t('an explicit label, emoji and style still win over the category', () => {
	const one = {
		blocks: [{
			buttons: [{
				categoryId: 1,
				emoji: '🔥',
				kind: 'ticket',
				label: 'Ask for help',
				style: 'danger',
			}],
			id: 'x',
			type: 'buttons',
		}],
		version: 1,
	};
	const row = v2.buildMessage(one, {
		...baseCtx,
		kind: 'panel',
	}).components[0].toJSON();
	assert.strictEqual(row.components[0].label, 'Ask for help');
	assert.strictEqual(row.components[0].emoji.name, '🔥');
	assert.strictEqual(row.components[0].style, 4, 'danger');
});

console.log('\n== select menu ==');
t('builds a select with all categories', () => {
	const l = {
		blocks: [{
			categoryIds: null,
			id: 's',
			type: 'select',
		}],
		version: 1,
	};
	v2.validateLayout(l, {
		categoryIds: categories,
		kind: 'panel',
	});
	const out = v2.buildMessage(l, {
		...baseCtx,
		kind: 'panel',
	}).components[0].toJSON();
	assert.strictEqual(out.components[0].custom_id, JSON.stringify({ action: 'create' }));
	assert.strictEqual(out.components[0].options.length, 2);
	assert.strictEqual(out.components[0].options[0].value, '1');
});

console.log('\n== opening message ==');
const opening = v2.defaultOpeningLayout('Hello {name}, ticket #{num}!', { image: 'https://example.com/cat.png' });

t('default layout validates', () => v2.validateLayout(opening, {
	categoryIds: categories,
	kind: 'opening',
}));

t('substitutes vars and resolves {avatar} into a thumbnail', () => {
	const out = v2.buildMessage(opening, {
		...baseCtx,
		kind: 'opening',
		opening: {
			answers: [{
				label: 'What is wrong?',
				value: 'It broke',
			}],
			claimed: false,
			creatorId: '111',
			pingRoles: ['222'],
			showClaim: true,
			showClose: true,
			showCloseReason: true,
			showEdit: true,
		},
		vars: {
			avatar: 'https://cdn.example.com/a.png',
			name: '<@111>',
			num: 7,
		},
	});
	const json = out.components.map(c => c.toJSON());
	assert.strictEqual(json[0].type, 10, 'mentions -> text display');
	assert.ok(json[0].content.includes('<@&222>'), 'role ping present');
	assert.strictEqual(json[1].type, 17, 'container');
	const section = json[1].components[0];
	assert.strictEqual(section.type, 9);
	assert.ok(section.components[0].content.includes('Hello <@111>, ticket #7!'), 'substituted: ' + section.components[0].content);
	assert.strictEqual(section.accessory.type, 11, 'thumbnail accessory');
	assert.strictEqual(section.accessory.media.url, 'https://cdn.example.com/a.png');
	assert.ok(json[1].components.some(c => c.type === 12), 'category image gallery');
	assert.ok(json[1].components.some(c => c.type === 10 && c.content.includes('What is wrong?')), 'answers');
	assert.strictEqual(json[1].accent_color, 0x009999, 'inherits guild colour');
	assert.strictEqual(json[2].type, 1, 'controls row');
	assert.deepStrictEqual(json[2].components.map(c => JSON.parse(c.custom_id).action),
		['edit', 'claim', 'close', 'close-reason']);
});

t('claimed state flips claim -> unclaim', () => {
	const out = v2.buildMessage(opening, {
		...baseCtx,
		kind: 'opening',
		opening: {
			claimed: true,
			creatorId: '111',
			pingRoles: [],
			showClaim: true,
			showClose: true,
		},
		vars: {},
	});
	const row = out.components.find(c => c.toJSON().type === 1).toJSON();
	assert.deepStrictEqual(row.components.map(c => JSON.parse(c.custom_id).action), ['unclaim', 'close']);
});

t('custom automation buttons render in a second controls row', () => {
	const withButtons = JSON.parse(JSON.stringify(opening));
	const controls = withButtons.blocks.find(b => b.type === 'controls');
	controls.buttons = [{
		emoji: '🔒',
		kind: 'automation',
		label: 'Escalate',
		style: 'danger',
	}];
	controls.buttons[0].automationKey = 'abc123';

	v2.validateLayout(withButtons, {
		automationKeys: new Set(['abc123']),
		categoryIds: categories,
		kind: 'opening',
	});

	const out = v2.buildMessage(withButtons, {
		...baseCtx,
		kind: 'opening',
		opening: {
			creatorId: '111',
			pingRoles: [],
			showClaim: true,
			showClose: true,
		},
		vars: {},
	});
	const rows = out.components.filter(c => c.toJSON().type === 1).map(c => c.toJSON());
	assert.strictEqual(rows.length, 2, 'built-ins and custom buttons are separate rows');
	assert.deepStrictEqual(rows[0].components.map(c => JSON.parse(c.custom_id).action), ['claim', 'close']);
	assert.strictEqual(rows[1].components[0].label, 'Escalate');
	assert.strictEqual(rows[1].components[0].style, 4, 'danger');
	assert.deepStrictEqual(JSON.parse(rows[1].components[0].custom_id), {
		action: 'auto',
		k: 'abc123',
	});
});

t('a controls block with no built-in buttons still renders its custom row', () => {
	const withButtons = JSON.parse(JSON.stringify(opening));
	withButtons.blocks.find(b => b.type === 'controls').buttons = [{
		automationKey: 'abc123',
		kind: 'automation',
		label: 'Escalate',
	}];
	const out = v2.buildMessage(withButtons, {
		...baseCtx,
		kind: 'opening',
		opening: {
			creatorId: '111',
			pingRoles: [],
		},
		vars: {},
	});
	const rows = out.components.filter(c => c.toJSON().type === 1).map(c => c.toJSON());
	assert.strictEqual(rows.length, 1);
	assert.strictEqual(rows[0].components[0].label, 'Escalate');
});

t('allowedMentions carries the pings', () => {
	const out = v2.buildMessage(opening, {
		...baseCtx,
		kind: 'opening',
		opening: {
			creatorId: '111',
			pingRoles: ['222', '333'],
		},
		vars: {},
	});
	assert.deepStrictEqual(out.allowedMentions, {
		roles: ['222', '333'],
		users: ['111'],
	});
});

t('unresolved {avatar} degrades the section to plain text', () => {
	const out = v2.buildMessage(opening, {
		...baseCtx,
		kind: 'opening',
		opening: {},
		vars: {},
	});
	const container = out.components.find(c => c.toJSON().type === 17).toJSON();
	assert.strictEqual(container.components[0].type, 10, 'became a text display, not an invalid section');
});

t('long answers are clamped under the text budget', () => {
	const out = v2.buildMessage(opening, {
		...baseCtx,
		kind: 'opening',
		opening: {
			answers: [{
				label: 'Q',
				value: 'x'.repeat(4000),
			}],
			creatorId: '1',
			pingRoles: [],
		},
		vars: { avatar: 'https://cdn.example.com/a.png' },
	});
	const total = JSON.stringify(out.components.map(c => c.toJSON()))
		.match(/"content":"(?:[^"\\]|\\.)*"/g).join('').length;
	assert.ok(total < 4000, 'total text ' + total);
});

console.log('\n== validation ==');
const expectFail = (name, layout, kind, code) => t(name, () => {
	try {
		v2.validateLayout(layout, {
			categoryIds: categories,
			kind,
		});
		throw new Error('expected LayoutError');
	} catch (e) {
		assert.strictEqual(e.name, 'LayoutError', 'got ' + e.message);
		assert.ok(e.errors.some(x => x.code === code), `expected ${code}, got ${JSON.stringify(e.errors.map(x => x.code))}`);
	}
});

expectFail('rejects nested containers', {
	blocks: [{
		accentColour: null,
		blocks: [{
			accentColour: null,
			blocks: [{
				content: 'x',
				id: 'i',
				type: 'container',
			}],
			id: 'n',
			type: 'container',
		}],
		id: 'o',
		type: 'container',
	}],
	version: 1,
}, 'panel', 'nested_container');

expectFail('rejects a panel with no entry point', {
	blocks: [{
		content: 'just text',
		id: 'a',
		type: 'text',
	}],
	version: 1,
}, 'panel', 'no_entry_point');

expectFail('rejects unknown categories', {
	blocks: [{
		buttons: [{
			categoryId: 99,
			kind: 'ticket',
		}],
		id: 'a',
		type: 'buttons',
	}],
	version: 1,
}, 'panel', 'unknown_category');

expectFail('rejects bad emoji (replaces the old rawError parser)', {
	blocks: [{
		buttons: [{
			categoryId: 1,
			emoji: 'not-an-emoji',
			kind: 'ticket',
		}],
		id: 'a',
		type: 'buttons',
	}],
	version: 1,
}, 'panel', 'invalid_emoji');

expectFail('rejects non-http urls', {
	blocks: [{
		id: 'a',
		items: [{ url: 'javascript:alert(1)' }],
		type: 'gallery',
	},
	{
		buttons: [{
			categoryId: 1,
			kind: 'ticket',
		}],
		id: 'b',
		type: 'buttons',
	}],
	version: 1,
}, 'panel', 'invalid_url');

expectFail('rejects 6 buttons in a row', {
	blocks: [{
		buttons: Array.from({ length: 6 }, () => ({
			categoryId: 1,
			kind: 'ticket',
		})),
		id: 'a',
		type: 'buttons',
	}],
	version: 1,
}, 'panel', 'too_many');

expectFail('rejects over-budget text', {
	blocks: [{
		content: 'x'.repeat(4001),
		id: 'a',
		type: 'text',
	},
	{
		buttons: [{
			categoryId: 1,
			kind: 'ticket',
		}],
		id: 'b',
		type: 'buttons',
	}],
	version: 1,
}, 'panel', 'too_much_text');

expectFail('rejects over-budget components', {
	blocks: Array.from({ length: 11 }, (_, i) => ({
		content: 'x',
		id: 'b' + i,
		type: 'text',
	})),
	version: 1,
}, 'panel', 'too_many');

expectFail('rejects a ticket button in the ticket controls', {
	blocks: [{
		buttons: [{
			categoryId: 1,
			kind: 'ticket',
		}],
		id: 'a',
		type: 'controls',
	}],
	version: 1,
}, 'opening', 'invalid');

expectFail('rejects more custom controls buttons than fit a row', {
	blocks: [{
		buttons: Array.from({ length: 6 }, (_, i) => ({
			automationKey: 'k' + i,
			kind: 'automation',
			label: 'x',
		})),
		id: 'a',
		type: 'controls',
	}],
	version: 1,
}, 'opening', 'too_many');

t('rejects a controls button pointing at an automation that does not exist', () => {
	try {
		v2.validateLayout({
			blocks: [{
				buttons: [{
					automationKey: 'gone',
					kind: 'automation',
					label: 'x',
				}],
				id: 'a',
				type: 'controls',
			}],
			version: 1,
		}, {
			automationKeys: new Set(['abc123']),
			categoryIds: categories,
			kind: 'opening',
		});
		throw new Error('expected LayoutError');
	} catch (e) {
		assert.strictEqual(e.name, 'LayoutError', 'got ' + e.message);
		assert.ok(e.errors.some(x => x.code === 'unknown_automation'), JSON.stringify(e.errors));
	}
});

expectFail('rejects opening-only blocks in a panel', {
	blocks: [{
		id: 'a',
		type: 'controls',
	}],
	version: 1,
}, 'panel', 'not_allowed');

expectFail('rejects a select in an opening message', {
	blocks: [{
		categoryIds: null,
		id: 'a',
		type: 'select',
	}],
	version: 1,
}, 'opening', 'not_allowed');

expectFail('rejects a future layout version', {
	blocks: [{
		buttons: [{
			categoryId: 1,
			kind: 'ticket',
		}],
		id: 'a',
		type: 'buttons',
	}],
	version: 99,
}, 'panel', 'unsupported');

console.log('\n== forward compat & helpers ==');
t('the opener family names the ticket creator, not the actor', () => {
	const vars = {
		displayname: 'Staffy',
		name: 'staff',
		num: 7,
		opener: 'member',
		openerdisplayname: 'Member Nick',
		openermention: '<@111>',
	};
	assert.strictEqual(
		v2.substitute('{name} closed #{num} for {openerdisplayname} ({opener}) {openermention}', vars),
		'staff closed #7 for Member Nick (member) <@111>',
	);
	// The opener has no nickname set: fall back to the username, never to the
	// person who pressed the button.
	assert.strictEqual(v2.substitute('{openerdisplayname}', {
		name: 'staff',
		opener: 'member',
	}), 'member');
	// No ticket in the run, so it renders empty rather than leaking the actor.
	assert.strictEqual(v2.substitute('[{opener}]', { name: 'staff' }), '[]');
});

t('substitution does not substitute into its own output', () => {
	// A member called "{match1}" must not pick up what a message pattern caught.
	const out = v2.substitute('{displayname} said {match1}', {
		displayname: '{match1}',
		match1: 'hello',
	});
	assert.strictEqual(out, '{match1} said hello');
});

t('unknown block types are skipped, not fatal', () => {
	const out = v2.buildMessage({
		blocks: [{
			id: 'a',
			type: 'hologram',
		}, {
			content: 'ok',
			id: 'b',
			type: 'text',
		}],
		version: 1,
	},
	{
		...baseCtx,
		kind: 'panel',
	});
	assert.strictEqual(out.components.length, 1);
});

t('needsStats detects stats vars anywhere in a layout', () => {
	assert.strictEqual(v2.needsStats(v2.defaultOpeningLayout('avg {avgResponseTime}')), true);
	assert.strictEqual(v2.needsStats(v2.defaultOpeningLayout('plain')), false);
});

t('resolveColour handles hex, names and junk', () => {
	assert.strictEqual(v2.resolveColour('#009999'), 0x009999);
	assert.strictEqual(v2.resolveColour('Red'), 0xed4245);
	assert.strictEqual(v2.resolveColour('garbage', '#009999'), 0x009999);
	assert.strictEqual(v2.resolveColour(null, null), null);
});

t('defaultPanelLayout reproduces a legacy MENU panel', () => {
	const l = v2.defaultPanelLayout({
		categories: [1, 2],
		description: 'd',
		image: 'https://e.com/i.png',
		title: 'T',
		type: 'MENU',
	});
	v2.validateLayout(l, {
		categoryIds: categories,
		kind: 'panel',
	});
	assert.ok(JSON.stringify(l).includes('"select"'));
});

console.log('\n== emoji resolution ==');
// Regression guard. node-emoji 1.11's dataset does not contain bare `💁` (it only
// maps the gendered `💁‍♀️`) nor any skin-tone sequence, so the old
// `hasEmoji(x) ? get(x) : {id: x}` idiom sent `{id: '💁'}` to Discord and the
// whole message was rejected with `Value "💁" is not snowflake`.
t('literal Unicode emoji missing from node-emoji still resolve', () => {
	for (const e of ['💁', '👍🏽', '🏳️‍🌈', '🎫']) {
		assert.deepStrictEqual(emojiLib.resolveEmoji(e), { name: e }, `${e} should be a Unicode emoji`);
		assert.strictEqual(emojiLib.isValidEmoji(e), true, `${e} should validate`);
	}
});

t('custom emoji IDs and tags still resolve to IDs', () => {
	assert.deepStrictEqual(emojiLib.resolveEmoji('123456789012345678'), { id: '123456789012345678' });
	assert.strictEqual(emojiLib.resolveEmoji('<a:spin:123456789012345678>').id, '123456789012345678');
	assert.strictEqual(emojiLib.resolveEmoji('<a:spin:123456789012345678>').animated, true);
});

t('shortcodes still expand', () => {
	assert.deepStrictEqual(emojiLib.resolveEmoji('question'), { name: '❓' });
	assert.deepStrictEqual(emojiLib.resolveEmoji(':question:'), { name: '❓' });
});

t('junk is still rejected', () => {
	assert.strictEqual(emojiLib.isValidEmoji('not-an-emoji'), false);
	assert.strictEqual(emojiLib.isValidEmoji(''), false);
	assert.strictEqual(emojiLib.resolveEmoji(null), null);
});

t('a 💁 category emoji survives a real panel build', () => {
	const cats = new Map([
		[1, {
			description: 'Get help',
			emoji: '💁',
			id: 1,
			name: 'Support',
		}],
		[2, {
			description: 'Report a bug',
			emoji: '👍🏽',
			id: 2,
			name: 'Bugs',
		}],
	]);
	const layout = {
		blocks: [{
			buttons: [
				{
					categoryId: 1,
					kind: 'ticket',
				},
				{
					categoryId: 2,
					kind: 'ticket',
				},
			],
			id: 'a',
			type: 'buttons',
		}],
		version: 1,
	};
	v2.validateLayout(layout, {
		categoryIds: cats,
		kind: 'panel',
	});
	const row = v2.buildMessage(layout, {
		...baseCtx,
		categories: cats,
		kind: 'panel',
	}).components[0].toJSON();
	// The bug: these used to be `{id: '💁'}` / `{id: '👍🏽'}`, which Discord rejects
	// with `Value "💁" is not snowflake`, failing the whole panel send.
	assert.strictEqual(row.components[0].emoji.name, '💁');
	assert.strictEqual(row.components[0].emoji.id, undefined);
	assert.strictEqual(row.components[1].emoji.name, '👍🏽');
	assert.strictEqual(row.components[1].emoji.id, undefined);
});

console.log(`\n${pass} checks passed${process.exitCode ? ' (with failures above)' : ''}\n`);
