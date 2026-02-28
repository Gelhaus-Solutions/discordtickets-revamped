const { SlashCommand } = require('@eartharoid/dbf');
const { ApplicationCommandOptionType } = require('discord.js');
const ExtendedEmbedBuilder = require('../../lib/embed');
const { logTicketEvent } = require('../../lib/logging');
const { isStaff } = require('../../lib/users');

const getEmoji = priority => {
	const emojis = {
		'HIGH': '🔴',
		'MEDIUM': '🟠',
		'LOW': '🟢', // eslint-disable-line sort-keys
	};
	return emojis[priority?.toUpperCase()] ?? '🔵';
};

module.exports = class PrioritySlashCommand extends SlashCommand {
	constructor(client, options) {
		const name = 'priority';
		super(client, {
			...options,
			description: client.i18n.getMessage(null, `commands.slash.${name}.description`),
			descriptionLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.description`),
			dmPermission: false,
			name,
			nameLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.name`),
			options: [
				{
					maxLength: 32,
					minLength: 1,
					name: 'priority',
					required: true,
					type: ApplicationCommandOptionType.String,
				},
			].map(option => {
				option.descriptionLocalizations = client.i18n.getAllMessages(`commands.slash.${name}.options.${option.name}.description`);
				option.description = option.descriptionLocalizations['en-GB'];
				option.nameLocalizations = client.i18n.getAllMessages(`commands.slash.${name}.options.${option.name}.name`);
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
			return await interaction.editReply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: ticket.guild.footer,
					})
						.setColor(ticket.guild.errorColour)
						.setTitle(getMessage('commands.slash.move.not_staff.title'))
						.setDescription(getMessage('commands.slash.move.not_staff.description')),
				],
			});
		}

		const priority = interaction.options.getString('priority', true).trim();
		let name = interaction.channel.name;
		// Separate the ✅ claim prefix so the priority emoji is always inserted immediately after it
		const claimedPrefix = name.startsWith('✅') ? '✅' : '';
		const unprefixed = claimedPrefix ? name.slice(1) : name;
		if (ticket.priority) {
			name = claimedPrefix + unprefixed.replace(getEmoji(ticket.priority), getEmoji(priority));
		} else {
			name = claimedPrefix + getEmoji(priority) + unprefixed;
		}
		await interaction.channel.setName(name);

		// don't reassign ticket because the original is used below
		await client.prisma.ticket.update({
			data: { priority },
			where: { id: interaction.channel.id },
		});

		logTicketEvent(this.client, {
			action: 'update',
			diff: {
				original: { priority: ticket.priority },
				updated: { priority: priority },
			},
			target: {
				id: ticket.id,
				name: `<#${ticket.id}>`,
			},
			userId: interaction.user.id,
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
