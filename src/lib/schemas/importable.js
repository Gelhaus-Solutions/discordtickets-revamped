/**
 * Scalar column allow-lists for everything that enters the database from an
 * uploaded guild archive.
 *
 * The importer used to spread the archive's JSON straight into Prisma creates
 * (`{ ...settings, id: guildId }`). Prisma's `*CreateInput` types accept nested
 * relation operations, so an archive could carry
 * `"tickets": { "connect": [{ "guildId_number": { "guildId": "<victim>", "number": 1 } }] }`
 * and reassign another guild's tickets to the importing guild — which then
 * reads them, fully decrypted, through the normal transcript route. `panels`,
 * `automations` and `feedback` are the same shape, and the per-ticket object
 * additionally let an archive choose primary keys and `htmlTranscript` (a path
 * that is later joined onto the data directory and served).
 *
 * So: nothing is spread. Every payload is rebuilt from a known list of scalar
 * columns, and an unexpected key is a hard error rather than a silent drop —
 * an archive from a newer version should fail visibly, not import half of
 * itself.
 *
 * The lists are the scalar (non-relation) fields of each model in
 * `db/<provider>/schema.prisma`. Relation *scalars* the importer sets itself
 * (`guildId`, `categoryId`, `ticketId`, …) are deliberately absent.
 */

// Guild columns the settings UI may write. Exported so the settings route and
// the importer share one definition and cannot drift apart.
// The `blockedRoles`…`totalLimit` entries are the server-wide defaults their
// namesakes on `Category` fall back to — see `src/lib/settings/inheritance.js`.
// They export as null when unset, and null is meaningful (it is what "inherit"
// looks like), so the round-trip has to preserve it rather than coerce it.
const GUILD_SETTINGS_FIELDS = [
	'archive',
	'autoClose',
	'autoTag',
	'awaitingStaffEmoji',
	'blockedRoles',
	'blocklist',
	'channelName',
	'claimedEmoji',
	'claimButton',
	'closeButton',
	'closedEmoji',
	'closeReasonButton',
	'cooldown',
	'disableDMs',
	'errorColour',
	'feedbackQuestions',
	'footer',
	'locale',
	'logChannel',
	'memberLimit',
	'pingRoles',
	'primaryColour',
	'priorityEmojis',
	'ratelimit',
	'reopenWindow',
	'requiredRoles',
	'skipCloseRequest',
	'staffRoles',
	'staleAfter',
	'successColour',
	'totalLimit',
	'unclaimedEmoji',
	'workingHours',
];

// …plus the bot profile, which the customization endpoint owns but which is
// part of a guild's exported state.
const GUILD_FIELDS = [
	...GUILD_SETTINGS_FIELDS,
	'botAvatar',
	'botBanner',
	'botBio',
	'botUsername',
];

const CATEGORY_FIELDS = [
	'autoAssign',
	'awaitingStaffEmoji',
	'blockedRoles',
	'channelMode',
	'channelName',
	'claimedEmoji',
	'claiming',
	'closedEmoji',
	'cooldown',
	'customTopic',
	'description',
	'discordCategory',
	'emoji',
	'enableFeedback',
	'feedbackQuestions',
	'image',
	'memberLimit',
	'messageLayout',
	'name',
	'openingMessage',
	'pingRoles',
	'priorityEmojis',
	'ratelimit',
	'requiredRoles',
	'requireTopic',
	'skipCloseRequest',
	'staffChannel',
	'staffChannelMode',
	// A snowflake that will not exist in an importing guild, the same as
	// `discordCategory` and `threadChannelId` beside it. Kept for the same reason
	// they are: an export within one guild round-trips, and the alternative is an
	// exception nobody would remember the rule for.
	'staffChannelParent',
	'staffRoles',
	'threadChannelId',
	'totalLimit',
	'unclaimedEmoji',
];

// `id` is kept deliberately: question ids are uuids, and each imported ticket's
// `questionAnswers.questionId` points at them. Dropping it would orphan every
// stored answer.
const QUESTION_FIELDS = [
	'config',
	'id',
	'label',
	'maxLength',
	'minLength',
	'options',
	'order',
	'placeholder',
	'required',
	'style',
	'type',
	'value',
];

const TAG_FIELDS = [
	'content',
	'name',
	'regex',
];

// `id` is kept: ticket ids are Discord channel/thread snowflakes and the
// archived message/user/role rows reference them. `htmlTranscript` is not —
// it is a storage reference, and one chosen by an archive would be a read of
// whatever it named. It stays excluded even though export archives now carry
// transcript files: the importer writes those under a key it derives from the
// ticket id itself and sets the reference afterwards, so the value never comes
// from the archive at any point. (See `importGuildFromArchive`.)
const TICKET_FIELDS = [
	'awaitingResponseFrom',
	'claimedById',
	'closedAt',
	'closedById',
	'closedReason',
	'createdAt',
	'createdById',
	'deleted',
	'emojiOverride',
	'emojiOverrideScope',
	'firstResponseAt',
	'id',
	'lastMessageAt',
	'messageCount',
	'number',
	'open',
	'openingMessageId',
	'pendingCloseAt',
	'pinnedMessageIds',
	'priority',
	'referencesMessageId',
	'referencesTicketId',
	'topic',
];

const ARCHIVED_CHANNEL_FIELDS = [
	'channelId',
	'createdAt',
	'name',
];

const ARCHIVED_MESSAGE_FIELDS = [
	'authorId',
	'content',
	'createdAt',
	'deleted',
	'edited',
	'external',
	'id',
	'ticketId',
];

const ARCHIVED_ROLE_FIELDS = [
	'colour',
	'createdAt',
	'name',
	'roleId',
];

const ARCHIVED_USER_FIELDS = [
	'avatar',
	'bot',
	'createdAt',
	'discriminator',
	'displayName',
	'roleId',
	'userId',
	'username',
];

const FEEDBACK_FIELDS = [
	'comment',
	'createdAt',
	'rating',
	'userId',
];

// `label` and `type` are snapshots taken at submission time, not references to
// a question row — feedback questions live in a JSON column, so there is nothing
// to point at. They are exported because they are the answer: without them an
// imported submission would be a value with no question attached.
const FEEDBACK_ANSWER_FIELDS = [
	'createdAt',
	'label',
	'questionId',
	'type',
	'value',
];

const QUESTION_ANSWER_FIELDS = [
	'createdAt',
	'questionId',
	'userId',
	'value',
];

/**
 * Rebuild `source` from `fields`, rejecting anything else.
 *
 * @param {Record<string, unknown>} source parsed archive data (untrusted)
 * @param {string[]} fields allowed scalar column names
 * @param {string} what label used in the error message
 * @param {string[]} [ignore] keys that are expected but handled elsewhere
 * @returns {Record<string, unknown>} a new object with only the allowed keys
 * @throws {Error} if `source` carries a key that is neither allowed nor ignored
 */
function pick(source, fields, what, ignore = []) {
	if (!source || typeof source !== 'object' || Array.isArray(source)) {
		throw new Error(`Archive contains an invalid ${what}`);
	}
	const allowed = new Set(fields);
	const skip = new Set(ignore);
	const picked = {};
	for (const key of Object.keys(source)) {
		if (allowed.has(key)) {
			picked[key] = source[key];
		} else if (!skip.has(key)) {
			throw new Error(`Archive contains an unexpected ${what} field "${key}"`);
		}
	}
	return picked;
}

module.exports = {
	ARCHIVED_CHANNEL_FIELDS,
	ARCHIVED_MESSAGE_FIELDS,
	ARCHIVED_ROLE_FIELDS,
	ARCHIVED_USER_FIELDS,
	CATEGORY_FIELDS,
	FEEDBACK_ANSWER_FIELDS,
	FEEDBACK_FIELDS,
	GUILD_FIELDS,
	GUILD_SETTINGS_FIELDS,
	QUESTION_ANSWER_FIELDS,
	QUESTION_FIELDS,
	TAG_FIELDS,
	TICKET_FIELDS,
	pick,
};
