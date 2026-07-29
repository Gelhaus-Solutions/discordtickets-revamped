const { SlashCommand } = require('@eartharoid/dbf');
const { ApplicationCommandOptionType } = require('discord.js');
const ExtendedEmbedBuilder = require('../../lib/embed');
const { isStaff } = require('../../lib/users');
const {
	getEmoji,
	setPriority,
} = require('../../lib/tickets/mutations');

module.exports = class PrioritySlashCommand extends SlashCommand {
	constructor(client, options) {
		const name = 'priority';
		super(client, {
			...options,
			description: client.i18n.getMessage(null, `commands.slash.${name}.description`) || 'Set ticket priority',
			descriptionLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.description`),
			dmPermission: false,
			name,
			nameLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.name`),
			options: [
				{
					// Restored from the three fixed choices. As free text this
					// accepted any 32-character string, so `getEmoji` fell through to
					// 🔵 for anything unrecognised, the channel-name emoji desynced
					// from the stored value, and the localised HIGH/MEDIUM/LOW choice
					// strings became dead in all 27 locales.
					choices: ['HIGH', 'MEDIUM', 'LOW'],
					name: 'priority',
					required: true,
					type: ApplicationCommandOptionType.String,
				},
			].map(option => {
				option.descriptionLocalizations = client.i18n.getAllMessages(`commands.slash.${name}.options.${option.name}.description`);
				option.description = option.descriptionLocalizations['en-GB'] || client.i18n.getMessage(null, `commands.slash.${name}.options.${option.name}.description`) || 'No description';
				option.nameLocalizations = client.i18n.getAllMessages(`commands.slash.${name}.options.${option.name}.name`);
				if (option.choices) {
					option.choices = option.choices.map(choice => ({
						name: client.i18n.getMessage(null, `commands.slash.priority.options.${option.name}.choices.${choice}`),
						nameLocalizations: client.i18n.getAllMessages(`commands.slash.priority.options.${option.name}.choices.${choice}`),
						value: choice,
					}));
				}
				return option;
			}),
		});
	}

	/**
	 *
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async run(interaction) {
		/** @type {import("client")} */
		const client = this.client;

		await interaction.deferReply();

		const settings = await client.prisma.guild.findUnique({ where: { id: interaction.guild.id } });
		const getMessage = client.i18n.getLocale(settings.locale);
		const ticket = await client.prisma.ticket.findUnique({
			include: { category: { select: { channelName: true } } },
			where: { id: interaction.channel.id },
		});

		if (!ticket) {
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

		if (!(await isStaff(interaction.guild, interaction.user.id))) { // if user is not staff
			// `settings`, not `ticket.guild` — the query above only includes
			// `category`, so `ticket.guild` is undefined and reading `.footer` off
			// it threw a TypeError for every non-staff invocation.
			return await interaction.editReply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: settings.footer,
					})
						.setColor(settings.errorColour)
						.setTitle(getMessage('commands.slash.move.not_staff.title'))
						.setDescription(getMessage('commands.slash.move.not_staff.description')),
				],
			});
		}

		const priority = interaction.options.getString('priority', true).trim();

		// The rename, the update and the log all live in `mutations.js` so an
		// automation can do exactly the same thing without an interaction.
		await setPriority(client, {
			actorId: interaction.user.id,
			priority,
			ticketId: interaction.channel.id,
		});

		return await interaction.editReply({
			embeds: [
				new ExtendedEmbedBuilder({
					iconURL: interaction.guild.iconURL(),
					text: settings.footer,
				})
					.setColor(settings.successColour)
					.setTitle(getMessage('commands.slash.priority.success.title'))
					.setDescription(getMessage('commands.slash.priority.success.description', { priority })),
			],
		});

	}
};

module.exports.getEmoji = getEmoji;
