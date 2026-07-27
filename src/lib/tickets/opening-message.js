const {
	buildMessage,
	defaultOpeningLayout,
	needsStats,
} = require('../components-v2');

/**
 * The ticket opening message.
 *
 * This is the single source of truth for what that message looks like. It used
 * to be built inline in `manager.create()`, and then *partially* rebuilt in
 * `claim()`, `release()` and the edit modals — each of which reconstructed only
 * the button row and so drifted from the original (claim/release silently
 * dropped the "Close with Reason" button, and both would wipe a Components v2
 * body entirely by replacing `components` with a bare action row).
 *
 * Every one of those call sites now re-renders the whole message from here.
 */

/**
 * The stored layout for a category, or the equivalent of its pre-v2 embed when
 * it has none. `Category.messageLayout` is nullable on purpose: a guild that
 * never opens the block editor keeps exactly the message it had before.
 */
function layoutFor(category) {
	return category.messageLayout ?? defaultOpeningLayout(category.openingMessage, { image: category.image });
}

/** Does this category's message reference any of the stats variables? */
function categoryNeedsStats(category) {
	return needsStats(layoutFor(category));
}

/**
 * @param {import('client')} client
 * @param {object} o
 * @param {object} o.category the category, including its `guild` settings
 * @param {import('discord.js').Guild} o.guild
 * @param {string} o.creatorId
 * @param {?import('discord.js').GuildMember} [o.creator] used for {avatar}/{displayname}
 * @param {number|string} [o.number] the ticket number, for {num}
 * @param {?string} [o.topic]
 * @param {?{label: string, value: string}[]} [o.answers]
 * @param {boolean} [o.claimed] renders Unclaim instead of Claim
 * @param {?object} [o.stats] {avgResponseTime, avgResolutionTime, avgRating}
 * @returns {{components: Array, flags: number, allowedMentions: object}}
 */
function buildOpeningMessage(client, {
	answers = null,
	category,
	claimed = false,
	creator = null,
	creatorId,
	guild,
	number,
	stats = null,
	topic = null,
}) {
	const settings = category.guild;

	return buildMessage(layoutFor(category), {
		categories: new Map(),
		getMessage: client.i18n.getLocale(settings.locale),
		guild: {
			footer: settings.footer,
			iconURL: guild?.iconURL() ?? null,
			primaryColour: settings.primaryColour,
		},
		kind: 'opening',
		opening: {
			answers,
			claimed,
			creatorId,
			pingRoles: category.pingRoles ?? [],
			// Matches the pre-v2 conditions exactly, including the claimButton
			// half that claim()/release() used to test but create() alone owned.
			showClaim: Boolean(settings.claimButton && category.claiming),
			showClose: Boolean(settings.closeButton),
			showCloseReason: Boolean(settings.closeReasonButton),
			showEdit: Boolean(topic) || Boolean(answers?.length),
			topic,
		},
		vars: {
			avatar: creator?.displayAvatarURL() ?? '',
			displayname: creator?.displayName ?? '',
			name: `<@${creatorId}>`,
			num: number,
			...(stats ?? {}),
		},
	});
}

/**
 * Re-render a live ticket's opening message in place.
 *
 * Loads everything the layout needs (category, guild settings, topic, answers),
 * decrypting the stored values, and edits the message. Used by claim, release
 * and the edit modals, all of which previously rebuilt only the button row —
 * which under Components v2 would replace the entire message body with a bare
 * action row.
 *
 * Best-effort by design: a ticket whose opening message has been deleted, or
 * which the bot can no longer edit, must not break claiming or editing.
 *
 * @param {import('client')} client
 * @param {import('discord.js').GuildTextBasedChannel} channel
 * @param {object} o
 * @param {?boolean} [o.claimed] defaults to the ticket's stored claim state
 * @param {?{label: string, value: string}[]} [o.answers] overrides the stored answers
 * @param {?string} [o.topic] overrides the stored topic
 * @returns {Promise<boolean>} whether the message was updated
 */
async function rerenderOpeningMessage(client, channel, {
	answers = undefined,
	claimed = undefined,
	topic = undefined,
} = {}) {
	const { pools } = require('../threads');
	const { crypto } = pools;

	const ticket = await client.prisma.ticket.findUnique({
		include: {
			category: { include: { guild: true } },
			questionAnswers: { include: { question: true } },
		},
		where: { id: channel.id },
	});
	if (!ticket?.openingMessageId || !ticket.category) return false;

	const message = await channel.messages.fetch(ticket.openingMessageId).catch(() => null);
	if (!message || message.author?.id !== client.user.id) return false;

	const resolvedTopic = topic !== undefined
		? topic
		: ticket.topic ? await crypto.queue(w => w.decrypt(ticket.topic)) : null;

	let resolvedAnswers = answers;
	if (resolvedAnswers === undefined) {
		resolvedAnswers = ticket.questionAnswers.length
			? await Promise.all(ticket.questionAnswers.map(async a => ({
				label: a.question.label,
				value: a.value ? await crypto.queue(w => w.decrypt(a.value)) : '',
			})))
			: null;
	}

	const payload = buildOpeningMessage(client, {
		answers: resolvedAnswers,
		category: ticket.category,
		claimed: claimed ?? Boolean(ticket.claimedById),
		creator: await channel.guild.members.fetch(ticket.createdById).catch(() => null),
		creatorId: ticket.createdById,
		guild: channel.guild,
		number: ticket.number,
		topic: resolvedTopic,
	});

	await message.edit({
		allowedMentions: payload.allowedMentions,
		components: payload.components,
		// Must be re-asserted on every edit.
		flags: payload.flags,
	});
	return true;
}

module.exports = {
	buildOpeningMessage,
	categoryNeedsStats,
	layoutFor,
	rerenderOpeningMessage,
};
