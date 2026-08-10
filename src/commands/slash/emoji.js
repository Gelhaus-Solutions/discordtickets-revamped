const { SlashCommand } = require('@eartharoid/dbf');
const { ApplicationCommandOptionType } = require('discord.js');
const ExtendedEmbedBuilder = require('../../lib/embed');
const { isStaff } = require('../../lib/users');
const { setTicketEmoji } = require('../../lib/tickets/mutations');

/**
 * /emoji — pin an emoji to this ticket's channel name, or clear it.
 *
 * The same override `action.ticket.setEmoji` sets, reachable by hand. Without
 * this, an override set by an automation that was later deleted could only be
 * removed by closing the ticket or editing the database.
 */
module.exports = class EmojiSlashCommand extends SlashCommand {
	constructor(client, options) {
		const name = 'emoji';
		super(client, {
			...options,
			description: client.i18n.getMessage(null, `commands.slash.${name}.description`) || 'Set or clear a ticket\'s emoji',
			descriptionLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.description`),
			dmPermission: false,
			name,
			nameLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.name`),
			options: [
				{
					name: 'emoji',
					required: false,
					type: ApplicationCommandOptionType.String,
				},
				{
					choices: ['state', 'all'],
					name: 'scope',
					required: false,
					type: ApplicationCommandOptionType.String,
				},
				{
					name: 'clear',
					required: false,
					type: ApplicationCommandOptionType.Boolean,
				},
			].map(option => {
				option.descriptionLocalizations = client.i18n.getAllMessages(`commands.slash.${name}.options.${option.name}.description`);
				option.description = option.descriptionLocalizations['en-GB'] || client.i18n.getMessage(null, `commands.slash.${name}.options.${option.name}.description`) || 'No description';
				option.nameLocalizations = client.i18n.getAllMessages(`commands.slash.${name}.options.${option.name}.name`);
				if (option.choices) {
					option.choices = option.choices.map(choice => ({
						name: client.i18n.getMessage(null, `commands.slash.${name}.options.${option.name}.choices.${choice}`),
						nameLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.options.${option.name}.choices.${choice}`),
						value: choice,
					}));
				}
				return option;
			}),
		});
	}

	/**
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async run(interaction) {
		/** @type {import("client")} */
		const client = this.client;

		await interaction.deferReply();

		const settings = await client.prisma.guild.findUnique({ where: { id: interaction.guild.id } });
		const getMessage = client.i18n.getLocale(settings.locale);
		const embed = () => new ExtendedEmbedBuilder({
			iconURL: interaction.guild.iconURL(),
			text: settings.footer,
		});

		const ticket = await client.prisma.ticket.findUnique({ where: { id: interaction.channel.id } });
		if (!ticket) {
			return await interaction.editReply({
				embeds: [
					embed()
						.setColor(settings.errorColour)
						.setTitle(getMessage('misc.not_ticket.title'))
						.setDescription(getMessage('misc.not_ticket.description')),
				],
			});
		}

		// Staff only. Deliberately stricter than /rename, which also allows the
		// ticket's creator: an emoji override is a signal staff use between
		// themselves, not a label the opener sets on their own ticket.
		if (!(await isStaff(interaction.guild, interaction.user.id))) {
			return await interaction.editReply({
				embeds: [
					embed()
						.setColor(settings.errorColour)
						.setTitle(getMessage('commands.slash.emoji.not_staff.title'))
						.setDescription(getMessage('commands.slash.emoji.not_staff.description')),
				],
			});
		}

		const emoji = interaction.options.getString('emoji', false);
		const scope = interaction.options.getString('scope', false) ?? 'state';
		const clear = interaction.options.getBoolean('clear', false) ?? false;

		// Clearing is explicit rather than "leave the emoji out", so a
		// half-finished `/emoji` cannot wipe an override by accident.
		if (clear === Boolean(emoji)) {
			return await interaction.editReply({
				embeds: [
					embed()
						.setColor(settings.errorColour)
						.setTitle(getMessage('commands.slash.emoji.nothing_to_do.title'))
						.setDescription(getMessage('commands.slash.emoji.nothing_to_do.description')),
				],
			});
		}

		const result = await setTicketEmoji(client, {
			actorId: interaction.user.id,
			emoji: clear ? null : emoji,
			scope,
			ticketId: interaction.channel.id,
		});

		if (!result.ok) {
			return await interaction.editReply({
				embeds: [
					embed()
						.setColor(settings.errorColour)
						.setTitle(getMessage('commands.slash.emoji.invalid.title'))
						.setDescription(getMessage('commands.slash.emoji.invalid.description')),
				],
			});
		}

		// The override is stored either way; only the visible rename can lag, and
		// saying so beats a success message next to an unchanged channel name.
		if (result.reason === 'rename_deferred') {
			return await interaction.editReply({
				embeds: [
					embed()
						.setColor(settings.primaryColour)
						.setTitle(getMessage('commands.slash.emoji.deferred.title'))
						.setDescription(getMessage('commands.slash.emoji.deferred.description')),
				],
			});
		}

		return await interaction.editReply({
			embeds: [
				embed()
					.setColor(settings.successColour)
					.setTitle(getMessage(clear ? 'commands.slash.emoji.cleared.title' : 'commands.slash.emoji.success.title'))
					.setDescription(getMessage(
						clear ? 'commands.slash.emoji.cleared.description' : 'commands.slash.emoji.success.description',
						{ emoji },
					)),
			],
		});
	}
};
