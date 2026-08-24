const { Button } = require('@eartharoid/dbf');
const {
	ActionRowBuilder,
	MessageFlags,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} = require('discord.js');
const ExtendedEmbedBuilder = require('../lib/embed');

/**
 * The "Close with Reason" button on a ticket's opening message, shown when the
 * guild has `closeReasonButton` enabled. It opens a modal asking for a reason
 * and then follows the same path as `/close reason:...`.
 *
 * The button was previously emitted by TicketManager with no handler behind it,
 * so every click failed with "This interaction failed".
 */
module.exports = class CloseReasonButton extends Button {
	constructor(client, options) {
		super(client, {
			...options,
			id: 'close-reason',
		});
	}

	/**
	 * @param {*} id
	 * @param {import("discord.js").ButtonInteraction} interaction
	 */
	async run(id, interaction) {
		/** @type {import("client")} */
		const client = this.client;

		const ticket = await client.tickets.getTicket(interaction.channel.id);
		if (!ticket) {
			const settings = await client.prisma.guild.findUnique({
				select: {
					errorColour: true,
					footer: true,
					locale: true,
				},
				where: { id: interaction.guild.id },
			});
			const getMessage = client.i18n.getLocale(settings.locale);
			return await interaction.reply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: settings.footer,
					})
						.setColor(settings.errorColour)
						.setTitle(getMessage('misc.not_ticket.title'))
						.setDescription(getMessage('misc.not_ticket.description')),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		const getMessage = client.i18n.getLocale(ticket.guild.locale);

		// Discord doesn't allow opening a modal in response to a modal submit, so
		// the reason modal can't later chain into the feedback modal. When this
		// user is due to leave feedback, show that modal directly instead — the
		// same thing `/close` does for them.
		if (
			ticket.createdById === interaction.user.id &&
			ticket.category.enableFeedback &&
			!ticket.feedback
		) {
			// null when the category's feedback form is empty on purpose; fall
			// through to the reason modal rather than showing nothing.
			const feedbackModal = client.tickets.buildFeedbackModal(
				ticket.category,
				ticket.guild.locale,
				{ next: 'requestClose' },
			);
			if (feedbackModal) return await interaction.showModal(feedbackModal);
		}

		await interaction.showModal(
			new ModalBuilder()
				.setCustomId(JSON.stringify({ action: 'close-reason' }))
				.setTitle(getMessage('buttons.close.text'))
				.setComponents(
					new ActionRowBuilder()
						.setComponents(
							new TextInputBuilder()
								.setCustomId('reason')
								.setLabel(getMessage('commands.slash.close.options.reason.description'))
								.setStyle(TextInputStyle.Paragraph)
								.setMaxLength(1000)
								.setRequired(false),
						),
				),
		);
	}
};
