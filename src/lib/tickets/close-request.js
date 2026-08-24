const {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, TextDisplayBuilder,
} = require('discord.js');
const { buildMessage } = require('../components-v2');
const ExtendedEmbedBuilder = require('../embed');

/**
 * The close request: the message asking the member who opened a ticket to
 * confirm closing it.
 *
 * Two shapes, one set of buttons. A guild that has never opened the block editor
 * gets the embed this has always been, built by {@link buildCloseRequestEmbed};
 * one that has gets its own Components v2 layout. `closeRequestLayout` is
 * nullable at both the guild and the category level precisely so the difference
 * between the two is an absence rather than a flag (see
 * `src/lib/settings/inheritance.js`).
 *
 * The Accept and Reject buttons are appended here either way, and are not
 * authorable. They carry the `{accepted, action: 'close', expect}` custom ids
 * that `src/buttons/close.js` parses, and the whole close flow — the member's
 * answer, the staff-versus-user `expect` check, and the durable auto-close
 * timeout Temporal is holding — hangs off them. Letting a layout place them
 * would mean a saved message could drop one and strand every ticket closed
 * through it, so the authorable part stops at the body.
 */

/**
 * Substitution variables for a close request.
 *
 * `{name}` and its siblings are the ticket *opener*, matching the opening
 * message, so a block of text moved between the two keeps talking about the same
 * person. Whoever asked to close it gets its own `{closer…}` family, which no
 * other context has because no other message has two people in it.
 *
 * Written to take plain objects rather than discord.js classes so it can be
 * tested without a gateway connection.
 *
 * @param {object} options
 * @param {{displayName: ?string, id: string, username: string}} options.closer whoever asked to close
 * @param {{memberCount: number, name: string}} options.guild
 * @param {{avatarURL: ?string, displayName: ?string, id: string, username: ?string}} options.opener
 * @param {?string} options.reason
 * @param {{number: number}} options.ticket
 * @returns {object}
 */
function closeRequestVars({
	closer, guild, opener, reason, ticket,
}) {
	const openerMention = `<@${opener.id}>`;
	return {
		avatar: opener.avatarURL ?? '',
		closer: closer.username,
		closerdisplayname: closer.displayName ?? closer.username,
		closerid: closer.id,
		closermention: `<@${closer.id}>`,
		displayname: opener.displayName ?? opener.username ?? '',
		members: guild.memberCount,
		// The opener under both spellings. They are the same person here, but
		// `{opener}` is what an automation layout would have been written with and
		// `{name}` is what an opening message would, and a close request is where
		// text from either tends to get pasted.
		name: openerMention,
		num: ticket.number,
		opener: opener.username ?? '',
		openerdisplayname: opener.displayName ?? opener.username ?? '',
		openerid: opener.id,
		openermention: openerMention,
		// Empty rather than absent when there is none: `substitute` renders an
		// unknown token as '' anyway, and a layout that says "Reason: {reason}"
		// should collapse to "Reason: " rather than leak the braces.
		reason: reason ?? '',
		server: guild.name,
		userid: opener.id,
	};
}

/**
 * The Accept/Reject row.
 *
 * `expect` names who the request is waiting on, and is the only thing separating
 * "staff asked, the member answers" from the other way round.
 *
 * @param {Function} getMessage from `client.i18n.getLocale(guild.locale)`
 * @param {{action: string, expect: string}} closeButtonId
 * @returns {ActionRowBuilder}
 */
function closeRequestButtons(getMessage, closeButtonId) {
	return new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId(JSON.stringify({
				accepted: true,
				...closeButtonId,
			}))
			.setStyle(ButtonStyle.Success)
			.setEmoji(getMessage('buttons.accept_close_request.emoji'))
			.setLabel(getMessage('buttons.accept_close_request.text')),
		new ButtonBuilder()
			.setCustomId(JSON.stringify({
				accepted: false,
				...closeButtonId,
			}))
			.setStyle(ButtonStyle.Danger)
			.setEmoji(getMessage('buttons.reject_close_request.emoji'))
			.setLabel(getMessage('buttons.reject_close_request.text')),
	);
}

/**
 * The embed the close request has always been.
 *
 * The title changes with who asked, and the description only appears when staff
 * did: a member closing their own ticket is not asking anybody's permission, so
 * there is nothing to explain to them.
 */
function buildCloseRequestEmbed({
	archive, getMessage, primaryColour, requestedByMention, requestedByName, staff,
}) {
	const embed = new ExtendedEmbedBuilder()
		.setColor(primaryColour)
		.setTitle(getMessage(`ticket.close.${staff ? 'staff' : 'user'}_request.title`, { requestedBy: requestedByName }));

	if (staff) {
		embed.setDescription(
			getMessage('ticket.close.staff_request.description', { requestedBy: requestedByMention }) +
			(archive ? getMessage('ticket.close.staff_request.archived') : ''),
		);
	}

	return embed;
}

/**
 * The whole message, ready to hand to `editReply`.
 *
 * A Components v2 message carries no `content`, which is also where Discord
 * parses mentions from — so the opener ping moves into the layout's own
 * `allowedMentions` rather than the `content` field the embed path uses. Getting
 * this wrong is silent: the ping renders and simply does not notify.
 *
 * @param {object} options
 * @param {?object} options.layout the resolved `closeRequestLayout`, or null for the embed
 * @returns {object} an `InteractionEditReplyOptions`
 */
function buildCloseRequest({
	archive,
	closer,
	getMessage,
	guild,
	layout,
	opener,
	primaryColour,
	reason,
	staff,
	ticket,
}) {
	const row = closeRequestButtons(getMessage, {
		action: 'close',
		expect: staff ? 'user' : 'staff',
	});
	// Only staff asking pings the member: a member closing their own ticket does
	// not need notifying that they did.
	const ping = staff ? opener.id : null;

	if (!layout) {
		return {
			components: [row],
			content: ping ? `<@${ping}>` : '',
			embeds: [buildCloseRequestEmbed({
				archive,
				getMessage,
				primaryColour,
				requestedByMention: `<@${closer.id}>`,
				requestedByName: closer.displayName ?? closer.username,
				staff,
			})],
		};
	}

	const built = buildMessage(layout, {
		getMessage,
		guild: {
			footer: guild.footer,
			primaryColour,
		},
		kind: 'closeRequest',
		vars: closeRequestVars({
			closer,
			guild,
			opener,
			reason,
			ticket,
		}),
	});

	// The ping is prepended rather than left to the layout. A Components v2
	// message has no `content`, which is where the embed path put it, and if
	// this depended on the author remembering to write {openermention} then
	// forgetting would mean the member is never told their ticket is up for
	// closing — a silent failure, and the request sits there until the auto-close
	// timeout fires. A layout that mentions them as well pings twice, which is
	// the harmless half of the trade.
	const components = ping
		? [new TextDisplayBuilder().setContent(`<@${ping}>`), ...built.components, row]
		: [...built.components, row];

	return {
		// Derived here rather than taken from `built`: `buildMessage` reads its
		// mentions off `ctx.opening`, which a close request does not have.
		allowedMentions: {
			roles: [],
			users: ping ? [String(ping)] : [],
		},
		components,
		flags: MessageFlags.IsComponentsV2,
	};
}

module.exports = {
	buildCloseRequest,
	buildCloseRequestEmbed,
	closeRequestButtons,
	closeRequestVars,
};
