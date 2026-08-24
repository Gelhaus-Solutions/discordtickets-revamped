/**
 * Checks the feedback form: what it is when nobody has configured one, how a
 * submission becomes the two columns every existing reader depends on, and that
 * "ask nothing" and "not set" stay different answers.
 *
 * The form was two hard-coded text inputs until it became a question set, and
 * three things about that change break silently:
 *
 *   - `Feedback.rating` is nullable now, so "no rating" and "rated 0" are
 *     different and every consumer has to keep them apart;
 *   - `rating` and `comment` are projections of the answers rather than the
 *     record, so a projection that picks the wrong answer loses data that is
 *     still sitting in `feedbackAnswers`;
 *   - a category with an empty form must not fall back to the server's.
 *
 * Everything runs with no database and no Discord connection.
 */
const assert = require('assert');
const path = require('path');

const root = path.join(__dirname, '..');
const feedback = require(path.join(root, 'src', 'lib', 'tickets', 'feedback'));
const questions = require(path.join(root, 'src', 'lib', 'tickets', 'questions'));
const { resolveCategory } = require(path.join(root, 'src', 'lib', 'settings', 'inheritance'));
const { validateQuestions } = require(path.join(root, 'src', 'lib', 'questions-validate'));
const { matches } = require(path.join(root, 'src', 'lib', 'automations', 'dispatcher'));

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

const MESSAGES = {
	'modals.feedback.comment.label': 'Comment',
	'modals.feedback.comment.placeholder': 'Do you have any additional feedback?',
	'modals.feedback.rating.label': 'Rating',
};
const getMessage = key => MESSAGES[key] ?? key;

const answer = (question, value) => ({
	question,
	value,
});

console.log('\nThe feedback form\n');

/* ───────────────────────────── the built-in form ──────────────────────────── */

t('the built-in form is a rating and a comment, as it has always been', () => {
	const form = feedback.defaultFeedbackQuestions(getMessage);
	assert.deepStrictEqual(form.map(q => [q.id, q.type, q.required]), [
		['rating', 'RATING', true],
		['comment', 'TEXT', false],
	]);
	// The labels still come from the same i18n keys, so all 25 locale files keep
	// working and no new key had to be added for the default path.
	assert.strictEqual(form[0].label, 'Rating');
	assert.strictEqual(form[1].label, 'Comment');
});

t('the built-in form is something Discord will accept', () => {
	validateQuestions(feedback.defaultFeedbackQuestions(getMessage), {
		max: feedback.LIMIT,
		what: 'feedback questions',
	});
});

t('the built-in form is a fresh object each time', () => {
	// Handed to callers that sort it. A shared array would be reordered for every
	// guild resolved afterwards.
	const a = feedback.defaultFeedbackQuestions(getMessage);
	const b = feedback.defaultFeedbackQuestions(getMessage);
	assert.notStrictEqual(a, b);
	assert.notStrictEqual(a[0], b[0]);
});

/* ──────────────────────────────── inheritance ─────────────────────────────── */

const custom = [{
	id: 'q1',
	label: 'How was it?',
	order: 0,
	required: true,
	type: 'RATING',
}];

t('unset at both levels is the built-in form', () => {
	const category = resolveCategory({ feedbackQuestions: null }, { feedbackQuestions: null });
	assert.deepStrictEqual(
		feedback.feedbackQuestionsFor(category, getMessage),
		feedback.defaultFeedbackQuestions(getMessage),
	);
});

t('a category with no form of its own uses the guild\'s', () => {
	const category = resolveCategory({ feedbackQuestions: null }, { feedbackQuestions: custom });
	assert.deepStrictEqual(feedback.feedbackQuestionsFor(category, getMessage).map(q => q.id), ['q1']);
});

t('an empty form asks nothing, and does not fall back', () => {
	// The distinction the nullable column exists for: `[]` is a decision, NULL is
	// an absence, and a `||` where there should be a `??` collapses the two.
	const category = resolveCategory({ feedbackQuestions: [] }, { feedbackQuestions: custom });
	const form = feedback.feedbackQuestionsFor(category, getMessage);
	assert.deepStrictEqual(form, []);
	assert.strictEqual(feedback.asksAnything(form), false, 'an empty form must not open a modal');
});

t('a form of only display blocks opens no modal either', () => {
	// There is nothing to submit, so showing it would ask the member to fill in a
	// form with no fields.
	const form = [{
		config: { content: 'Thanks!' },
		id: 'd',
		label: 'd',
		type: 'TEXT_DISPLAY',
	}];
	assert.strictEqual(feedback.asksAnything(form), false);
});

t('questions are asked in their stored order', () => {
	const category = resolveCategory({
		feedbackQuestions: [
			{
				id: 'second',
				label: 'B',
				order: 1,
				type: 'TEXT',
			},
			{
				id: 'first',
				label: 'A',
				order: 0,
				type: 'TEXT',
			},
		],
	}, {});
	assert.deepStrictEqual(feedback.feedbackQuestionsFor(category, getMessage).map(q => q.id), ['first', 'second']);
});

t('a form longer than a modal holds is cut rather than thrown', () => {
	// The API rejects an over-long form on save, so this only happens to a set
	// stored before the cap existed — and a truncated modal is better than a
	// close button that errors.
	const category = resolveCategory({
		feedbackQuestions: Array.from({ length: 9 }, (_, i) => ({
			id: `q${i}`,
			label: 'Q',
			order: i,
			type: 'TEXT',
		})),
	}, {});
	assert.strictEqual(feedback.feedbackQuestionsFor(category, getMessage).length, feedback.LIMIT);
});

/* ─────────────────────────────── the projection ───────────────────────────── */

t('the first rating and the first text answer become the columns', () => {
	const projected = feedback.projectFeedback([
		answer({
			id: 'r',
			type: 'RATING',
		}, JSON.stringify(['4'])),
		answer({
			id: 'c',
			type: 'TEXT',
		}, 'it went well'),
	]);
	assert.deepStrictEqual(projected, {
		comment: 'it went well',
		rating: 4,
	});
});

t('a later rating does not win over the first', () => {
	const projected = feedback.projectFeedback([
		answer({
			id: 'a',
			type: 'RATING',
		}, JSON.stringify(['5'])),
		answer({
			id: 'b',
			type: 'RATING',
		}, JSON.stringify(['1'])),
	]);
	assert.strictEqual(projected.rating, 5);
});

t('a form with no rating question yields null, not zero', () => {
	// This is the whole reason `Feedback.rating` is nullable. Zero would be a
	// one-star review nobody gave.
	const projected = feedback.projectFeedback([answer({
		id: 'c',
		type: 'TEXT',
	}, 'no stars here')]);
	assert.strictEqual(projected.rating, null);
	assert.strictEqual(projected.comment, 'no stars here');
});

t('an unanswered optional rating is null rather than NaN', () => {
	const projected = feedback.projectFeedback([answer({
		id: 'r',
		type: 'RATING',
	}, JSON.stringify([]))]);
	assert.strictEqual(projected.rating, null);
});

t('an empty comment is null rather than an empty string', () => {
	// It is written straight to a nullable column, and '' would encrypt to a
	// non-empty blob that renders as a blank comment rather than as none.
	const projected = feedback.projectFeedback([answer({
		id: 'c',
		type: 'TEXT',
	}, '')]);
	assert.strictEqual(projected.comment, null);
});

t('a non-text answer is never mistaken for the comment', () => {
	const projected = feedback.projectFeedback([answer({
		id: 's',
		type: 'MENU',
	}, JSON.stringify(['billing']))]);
	assert.strictEqual(projected.comment, null);
});

/* ───────────────────── an unrated submission downstream ───────────────────── */

t('an unrated submission does not fire a "rating below N" automation', () => {
	// `null < 3` is true, so without an explicit type check every such automation
	// fires on a form that never asked for a rating.
	const node = {
		params: { ratingBelow: 3 },
		type: 'trigger.ticket.feedback',
	};
	assert.strictEqual(matches(node, { rating: null }), false);
	assert.strictEqual(matches(node, {}), false);
	assert.strictEqual(matches(node, { rating: 2 }), true);
	assert.strictEqual(matches(node, { rating: 4 }), false);
	// With no filter, every submission still matches — including an unrated one.
	assert.strictEqual(matches({
		params: {},
		type: 'trigger.ticket.feedback',
	}, { rating: null }), true);
});

/* ────────────────────────── rendering stored answers ──────────────────────── */

t('a stored answer renders under the label it was asked with', () => {
	// `FeedbackAnswer` snapshots the label and type, so this needs no access to
	// the form — which is the point: it may since have been reworded or deleted.
	const rendered = feedback.formatFeedbackAnswers([
		{
			label: 'Service',
			type: 'RATING',
			value: JSON.stringify(['5']),
		},
		{
			label: 'Anything else?',
			type: 'TEXT',
			value: 'nope',
		},
	]);
	assert.deepStrictEqual(rendered, [
		{
			label: 'Service',
			value: '⭐ ⭐ ⭐ ⭐ ⭐ (5/5)',
		},
		{
			label: 'Anything else?',
			value: 'nope',
		},
	]);
});

t('an unanswered optional question renders as the no-response message', () => {
	const [rendered] = feedback.formatFeedbackAnswers(
		[{
			label: 'Anything else?',
			type: 'TEXT',
			value: null,
		}],
		{ getMessage: () => '*No response*' },
	);
	assert.strictEqual(rendered.value, '*No response*');
});

t('every answerable type a form can hold renders as something', () => {
	// A form is built from the same question types a category's questions use, so
	// anything that can be asked can end up here.
	for (const [type, kind] of Object.entries(questions.KINDS)) {
		if (kind === 'display') continue;
		const [rendered] = feedback.formatFeedbackAnswers(
			[{
				label: type,
				type,
				value: null,
			}],
			{ getMessage: () => '*No response*' },
		);
		assert.strictEqual(typeof rendered.value, 'string', `${type} rendered as ${typeof rendered.value}`);
	}
});

/* ─────────────────────────── deleting a submission ────────────────────────── */

// The route itself is exercised against a real database by hand; what is worth
// pinning here is the shape, because both parts of it fail silently. A missing
// decorator is an open endpoint, and a route file in the wrong place registers
// at the wrong path or shadows the GET.

t('deleting feedback is admin-only, like every other admin route', () => {
	const route = require(path.join(root, 'src', 'routes', 'api', 'admin', 'guilds', '[guild]', 'feedback', '[ticket]'));
	assert.deepStrictEqual(Object.keys(route), ['delete'], 'the file must export only a DELETE');

	// `fastify.authenticate` and `fastify.isAdmin` are decorators looked up off
	// the instance, so a stand-in is enough to see which were asked for.
	const named = name => Object.assign(() => {}, { decorator: name });
	const fastify = new Proxy({}, { get: (_, name) => named(name) });
	const { onRequest } = route.delete(fastify);
	assert.deepStrictEqual(
		onRequest.map(fn => fn.decorator),
		['authenticate', 'isAdmin'],
		'a DELETE that is not behind isAdmin lets any member wipe a review',
	);
});

t('the read route still answers on its original path', () => {
	// Moving `feedback.js` to `feedback/index.js` is what makes room for
	// `feedback/[ticket].js`. The loader strips `/index`, so the URL is unchanged
	// — but only if the file is named `index.js`.
	const { collectRouteFiles } = require(path.join(root, 'src', 'lib', 'routes'));
	const dir = path.join(root, 'src', 'routes');
	const paths = {};
	for (const file of collectRouteFiles(dir)) {
		const url = file
			.slice(0, -3)
			.slice(dir.length)
			.replace(/\\/g, '/')
			.replace(/\[(\w+)\]/gi, ':$1')
			.replace('/index', '') || '/';
		if (url.includes('feedback')) paths[url] = Object.keys(require(file));
	}
	assert.deepStrictEqual(paths['/api/admin/guilds/:guild/feedback'], ['get']);
	assert.deepStrictEqual(paths['/api/admin/guilds/:guild/feedback/:ticket'], ['delete']);
	// The members-only totals endpoint is untouched, and stays a read.
	assert.deepStrictEqual(paths['/api/guilds/:guild/feedback'], ['get']);
});

console.log(`\n${pass} checks passed${process.exitCode ? ' (with failures above)' : ''}\n`);
