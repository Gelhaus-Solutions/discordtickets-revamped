const { SlashCommand } = require('@eartharoid/dbf');
const {
	ApplicationCommandOptionType, MessageFlags,
} = require('discord.js');
const ExtendedEmbedBuilder = require('../../lib/embed');
const { substitute } = require('../../lib/placeholders');
const { tagVars } = require('../../lib/tags');

module.exports = class TagSlashCommand extends SlashCommand {
	constructor(client, options) {
		const name = 'tag';
		super(client, {
			...options,
			description: client.i18n.getMessage(null, `commands.slash.${name}.description`) || 'Add or remove tags from a ticket',
			descriptionLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.description`),
			dmPermission: false,
			name,
			nameLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.name`),
			options: [
				{
					autocomplete: true,
					name: 'tag',
					required: true,
					type: ApplicationCommandOptionType.Integer,
				},
				{
					name: 'for',
					required: false,
					type: ApplicationCommandOptionType.User,
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
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async run(interaction) {
		/** @type {import("client")} */
		const client = this.client;

		const user = interaction.options.getUser('for', false);
		await interaction.deferReply({ flags: user ? 0 : MessageFlags.Ephemeral });
		const tag = await client.prisma.tag.findUnique({
			include: { guild: true },
			where: { id: interaction.options.getInteger('tag', true) },
		});

		await interaction.editReply({
			allowedMentions: { users: user ? [user.id]: [] },
			content: user?.toString(),
			embeds: [
				new ExtendedEmbedBuilder()
					.setColor(tag.guild.primaryColour)
					// Tags never substituted anything: the dashboard previewed
					// {name} being filled in and the bot posted the braces.
					.setDescription(substitute(tag.content, tagVars({
						guild: interaction.guild,
						member: interaction.member,
					}))),
			],
		});
	}
};
