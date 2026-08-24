const {
	KINDS, formatAnswer, isAnswerable,
} = require('./questions');

/**
 * The feedback form: what it is by default, and how a submission is stored.
 *
 * Feedback used to be two hard-coded text inputs — a 1-5 rating and an optional
 * comment — built inline in `TicketManager#buildFeedbackModal` and read back by
 * custom id in `src/modals/feedback.js`. A server could not ask anything else.
 *
 * It is now a question set of exactly the shape a category's ticket questions
 * use, so the builder, the reader and the renderer in `./questions.js` are
 * reused rather than duplicated. The set is stored as a nullable JSON column on
 * both `Guild` and `Category` and resolved through the normal inheritance chain,
 * which is what lets a category ask something different from the server default
 * while still telling "not set" apart from "ask nothing".
 */

/** A modal holds five top-level components, and Discord rejects a sixth. */
const LIMIT = 5;

/**
 * The ids the built-in questions carry.
 *
 * Stable and reserved, because they are what `Feedback.rating` and
 * `Feedback.comment` were before any of this existed: an answer stored against
 * `rating` by a bot from last month and one stored today are the same answer.
 */
const BUILTIN_IDS = {
	comment: 'comment',
	rating: 'rating',
};

/**
 * The form every server has had until now.
 *
 * Returned rather than stored: `feedbackQuestions` is NULL everywhere on
 * upgrade, and NULL at both levels resolves to this, so nothing changes for a
 * server that never opens the builder and no row needs backfilling.
 *
 * It is not built in `src/lib/settings/inheritance.js` with the other built-ins
 * because the labels are translated, and an inheritance built-in is a zero-arg
 * factory with no locale in scope. That file stays free of i18n; this one is
 * only ever called from somewhere `getMessage` already exists.
 *
 * The rating is a RATING rather than the old text input. That is a deliberate,
 * visible change: the text input accepted anything, and `parseInt` on a typo
 * silently became a 1-star review.
 *
 * @param {Function} getMessage from `client.i18n.getLocale(guild.locale)`
 * @returns {object[]}
 */
function defaultFeedbackQuestions(getMessage) {
	return [
		{
			config: { scale: 5 },
			id: BUILTIN_IDS.rating,
			label: getMessage('modals.feedback.rating.label'),
			order: 0,
			required: true,
			type: 'RATING',
		},
		{
			config: {},
			id: BUILTIN_IDS.comment,
			label: getMessage('modals.feedback.comment.label'),
			maxLength: 1000,
			minLength: 4,
			order: 1,
			placeholder: getMessage('modals.feedback.comment.placeholder'),
			required: false,
			// Paragraph, as it has always been.
			style: 2,
			type: 'TEXT',
		},
	];
}

/**
 * The questions to ask for a ticket, in order.
 *
 * `category` is the *resolved* category, so `feedbackQuestions` is already the
 * category's own set, or the guild's, or null. Null means the built-in form; an
 * empty array means this category deliberately asks nothing, and the two must
 * not be conflated — that is the whole reason the column is nullable.
 *
 * @param {object} category a category resolved through `resolveCategory`
 * @param {Function} getMessage
 * @returns {object[]}
 */
function feedbackQuestionsFor(category, getMessage) {
	const stored = category?.feedbackQuestions;
	if (stored === null || stored === undefined) return defaultFeedbackQuestions(getMessage);
	if (!Array.isArray(stored)) return defaultFeedbackQuestions(getMessage);
	return [...stored]
		.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
		.slice(0, LIMIT);
}

/** Is there anything to ask? An empty set means the modal is skipped entirely. */
const asksAnything = questions => questions.some(isAnswerable);

/**
 * The two scalar columns, worked out from a submission.
 *
 * `Feedback.rating` and `Feedback.comment` are projections of the answers, not
 * the record — see the comment on the model. They exist because every existing
 * reader wants them cheaply: the aggregates group by `rating`, the closing DM
 * and the staff log embed show it beside the comment, the HTML transcript
 * renders both, and `{avgRating}` averages the column.
 *
 * The first RATING question is the canonical one, and the first TEXT question is
 * the canonical comment. "First" rather than a flag on the question because the
 * order is already meaningful — it is the order the member is asked in — and a
 * second flag to keep in sync is a second thing to get wrong.
 *
 * A form with no rating question yields `null`, which is why the column is
 * nullable. It is not zero, and every consumer has to keep the two apart.
 *
 * @param {{question: object, value: string}[]} answers as returned by `readAnswers`
 * @returns {{comment: ?string, rating: ?number}} the *plaintext* comment
 */
function projectFeedback(answers) {
	const first = predicate => answers.find(a => predicate(a.question));

	const ratingAnswer = first(q => q.type === 'RATING');
	let rating = null;
	if (ratingAnswer) {
		// Stored as a JSON array holding one value, like the other choice types.
		const [point] = parseAnswerList(ratingAnswer.value);
		const parsed = Number.parseInt(point, 10);
		if (Number.isInteger(parsed)) rating = parsed;
	}

	const commentAnswer = first(q => KINDS[q.type] === 'text');
	const comment = commentAnswer?.value?.length > 0 ? commentAnswer.value : null;

	return {
		comment,
		rating,
	};
}

/** `parseList` from `./questions`, without exporting a second name for it. */
function parseAnswerList(value) {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [value];
	}
}

/**
 * A stored submission as a human reads it.
 *
 * `FeedbackAnswer` snapshots the label and type, so this needs no access to the
 * form the answer was given against — which is the point: the form may since
 * have been reworded or deleted.
 *
 * @param {{label: string, type: string, value: ?string}[]} answers decrypted
 * @param {object} [options]
 * @param {?Function} [options.getMessage]
 * @returns {{label: string, value: string}[]}
 */
function formatFeedbackAnswers(answers, { getMessage = null } = {}) {
	return answers.map(answer => ({
		label: answer.label,
		value: formatAnswer({
			// A rating's scale is not snapshotted, so a stored answer renders
			// against the default five-point scale. The stored value is the point
			// itself, so the number is right either way; only the "/5" could be
			// stale, and carrying a whole config copy per answer to fix that is not
			// worth it.
			config: {},
			label: answer.label,
			type: answer.type,
		}, answer.value, { getMessage }),
	}));
}

module.exports = {
	BUILTIN_IDS,
	LIMIT,
	asksAnything,
	defaultFeedbackQuestions,
	feedbackQuestionsFor,
	formatFeedbackAnswers,
	projectFeedback,
};
