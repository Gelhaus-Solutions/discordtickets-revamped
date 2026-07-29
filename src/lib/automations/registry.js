/**
 * The automation node catalogue.
 *
 * Every node type the canvas can produce is declared here exactly once, and this
 * file is the only place that knows what a node type *is*. Validation
 * (`validate.js`), execution (`runtime.js`) and the dashboard's catalogue
 * endpoint all read it, so adding a node type is a single entry here plus the
 * mirrored entry in the editor's `nodes.js`.
 *
 * ## The shape of an entry
 *
 * @typedef {object} ParamField
 * @property {string} key
 * @property {string} type          one of FIELD_TYPES; drives both validation and the editor widget
 * @property {string} label
 * @property {boolean} [required]
 * @property {*} [default]
 * @property {number} [min] @property {number} [max]
 * @property {number} [maxLength]
 * @property {{value: *, label: string}[]} [options]  for `select`
 * @property {string} [help]
 *
 * @typedef {object} NodeType
 * @property {'trigger'|'condition'|'action'|'flow'} category
 * @property {string} label
 * @property {string} description
 * @property {string[]} outputs     handle names, in canvas order
 * @property {ParamField[]} params
 * @property {boolean} [durable]    true ⇒ the run must be handed to Temporal here
 * @property {string[]} [provides]  triggers only: capabilities the run context will hold
 * @property {string[]} [needs]     capabilities this node cannot run without
 * @property {'stop'|'continue'} [onError]  default 'stop' — stops this branch only
 * @property {(params, push, path) => void} [validate]  cross-field rules only;
 *   per-field checks come free from `params`
 *
 * ## Capabilities
 *
 * `provides`/`needs` are what turn "reply to the message under a cron trigger"
 * from a mystery at 3am into a 400 at save time. A trigger declares what the run
 * context will contain; every reachable node's `needs` must be a subset of that.
 */

const { LIMITS } = require('./errors');
const {
	MAX_PATTERN_LENGTH, isSafePattern,
} = require('../regex');

/** What a run context can hold. Triggers `provide` these; nodes `need` them. */
const CAPABILITIES = [
	'guild',
	'actor', // the user who caused the trigger
	'member', // ...resolved to a GuildMember (absent if they left)
	'ticket', // the ticket row
	'ticketChannel', // ...and its live channel (absent once a ticket is closed)
	'channel', // some channel, not necessarily a ticket
	'message',
	'interaction',
	'selection', // the values chosen in a select menu
];

/** Who an action or condition is about. */
const SUBJECTS = [
	{
		label: 'Whoever triggered this',
		value: 'actor',
	},
	{
		label: 'The ticket creator',
		value: 'ticketCreator',
	},
	{
		label: 'Whoever claimed the ticket',
		value: 'ticketClaimer',
	},
	{
		label: 'The message author',
		value: 'messageAuthor',
	},
];

/** Which capability each subject depends on, for the `needs` walk. */
const SUBJECT_NEEDS = {
	actor: 'member',
	messageAuthor: 'message',
	ticketClaimer: 'ticket',
	ticketCreator: 'ticket',
};

const SNOWFLAKE = /^\d{15,20}$/;

/**
 * A strict 5-field cron validator.
 *
 * Deliberately hand-rolled: no cron parser is a dependency, and adding one to
 * validate a string the dashboard already constrains is not worth the surface.
 * The floor matters more than the grammar — a per-minute schedule across
 * thousands of guilds is a self-inflicted outage, so the smallest interval is
 * five minutes.
 */
const CRON_RANGES = [[0, 59], [0, 23], [1, 31], [1, 12], [0, 6]];

function isValidCron(expression) {
	if (typeof expression !== 'string') return false;
	const fields = expression.trim().split(/\s+/);
	if (fields.length !== 5) return false;

	for (let i = 0; i < fields.length; i++) {
		const [lo, hi] = CRON_RANGES[i];
		for (const part of fields[i].split(',')) {
			const [range, step] = part.split('/');
			if (step !== undefined && !/^\d+$/.test(step)) return false;
			if (step !== undefined && Number(step) < 1) return false;
			if (range === '*') continue;
			const bounds = range.split('-');
			if (bounds.length > 2) return false;
			for (const bound of bounds) {
				if (!/^\d+$/.test(bound)) return false;
				const value = Number(bound);
				if (value < lo || value > hi) return false;
			}
		}
	}

	// The floor: reject anything that could fire more often than every 5 minutes.
	const minute = fields[0];
	if (minute === '*') return false;
	const stepped = minute.match(/^\*\/(\d+)$/);
	if (stepped && Number(stepped[1]) < 5) return false;
	return true;
}

function isValidTimezone(value) {
	if (typeof value !== 'string' || !value) return false;
	try {
		new Intl.DateTimeFormat(undefined, { timeZone: value });
		return true;
	} catch {
		return false;
	}
}

/**
 * Check a stored pattern, returning the error code to report.
 *
 * "Does it compile" was the only check here, which says nothing about how long
 * it takes to run: these patterns are matched against every message in every
 * guild, on the single thread that also serves Discord and the dashboard. See
 * `src/lib/regex.js` for what is refused and why.
 *
 * @param {unknown} pattern
 * @param {string} [flags]
 * @returns {'invalid_regex'|'unsafe_regex'|null} null when the pattern is fine
 */
function regexError(pattern, flags) {
	if (typeof pattern !== 'string') return 'invalid_regex';
	try {
		new RegExp(pattern, flags ?? '');
	} catch {
		return 'invalid_regex';
	}
	return isSafePattern(pattern) ? null : 'unsafe_regex';
}

/**
 * Per-field validators.
 *
 * Each returns an error code, or null when the value is acceptable. `required`
 * is handled by the caller so every validator only has to consider values that
 * are actually present.
 */
const FIELD_TYPES = {
	automationKey: v => (typeof v === 'string' && v.length > 0 && v.length <= 12 ? null : 'invalid_automation_key'),
	boolean: v => (typeof v === 'boolean' ? null : 'not_a_boolean'),
	categories: v => (Array.isArray(v) && v.every(Number.isInteger) ? null : 'not_a_category_list'),
	category: v => (Number.isInteger(v) ? null : 'not_a_category'),
	channel: v => (SNOWFLAKE.test(String(v)) ? null : 'not_a_snowflake'),
	channels: v => (Array.isArray(v) && v.every(id => SNOWFLAKE.test(String(id))) ? null : 'not_a_channel_list'),
	clauses: null, // handled by validateClauses, which needs the registry itself
	cron: v => (isValidCron(v) ? null : 'invalid_cron'),
	duration: v => (Number.isInteger(v) && v >= 0 ? null : 'not_a_duration'),
	emoji: v => (typeof v === 'string' && v.length > 0 ? null : 'not_an_emoji'),
	number: v => (typeof v === 'number' && Number.isFinite(v) ? null : 'not_a_number'),
	priority: v => (['LOW', 'MEDIUM', 'HIGH'].includes(v) ? null : 'invalid_priority'),
	regex: v => (typeof v === 'string' ? null : 'not_a_string'),
	role: v => (SNOWFLAKE.test(String(v)) ? null : 'not_a_snowflake'),
	roles: v => (Array.isArray(v) && v.every(id => SNOWFLAKE.test(String(id))) ? null : 'not_a_role_list'),
	select: null, // checked against the field's own `options`
	subject: v => (SUBJECTS.some(s => s.value === v) || /^user:\d{15,20}$/.test(String(v)) ? null : 'invalid_subject'),
	tag: v => (Number.isInteger(v) ? null : 'not_a_tag'),
	text: v => (typeof v === 'string' ? null : 'not_a_string'),
	textarea: v => (typeof v === 'string' ? null : 'not_a_string'),
	timezone: v => (isValidTimezone(v) ? null : 'invalid_timezone'),
	url: v => {
		try {
			return new URL(String(v)).protocol === 'https:' ? null : 'not_https';
		} catch {
			return 'not_a_url';
		}
	},
	user: v => (SNOWFLAKE.test(String(v)) ? null : 'not_a_snowflake'),
};

const MESSAGES = {
	invalid_automation_key: 'is not a valid automation reference',
	invalid_cron: 'is not a valid schedule (5 cron fields, and no more often than every 5 minutes)',
	invalid_priority: 'must be LOW, MEDIUM or HIGH',
	invalid_regex: 'is not a valid regular expression',
	invalid_subject: 'is not a person this node can act on',
	invalid_timezone: 'is not a recognised timezone',
	not_a_boolean: 'must be true or false',
	not_a_category: 'must be a ticket category',
	not_a_category_list: 'must be a list of ticket categories',
	not_a_channel_list: 'must be a list of channels',
	not_a_duration: 'must be a length of time',
	not_a_number: 'must be a number',
	not_a_role_list: 'must be a list of roles',
	not_a_snowflake: 'must be a Discord id',
	not_a_string: 'must be text',
	not_a_tag: 'must be a tag',
	not_a_url: 'must be a URL',
	not_an_emoji: 'must be an emoji',
	not_https: 'must be an https:// URL',
	required: 'is required',
	too_long: 'is too long',
	too_many: 'has too many entries',
	unknown_option: 'is not one of the allowed values',
	unsafe_regex: `is too complex to run safely — avoid a repeat applied to a group that already repeats (like "(a+)+"), and keep it under ${MAX_PATTERN_LENGTH} characters`,
	value_too_large: 'is too large',
	value_too_small: 'is too small',
};

const message = code => MESSAGES[code] ?? 'is not valid';

/**
 * Validate one node's params against its schema.
 *
 * Generic on purpose: the `params` array *is* the schema, so a new node type
 * gets full validation without writing any. Node types only supply a `validate`
 * of their own for rules that span more than one field.
 */
function validateParams(params, schema, push, path) {
	const value = params ?? {};
	for (const field of schema) {
		const current = value[field.key];
		const at = `${path}.${field.key}`;

		if (current === undefined || current === null || current === '') {
			if (field.required) push(at, 'required', `${field.label} ${message('required')}`);
			continue;
		}

		if (field.type === 'select') {
			if (!field.options.some(o => o.value === current)) {
				push(at, 'unknown_option', `${field.label} ${message('unknown_option')}`);
			}
			continue;
		}

		const check = FIELD_TYPES[field.type];
		if (check) {
			const code = check(current);
			if (code) {
				push(at, code, `${field.label} ${message(code)}`);
				continue;
			}
		}

		if (field.maxLength !== undefined && String(current).length > field.maxLength) {
			push(at, 'too_long', `${field.label} ${message('too_long')} (max ${field.maxLength})`);
		}
		if (field.max !== undefined && Number(current) > field.max) {
			push(at, 'value_too_large', `${field.label} ${message('value_too_large')} (max ${field.max})`);
		}
		if (field.min !== undefined && Number(current) < field.min) {
			push(at, 'value_too_small', `${field.label} ${message('value_too_small')} (min ${field.min})`);
		}
		if (Array.isArray(current) && field.maxItems !== undefined && current.length > field.maxItems) {
			push(at, 'too_many', `${field.label} ${message('too_many')} (max ${field.maxItems})`);
		}
	}
}

/* ────────────────────────────── condition clauses ───────────────────────────── */

/**
 * The left-hand operands available in a clause row, and what each needs.
 *
 * `condition.*` nodes are sugar for a one-clause `flow.if`; both evaluate the
 * same clause objects through `conditions.js#evaluateClause`, so this table is
 * the only definition of what can be tested.
 */
const CLAUSE_FIELDS = {
	'member.accountAge': {
		label: 'The member\'s account age',
		needs: ['member'],
		operand: 'duration',
		ops: ['gt', 'lt'],
	},
	'member.hasRole': {
		label: 'The member\'s roles',
		needs: ['member'],
		operand: 'role',
		ops: ['contains', 'notContains'],
	},
	'member.isStaff': {
		label: 'The member is staff',
		needs: ['member'],
		operand: 'boolean',
		ops: ['is'],
	},
	'member.privilege': {
		label: 'The member\'s privilege level',
		needs: ['member'],
		operand: 'number',
		ops: ['gte', 'lt'],
	},
	'message.content': {
		label: 'The message text',
		needs: ['message'],
		operand: 'regex',
		ops: ['contains', 'notContains', 'matches'],
	},
	'random.percent': {
		label: 'A random percentage',
		needs: [],
		operand: 'number',
		ops: ['lt'],
	},
	'ticket.answer': {
		label: 'An answer to a question',
		needs: ['ticket'],
		operand: 'regex',
		ops: ['is', 'contains', 'matches'],
	},
	'ticket.category': {
		label: 'The ticket\'s category',
		needs: ['ticket'],
		operand: 'category',
		ops: ['is', 'isNot'],
	},
	'ticket.claimed': {
		label: 'The ticket is claimed',
		needs: ['ticket'],
		operand: 'boolean',
		ops: ['is'],
	},
	'ticket.openFor': {
		label: 'How long the ticket has been open',
		needs: ['ticket'],
		operand: 'duration',
		ops: ['gt', 'lt'],
	},
	'ticket.priority': {
		label: 'The ticket\'s priority',
		needs: ['ticket'],
		operand: 'priority',
		ops: ['is', 'isNot'],
	},
	'time.workingHours': {
		label: 'Inside working hours',
		needs: ['guild'],
		operand: 'boolean',
		ops: ['is'],
	},
};

const CLAUSE_OPS = {
	contains: 'contains',
	gt: 'is more than',
	gte: 'is at least',
	is: 'is',
	isNot: 'is not',
	lt: 'is less than',
	matches: 'matches the pattern',
	notContains: 'does not contain',
};

/** Validate the `clauses` array shared by `flow.if` and `condition.filter`. */
function validateClauses(clauses, push, path) {
	if (!Array.isArray(clauses) || clauses.length === 0) {
		push(path, 'required', 'At least one condition is required');
		return;
	}
	if (clauses.length > LIMITS.clauses) {
		push(path, 'too_many', `Too many conditions (max ${LIMITS.clauses})`);
		return;
	}

	clauses.forEach((clause, i) => {
		const at = `${path}[${i}]`;
		const definition = CLAUSE_FIELDS[clause?.field];
		if (!definition) {
			push(`${at}.field`, 'unknown_clause_field', `"${clause?.field}" is not something that can be tested`);
			return;
		}
		if (!definition.ops.includes(clause.op)) {
			push(`${at}.op`, 'unknown_clause_op', `"${clause.op}" cannot be used with ${definition.label}`);
			return;
		}

		// `ticket.answer` is the only clause that names a second thing (which
		// question), so it carries an extra key rather than widening every clause.
		if (clause.field === 'ticket.answer' && typeof clause.questionId !== 'string') {
			push(`${at}.questionId`, 'required', 'Pick which question to check');
		}
		if (definition.operand === 'regex' && clause.op === 'matches') {
			// Clause values never reach the generic `maxLength` check below (that
			// runs over node params, not clauses), so this is the only length
			// limit they get.
			const code = regexError(clause.value, clause.flags);
			if (code) push(`${at}.value`, code, `The pattern ${message(code)}`);
		}
		if (definition.operand !== 'regex') {
			const check = FIELD_TYPES[definition.operand];
			const code = check ? check(clause.value) : null;
			if (code) push(`${at}.value`, code, `The value ${message(code)}`);
		}
	});
}

/**
 * Validate the buttons attached to `action.message.send`.
 *
 * Each one points at another automation, which must exist in this guild *and*
 * be triggered by a button press — pointing a button at a ticket-closed
 * automation would render fine and then do nothing when pressed, which is the
 * worst kind of broken.
 */
function validateButtons(buttons, push, path, options = {}) {
	if (buttons === undefined || buttons === null) return;
	if (!Array.isArray(buttons)) {
		push(path, 'not_a_list', 'Buttons must be a list');
		return;
	}
	if (buttons.length > LIMITS.messageButtons) {
		push(path, 'too_many', `Too many buttons (max ${LIMITS.messageButtons})`);
		return;
	}

	buttons.forEach((button, i) => {
		const at = `${path}[${i}]`;
		if (!button || typeof button !== 'object') {
			push(at, 'not_an_object', 'This button is not valid');
			return;
		}
		if (typeof button.label !== 'string' || !button.label.trim()) {
			push(`${at}.label`, 'required', 'Buttons need a label');
		} else if (button.label.length > 80) {
			push(`${at}.label`, 'too_long', 'The label is too long (max 80)');
		}
		if (button.style && !['primary', 'secondary', 'success', 'danger'].includes(button.style)) {
			push(`${at}.style`, 'unknown_option', 'That is not a button style');
		}
		// A button points either at a trigger node in *this* graph — the common
		// case, and why one automation can own several buttons — or at another
		// automation entirely.
		const hasNode = typeof button.nodeId === 'string' && button.nodeId;
		const hasKey = typeof button.automationKey === 'string' && button.automationKey;

		if (!hasNode && !hasKey) {
			push(`${at}.nodeId`, 'required', 'Pick what this button does');
			return;
		}
		if (hasNode && hasKey) {
			push(`${at}.nodeId`, 'ambiguous_target', 'A button runs one thing, not two');
			return;
		}

		if (hasNode) {
			// `buttonNodeIds` is supplied by the caller from the graph being saved.
			if (options.buttonNodeIds && !options.buttonNodeIds.includes(button.nodeId)) {
				push(`${at}.nodeId`, 'unknown_trigger', 'That step is not a "button is pressed" trigger in this automation');
			}
			return;
		}

		// `buttonAutomationKeys` is only supplied by the routes; the tests and the
		// catalogue endpoint validate the shape without the guild's data.
		if (options.automationKeys && !options.automationKeys.includes(button.automationKey)) {
			push(`${at}.automationKey`, 'unknown_automation', 'That automation no longer exists');
		} else if (options.buttonAutomationKeys && !options.buttonAutomationKeys.includes(button.automationKey)) {
			push(`${at}.automationKey`, 'not_a_button_automation', 'That automation is not started by a button press');
		}
	});
}

/** Capabilities every clause in a node's params depends on. */
function clauseNeeds(params) {
	const needs = new Set();
	for (const clause of params?.clauses ?? []) {
		for (const capability of CLAUSE_FIELDS[clause?.field]?.needs ?? []) needs.add(capability);
	}
	return [...needs];
}

/* ─────────────────────────── shared param fragments ─────────────────────────── */

const subjectField = (label = 'Who') => ({
	default: 'actor',
	key: 'subject',
	label,
	options: SUBJECTS,
	required: true,
	type: 'select',
});

const categoryFilter = {
	help: 'Leave empty to match every category.',
	key: 'categoryIds',
	label: 'Only these categories',
	type: 'categories',
};

const clauseParams = [
	{
		default: 'all',
		key: 'match',
		label: 'Match',
		options: [{
			label: 'All of these',
			value: 'all',
		}, {
			label: 'Any of these',
			value: 'any',
		}],
		required: true,
		type: 'select',
	},
	{
		default: [],
		key: 'clauses',
		label: 'Conditions',
		required: true,
		type: 'clauses',
	},
];

const validateClauseNode = (params, push, path) => validateClauses(params?.clauses, push, `${path}.clauses`);

/* ──────────────────────────────── node types ────────────────────────────────── */

/** Capabilities every ticket trigger provides. `ticketChannel` is added per type. */
const TICKET_CTX = ['guild', 'actor', 'member', 'ticket', 'ticketChannel'];

/** @type {Record<string, NodeType>} */
const NODE_TYPES = {

	/* ── actions ─────────────────────────────────────────────────────────────── */

	'action.automation.run': {
		category: 'action',
		description: 'Run another automation with the same context.',
		label: 'Run another automation',
		outputs: ['out'],
		params: [{
			key: 'automationKey',
			label: 'Automation',
			required: true,
			type: 'automationKey',
		}],
	},
	'action.log': {
		category: 'action',
		description: 'Write a line to the server\'s log channel.',
		label: 'Write to the log',
		needs: ['guild'],
		outputs: ['out'],
		params: [{
			key: 'content',
			label: 'Entry',
			maxLength: 1000,
			required: true,
			type: 'textarea',
		}],
	},
	'action.message.dm': {
		category: 'action',
		description: 'Send someone a direct message.',
		label: 'Send a DM',
		needs: ['member'],
		// A closed DM is the member's choice, not a fault: it must not stop the run.
		onError: 'continue',
		outputs: ['out'],
		params: [subjectField('Send to'), {
			key: 'content',
			label: 'Message',
			maxLength: LIMITS.messageLength,
			required: true,
			type: 'textarea',
		}],
	},
	'action.message.ephemeral': {
		category: 'action',
		description: 'Reply where only the person who pressed the button or picked the option can see it.',
		label: 'Send an ephemeral reply',
		// Only an interaction can be answered privately. Declaring the capability
		// is what turns "why did nothing happen?" under a ticket trigger into a
		// 400 at save time.
		needs: ['interaction'],
		outputs: ['out'],
		params: [{
			key: 'content',
			label: 'Message',
			maxLength: LIMITS.messageLength,
			required: true,
			type: 'textarea',
		}],
	},
	'action.message.react': {
		category: 'action',
		description: 'React to the message that triggered this.',
		label: 'Add a reaction',
		needs: ['message'],
		onError: 'continue',
		outputs: ['out'],
		params: [{
			key: 'emoji',
			label: 'Emoji',
			required: true,
			type: 'emoji',
		}],
	},
	'action.message.reply': {
		category: 'action',
		description: 'Reply to the message or interaction that triggered this.',
		label: 'Reply',
		needs: ['actor'],
		outputs: ['out'],
		params: [
			{
				key: 'content',
				label: 'Message',
				maxLength: LIMITS.messageLength,
				required: true,
				type: 'textarea',
			},
			{
				default: true,
				key: 'ephemeral',
				label: 'Only they can see it',
				type: 'boolean',
			},
		],
	},
	'action.message.send': {
		category: 'action',
		description: 'Post a message in a channel.',
		label: 'Send a message',
		outputs: ['out'],
		params: [
			{
				default: 'ticket',
				key: 'target',
				label: 'Send to',
				options: [
					{
						label: 'The ticket channel',
						value: 'ticket',
					},
					{
						label: 'The channel this happened in',
						value: 'triggerChannel',
					},
					{
						label: 'A specific channel',
						value: 'channel',
					},
				],
				required: true,
				type: 'select',
			},
			{
				key: 'channelId',
				label: 'Channel',
				type: 'channel',
			},
			{
				key: 'content',
				label: 'Message',
				maxLength: LIMITS.messageLength,
				required: true,
				type: 'textarea',
			},
			{
				help: 'Each button starts a "button is pressed" trigger — in this automation, or another one.',
				key: 'buttons',
				label: 'Buttons',
				maxItems: LIMITS.messageButtons,
				type: 'buttons',
			},
		],
		validate: (params, push, path, options) => {
			if (params?.target === 'channel' && !params.channelId) {
				push(`${path}.channelId`, 'required', 'Pick a channel to send to');
			}
			validateButtons(params?.buttons, push, `${path}.buttons`, options);
		},
	},
	'action.role.add': {
		category: 'action',
		description: 'Give someone a role.',
		label: 'Add a role',
		needs: ['member'],
		outputs: ['out'],
		params: [subjectField('Give it to'), {
			key: 'roleId',
			label: 'Role',
			required: true,
			type: 'role',
		}],
	},
	'action.role.remove': {
		category: 'action',
		description: 'Take a role away from someone.',
		label: 'Remove a role',
		needs: ['member'],
		outputs: ['out'],
		params: [subjectField('Take it from'), {
			key: 'roleId',
			label: 'Role',
			required: true,
			type: 'role',
		}],
	},
	'action.ticket.addMember': {
		category: 'action',
		description: 'Give someone access to the ticket.',
		label: 'Add someone to the ticket',
		needs: ['ticketChannel'],
		outputs: ['out'],
		params: [subjectField('Add')],
	},
	'action.ticket.claim': {
		category: 'action',
		description: 'Assign the ticket to someone.',
		label: 'Claim the ticket',
		needs: ['ticketChannel'],
		outputs: ['out'],
		params: [subjectField('Claim for')],
	},
	'action.ticket.close': {
		category: 'action',
		// Closing goes through Temporal already, so this action is not itself durable.
		description: 'Close the ticket, with an optional reason.',
		label: 'Close the ticket',
		needs: ['ticket'],
		outputs: ['out'],
		params: [{
			key: 'reason',
			label: 'Reason',
			maxLength: 100,
			type: 'text',
		}],
	},
	'action.ticket.move': {
		category: 'action',
		description: 'Move the ticket to another category.',
		label: 'Move the ticket',
		needs: ['ticketChannel'],
		outputs: ['out'],
		params: [{
			key: 'categoryId',
			label: 'Category',
			required: true,
			type: 'category',
		}],
	},
	'action.ticket.removeMember': {
		category: 'action',
		description: 'Revoke someone\'s access to the ticket.',
		label: 'Remove someone from the ticket',
		needs: ['ticketChannel'],
		outputs: ['out'],
		params: [subjectField('Remove')],
	},
	'action.ticket.rename': {
		category: 'action',
		description: 'Rename the ticket channel.',
		label: 'Rename the channel',
		needs: ['ticketChannel'],
		// Discord allows two channel renames per ten minutes; being rate limited is
		// an expected outcome here, not a failure worth stopping the branch for.
		onError: 'continue',
		outputs: ['out'],
		params: [{
			key: 'name',
			label: 'New name',
			maxLength: 100,
			required: true,
			type: 'text',
		}],
	},
	'action.ticket.setPriority': {
		category: 'action',
		description: 'Change the ticket\'s priority.',
		label: 'Set the priority',
		needs: ['ticketChannel'],
		outputs: ['out'],
		params: [{
			default: 'MEDIUM',
			key: 'priority',
			label: 'Priority',
			options: [{
				label: 'Low',
				value: 'LOW',
			}, {
				label: 'Medium',
				value: 'MEDIUM',
			}, {
				label: 'High',
				value: 'HIGH',
			}],
			required: true,
			type: 'select',
		}],
	},
	'action.ticket.setTopic': {
		category: 'action',
		description: 'Replace the ticket\'s topic.',
		label: 'Set the topic',
		needs: ['ticket'],
		outputs: ['out'],
		params: [{
			key: 'topic',
			label: 'Topic',
			maxLength: 1000,
			required: true,
			type: 'text',
		}],
	},

	/* ── conditions ──────────────────────────────────────────────────────────── */

	'condition.filter': {
		category: 'condition',
		description: 'Split the path on one or more tests.',
		label: 'Check something',
		needs: [],
		outputs: ['true', 'false'],
		params: clauseParams,
		validate: validateClauseNode,
	},

	/* ── flow ────────────────────────────────────────────────────────────────── */

	'flow.if': {
		category: 'flow',
		description: 'Split the path in two.',
		label: 'If / Else',
		outputs: ['true', 'false'],
		params: clauseParams,
		validate: validateClauseNode,
	},
	'flow.noop': {
		category: 'flow',
		description: 'Does nothing. Useful as a place for branches to converge.',
		label: 'Continue',
		outputs: ['out'],
		params: [{
			key: 'note',
			label: 'Note',
			maxLength: 200,
			type: 'text',
		}],
	},
	'flow.stop': {
		category: 'flow',
		description: 'End this branch here.',
		label: 'Stop',
		outputs: [],
		params: [{
			key: 'reason',
			label: 'Reason',
			maxLength: 200,
			type: 'text',
		}],
	},
	'flow.wait': {
		category: 'flow',
		description: 'Pause, then carry on. The rest of the run is made durable.',
		durable: true,
		label: 'Wait',
		outputs: ['out'],
		params: [{
			default: 600_000,
			key: 'ms',
			label: 'Wait for',
			max: LIMITS.waitMaxMs,
			min: LIMITS.waitMinMs,
			required: true,
			type: 'duration',
		}],
	},

	/* ── triggers ────────────────────────────────────────────────────────────── */

	'trigger.bot.command': {
		category: 'trigger',
		description: 'Another bot posts a command for this bot to act on. Locked to one bot, in one channel, behind a prefix.',
		label: 'Another bot sends a command',
		outputs: ['out'],
		params: [
			{
				help: 'Enable Developer Mode in Discord, then right-click the other bot and Copy User ID. Nothing else can trigger this.',
				key: 'botId',
				label: 'From this bot',
				required: true,
				type: 'user',
			},
			{
				help: 'Use a channel only the two bots can post in. Discord\'s channel permissions are the real lock here — the prefix is not a substitute for them.',
				key: 'channelId',
				label: 'In this channel',
				required: true,
				type: 'channel',
			},
			{
				help: 'The message must start with this, e.g. !dt-. Matched against the message text only, never an embed, so nothing an embed contains can fake it.',
				key: 'prefix',
				label: 'Required prefix',
				maxLength: 32,
				required: true,
				type: 'text',
			},
			{
				help: 'Optional, and tested against what follows the prefix. Anything in (brackets) becomes {match1}, {match2}… for later steps.',
				key: 'pattern',
				label: 'Then matching',
				maxLength: 200,
				type: 'regex',
			},
		],
		provides: ['guild', 'actor', 'member', 'channel', 'message', 'ticket', 'ticketChannel'],
		validate: (params, push, path) => {
			// A prefix of whitespace, or one that is just the bot's own name, is
			// how this stops being a lock and starts being a formality.
			if (params?.prefix !== undefined && params.prefix !== null && !String(params.prefix).trim()) {
				push(`${path}.prefix`, 'required', 'The prefix cannot be blank');
			}
			if (params?.pattern) {
				const code = regexError(params.pattern, 'i');
				if (code) push(`${path}.pattern`, code, `The pattern ${message(code)}`);
			}
		},
	},
	'trigger.button.pressed': {
		category: 'trigger',
		description: 'Someone presses a button you placed on a panel or opening message.',
		label: 'A button is pressed',
		outputs: ['out'],
		params: [
			{
				key: 'label',
				label: 'Button label',
				maxLength: 80,
				required: true,
				type: 'text',
			},
			{
				key: 'emoji',
				label: 'Emoji',
				type: 'emoji',
			},
			{
				default: 'primary',
				key: 'style',
				label: 'Style',
				options: [
					{
						label: 'Blurple',
						value: 'primary',
					},
					{
						label: 'Grey',
						value: 'secondary',
					},
					{
						label: 'Green',
						value: 'success',
					},
					{
						label: 'Red',
						value: 'danger',
					},
				],
				type: 'select',
			},
			{
				default: 'ephemeral',
				help: 'Discord needs an answer within 3 seconds, so this happens before the automation runs.',
				key: 'ack',
				label: 'When pressed',
				options: [
					{
						label: 'Show a private "working on it"',
						value: 'ephemeral',
					},
					{
						label: 'Acknowledge silently',
						value: 'none',
					},
				],
				type: 'select',
			},
		],
		provides: ['guild', 'actor', 'member', 'interaction', 'channel', 'ticket', 'ticketChannel'],
	},
	'trigger.member.joined': {
		category: 'trigger',
		description: 'Someone joins the server.',
		label: 'A member joins',
		outputs: ['out'],
		params: [],
		provides: ['guild', 'actor', 'member'],
	},
	'trigger.member.left': {
		category: 'trigger',
		description: 'Someone leaves the server.',
		label: 'A member leaves',
		outputs: ['out'],
		params: [],
		// No `member`: they are gone by the time this fires.
		provides: ['guild', 'actor'],
	},
	'trigger.member.roleAdded': {
		category: 'trigger',
		description: 'Someone is given a particular role.',
		label: 'A role is added',
		outputs: ['out'],
		params: [{
			key: 'roleId',
			label: 'Role',
			required: true,
			type: 'role',
		}],
		provides: ['guild', 'actor', 'member'],
	},
	'trigger.member.roleRemoved': {
		category: 'trigger',
		description: 'A particular role is taken away from someone.',
		label: 'A role is removed',
		outputs: ['out'],
		params: [{
			key: 'roleId',
			label: 'Role',
			required: true,
			type: 'role',
		}],
		provides: ['guild', 'actor', 'member'],
	},
	'trigger.menu.selected': {
		category: 'trigger',
		description: 'Someone picks an option from a menu you placed.',
		label: 'A menu option is picked',
		outputs: ['out'],
		params: [
			{
				key: 'placeholder',
				label: 'Placeholder',
				maxLength: 150,
				type: 'text',
			},
			{
				default: 'ephemeral',
				key: 'ack',
				label: 'When picked',
				options: [
					{
						label: 'Show a private "working on it"',
						value: 'ephemeral',
					},
					{
						label: 'Acknowledge silently',
						value: 'none',
					},
				],
				type: 'select',
			},
		],
		provides: ['guild', 'actor', 'member', 'interaction', 'channel', 'selection', 'ticket', 'ticketChannel'],
	},
	'trigger.message.created': {
		category: 'trigger',
		description: 'Someone posts a message.',
		label: 'A message is posted',
		outputs: ['out'],
		params: [
			{
				default: 'ticket',
				key: 'scope',
				label: 'Where',
				options: [
					{
						label: 'In any ticket',
						value: 'ticket',
					},
					{
						label: 'Outside tickets',
						value: 'nonTicket',
					},
					{
						label: 'In specific channels',
						value: 'channels',
					},
					{
						label: 'Anywhere',
						value: 'any',
					},
				],
				required: true,
				type: 'select',
			},
			{
				key: 'channelIds',
				label: 'Channels',
				type: 'channels',
			},
			{
				help: 'Leave empty to match every message. Anything in (brackets) becomes {match1}, {match2}… for later steps to use.',
				key: 'pattern',
				label: 'Matching',
				maxLength: 200,
				type: 'regex',
			},
			{
				default: true,
				help: 'Most bots put their output in an embed rather than in the message text.',
				key: 'searchEmbeds',
				label: 'Search embeds too',
				type: 'boolean',
			},
			{
				default: true,
				help: 'Turn this off to listen to another bot. This bot\'s own messages never trigger an automation either way.',
				key: 'ignoreBots',
				label: 'Ignore bots',
				type: 'boolean',
			},
			{
				help: 'Only messages from this bot. Enable Developer Mode in Discord, then right-click the bot and Copy User ID.',
				key: 'botId',
				label: 'From one bot only',
				type: 'user',
			},
		],
		provides: ['guild', 'actor', 'member', 'channel', 'message', 'ticket', 'ticketChannel'],
		validate: (params, push, path) => {
			if (params?.scope === 'channels' && !(params.channelIds?.length > 0)) {
				push(`${path}.channelIds`, 'required', 'Pick at least one channel');
			}
			if (params?.pattern) {
				const code = regexError(params.pattern, 'i');
				if (code) push(`${path}.pattern`, code, `The pattern ${message(code)}`);
			}
			// Naming a bot while still ignoring bots matches nothing at all, which
			// is a support ticket rather than an error anyone would guess at.
			if (params?.botId && params.ignoreBots !== false) {
				push(`${path}.ignoreBots`, 'conflict', 'Turn "Ignore bots" off to listen to another bot');
			}
		},
	},
	'trigger.schedule.cron': {
		category: 'trigger',
		description: 'Runs on a fixed schedule.',
		label: 'On a schedule',
		outputs: ['out'],
		params: [
			{
				default: '0 9 * * *',
				key: 'cron',
				label: 'Schedule',
				required: true,
				type: 'cron',
			},
			{
				default: 'UTC',
				key: 'timezone',
				label: 'Timezone',
				required: true,
				type: 'timezone',
			},
		],
		// Nothing but the guild: there is no actor, no ticket and no message.
		provides: ['guild'],
	},
	'trigger.ticket.claimed': {
		category: 'trigger',
		description: 'A staff member claims a ticket.',
		label: 'A ticket is claimed',
		outputs: ['out'],
		params: [categoryFilter],
		provides: TICKET_CTX,
	},
	'trigger.ticket.closeRequested': {
		category: 'trigger',
		description: 'Someone asks for a ticket to be closed.',
		label: 'A close is requested',
		outputs: ['out'],
		params: [categoryFilter],
		provides: TICKET_CTX,
	},
	'trigger.ticket.closed': {
		category: 'trigger',
		description: 'A ticket is closed.',
		label: 'A ticket is closed',
		outputs: ['out'],
		params: [categoryFilter],
		// No `ticketChannel`: for channel-mode tickets it has already been deleted.
		provides: ['guild', 'actor', 'member', 'ticket'],
	},
	'trigger.ticket.created': {
		category: 'trigger',
		description: 'Someone opens a ticket.',
		label: 'A ticket is opened',
		outputs: ['out'],
		params: [categoryFilter],
		provides: TICKET_CTX,
	},
	'trigger.ticket.feedback': {
		category: 'trigger',
		description: 'Someone rates a closed ticket.',
		label: 'Feedback is given',
		outputs: ['out'],
		params: [{
			key: 'ratingBelow',
			label: 'Only if the rating is below',
			max: 5,
			min: 1,
			type: 'number',
		}],
		provides: ['guild', 'actor', 'member', 'ticket'],
	},
	'trigger.ticket.memberAdded': {
		category: 'trigger',
		description: 'Someone is given access to a ticket.',
		label: 'Someone is added to a ticket',
		outputs: ['out'],
		params: [categoryFilter],
		provides: TICKET_CTX,
	},
	'trigger.ticket.moved': {
		category: 'trigger',
		description: 'A ticket is moved to another category.',
		label: 'A ticket is moved',
		outputs: ['out'],
		params: [categoryFilter],
		provides: TICKET_CTX,
	},
	'trigger.ticket.priorityChanged': {
		category: 'trigger',
		description: 'A ticket\'s priority is changed.',
		label: 'A ticket\'s priority changes',
		outputs: ['out'],
		params: [{
			key: 'to',
			label: 'Only when set to',
			options: [{
				label: 'Low',
				value: 'LOW',
			}, {
				label: 'Medium',
				value: 'MEDIUM',
			}, {
				label: 'High',
				value: 'HIGH',
			}],
			type: 'select',
		}],
		provides: TICKET_CTX,
	},
	'trigger.ticket.released': {
		category: 'trigger',
		description: 'A staff member releases a ticket they had claimed.',
		label: 'A ticket is released',
		outputs: ['out'],
		params: [categoryFilter],
		provides: TICKET_CTX,
	},
	'trigger.ticket.reopened': {
		category: 'trigger',
		description: 'A closed ticket is reopened.',
		label: 'A ticket is reopened',
		outputs: ['out'],
		params: [categoryFilter],
		provides: TICKET_CTX,
	},
	'trigger.ticket.stale': {
		category: 'trigger',
		description: 'A ticket goes quiet for long enough to be warned about.',
		label: 'A ticket goes stale',
		outputs: ['out'],
		params: [categoryFilter],
		provides: TICKET_CTX,
	},
};

/** Node type ids grouped by category, for the palette and the catalogue endpoint. */
const NODE_CATEGORIES = ['trigger', 'condition', 'action', 'flow'].reduce((acc, category) => {
	acc[category] = Object.keys(NODE_TYPES).filter(type => NODE_TYPES[type].category === category).sort();
	return acc;
}, {});

/**
 * Everything a node depends on: its declared `needs`, plus whatever its clauses
 * and subject reference. Keeping this in one function is what stops the
 * capability check from quietly missing the dynamic cases.
 */
function needsOf(node) {
	const type = NODE_TYPES[node?.type];
	if (!type) return [];
	const needs = new Set(type.needs ?? []);
	for (const capability of clauseNeeds(node.params)) needs.add(capability);

	const subject = node.params?.subject;
	if (subject && SUBJECT_NEEDS[subject]) needs.add(SUBJECT_NEEDS[subject]);
	if (typeof subject === 'string' && subject.startsWith('user:')) needs.add('guild');

	// "Send to the ticket channel" is only a ticket dependency when that is what
	// was picked — the same node sending to a fixed channel needs nothing.
	if (node.type === 'action.message.send') {
		if (node.params?.target === 'ticket') needs.add('ticketChannel');
		if (node.params?.target === 'triggerChannel') needs.add('channel');
	}
	return [...needs];
}

/** The catalogue the dashboard fetches. Derived, so it can never drift. */
function catalogue() {
	return {
		capabilities: CAPABILITIES,
		categories: NODE_CATEGORIES,
		clauseFields: Object.entries(CLAUSE_FIELDS).map(([field, d]) => ({
			field,
			label: d.label,
			needs: d.needs,
			operand: d.operand,
			ops: d.ops,
		})),
		clauseOps: CLAUSE_OPS,
		limits: LIMITS,
		subjects: SUBJECTS,
		types: Object.entries(NODE_TYPES).map(([type, d]) => ({
			category: d.category,
			description: d.description,
			durable: Boolean(d.durable),
			label: d.label,
			needs: d.needs ?? [],
			outputs: d.outputs,
			params: d.params,
			provides: d.provides ?? [],
			type,
		})),
		version: require('./errors').GRAPH_VERSION,
	};
}

module.exports = {
	CAPABILITIES,
	CLAUSE_FIELDS,
	CLAUSE_OPS,
	NODE_CATEGORIES,
	NODE_TYPES,
	SUBJECTS,
	catalogue,
	isValidCron,
	isValidTimezone,
	regexError,
	needsOf,
	validateButtons,
	validateClauses,
	validateParams,
};
