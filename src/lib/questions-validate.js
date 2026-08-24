const { isValidEmoji } = require('./emoji');
const {
	KINDS,
	LIMITS,
	configOf,
} = require('./tickets/questions');

/**
 * Validation for category questions, at the API boundary.
 *
 * The category routes used to write `data.questions` straight through — the
 * PATCH handler's `upsert` took whatever the client sent, and the only thing
 * validated anywhere on a category was its message layout. That was survivable
 * while a question could only ever be a text input, because the modal builders
 * clamped the two numbers that mattered. It is not survivable now: a select menu
 * with no options, a radio group with one, or a min above its max makes Discord
 * reject the *modal*, so the failure surfaces to a member trying to open a
 * ticket rather than to the admin who caused it.
 *
 * Everything here mirrors a constraint @discordjs/builders enforces at build
 * time (see `LIMITS`), so passing validation means the modal will build.
 */

class QuestionError extends Error {
	constructor(errors) {
		super('Invalid questions');
		this.name = 'QuestionError';
		this.errors = errors;
	}
}

const TYPES = Object.keys(KINDS);

/** Types whose answers come from a stored option list. */
const NEEDS_OPTIONS = new Set(['MENU', 'CHECKBOX_GROUP', 'RADIO_GROUP']);

/** The fewest and most options each of those may have. */
const OPTION_RANGE = {
	CHECKBOX_GROUP: [1, LIMITS.choiceOptions],
	MENU: [1, LIMITS.selectOptions],
	RADIO_GROUP: [2, LIMITS.choiceOptions],
};

/**
 * @param {?object[]} questions
 * @param {object} [options]
 * @param {?number} [options.max] the most questions allowed, or null for no cap
 * @param {string} [options.what] what to call them in an error message
 * @throws {QuestionError} if anything is out of range
 * @returns {void}
 */
function validateQuestions(questions, {
	max = null, what = 'questions',
} = {}) {
	if (questions === undefined || questions === null) return;
	const errors = [];
	const add = (index, message) => errors.push({
		message,
		path: `questions[${index}]`,
	});

	if (!Array.isArray(questions)) throw new QuestionError([{ message: `${what} must be an array` }]);

	// A modal holds at most five top-level components, and Discord rejects the
	// whole thing rather than truncating — so an over-long set fails when a
	// *member* opens the modal, not when the admin saved it.
	//
	// Opt-in rather than always on: the category-question builder has only ever
	// enforced its cap in the dashboard, and turning it on here would start
	// rejecting saves that succeed today.
	if (max !== null && questions.length > max) {
		throw new QuestionError([{ message: `a modal holds at most ${max} ${what}` }]);
	}

	questions.forEach((question, i) => {
		if (!question || typeof question !== 'object') return add(i, 'must be an object');

		if (!TYPES.includes(question.type)) {
			return add(i, `type must be one of: ${TYPES.join(', ')}`);
		}

		const label = typeof question.label === 'string' ? question.label.trim() : '';
		if (!label) add(i, 'label is required');
		else if (label.length > LIMITS.label) add(i, `label must be at most ${LIMITS.label} characters`);

		const config = configOf(question);
		if (config.description && String(config.description).length > LIMITS.description) {
			add(i, `description must be at most ${LIMITS.description} characters`);
		}

		const kind = KINDS[question.type];

		if (kind === 'display') {
			// Not an input, so nothing else applies — but it must actually say
			// something, or it renders as an empty block.
			if (!String(config.content ?? question.value ?? '').trim()) add(i, 'text display questions need some content');
			return;
		}

		if (question.placeholder && String(question.placeholder).length > LIMITS.placeholder) {
			add(i, `placeholder must be at most ${LIMITS.placeholder} characters`);
		}

		if (kind === 'text') {
			const max = toInt(question.maxLength, LIMITS.textValue);
			const min = toInt(question.minLength, 0);
			if (max < 1 || max > LIMITS.textValue) add(i, `maxLength must be between 1 and ${LIMITS.textValue}`);
			if (min < 0 || min > max) add(i, 'minLength must be between 0 and maxLength');
			if (question.value && String(question.value).length > max) add(i, 'the pre-filled value is longer than maxLength');
			if (question.value && String(question.value).length < min) add(i, 'the pre-filled value is shorter than minLength');
			// Discord's text-input placeholder is shorter than a select's.
			if (question.placeholder && String(question.placeholder).length > LIMITS.textPlaceholder) {
				add(i, `placeholder must be at most ${LIMITS.textPlaceholder} characters`);
			}
			return;
		}

		if (NEEDS_OPTIONS.has(question.type)) validateOptions(question, i, add);

		if (kind === 'upload') {
			const max = toInt(config.maxFiles, 1);
			const min = toInt(config.minFiles, 0);
			if (max < 1 || max > LIMITS.uploadFiles) add(i, `maxFiles must be between 1 and ${LIMITS.uploadFiles}`);
			if (min < 0 || min > max) add(i, 'minFiles must be between 0 and maxFiles');
			return;
		}

		if (question.type === 'CHANNEL_SELECT' && config.channelTypes !== undefined) {
			if (!Array.isArray(config.channelTypes) || config.channelTypes.some(type => !Number.isInteger(type))) {
				add(i, 'channelTypes must be an array of channel type numbers');
			}
		}

		if (kind === 'rating') {
			// The options are generated from the scale rather than authored, so the
			// scale is the only thing there is to get wrong. `questions.js#scaleOf`
			// clamps it anyway; this is what turns a typo into a 400 the admin sees
			// instead of a silently different form.
			if (config.scale !== undefined && config.scale !== null && config.scale !== '') {
				const scale = toInt(config.scale, NaN);
				if (!Number.isInteger(scale) || scale < LIMITS.ratingScaleMin || scale > LIMITS.ratingScaleMax) {
					add(i, `the scale must be a whole number between ${LIMITS.ratingScaleMin} and ${LIMITS.ratingScaleMax}`);
				}
			}
			for (const end of ['minLabel', 'maxLabel']) {
				if (config[end] && String(config[end]).length > LIMITS.optionLabel) {
					add(i, `${end} must be at most ${LIMITS.optionLabel} characters`);
				}
			}
			return;
		}

		// Ranges: `RADIO_GROUP` and `CHECKBOX` take exactly one answer and have no
		// range of their own.
		if (question.type !== 'RADIO_GROUP' && kind !== 'checkbox') {
			const ceiling = NEEDS_OPTIONS.has(question.type)
				? Math.min(optionsArray(question).length || 1, OPTION_RANGE[question.type][1])
				: LIMITS.selectValues;
			const max = toInt(question.maxLength, 1);
			const min = toInt(question.minLength, question.required ? 1 : 0);
			if (max < 1 || max > ceiling) add(i, `maximum values must be between 1 and ${ceiling}`);
			if (min < 0 || min > max) add(i, 'minimum values must be between 0 and the maximum');
			if (question.required && min < 1) add(i, 'a required question needs a minimum of at least 1');
		}
	});

	if (errors.length) throw new QuestionError(errors);
}

function validateOptions(question, i, add) {
	const options = optionsArray(question);
	const [least, most] = OPTION_RANGE[question.type];
	if (options.length < least) return add(i, `needs at least ${least} option${least === 1 ? '' : 's'}`);
	if (options.length > most) return add(i, `must have at most ${most} options`);

	const values = new Set();
	options.forEach((option, j) => {
		const where = `option ${j + 1}`;
		const label = typeof option?.label === 'string' ? option.label.trim() : '';
		if (!label) return add(i, `${where} needs a label`);
		if (label.length > LIMITS.optionLabel) add(i, `${where}'s label must be at most ${LIMITS.optionLabel} characters`);
		if (option.description && String(option.description).length > LIMITS.optionLabel) {
			add(i, `${where}'s description must be at most ${LIMITS.optionLabel} characters`);
		}
		// The value is what gets stored as the answer, so duplicates would make an
		// answer ambiguous — and Discord rejects them outright in choice groups.
		const value = String(option.value ?? '').trim() || label;
		if (value.length > LIMITS.optionValue) add(i, `${where}'s value must be at most ${LIMITS.optionValue} characters`);
		if (values.has(value)) add(i, `${where}'s value is a duplicate`);
		values.add(value);
		// A select-menu option emoji goes through the same resolution as a
		// category's, so it is rejected on the same terms — an unresolvable one
		// renders as a blank space in Discord rather than failing loudly.
		if (option.emoji && question.type === 'MENU' && !isValidEmoji(option.emoji)) {
			add(i, `${where}'s emoji is not a Unicode emoji, a custom emoji ID or a <:name:id> tag`);
		}
	});
}

function optionsArray(question) {
	if (Array.isArray(question.options)) return question.options;
	if (typeof question.options === 'string') {
		try {
			const parsed = JSON.parse(question.options);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}
	return [];
}

function toInt(value, fallback) {
	const number = Number(value);
	return Number.isInteger(number) ? number : fallback;
}

module.exports = {
	QuestionError,
	validateQuestions,
};
