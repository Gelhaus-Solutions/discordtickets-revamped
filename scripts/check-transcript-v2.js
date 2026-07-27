// Round-trips a real opening message through the archiver's serialisation and
// into the transcript renderer, then checks the HTML actually contains the
// message. Before this renderer existed, a v2 message produced a blank gap.
const assert = require('assert');
const path = require('path');
const REPO = path.join(__dirname, '..');
const v2 = require(path.join(REPO, 'src', 'lib', 'components-v2'));

const { renderComponents } = require(path.join(REPO, 'src', 'lib', 'tickets', 'transcript-html'));

const messages = {
	'buttons.claim.emoji': '🙌',
	'buttons.claim.text': 'Claim',
	'buttons.close.emoji': '✖️',
	'buttons.close.text': 'Close',
	'buttons.edit.emoji': '✏️',
	'buttons.edit.text': 'Edit',
};
const getMessage = (key, vars = {}) =>
	key === 'ticket.opening_message.content'
		? `${vars.staff}\n${vars.creator} has created a new ticket`
		: messages[key] ?? `<<${key}>>`;

const layout = v2.defaultOpeningLayout('Hello {name}, welcome to ticket #{num}! **Read the rules.**', { image: 'https://cdn.discordapp.com/cat.png' });

const payload = v2.buildMessage(layout, {
	categories: new Map(),
	getMessage,
	guild: {
		footer: 'Discord Tickets',
		primaryColour: '#009999',
	},
	kind: 'opening',
	opening: {
		answers: [{
			label: 'What is wrong?',
			value: 'Everything is on fire',
		}],
		claimed: false,
		creatorId: '444',
		pingRoles: ['333'],
		showClaim: true,
		showClose: true,
		showEdit: true,
	},
	vars: {
		avatar: 'https://cdn.discordapp.com/avatar.png',
		name: '<@444>',
		num: 42,
	},
});

// Exactly what archiver.js stores: JSON of the resolved components.
const archived = JSON.parse(JSON.stringify(payload.components.map(c => c.toJSON())));
const html = renderComponents(archived);

let fail = 0;
const check = (name, fn) => {
	try {
		fn();
		console.log('  ok  ', name);
	} catch (e) {
		fail++;
		console.log('  FAIL', name, '\n       ', e.message);
	}
};

console.log('\n== transcript rendering of a v2 opening message ==');

check('produces non-empty HTML', () => assert.ok(html.length > 100, `only ${html.length} chars`));
check('renders the opening message text', () => assert.ok(html.includes('welcome to ticket #42'), html.slice(0, 200)));
check('renders markdown', () => assert.ok(html.includes('<strong>Read the rules.</strong>')));
check('renders the ping line as a role mention', () => assert.ok(html.includes('role-mention') && html.includes('@333'), html.slice(0, 300)));
check('renders the creator avatar thumbnail', () => assert.ok(html.includes('cdn.discordapp.com/avatar.png')));
check('renders the category image gallery', () => assert.ok(html.includes('cdn.discordapp.com/cat.png')));
check('renders the answers', () => assert.ok(html.includes('What is wrong?') && html.includes('Everything is on fire')));
check('renders the container accent colour', () => assert.ok(html.includes('#009999'), 'accent colour missing'));
check('renders the buttons', () => assert.ok(html.includes('Close') && html.includes('Claim')));
check('renders a separator', () => assert.ok(html.includes('v2-separator')));

console.log('\n== safety ==');
check('rejects a data: URI in a thumbnail', () => {
	const out = renderComponents([{
		accessory: {
			media: { url: 'data:text/html;base64,PHNjcmlwdD4=' },
			type: 11,
		},
		components: [{
			content: 'hi',
			type: 10,
		}],
		type: 9,
	}]);
	assert.ok(!out.includes('data:'), out);
});
check('rejects a javascript: URI in a gallery', () => {
	const out = renderComponents([{
		items: [{ media: { url: 'javascript:alert(1)' } }],
		type: 12,
	}]);
	assert.ok(!out.includes('javascript:'), out);
});
check('clamps a bogus accent colour instead of injecting it', () => {
	const out = renderComponents([{
		accent_color: 'red; background:url(x)',
		components: [{
			content: 'x',
			type: 10,
		}],
		type: 17,
	}]);
	assert.ok(out.includes('#5865F2'), out);
	assert.ok(!out.includes('background:url'), out);
});
check('escapes HTML in text', () => {
	const out = renderComponents([{
		content: '<img src=x onerror=alert(1)>',
		type: 10,
	}]);
	assert.ok(!out.includes('<img src=x'), out);
	assert.ok(out.includes('&lt;img'), out);
});
check('skips unknown component types without throwing', () => {
	const out = renderComponents([{ type: 999 }, {
		content: 'still here',
		type: 10,
	}]);
	assert.ok(out.includes('still here'));
});

console.log('\n== embeds ==');

const { Embed } = require('discord.js');
const { renderEmbed } = require(path.join(REPO, 'src', 'lib', 'tickets', 'transcript-html'));

const sampleEmbed = {
	author: {
		icon_url: 'https://cdn.discordapp.com/a.png',
		name: 'Tickets',
	},
	color: 0x009999,
	description: 'Closed by **staff**',
	fields: [{
		inline: false,
		name: 'Reason',
		value: 'Resolved',
	}],
	footer: {
		icon_url: 'https://cdn.discordapp.com/f.png',
		text: 'Discord Tickets',
	},
	image: { url: 'https://cdn.discordapp.com/i.png' },
	title: 'Ticket closed',
};

const expectRendered = (name, shape) => check(name, () => {
	const out = renderEmbed(shape);
	assert.ok(out.includes('Ticket closed'), `title missing: ${out.slice(0, 160)}`);
	assert.ok(out.includes('Closed by <strong>staff</strong>'), 'description/markdown missing');
	assert.ok(out.includes('Resolved'), 'fields missing');
	assert.ok(out.includes('#009999'), 'colour missing');
	assert.ok(out.includes('Discord Tickets'), 'footer missing');
});

// The shape every transcript archived before the archiver fix contains. It used
// to render as an empty coloured box, so bot messages with no text of their own
// disappeared from the transcript entirely.
expectRendered('legacy { data: … } archives still render', { data: sampleEmbed });
expectRendered('flat API JSON (what is archived now) renders', sampleEmbed);
expectRendered('camelCase icon fields render', {
	...sampleEmbed,
	author: {
		iconURL: 'https://cdn.discordapp.com/a.png',
		name: 'Tickets',
	},
	footer: {
		iconURL: 'https://cdn.discordapp.com/f.png',
		text: 'Discord Tickets',
	},
});

check('a real discord.js Embed spread the old way still renders', () => {
	const received = new Embed(sampleEmbed);
	assert.ok(renderEmbed({ ...received }).includes('Ticket closed'));
});

check('an empty embed renders nothing rather than an empty box', () => {
	assert.strictEqual(renderEmbed({}), '');
	assert.strictEqual(renderEmbed({ data: {} }), '');
	assert.strictEqual(renderEmbed(null), '');
});

check('embed images reject non-http URIs', () => {
	const out = renderEmbed({
		image: { url: 'data:text/html;base64,PHNjcmlwdD4=' },
		title: 'x',
	});
	assert.ok(!out.includes('data:'), out);
});

console.log(fail ? `\n${fail} failure(s)\n` : '\nall transcript checks pass\n');
process.exitCode = fail ? 1 : 0;
