const { SlashCommand } = require('@eartharoid/dbf');
const { ApplicationCommandOptionType } = require('discord.js');
const ms = require('ms');
const ExtendedEmbedBuilder = require('../../lib/embed');
const { isStaff } = require('../../lib/users');
const {
	SLOWMODE_LIMIT,
	setSlowmode,
} = require('../../lib/tickets/mutations');

/**
 * Parse `30s` / `10m` / `2h` / `off` into whole seconds.
 *
 * A bare number is seconds, not milliseconds — `ms` would read `30` as 30ms and
 * round it away to nothing. This is the same rule the dashboard's duration field
 * uses (`AutomationEditor/nodes.js#parseDuration`), so `10m` means the same thing
 * typed into the command as dragged into an automation.
 *
 * @returns {number|null} seconds, or null if it is not a length of time
 */
function parseSeconds(input) {
	const text = String(input ?? '').trim().toLowerCase();
	if (!text) return null;
	if (text === 'off' || text === 'none') return 0;
	if (/^\d+$/.test(text)) return Number(text);

	let millis;
	try {
		millis = ms(text);
	} catch {
		return null;
	}
	if (typeof millis !== 'number' || !Number.isFinite(millis) || millis < 0) return null;
	return Math.round(millis / 1000);
}

module.exports = class SlowmodeSlashCommand extends SlashCommand {
	constructor(client, options) {
		const name = 'slowmode';
		super(client, {
			...options,
			description: client.i18n.getMessage(null, `commands.slash.${name}.description`) || 'Set the slow mode of a ticket',
			descriptionLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.description`),
			dmPermission: false,
			name,
			nameLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.name`),
			options: [
				{
					// Free text rather than the dashboard's fixed list of 13: choices
					// would need a localised name for each one in all 28 locales, and
					// `30s`/`10m`/`2h` is the notation the automation editor already
					// takes for the same setting.
					name: 'duration',
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
	 *
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async run(interaction) {
		/** @type {import("client")} */
		const client = this.client;

		await interaction.deferReply();

		const settings = await client.prisma.guild.findUnique({ where: { id: interaction.guild.id } });
		const getMessage = client.i18n.getLocale(settings.locale);
		const ticket = await client.prisma.ticket.findUnique({ where: { id: interaction.channel.id } });

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
			return await interaction.editReply({ embeds: [errorEmbed('commands.slash.slowmode.not_staff')] });
		}

		const seconds = parseSeconds(interaction.options.getString('duration', true));
		if (seconds === null || seconds > SLOWMODE_LIMIT) {
			return await interaction.editReply({ embeds: [errorEmbed('commands.slash.slowmode.invalid')] });
		}

		// The channel edit and the log both live in `mutations.js` so the
		// automation node does exactly the same thing without an interaction.
		const result = await setSlowmode(client, {
			actorId: interaction.user.id,
			seconds,
			ticketId: interaction.channel.id,
		});

		if (!result.ok) {
			return await interaction.editReply({ embeds: [errorEmbed('commands.slash.slowmode.failed')] });
		}

		const outcome = seconds === 0 ? 'cleared' : 'set';

		return await interaction.editReply({
			embeds: [
				new ExtendedEmbedBuilder({
					iconURL: interaction.guild.iconURL(),
					text: settings.footer,
				})
					.setColor(settings.successColour)
					.setTitle(getMessage(`commands.slash.slowmode.success.${outcome}.title`))
					.setDescription(getMessage(`commands.slash.slowmode.success.${outcome}.description`, { duration: ms(seconds * 1000, { long: true }) })),
			],
		});
	}
};
