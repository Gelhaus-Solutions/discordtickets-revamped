const { SlashCommand } = require('@eartharoid/dbf');
const ExtendedEmbedBuilder = require('../../lib/embed');
const {
	MessageFlags,
	ApplicationCommandOptionType,
} = require('discord.js');
const { isStaff } = require('../../lib/users');
const { renameTicket } = require('../../lib/tickets/mutations');

module.exports = class RenameSlashCommand extends SlashCommand {
	constructor(client, options) {
		const name = 'rename';
		super(client, {
			...options,
			description: client.i18n.getMessage(null, `commands.slash.${name}.description`) || 'Rename a ticket channel',
			descriptionLocalisations: client.i18n.getAllMessages(`commands.slash.${name}.description`),
			dmPermission: false,
			name,
			nameLocalisations: client.i18n.getAllMessages(`commands.slash.${name}.name`),
			options: [
				{
					name: 'name',
					required: true,
					type: ApplicationCommandOptionType.String,
				},
			].map(option => {
				option.descriptionLocalizations = client.i18n.getAllMessages(`commands.slash.${name}.options.${option.name}.description`);
				option.description = option.descriptionLocalizations['en-GB'] || client.i18n.getMessage(null, `commands.slash.${name}.options.${option.name}.description`) || 'No description';
				option.nameLocalizations = client.i18n.getAllMessages(`commands.slash.${name}.options.${option.name}.name`);
				return option;
			}),
		});
	}

	/**
	 * Handle the 'rename' command
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async run(interaction) {
		/** @type {import("client")} */
		const client = this.client;

		// Defer the reply while processing the request
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		// Fetch the necessary ticket data for the channel
		const ticket = await client.prisma.ticket.findUnique({
			include: { guild: true },
			where: { id: interaction.channel.id },
		});

		// If no ticket found for the channel, return an error
		if (!ticket) {
			// Fetch guild settings
			const settings = await client.prisma.guild.findUnique({ where: { id: interaction.guild.id } });
			const getMessage = client.i18n.getLocale(settings.locale);
			return await interaction.editReply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: settings.footer,
					})
						.setColor(settings.errorColour)
						.setTitle(getMessage('misc.not_ticket.title'))
						.setDescription(getMessage('misc.not_ticket.description')),
				],
			});
		}

		const getMessage = client.i18n.getLocale(ticket.guild.locale);

		// Check if the user has permission to rename the channel
		if (
			ticket.id !== interaction.channel.id &&
			ticket.createdById !== interaction.member.id &&
			!(await isStaff(interaction.guild, interaction.member.id))
		) {
			return await interaction.editReply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: ticket.guild.footer,
					})
						.setColor(ticket.guild.errorColour)
						.setTitle(getMessage('commands.slash.rename.not_staff.title'))
						.setDescription(getMessage('commands.slash.rename.not_staff.description')),
				],
			});
		}

		const rawName = interaction.options.getString('name'); // Get the new name from the user's input

		// The prefix handling, the rate limit and the log all live in
		// `mutations.js` so an automation can rename a channel the same way.
		const renamed = await renameTicket(client, {
			actorId: interaction.user.id,
			name: rawName,
			ticketId: ticket.id,
		});

		if (renamed.reason === 'invalid_name') {
			return await interaction.editReply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: ticket.guild.footer,
					})
						.setColor(ticket.guild.errorColour)
						.setTitle(getMessage('commands.slash.rename.invalid.title'))
						.setDescription(getMessage('commands.slash.rename.invalid.description')),
				],
			});
		}

		if (renamed.reason === 'rate_limited') {
			return await interaction.editReply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: ticket.guild.footer,
					})
						.setColor(ticket.guild.errorColour)
						.setTitle(getMessage('commands.slash.rename.ratelimited.title'))
						.setDescription(getMessage('commands.slash.rename.ratelimited.description')),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		// Respond with a success message (show only the user-provided portion)
		await interaction.editReply({
			embeds: [
				new ExtendedEmbedBuilder({
					iconURL: interaction.guild.iconURL(),
					text: ticket.guild.footer,
				})
					.setColor(ticket.guild.successColour)
					.setTitle(getMessage('commands.slash.rename.success.title'))
					.setDescription(getMessage('commands.slash.rename.success.description', { name: rawName })),
			],
		});

	}
};
