import { LIMITS, NEEDS_OPTIONS, OPTION_RANGE, kindOf } from './types.js';

/**
 * Client-side question checks, so an admin sees the problem next to the field
 * rather than as a 400 from the save.
 *
 * `src/lib/questions-validate.js` is the enforcement — this only mirrors it.
 * Anything it rejects, the API rejects too.
 *
 * @param {any} question
 * @returns {?string} a sentence completing 'The 'X' question …', or null
 */
export function validateQuestion(question) {
	const kind = kindOf(question.type);
	if (!kind) return 'has no type — pick one.';

	const label = (question.label ?? '').trim();
	if (!label) return 'needs a label.';
	if (label.length > LIMITS.label) return `has a label longer than ${LIMITS.label} characters.`;

	const config = question.config ?? {};
	if ((config.description ?? '').length > LIMITS.description) {
		return `has a description longer than ${LIMITS.description} characters.`;
	}

	if (kind === 'display') {
		if (!(config.content ?? '').trim()) return 'is a text block with no text.';
		return null;
	}

	if (kind === 'rating') {
		const scale = Number(config.scale ?? 0);
		if (!Number.isInteger(scale) || scale < LIMITS.ratingScaleMin || scale > LIMITS.ratingScaleMax) {
			return `needs a scale between ${LIMITS.ratingScaleMin} and ${LIMITS.ratingScaleMax}.`;
		}
		for (const end of ['minLabel', 'maxLabel']) {
			if ((config[end] ?? '').length > LIMITS.optionLabel) {
				return `has an end label longer than ${LIMITS.optionLabel} characters.`;
			}
		}
		return null;
	}

	if (kind === 'text') {
		const value = question.value ?? '';
		if (value.length > 0 && value.length < question.minLength) {
			return 'has a pre-filled value shorter than its minimum length.';
		}
		if (value.length > question.maxLength) {
			return 'has a pre-filled value longer than its maximum length.';
		}
		return null;
	}

	if (NEEDS_OPTIONS.has(question.type)) {
		const options = Array.isArray(question.options) ? question.options : [];
		const [least, most] = OPTION_RANGE[question.type];
		if (options.length < least)
			return `needs at least ${least} option${least === 1 ? '' : 's'}.`;
		if (options.length > most) return `has more than ${most} options.`;
		if (options.some((o) => !(o.label ?? '').trim())) return 'has an option with no label.';
		const values = options.map((o) => (o.value ?? '').trim() || (o.label ?? '').trim());
		if (new Set(values).size !== values.length)
			return 'has two options storing the same value.';
	}

	if (kind === 'upload') {
		const max = config.maxFiles ?? 1;
		const min = config.minFiles ?? 0;
		if (max < 1 || max > LIMITS.uploadFiles) {
			return `allows an impossible number of files (1–${LIMITS.uploadFiles}).`;
		}
		if (min > max) return 'requires more files than it allows.';
		return null;
	}

	if (question.type !== 'RADIO_GROUP' && kind !== 'checkbox') {
		const max = question.maxLength ?? 1;
		const min = question.minLength ?? 0;
		if (max < 1) return 'must allow at least one choice.';
		if (min > max) return 'requires more choices than it allows.';
		if (question.required && min < 1) return 'is required but allows zero choices.';
	}

	return null;
}
