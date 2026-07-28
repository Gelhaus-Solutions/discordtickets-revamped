const {
	ChannelSelectMenuBuilder,
	CheckboxBuilder,
	CheckboxGroupBuilder,
	CheckboxGroupOptionBuilder,
	FileUploadBuilder,
	LabelBuilder,
	MentionableSelectMenuBuilder,
	RadioGroupBuilder,
	RadioGroupOptionBuilder,
	RoleSelectMenuBuilder,
	SelectMenuDefaultValueType,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextDisplayBuilder,
	TextInputBuilder,
	TextInputStyle,
	UserSelectMenuBuilder,
} = require('discord.js');
const { resolveEmoji } = require('../emoji');

/**
 * Category questions, end to end.
 *
 * Building the ticket-open modal, reading its submission back, and turning a
 * stored answer into something a human can read all used to be written out
 * inline at four different call sites (`TicketManager.create`,
 * `TicketManager.postQuestions`, the edit button, and the questions modal),
 * which is how they drifted: `postQuestions` filtered to TEXT questions while
 * the opening-message renderer twenty lines below did not, so a single non-TEXT
 * question would have thrown.
 *
 * Everything about a question type is therefore described exactly once, here.
 *
 * A question was a text input and nothing else, because a Discord modal held
 * nothing else — hence the `.filter(q => q.type === 'TEXT')` and the
 * "remove this when modals support select menus" TODO that used to guard both
 * builders. Modals now take Label components wrapping any input, so every type
 * below is real.
 *
 * ## Storage
 *
 * `QuestionAnswer.value` stays a single (encrypted) string, so nothing about the
 * schema or the crypto worker changes:
 *
 * | type                                    | stored                                |
 * |-----------------------------------------|---------------------------------------|
 * | TEXT                                    | the text                              |
 * | MENU / CHECKBOX_GROUP / RADIO_GROUP     | JSON array of the chosen option values|
 * | USER_/ROLE_/CHANNEL_SELECT              | JSON array of snowflakes              |
 * | MENTIONABLE_SELECT                      | JSON array of `{id, type}`            |
 * | CHECKBOX                                | `"true"` / `"false"`                  |
 * | FILE_UPLOAD                             | JSON array of `{name, url}`           |
 * | TEXT_DISPLAY                            | nothing — it is not an input          |
 *
 * Option *values* rather than indices are stored on purpose: an admin reordering
 * a question's options must not silently rewrite every past answer.
 */

/**
 * Discord's limits, as enforced by @discordjs/builders. Duplicated in
 * `src/lib/questions-validate.js`, which rejects out-of-range values at the API
 * boundary so an admin gets a 400 instead of a modal that fails to open.
 */
const LIMITS = {
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
	uploadFiles: 10,
};

/**
 * What each `QuestionType` *is*, so the rest of the file can switch on a small
 * closed set of kinds instead of eleven type names.
 */
const KINDS = {
	CHANNEL_SELECT: 'entity-select',
	CHECKBOX: 'checkbox',
	CHECKBOX_GROUP: 'choice',
	FILE_UPLOAD: 'upload',
	MENTIONABLE_SELECT: 'entity-select',
	// The string select predates every other non-text type and keeps its original
	// name so no rows have to be migrated.
	MENU: 'string-select',
	RADIO_GROUP: 'choice',
	ROLE_SELECT: 'entity-select',
	TEXT: 'text',
	TEXT_DISPLAY: 'display',
	USER_SELECT: 'entity-select',
};

/** The entity-select builder and mention syntax for each entity type. */
const ENTITIES = {
	CHANNEL_SELECT: {
		Builder: ChannelSelectMenuBuilder,
		mention: id => `<#${id}>`,
		setDefaults: (menu, ids) => menu.setDefaultChannels(ids),
	},
	MENTIONABLE_SELECT: {
		Builder: MentionableSelectMenuBuilder,
		mention: id => `<@${id}>`,
		setDefaults: (menu, values) => menu.setDefaultValues(values),
	},
	ROLE_SELECT: {
		Builder: RoleSelectMenuBuilder,
		mention: id => `<@&${id}>`,
		setDefaults: (menu, ids) => menu.setDefaultRoles(ids),
	},
	USER_SELECT: {
		Builder: UserSelectMenuBuilder,
		mention: id => `<@${id}>`,
		setDefaults: (menu, ids) => menu.setDefaultUsers(ids),
	},
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const truncate = (string, length) => (string.length > length ? string.slice(0, length - 1) + '…' : string);

/** A question's `config` JSON, which is nullable and may be a string from an import. */
function configOf(question) {
	const { config } = question;
	if (!config) return {};
	if (typeof config === 'string') {
		try {
			return JSON.parse(config) ?? {};
		} catch {
			return {};
		}
	}
	return typeof config === 'object' ? config : {};
}

/** Is this type an input, i.e. does submitting the modal produce an answer? */
const isAnswerable = question => KINDS[question.type] !== 'display';

/**
 * A question's options, normalised.
 *
 * `Question.options` is untyped JSON written by the dashboard, so nothing about
 * its contents is guaranteed. Values are what gets stored as the answer, so they
 * must be present and unique — Discord rejects a checkbox or radio group with
 * duplicates, and a duplicate would make the answer ambiguous anyway.
 */
function optionsOf(question) {
	const raw = Array.isArray(question.options) ? question.options : [];
	const seen = new Set();
	return raw
		.filter(option => option && typeof option === 'object' && option.label)
		.map((option, i) => {
			let value = String(option.value ?? '').trim() || String(option.label).trim() || String(i);
			value = truncate(value, LIMITS.optionValue);
			// Last-resort guard; `validateQuestions` rejects duplicates up front.
			while (seen.has(value)) value = truncate(`${value}~${i}`, LIMITS.optionValue);
			seen.add(value);
			return {
				description: option.description ? truncate(String(option.description), LIMITS.optionLabel) : null,
				emoji: option.emoji || null,
				label: truncate(String(option.label), LIMITS.optionLabel),
				value,
			};
		});
}

/** Parse a stored answer that should be a JSON array, tolerating anything else. */
function parseList(value) {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		// Pre-existing plain-text answers, and anything hand-edited in the DB.
		return [value];
	}
}

/**
 * Build the modal components for a set of questions.
 *
 * Every question becomes a `Label` wrapping its input, except `TEXT_DISPLAY`
 * which is a bare text block. `ModalBuilder.setComponents()` takes these
 * directly — the action rows the old code wrapped text inputs in are a legacy
 * shape, and were never valid around a select menu (which is why the dead `MENU`
 * branch would have failed had the filter above it ever been removed).
 *
 * @param {import('@prisma/client').Question[]} questions
 * @param {object} [options]
 * @param {(question: import('@prisma/client').Question) => string} [options.customIdFor]
 *   the component custom id — the question's id when creating a ticket, the
 *   answer's id when editing one.
 * @param {?Map<string, string>|Record<string, string>} [options.prefill]
 *   stored (decrypted) answers keyed by question id, for the edit modal.
 * @returns {Array<LabelBuilder|TextDisplayBuilder>}
 */
function buildQuestionComponents(questions, {
	customIdFor = question => question.id,
	prefill = null,
} = {}) {
	const read = id => {
		if (!prefill) return undefined;
		return typeof prefill.get === 'function' ? prefill.get(id) : prefill[id];
	};
	return questions.map(question => buildQuestionComponent(question, {
		customId: String(customIdFor(question)),
		value: read(question.id),
	}));
}

/**
 * @param {import('@prisma/client').Question} question
 * @param {{customId: string, value: ?string}} options
 * @returns {LabelBuilder|TextDisplayBuilder}
 */
function buildQuestionComponent(question, {
	customId, value,
}) {
	const config = configOf(question);
	const kind = KINDS[question.type];

	if (kind === 'display') {
		const content = config.content || question.value || question.label;
		return new TextDisplayBuilder().setContent(truncate(String(content), LIMITS.textValue));
	}

	const label = new LabelBuilder().setLabel(truncate(question.label, LIMITS.label));
	if (config.description) label.setDescription(truncate(String(config.description), LIMITS.description));

	switch (kind) {
	case 'text':
		return label.setTextInputComponent(buildTextInput(question, {
			customId,
			value,
		}));
	case 'string-select':
		return label.setStringSelectMenuComponent(buildStringSelect(question, {
			customId,
			value,
		}));
	case 'entity-select':
		return label[selectSetterFor(question.type)](buildEntitySelect(question, {
			config,
			customId,
			value,
		}));
	case 'checkbox':
		return label.setCheckboxComponent(buildCheckbox({
			config,
			customId,
			value,
		}));
	case 'choice':
		return question.type === 'RADIO_GROUP'
			? label.setRadioGroupComponent(buildRadioGroup(question, {
				customId,
				value,
			}))
			: label.setCheckboxGroupComponent(buildCheckboxGroup(question, {
				customId,
				value,
			}));
	case 'upload':
		return label.setFileUploadComponent(buildFileUpload(question, {
			config,
			customId,
		}));
	default:
		throw new Error(`Unsupported question type: ${question.type}`);
	}
}

const selectSetterFor = type => ({
	CHANNEL_SELECT: 'setChannelSelectMenuComponent',
	MENTIONABLE_SELECT: 'setMentionableSelectMenuComponent',
	ROLE_SELECT: 'setRoleSelectMenuComponent',
	USER_SELECT: 'setUserSelectMenuComponent',
}[type]);

function buildTextInput(question, {
	customId, value,
}) {
	// The old builders clamped to 1000 while the schema defaulted to 4000, so the
	// default was unreachable. Discord's actual ceiling is 4000.
	const max = clamp(question.maxLength ?? LIMITS.textValue, 1, LIMITS.textValue);
	const input = new TextInputBuilder()
		.setCustomId(customId)
		.setStyle(question.style === TextInputStyle.Short ? TextInputStyle.Short : TextInputStyle.Paragraph)
		.setRequired(Boolean(question.required))
		.setMaxLength(max)
		.setMinLength(clamp(question.minLength ?? 0, 0, max));
	if (question.placeholder) input.setPlaceholder(truncate(question.placeholder, LIMITS.textPlaceholder));
	const prefilled = value ?? question.value;
	if (prefilled) input.setValue(truncate(String(prefilled), max));
	return input;
}

function buildStringSelect(question, {
	customId, value,
}) {
	const options = optionsOf(question).slice(0, LIMITS.selectOptions);
	const selected = new Set(parseList(value).map(String));
	const menu = new StringSelectMenuBuilder()
		.setCustomId(customId)
		.setRequired(Boolean(question.required))
		.setOptions(options.map(option => {
			const builder = new StringSelectMenuOptionBuilder()
				.setLabel(option.label)
				.setValue(option.value);
			if (option.description) builder.setDescription(option.description);
			if (option.emoji) {
				const emoji = resolveEmoji(option.emoji);
				if (emoji) builder.setEmoji(emoji);
			}
			if (selected.has(option.value)) builder.setDefault(true);
			return builder;
		}));
	if (question.placeholder) menu.setPlaceholder(truncate(question.placeholder, LIMITS.placeholder));
	applyValueRange(menu, question, options.length);
	return menu;
}

function buildEntitySelect(question, {
	config, customId, value,
}) {
	const {
		Builder, setDefaults,
	} = ENTITIES[question.type];
	const menu = new Builder()
		.setCustomId(customId)
		.setRequired(Boolean(question.required));
	if (question.placeholder) menu.setPlaceholder(truncate(question.placeholder, LIMITS.placeholder));
	applyValueRange(menu, question, LIMITS.selectValues);
	if (question.type === 'CHANNEL_SELECT' && Array.isArray(config.channelTypes) && config.channelTypes.length) {
		menu.setChannelTypes(config.channelTypes.filter(type => Number.isInteger(type)));
	}
	const stored = parseList(value);
	if (stored.length) {
		setDefaults(
			menu,
			question.type === 'MENTIONABLE_SELECT'
				? stored
					.filter(entry => entry?.id)
					.slice(0, LIMITS.selectValues)
					.map(entry => ({
						id: String(entry.id),
						type: entry.type === 'role' ? SelectMenuDefaultValueType.Role : SelectMenuDefaultValueType.User,
					}))
				: stored.map(String).slice(0, LIMITS.selectValues),
		);
	}
	return menu;
}

function buildCheckbox({
	config, customId, value,
}) {
	const checkbox = new CheckboxBuilder().setCustomId(customId);
	const checked = value === undefined ? Boolean(config.defaultChecked) : value === 'true';
	if (checked) checkbox.setDefault(true);
	return checkbox;
}

function buildCheckboxGroup(question, {
	customId, value,
}) {
	const options = optionsOf(question).slice(0, LIMITS.choiceOptions);
	const selected = new Set(parseList(value).map(String));
	const group = new CheckboxGroupBuilder()
		.setCustomId(customId)
		.setRequired(Boolean(question.required))
		.setOptions(options.map(option => choiceOption(new CheckboxGroupOptionBuilder(), option, selected)));
	applyValueRange(group, question, options.length, LIMITS.choiceOptions);
	return group;
}

function buildRadioGroup(question, {
	customId, value,
}) {
	const options = optionsOf(question).slice(0, LIMITS.choiceOptions);
	const [chosen] = parseList(value).map(String);
	// A radio group has exactly one answer, so at most one default.
	const selected = new Set(chosen === undefined ? [] : [chosen]);
	return new RadioGroupBuilder()
		.setCustomId(customId)
		.setRequired(Boolean(question.required))
		.setOptions(options.map(option => choiceOption(new RadioGroupOptionBuilder(), option, selected)));
}

function choiceOption(builder, option, selected) {
	builder.setLabel(option.label).setValue(option.value);
	if (option.description) builder.setDescription(option.description);
	if (selected.has(option.value)) builder.setDefault(true);
	return builder;
}

function buildFileUpload(question, {
	config, customId,
}) {
	const required = Boolean(question.required);
	// Deliberately not `question.maxLength`: that column defaults to 4000 and
	// means "characters" for a text input, which is meaningless here.
	const max = clamp(config.maxFiles ?? 1, 1, LIMITS.uploadFiles);
	return new FileUploadBuilder()
		.setCustomId(customId)
		.setRequired(required)
		.setMaxValues(max)
		.setMinValues(clamp(config.minFiles ?? (required ? 1 : 0), required ? 1 : 0, max));
}

/**
 * min/max values for anything that takes a range.
 *
 * Builder validation rejects `min > max`, a max above the number of options, and
 * `required` with a min of 0, so all three are resolved here rather than trusted
 * from the database.
 */
function applyValueRange(builder, question, available, ceiling = LIMITS.selectValues) {
	const upper = Math.max(1, Math.min(available, ceiling));
	const max = clamp(question.maxLength ?? 1, 1, upper);
	const floor = question.required ? 1 : 0;
	builder.setMaxValues(max);
	builder.setMinValues(clamp(question.minLength ?? floor, floor, max));
}

/**
 * Read a submitted modal.
 *
 * Returns one entry per answerable question, in the order the questions were
 * given. `value` is the string to store (before encryption); `attachments` is
 * set only for FILE_UPLOAD, so the caller can re-post the files somewhere
 * permanent before deciding what to store — Discord's modal attachment URLs
 * expire.
 *
 * Reads are individually guarded: a question added to a category *after* a modal
 * was opened is absent from the submission, and `getField` throws for a missing
 * custom id. That must not lose the answers that were submitted.
 *
 * @param {import('discord.js').ModalSubmitInteraction} interaction
 * @param {import('@prisma/client').Question[]} questions
 * @param {object} [options]
 * @param {(question: import('@prisma/client').Question) => string} [options.customIdFor]
 * @returns {{question: object, value: string, attachments: ?import('discord.js').Collection}[]}
 */
function readAnswers(interaction, questions, { customIdFor = question => question.id } = {}) {
	return questions.filter(isAnswerable).map(question => {
		const customId = String(customIdFor(question));
		let value = '';
		let attachments = null;
		try {
			switch (KINDS[question.type]) {
			case 'text':
				value = interaction.fields.getTextInputValue(customId) || '';
				break;
			case 'string-select':
				value = JSON.stringify(interaction.fields.getStringSelectValues(customId) ?? []);
				break;
			case 'entity-select':
				value = JSON.stringify(readEntitySelect(interaction, question.type, customId));
				break;
			case 'checkbox':
				value = String(interaction.fields.getCheckbox(customId));
				break;
			case 'choice':
				value = JSON.stringify(
					question.type === 'RADIO_GROUP'
						? [interaction.fields.getRadioGroup(customId)].filter(chosen => chosen !== null && chosen !== undefined)
						: interaction.fields.getCheckboxGroup(customId) ?? [],
				);
				break;
			case 'upload':
				attachments = interaction.fields.getUploadedFiles(customId);
				value = JSON.stringify([...(attachments?.values() ?? [])].map(attachment => ({
					name: attachment.name,
					url: attachment.url,
				})));
				break;
			default:
				break;
			}
		} catch {
			// The field is missing from this submission — treat it as unanswered
			// rather than failing the whole ticket.
			value = '';
			attachments = null;
		}
		return {
			attachments,
			question,
			value,
		};
	});
}

function readEntitySelect(interaction, type, customId) {
	if (type === 'CHANNEL_SELECT') {
		return [...(interaction.fields.getSelectedChannels(customId)?.keys() ?? [])];
	}
	if (type === 'ROLE_SELECT') {
		return [...(interaction.fields.getSelectedRoles(customId)?.keys() ?? [])];
	}
	if (type === 'USER_SELECT') {
		return [...(interaction.fields.getSelectedUsers(customId)?.keys() ?? [])];
	}
	// Mentionable: users and roles arrive in separate collections and the type has
	// to be kept, or the answer cannot be rendered as the right kind of mention.
	const mentionables = interaction.fields.getSelectedMentionables(customId) ?? {};
	return [
		...[...(mentionables.users?.keys() ?? [])].map(id => ({
			id,
			type: 'user',
		})),
		...[...(mentionables.roles?.keys() ?? [])].map(id => ({
			id,
			type: 'role',
		})),
	];
}

/**
 * A stored answer as a human reads it — the opening message, the edit diff and
 * the HTML transcript all go through here, so they cannot disagree.
 *
 * @param {import('@prisma/client').Question} question
 * @param {?string} value the decrypted stored value
 * @param {object} [options]
 * @param {?(key: string) => string} [options.getMessage] i18n, for the empty case
 * @returns {string}
 */
function formatAnswer(question, value, { getMessage = null } = {}) {
	const empty = getMessage ? getMessage('ticket.answers.no_value') : '';
	if (value === null || value === undefined || value === '') return empty;

	switch (KINDS[question.type]) {
	case 'text':
		return value;
	case 'checkbox':
		return value === 'true' ? '✅' : '❌';
	case 'string-select':
	case 'choice': {
		const labels = new Map(optionsOf(question).map(option => [option.value, option.label]));
		const chosen = parseList(value).map(chosenValue => labels.get(String(chosenValue)) ?? String(chosenValue));
		return chosen.length ? chosen.join(', ') : empty;
	}
	case 'entity-select': {
		const { mention } = ENTITIES[question.type];
		const mentions = parseList(value).map(entry => {
			if (entry && typeof entry === 'object') {
				return entry.type === 'role' ? `<@&${entry.id}>` : `<@${entry.id}>`;
			}
			return mention(entry);
		});
		return mentions.length ? mentions.join(' ') : empty;
	}
	case 'upload': {
		const files = parseList(value).filter(file => file?.url);
		return files.length
			? files.map(file => `[${file.name || 'file'}](${file.url})`).join('\n')
			: empty;
	}
	default:
		return value;
	}
}

module.exports = {
	KINDS,
	LIMITS,
	buildQuestionComponents,
	configOf,
	formatAnswer,
	isAnswerable,
	optionsOf,
	parseList,
	readAnswers,
};
