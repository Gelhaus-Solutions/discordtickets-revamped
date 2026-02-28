'use strict';
const { SlashCommand } = require('@eartharoid/dbf');
const {
	ApplicationCommandOptionType,
	MessageFlags,
} = require('discord.js');
const ExtendedEmbedBuilder = require('../../lib/embed');
const { isStaff } = require('../../lib/users');
const { getEmoji } = require('./priority');

/**
 * /escalate – Move a ticket to a different (typically higher-tier) category and
 * notify that category's ping roles. This is semantically different from /move:
 * escalation implies urgency and always mentions the receiving team.
 */
module.exports = class EscalateSlashCommand extends SlashCommand {
	constructor(client, options) {
		const name = 'escalate';
		super(client, {
			...options,
			description: client.i18n.getMessage(null, `commands.slash.${name}.description`),
			descriptionLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.description`),
			dmPermission: false,
			name,
			nameLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.name`),
			options: [
				{
					autocomplete: true,
					name: 'category',
					required: true,
					type: ApplicationCommandOptionType.Integer,
				},
				{
					name: 'reason',
					required: false,
					type: ApplicationCommandOptionType.String,
				},
			].map(option => {
				option.descriptionLocalizations = client.i18n.getAllMessages(`commands.slash.${name}.options.${option.name}.description`);
				option.description = option.descriptionLocalizations['en-GB'] ?? option.name;
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

		await interaction.deferReply();

		const ticket = await client.prisma.ticket.findUnique({
			include: {
				category: true,
				guild: true,
			},
			where: { id: interaction.channel.id },
		});

		if (!ticket) {
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
				flags: MessageFlags.Ephemeral,
			});
		}

		const getMessage = client.i18n.getLocale(ticket.guild.locale);

		if (!(await isStaff(interaction.guild, interaction.user.id))) {
			return await interaction.editReply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: ticket.guild.footer,
					})
						.setColor(ticket.guild.errorColour)
						.setTitle(getMessage('commands.slash.escalate.not_staff.title'))
						.setDescription(getMessage('commands.slash.escalate.not_staff.description')),
				],
			});
		}

		const newCategoryId = interaction.options.getInteger('category', true);
		const reason = interaction.options.getString('reason') || null;

		const newCategory = await client.prisma.category.findUnique({ where: { id: newCategoryId } });
		if (!newCategory) {
			return await interaction.editReply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: ticket.guild.footer,
					})
						.setColor(ticket.guild.errorColour)
						.setTitle(getMessage('misc.not_ticket.title'))
						.setDescription(getMessage('commands.slash.escalate.no_category')),
				],
			});
		}

		const creator = await interaction.guild.members.fetch(ticket.createdById).catch(() => null);

		// For CHANNEL mode: check Discord category limit
		const channelMode = newCategory.channelMode || 'CHANNEL';
		if (channelMode === 'CHANNEL' && newCategory.discordCategory) {
			const discordCategory = await interaction.guild.channels.fetch(newCategory.discordCategory).catch(() => null);
			if (discordCategory?.children?.cache.size >= 50) {
				return await interaction.editReply({
					embeds: [
						new ExtendedEmbedBuilder({
							iconURL: interaction.guild.iconURL(),
							text: ticket.guild.footer,
						})
							.setColor(ticket.guild.errorColour)
							.setTitle(getMessage('misc.category_full.title'))
							.setDescription(getMessage('misc.category_full.description')),
					],
					flags: MessageFlags.Ephemeral,
				});
			}
		}

		// Update ticket category in DB
		await client.prisma.ticket.update({
			data: { category: { connect: { id: newCategory.id } } },
			where: { id: ticket.id },
		});

		// Update in-memory counters
		const $counters = client.tickets.$count.categories;
		$counters[newCategory.id] ??= {};
		const $old = $counters[ticket.categoryId] ?? {};
		const $new = $counters[newCategory.id];
		if ($old.total > 0) $old.total--;
		if ($old[ticket.createdById] > 0) $old[ticket.createdById]--;
		$new.total = ($new.total ?? 0) + 1;
		$new[ticket.createdById] = ($new[ticket.createdById] ?? 0) + 1;

		// Rename channel/thread and move to new Discord category (CHANNEL mode only)
		if (
			channelMode === 'CHANNEL' &&
			(newCategory.staffRoles !== ticket.category.staffRoles ||
			newCategory.channelName !== ticket.category.channelName ||
			newCategory.discordCategory !== ticket.category.discordCategory)
		) {
			const allow = ['ViewChannel', 'ReadMessageHistory', 'SendMessages', 'EmbedLinks', 'AttachFiles'];
			const channelName = newCategory.channelName
				.replace(/{+\s?(user)?name\s?}+/gi, creator?.user.username ?? ticket.createdById)
				.replace(/{+\s?(nick|display)(name)?\s?}+/gi, creator?.displayName ?? ticket.createdById)
				.replace(/{+\s?num(ber)?\s?}+/gi, ticket.number === 1488 ? '1487b' : ticket.number);

			// Preserve claim (✅) and priority emoji prefixes
			const finalName = (ticket.claimedById ? '✅' : '') + (ticket.priority ? getEmoji(ticket.priority) : '') + channelName;

			const discordCategory = await interaction.guild.channels.fetch(newCategory.discordCategory).catch(() => null);
			await interaction.channel.edit({
				lockPermissions: false,
				name: finalName,
				...(discordCategory ? { parent: discordCategory } : {}),
				permissionOverwrites: [
					{ deny: ['ViewChannel'], id: interaction.guild.roles.everyone },
					{ allow, id: client.user.id },
					...(creator ? [{ allow, id: creator.id }] : []),
					...newCategory.staffRoles.map(id => ({ allow, id })),
				],
				reason: `Escalated by ${interaction.user.username}`,
			});
		}

		// Ping the receiving team
		const pingRoles = Array.isArray(newCategory.pingRoles) ? newCategory.pingRoles : [];
		const pingText = pingRoles.length ? pingRoles.map(r => `<@&${r}>`).join(' ') : null;

		const reasonText = reason ? ` **${getMessage('dm.closed.fields.reason')}:** ${reason}` : '';
		const escalatedMsg = getMessage('commands.slash.escalate.escalated', {
			by: interaction.user.toString(),
			from: ticket.category.name,
			reason: reasonText,
			to: newCategory.name,
		});

		await interaction.editReply({
			content: pingText || undefined,
			embeds: [
				new ExtendedEmbedBuilder()
					.setColor(ticket.guild.primaryColour)
					.setDescription(escalatedMsg),
			],
		});
	}
};
