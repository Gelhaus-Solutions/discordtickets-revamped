/**
 * The question types, and Discord's limits on each.
 *
 * Mirrors `KINDS`/`LIMITS` in `src/lib/tickets/questions.js` and the checks in
 * `src/lib/questions-validate.js`. The API rejects anything out of range, so the
 * numbers here exist to stop an admin getting a 400 they could have been warned
 * about — they are not the enforcement.
 */

export const LIMITS = {
	choiceOptions: 10,
	description: 100,
	label: 45,
	optionLabel: 100,
	optionValue: 100,
	placeholder: 150,
	selectOptions: 25,
	selectValues: 25,
	textPlaceholder: 100,
	textValue: 4000,
	uploadFiles: 10
};

/**
 * `kind` groups the types that share an editor. `MENU` keeps its name for
 * backwards compatibility — it is the string select.
 */
export const QUESTION_TYPES = [
	{
		value: 'TEXT',
		label: 'Text box',
		kind: 'text',
		hint: 'A single or multi-line text input'
	},
	{
		value: 'MENU',
		label: 'Dropdown (choices)',
		kind: 'select',
		hint: 'A dropdown of options you define'
	},
	{
		value: 'RADIO_GROUP',
		label: 'Radio buttons',
		kind: 'choice',
		hint: 'Pick exactly one of 2–10 options'
	},
	{
		value: 'CHECKBOX_GROUP',
		label: 'Checkboxes',
		kind: 'choice',
		hint: 'Pick any number of up to 10 options'
	},
	{
		value: 'CHECKBOX',
		label: 'Single checkbox',
		kind: 'checkbox',
		hint: 'A yes/no tick box'
	},
	{
		value: 'USER_SELECT',
		label: 'User picker',
		kind: 'entity',
		hint: 'Pick members of the server'
	},
	{
		value: 'ROLE_SELECT',
		label: 'Role picker',
		kind: 'entity',
		hint: 'Pick roles'
	},
	{
		value: 'MENTIONABLE_SELECT',
		label: 'User or role picker',
		kind: 'entity',
		hint: 'Pick members and/or roles'
	},
	{
		value: 'CHANNEL_SELECT',
		label: 'Channel picker',
		kind: 'entity',
		hint: 'Pick channels'
	},
	{
		value: 'FILE_UPLOAD',
		label: 'File upload',
		kind: 'upload',
		hint: 'Attach files — they are re-posted into the ticket so the links keep working'
	},
	{
		value: 'TEXT_DISPLAY',
		label: 'Text block (no input)',
		kind: 'display',
		hint: 'Static text shown in the modal — asks nothing and stores nothing'
	}
];

export const kindOf = (type) => QUESTION_TYPES.find((t) => t.value === type)?.kind ?? null;

/** Types whose answers come from an option list you define. */
export const NEEDS_OPTIONS = new Set(['MENU', 'CHECKBOX_GROUP', 'RADIO_GROUP']);

/** The fewest and most options each of those may have. */
export const OPTION_RANGE = {
	CHECKBOX_GROUP: [1, LIMITS.choiceOptions],
	MENU: [1, LIMITS.selectOptions],
	RADIO_GROUP: [2, LIMITS.choiceOptions]
};

/**
 * The channel types a CHANNEL_SELECT can be limited to, as Discord numbers them.
 */
export const CHANNEL_TYPES = [
	{ value: 0, label: 'Text' },
	{ value: 2, label: 'Voice' },
	{ value: 4, label: 'Category' },
	{ value: 5, label: 'Announcement' },
	{ value: 11, label: 'Public thread' },
	{ value: 12, label: 'Private thread' },
	{ value: 13, label: 'Stage' },
	{ value: 15, label: 'Forum' }
];

/**
 * A question's `config`, always an object so the editors can read from it.
 *
 * Pure on purpose. Every editor calls this from a `$derived`, and Svelte 5
 * throws `state_unsafe_mutation` if a derived writes to state — which is what
 * happened for every question created before the migration that added the
 * column, since those rows have `config = null`. The editors all write back
 * with `question.config = { ...config, ... }`, so nothing needs a live
 * reference to the stored object.
 */
export function configOf(question) {
	const { config } = question;
	if (!config || typeof config !== 'object') return {};
	return config;
}

/**
 * Reset the fields that mean something different for each type.
 *
 * Without this, switching a text box (maxLength 4000, 'characters') to a
 * dropdown leaves it asking for 4000 selections.
 */
export function applyTypeDefaults(question) {
	const kind = kindOf(question.type);
	question.config ??= {};
	if (kind === 'text') {
		question.maxLength = 1000;
		question.minLength = 0;
	} else if (kind === 'select' || kind === 'entity') {
		question.maxLength = 1;
		question.minLength = question.required ? 1 : 0;
	} else if (question.type === 'CHECKBOX_GROUP') {
		question.maxLength = Math.max(1, question.options?.length || 1);
		question.minLength = question.required ? 1 : 0;
	} else if (question.type === 'RADIO_GROUP') {
		question.maxLength = 1;
		question.minLength = question.required ? 1 : 0;
	} else if (kind === 'upload') {
		question.config.maxFiles ??= 1;
		question.config.minFiles ??= 0;
	}
}
