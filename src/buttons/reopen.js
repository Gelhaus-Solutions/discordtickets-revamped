const { Button } = require('@eartharoid/dbf');
const ExtendedEmbedBuilder = require('../lib/embed');
const { isStaff } = require('../lib/users');
const { MessageFlags } = require('discord.js');
const temporal = require('../lib/temporal');

module.exports = class ReopenButton extends Button {
	constructor(client, options) {
		super(client, {
			...options,
			id: 'reopen',
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
		if (!ticket) return;
		const getMessage = client.i18n.getLocale(ticket.guild.locale);

		if (interaction.user.id !== ticket.createdById && !(await isStaff(interaction.guild, interaction.user.id))) {
			return await interaction.reply({
				embeds: [
					new ExtendedEmbedBuilder()
						.setColor(ticket.guild.errorColour)
						.setTitle(getMessage('ticket.reopen.not_allowed.title'))
						.setDescription(getMessage('ticket.reopen.not_allowed.description')),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		// Signal the durable grace-window workflow. Three outcomes, and the two
		// failures must not share a message: `no_window` means the ticket is gone
		// for good, `unavailable` means Temporal could not be asked and the window
		// may well still be open. Telling the member the window "has expired"
		// during an outage is a lie that costs them the ticket.
		const outcome = await temporal.signalReopenTicket(ticket.id);
		if (outcome !== 'reopened') {
			const key = outcome === 'unavailable' ? 'unavailable' : 'no_window';
			if (outcome === 'unavailable') {
				client.log.warn('Temporal is unavailable, cannot reopen ticket %s', ticket.id);
			}
			return await interaction.reply({
				embeds: [
					new ExtendedEmbedBuilder()
						.setColor(ticket.guild.errorColour)
						.setTitle(getMessage(`ticket.reopen.${key}.title`))
						.setDescription(getMessage(`ticket.reopen.${key}.description`)),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		// Replace the reopen prompt (this button's message) with a confirmation.
		await interaction.update({
			components: [],
			embeds: [
				new ExtendedEmbedBuilder({
					iconURL: interaction.guild.iconURL(),
					text: ticket.guild.footer,
				})
					.setColor(ticket.guild.successColour)
					.setTitle(getMessage('ticket.reopen.reopened.title'))
					.setDescription(getMessage('ticket.reopen.reopened.description', { user: interaction.user.toString() })),
			],
		});
	}
};
