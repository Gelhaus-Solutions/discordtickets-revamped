/**
 * Checks the category-question contract: that every question type builds a modal
 * component Discord will accept, that a submission round-trips, and that a
 * stored answer renders as something a human can read.
 *
 * These stopped being cosmetic when questions stopped being text-only. A modal
 * Discord rejects fails at the moment a *member* clicks the button, not when the
 * admin saves the category, so the builder limits are asserted here rather than
 * discovered in production.
 */
const assert = require('assert');
const path = require('path');
const {
	ComponentType, ModalBuilder,
} = require('discord.js');

const lib = path.join(__dirname, '..', 'src', 'lib');
const questions = require(path.join(lib, 'tickets', 'questions'));
const emojiLib = require(path.join(lib, 'emoji'));
const {
	QuestionError, validateQuestions,
} = require(path.join(lib, 'questions-validate'));

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

const OPTIONS = [
	{
		emoji: 'rofl',
		id: 'o1',
		label: 'One',
		value: 'one',
	},
	{
		description: 'the second',
		id: 'o2',
		label: 'Two',
		value: 'two',
	},
];

const question = (type, extra = {}) => ({
	config: {},
	id: `q-${type}`,
	label: `A ${type} question`,
	maxLength: 1,
	minLength: 0,
	options: [],
	order: 0,
	placeholder: null,
	required: false,
	style: 2,
	type,
	value: null,
	...extra,
});

const ALL = [
	question('TEXT', {
		maxLength: 2000,
		minLength: 5,
		placeholder: 'Describe the problem',
		required: true,
		value: 'prefilled',
	}),
	question('MENU', {
		maxLength: 2,
		options: OPTIONS,
		placeholder: 'Pick some',
	}),
	question('RADIO_GROUP', {
		options: OPTIONS,
		required: true,
	}),
	question('CHECKBOX_GROUP', {
		maxLength: 2,
		options: OPTIONS,
	}),
	question('CHECKBOX', { config: { defaultChecked: true } }),
	question('USER_SELECT', { maxLength: 3 }),
	question('ROLE_SELECT', {}),
	question('MENTIONABLE_SELECT', { maxLength: 2 }),
	question('CHANNEL_SELECT', { config: { channelTypes: [0, 15] } }),
	question('FILE_UPLOAD', {
		config: {
			maxFiles: 5,
			minFiles: 0,
		},
	}),
	question('TEXT_DISPLAY', { config: { content: '**Read this first.**' } }),
];

const buildModal = qs => new ModalBuilder()
	.setCustomId('x')
	.setTitle('Test')
	.setComponents(questions.buildQuestionComponents(qs))
	.toJSON();

console.log('\n== every type builds a modal Discord accepts ==');

// `toJSON()` runs @discordjs/builders' validation, which is the same validation
// the REST call would fail on — so this passing means Discord will not reject it.
const modal = buildModal(ALL);

t('one component per question, in order', () => {
	assert.strictEqual(modal.components.length, ALL.length);
});

t('inputs are wrapped in Label components, not action rows', () => {
	const kinds = new Set(modal.components.map(c => c.type));
	assert.ok(!kinds.has(ComponentType.ActionRow), 'a modal action row is the legacy shape');
	assert.ok(kinds.has(ComponentType.Label));
});

t('each type maps to the right component', () => {
	const byLabel = Object.fromEntries(
		modal.components
			.filter(c => c.type === ComponentType.Label)
			.map(c => [c.label, c.component.type]),
	);
	assert.strictEqual(byLabel['A TEXT question'], ComponentType.TextInput);
	assert.strictEqual(byLabel['A MENU question'], ComponentType.StringSelect);
	assert.strictEqual(byLabel['A RADIO_GROUP question'], ComponentType.RadioGroup);
	assert.strictEqual(byLabel['A CHECKBOX_GROUP question'], ComponentType.CheckboxGroup);
	assert.strictEqual(byLabel['A CHECKBOX question'], ComponentType.Checkbox);
	assert.strictEqual(byLabel['A USER_SELECT question'], ComponentType.UserSelect);
	assert.strictEqual(byLabel['A ROLE_SELECT question'], ComponentType.RoleSelect);
	assert.strictEqual(byLabel['A MENTIONABLE_SELECT question'], ComponentType.MentionableSelect);
	assert.strictEqual(byLabel['A CHANNEL_SELECT question'], ComponentType.ChannelSelect);
	assert.strictEqual(byLabel['A FILE_UPLOAD question'], ComponentType.FileUpload);
});

t('a text display is a bare text block, not a labelled input', () => {
	const display = modal.components.find(c => c.type === ComponentType.TextDisplay);
	assert.ok(display, 'no TextDisplay component');
	assert.strictEqual(display.content, '**Read this first.**');
});

t('the Label description carries the question help text', () => {
	const [one] = questions.buildQuestionComponents([
		question('TEXT', { config: { description: 'Be specific' } }),
	]);
	assert.strictEqual(one.toJSON().description, 'Be specific');
});

t('channel types reach the component', () => {
	const channel = modal.components.find(c => c.component?.type === ComponentType.ChannelSelect);
	assert.deepStrictEqual(channel.component.channel_types, [0, 15]);
});

console.log('\n== ranges are corrected rather than sent and bounced ==');

t('a max above the option count is clamped to it', () => {
	const [label] = questions.buildQuestionComponents([
		question('MENU', {
			maxLength: 25,
			options: OPTIONS,
		}),
	]);
	assert.strictEqual(label.toJSON().component.max_values, 2);
});

t('a required component never gets a minimum of zero', () => {
	// Builder validation rejects this outright, so an uncorrected value would
	// throw rather than merely look wrong.
	const [label] = questions.buildQuestionComponents([
		question('MENU', {
			maxLength: 2,
			minLength: 0,
			options: OPTIONS,
			required: true,
		}),
	]);
	assert.strictEqual(label.toJSON().component.min_values, 1);
});

t('a file upload ignores maxLength, which counts characters', () => {
	// The column defaults to 4000; treating that as a file count would be well
	// past Discord's limit of 10.
	const [label] = questions.buildQuestionComponents([
		question('FILE_UPLOAD', { maxLength: 4000 }),
	]);
	assert.strictEqual(label.toJSON().component.max_values, 1);
});

t('a text input may use the full 4000 characters', () => {
	// The old builders clamped to 1000 while the schema defaulted to 4000, so the
	// default was unreachable.
	const [label] = questions.buildQuestionComponents([
		question('TEXT', { maxLength: 4000 }),
	]);
	assert.strictEqual(label.toJSON().component.max_length, 4000);
});

console.log('\n== emoji ==');

t('a shortcode node-emoji lacks still resolves', () => {
	// The exact regression: `rofl` is one of 502 names emoji-name-map has and
	// node-emoji 1.11 does not. It used to be sent as the emoji's *name*, which
	// Discord accepts and draws as nothing.
	assert.deepStrictEqual(emojiLib.resolveEmoji('rofl'), { name: '🤣' });
	assert.deepStrictEqual(emojiLib.resolveEmoji('man_technologist'), { name: '👨‍💻' });
});

t('an unresolvable shortcode is no emoji, not a blank one', () => {
	assert.strictEqual(emojiLib.resolveEmoji('definitely_not_an_emoji'), null);
	assert.strictEqual(emojiLib.isValidEmoji('definitely_not_an_emoji'), false);
});

t('a select option emoji reaches the component resolved', () => {
	const menu = modal.components.find(c => c.component?.type === ComponentType.StringSelect);
	assert.deepStrictEqual(menu.component.options[0].emoji, { name: '🤣' });
});

console.log('\n== reading a submission ==');

/** A stand-in for `interaction.fields`, keyed the way the real one is. */
const fakeInteraction = fields => ({
	fields: {
		getCheckbox: id => fields[id],
		getCheckboxGroup: id => fields[id],
		getRadioGroup: id => fields[id],
		getSelectedChannels: id => new Map(fields[id].map(v => [v, {}])),
		getSelectedMentionables: id => fields[id],
		getSelectedRoles: id => new Map(fields[id].map(v => [v, {}])),
		getSelectedUsers: id => new Map(fields[id].map(v => [v, {}])),
		getStringSelectValues: id => fields[id],
		getTextInputValue: id => fields[id],
		getUploadedFiles: id => new Map(fields[id].map(f => [f.name, f])),
	},
});

const submission = fakeInteraction({
	'q-CHANNEL_SELECT': ['300'],
	'q-CHECKBOX': true,
	'q-CHECKBOX_GROUP': ['one', 'two'],
	'q-FILE_UPLOAD': [{
		name: 'shot.png',
		url: 'https://cdn.example/shot.png',
	}],
	'q-MENTIONABLE_SELECT': {
		roles: new Map([['400', {}]]),
		users: new Map([['401', {}]]),
	},
	'q-MENU': ['one'],
	'q-RADIO_GROUP': 'two',
	'q-ROLE_SELECT': ['200'],
	'q-TEXT': 'it is broken',
	'q-USER_SELECT': ['100', '101'],
});

const read = questions.readAnswers(submission, ALL);
const answerFor = type => read.find(a => a.question.type === type);

t('a text display produces no answer row', () => {
	assert.strictEqual(read.length, ALL.length - 1);
	assert.strictEqual(answerFor('TEXT_DISPLAY'), undefined);
});

t('multi-value answers are stored as JSON, not stringified objects', () => {
	assert.strictEqual(answerFor('MENU').value, '["one"]');
	assert.strictEqual(answerFor('USER_SELECT').value, '["100","101"]');
	assert.strictEqual(answerFor('CHECKBOX_GROUP').value, '["one","two"]');
	assert.strictEqual(answerFor('RADIO_GROUP').value, '["two"]');
	assert.strictEqual(answerFor('CHECKBOX').value, 'true');
});

t('a mentionable answer keeps whether each id is a user or a role', () => {
	assert.deepStrictEqual(JSON.parse(answerFor('MENTIONABLE_SELECT').value), [
		{
			id: '401',
			type: 'user',
		},
		{
			id: '400',
			type: 'role',
		},
	]);
});

t('uploads come back with their attachments, for re-posting', () => {
	const upload = answerFor('FILE_UPLOAD');
	assert.strictEqual(upload.attachments.size, 1);
	assert.deepStrictEqual(JSON.parse(upload.value), [{
		name: 'shot.png',
		url: 'https://cdn.example/shot.png',
	}]);
});

t('a field missing from the submission is unanswered, not fatal', () => {
	// A question added to the category after the modal was opened.
	const later = question('TEXT', { id: 'q-late' });
	const out = questions.readAnswers(submission, [later]);
	assert.strictEqual(out[0].value, '');
});

console.log('\n== rendering a stored answer ==');

const render = type => questions.formatAnswer(
	ALL.find(q => q.type === type),
	answerFor(type).value,
	{ getMessage: () => '*No response*' },
);

t('choices render as their labels, not their stored values', () => {
	assert.strictEqual(render('MENU'), 'One');
	assert.strictEqual(render('CHECKBOX_GROUP'), 'One, Two');
	assert.strictEqual(render('RADIO_GROUP'), 'Two');
});

t('entity answers render as mentions', () => {
	assert.strictEqual(render('USER_SELECT'), '<@100> <@101>');
	assert.strictEqual(render('ROLE_SELECT'), '<@&200>');
	assert.strictEqual(render('CHANNEL_SELECT'), '<#300>');
	assert.strictEqual(render('MENTIONABLE_SELECT'), '<@401> <@&400>');
});

t('a checkbox renders as a tick or a cross', () => {
	assert.strictEqual(render('CHECKBOX'), '✅');
});

t('uploads render as markdown links', () => {
	assert.strictEqual(render('FILE_UPLOAD'), '[shot.png](https://cdn.example/shot.png)');
});

t('an empty answer renders as the no-response message', () => {
	const q = ALL.find(x => x.type === 'MENU');
	assert.strictEqual(questions.formatAnswer(q, '', { getMessage: () => '*No response*' }), '*No response*');
	assert.strictEqual(questions.formatAnswer(q, '[]', { getMessage: () => '*No response*' }), '*No response*');
});

t('a pre-existing plain-text answer still renders', () => {
	// Answers written before the non-text types existed are not JSON.
	const q = ALL.find(x => x.type === 'TEXT');
	assert.strictEqual(questions.formatAnswer(q, 'it is broken'), 'it is broken');
});

console.log('\n== validation rejects what Discord would ==');

const rejects = (q, why) => {
	assert.throws(() => validateQuestions([question(q.type, q)]), QuestionError, why);
};

t('a dropdown with no options', () => rejects({
	options: [],
	type: 'MENU',
}));

t('a radio group with one option', () => rejects({
	options: [OPTIONS[0]],
	type: 'RADIO_GROUP',
}));

t('two options storing the same value', () => rejects({
	options: [
		{
			label: 'A',
			value: 'same',
		},
		{
			label: 'B',
			value: 'same',
		},
	],
	type: 'RADIO_GROUP',
}));

t('a minimum above the maximum', () => rejects({
	maxLength: 1,
	minLength: 2,
	options: OPTIONS,
	type: 'MENU',
}));

t('a required question that allows zero choices', () => rejects({
	maxLength: 2,
	minLength: 0,
	options: OPTIONS,
	required: true,
	type: 'MENU',
}));

t('an unknown type', () => rejects({ type: 'NOT_A_TYPE' }));

t('an empty text block', () => rejects({
	config: {},
	type: 'TEXT_DISPLAY',
}));

t('a text input longer than Discord allows', () => rejects({
	maxLength: 5000,
	type: 'TEXT',
}));

t('more files than Discord accepts', () => rejects({
	config: { maxFiles: 50 },
	type: 'FILE_UPLOAD',
}));

t('an option emoji that would render as a blank', () => rejects({
	options: [{
		emoji: 'definitely_not_an_emoji',
		label: 'A',
		value: 'a',
	}],
	type: 'MENU',
}));

t('every question that builds a modal also passes validation', () => {
	validateQuestions(ALL);
});

t('no questions at all is fine', () => {
	validateQuestions(undefined);
	validateQuestions(null);
	validateQuestions([]);
});

console.log(`\n${pass} checks passed${process.exitCode ? ' (with failures above)' : ''}`);
