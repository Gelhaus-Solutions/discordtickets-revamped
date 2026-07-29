/**
 * Clause evaluation.
 *
 * `flow.if` and `condition.filter` are the same thing wearing different hats —
 * one is presented as a branch, the other as a filter — so both come here. That
 * is deliberate: two evaluators would drift, and "the If node and the Only
 * Continue If node disagree about what `is staff` means" is a bug nobody would
 * enjoy finding.
 *
 * Every clause is `{field, op, value}` (plus `questionId` for `ticket.answer`),
 * with the legal combinations declared in `registry.js#CLAUSE_FIELDS` and
 * enforced at save time — so this file can assume the shape is sound and worry
 * only about the data being missing at runtime.
 *
 * **An unresolvable clause is false, never an error.** A member who left, a
 * ticket that was deleted, an answer to a question that has since been removed:
 * all of those are ordinary, and a branch that cannot be evaluated simply does
 * not fire.
 */

const { getWorkingHours } = require('../working-hours');
const {
	getPrivilegeLevel,
	isStaff,
} = require('../users');
const { pools } = require('../threads');

/** Numeric comparisons, shared by the duration and number clauses. */
const compare = {
	gt: (a, b) => a > b,
	gte: (a, b) => a >= b,
	lt: (a, b) => a < b,
};

/** Text comparisons. */
function textMatches(haystack, clause) {
	const text = String(haystack ?? '');
	const value = String(clause.value ?? '');
	switch (clause.op) {
	case 'contains':
		return text.toLowerCase().includes(value.toLowerCase());
	case 'notContains':
		return !text.toLowerCase().includes(value.toLowerCase());
	case 'is':
		return text.toLowerCase() === value.toLowerCase();
	case 'matches':
		try {
			return new RegExp(value, clause.flags ?? 'i').test(text);
		} catch {
			// Validation compiles the pattern at save time, so reaching here means
			// the row predates a stricter check. False, not a crash.
			return false;
		}
	default:
		return false;
	}
}

/**
 * Evaluate one clause.
 *
 * @param {object} clause
 * @param {import('./context').Context} ctx
 * @returns {Promise<boolean>}
 */
async function evaluateClause(clause, ctx) {
	switch (clause.field) {

	case 'member.accountAge': {
		const member = await ctx.resolveSubject(clause.subject ?? 'actor');
		if (!member) return false;
		return compare[clause.op]?.(Date.now() - member.user.createdTimestamp, Number(clause.value)) ?? false;
	}

	case 'member.hasRole': {
		const member = await ctx.resolveSubject(clause.subject ?? 'actor');
		if (!member) return false;
		const has = member.roles.cache.has(String(clause.value));
		return clause.op === 'notContains' ? !has : has;
	}

	case 'member.isStaff': {
		const member = await ctx.resolveSubject(clause.subject ?? 'actor');
		if (!member) return false;
		return (await isStaff(member.guild, member.id)) === Boolean(clause.value);
	}

	case 'member.privilege': {
		const member = await ctx.resolveSubject(clause.subject ?? 'actor');
		if (!member) return false;
		return compare[clause.op]?.(await getPrivilegeLevel(member), Number(clause.value)) ?? false;
	}

	case 'message.content': {
		const message = await ctx.getMessage();
		if (!message) return false;
		return textMatches(message.content, clause);
	}

	// Only ever runs inside an activity, never in Temporal workflow code, so
	// there is no replay determinism to worry about.
	case 'random.percent':
		return Math.random() * 100 < Number(clause.value);

	case 'ticket.answer': {
		const ticket = await ctx.getTicket();
		if (!ticket) return false;
		const answers = ticket.questionAnswers ?? await ctx.client.prisma.questionAnswer.findMany({ where: { ticketId: ticket.id } });
		const answer = answers.find(a => a.questionId === clause.questionId);
		if (!answer?.value) return false;
		// Answers are encrypted at rest; decrypt lazily so a graph that never
		// asks about one never pays for the worker round trip.
		const value = await pools.crypto.queue(w => w.decrypt(answer.value));
		return textMatches(value, clause);
	}

	case 'ticket.category': {
		const ticket = await ctx.getTicket();
		if (!ticket) return false;
		const is = ticket.categoryId === Number(clause.value);
		return clause.op === 'isNot' ? !is : is;
	}

	case 'ticket.claimed': {
		const ticket = await ctx.getTicket();
		if (!ticket) return false;
		return Boolean(ticket.claimedById) === Boolean(clause.value);
	}

	case 'ticket.openFor': {
		const ticket = await ctx.getTicket();
		if (!ticket) return false;
		return compare[clause.op]?.(Date.now() - new Date(ticket.createdAt).getTime(), Number(clause.value)) ?? false;
	}

	case 'ticket.priority': {
		const ticket = await ctx.getTicket();
		if (!ticket) return false;
		const is = ticket.priority === clause.value;
		return clause.op === 'isNot' ? !is : is;
	}

	case 'time.workingHours': {
		const settings = await ctx.getSettings();
		if (!settings) return false;
		return getWorkingHours(settings.workingHours).working === Boolean(clause.value);
	}

	default:
		return false;
	}
}

/**
 * Evaluate a node's whole clause list.
 *
 * Short-circuits, so an expensive clause (a decrypt, a member fetch) is only
 * paid for when an earlier one has not already decided the answer. Put your
 * cheap clauses first.
 */
async function evaluateClauses(params, ctx) {
	const clauses = params?.clauses ?? [];
	if (clauses.length === 0) return true;
	const all = (params.match ?? 'all') === 'all';

	for (const clause of clauses) {
		const result = await evaluateClause(clause, ctx);
		if (all && !result) return false;
		if (!all && result) return true;
	}
	return all;
}

module.exports = {
	evaluateClause,
	evaluateClauses,
	textMatches,
};
