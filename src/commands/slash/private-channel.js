const { SlashCommand } = require('@eartharoid/dbf');
const { MessageFlags } = require('discord.js');
const ExtendedEmbedBuilder = require('../../lib/embed');
const { isStaff } = require('../../lib/users');
const { ensureStaffChannel } = require('../../lib/tickets/mutations');

module.exports = class PrivateChannelSlashCommand extends SlashCommand {
	constructor(client, options) {
		const name = 'private-channel';
		super(client, {
			...options,
			description: client.i18n.getMessage(null, `commands.slash.${name}.description`) || 'Open a private staff channel for this ticket',
			descriptionLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.description`),
			dmPermission: false,
			name,
			nameLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.name`),
		});
	}

	/**
	 *
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async run(interaction) {
		/** @type {import("client")} */
		const client = this.client;

		// Ephemeral, unlike every other staff command here: the reply names a
		// channel the ticket's author cannot see, and announcing its existence to
		// the person it is about would defeat the point of making it private.
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const settings = await client.prisma.guild.findUnique({ where: { id: interaction.guild.id } });
		const getMessage = client.i18n.getLocale(settings.locale);
		const ticket = await client.tickets.getTicket(interaction.channel.id, false, interaction.guild.id);

		const errorEmbed = key => new ExtendedEmbedBuilder({
			iconURL: interaction.guild.iconURL(),
			text: settings.footer,
		})
			.setColor(settings.errorColour)
			.setTitle(getMessage(`${key}.title`))
			.setDescription(getMessage(`${key}.description`));

		if (!ticket) {
			return await interaction.editReply({ embeds: [errorEmbed('misc.not_ticket')] });
		}

		if (!(await isStaff(interaction.guild, interaction.user.id))) {
			return await interaction.editReply({ embeds: [errorEmbed('commands.slash.private-channel.not_staff')] });
		}

		// A closed ticket's channel is deleted or archived and its staff channel
		// with it, so there would be nothing to attach a new one to.
		if (!ticket.open) {
			return await interaction.editReply({ embeds: [errorEmbed('commands.slash.private-channel.closed')] });
		}

		// The same function the category option calls, so a channel made here and
		// one made automatically are the same channel in the same place.
		const result = await ensureStaffChannel(client, {
			actorId: interaction.user.id,
			ticket,
		});

		if (!result.ok) {
			// `missing_permission` and `channel_limit` are the two an admin can
			// actually act on, so they say which one it was; the rest fall back.
			const known = ['channel_limit', 'missing_permission', 'no_staff_roles'];
			const key = known.includes(result.reason) ? result.reason : 'failed';
			return await interaction.editReply({ embeds: [errorEmbed(`commands.slash.private-channel.${key}`)] });
		}

		return await interaction.editReply({
			embeds: [
				new ExtendedEmbedBuilder({
					iconURL: interaction.guild.iconURL(),
					text: settings.footer,
				})
					.setColor(settings.successColour)
					.setTitle(getMessage(`commands.slash.private-channel.success.${result.created ? 'created' : 'exists'}.title`))
					.setDescription(getMessage(
						`commands.slash.private-channel.success.${result.created ? 'created' : 'exists'}.description`,
						{ channel: `<#${result.channel.id}>` },
					)),
			],
		});
	}
};
