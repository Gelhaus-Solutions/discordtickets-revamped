const { SlashCommand } = require('@eartharoid/dbf');
const {
	ApplicationCommandOptionType,
	PermissionsBitField,
	MessageFlags,
} = require('discord.js');
const fs = require('fs');
const { dataPath } = require('../../lib/paths');
const Mustache = require('mustache');
const { AttachmentBuilder } = require('discord.js');
const ExtendedEmbedBuilder = require('../../lib/embed');
const { resolveCategory } = require('../../lib/settings/inheritance');
const { formatAnswer } = require('../../lib/tickets/questions');
const { pools } = require('../../lib/threads');

const { transcript: pool } = pools;

module.exports = class TranscriptSlashCommand extends SlashCommand {
	constructor(client, options) {
		const name = 'transcript';
		super(client, {
			...options,
			description: client.i18n.getMessage(null, `commands.slash.${name}.description`) || 'Generate or download a ticket transcript',
			descriptionLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.description`),
			dmPermission: false,
			name,
			nameLocalizations: client.i18n.getAllMessages(`commands.slash.${name}.name`),
			options: [
				{
					autocomplete: true,
					name: 'ticket',
					required: true,
					type: ApplicationCommandOptionType.String,
				},
				{
					name: 'member',
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

		// Markdown transcripts must not be HTML-escaped, but we don't want to
		// mutate Mustache's *global* escape function — that would silently
		// disable escaping for any other Mustache.render in the process. We
		// scope the override to renders that go through `this.renderTranscript`.
		this.template = fs.readFileSync(
			dataPath('user', 'templates', this.client.config.templates.transcript + '.mustache'),
			{ encoding: 'utf8' },
		);
	}

	shouldAllowAccess(interaction, ticket) {
		// the creator can always get their ticket, even from outside the guild
		if (ticket.createdById === interaction.user.id) return true; // user not member (DMs)
		// everyone else must be in the guild
		if (interaction.guild?.id !== ticket.guildId) return false;
		// and have authority
		if (interaction.client.supers.includes(interaction.member.id)) return true;
		if (interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return true;
		if (interaction.member.roles.cache.filter(role => ticket.category.staffRoles.includes(role.id)).size > 0) return true;
		return false;
	}

	async fillTemplate(ticket) {
		/** @type {import("client")} */
		const client = this.client;

		ticket = await pool.queue(w => w(ticket));

		// The worker only decrypts. Non-text answers are stored as JSON, so the
		// template would otherwise print `["one","two"]` where a reader expects the
		// option labels. Done here rather than in the worker so the worker thread
		// stays free of the discord.js builders `formatAnswer` lives beside.
		ticket.questionAnswers = ticket.questionAnswers.map(answer => ({
			...answer,
			value: answer.question ? formatAnswer(answer.question, answer.value) : answer.value,
		}));

		const channelName = ticket.category.channelName
			.replace(/{+\s?(user)?name\s?}+/gi, ticket.createdBy?.username)
			.replace(/{+\s?(nick|display)(name)?\s?}+/gi, ticket.createdBy?.displayName)
			.replace(/{+\s?num(ber)?\s?}+/gi, ticket.number);
		const fileName = `${channelName}.${this.client.config.templates.transcript.split('.').slice(-1)[0]}`;
		// Save/restore Mustache.escape around this single render so any other
		// caller of Mustache.render keeps its default HTML-escaping. Cf. V8.
		const previousEscape = Mustache.escape;
		Mustache.escape = text => text;
		let transcript;
		try {
			transcript = Mustache.render(this.template, {
				channelName,
				closedAtFull: function () {
					return new Intl.DateTimeFormat([ticket.guild.locale, 'en-GB'], {
						dateStyle: 'full',
						timeStyle: 'long',
						timeZone: 'Etc/UTC',
					}).format(this.closedAt);
				},
				createdAtFull: function () {
					return new Intl.DateTimeFormat([ticket.guild.locale, 'en-GB'], {
						dateStyle: 'full',
						timeStyle: 'long',
						timeZone: 'Etc/UTC',
					}).format(this.createdAt);
				},
				createdAtTimestamp: function () {
					return new Intl.DateTimeFormat([ticket.guild.locale, 'en-GB'], {
						dateStyle: 'short',
						timeStyle: 'long',
						timeZone: 'Etc/UTC',
					}).format(this.createdAt);
				},
				guildName: client.guilds.cache.get(ticket.guildId)?.name,
				pinned: ticket.pinnedMessageIds.join(', '),
				ticket,
			});
		} finally {
			Mustache.escape = previousEscape;
		}

		return {
			fileName,
			transcript,
		};
	}

	/**
	 * @param {import("discord.js").ChatInputCommandInteraction} interaction
	 */
	async run(interaction, ticketId) {
		/** @type {import("client")} */
		const client = this.client;

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		ticketId = ticketId || interaction.options.getString('ticket', true);
		const ticket = await client.prisma.ticket.findUnique({
			include: {
				archivedChannels: true,
				archivedMessages: {
					orderBy: { createdAt: 'asc' },
					where: { external: false },
				},
				archivedRoles: true,
				archivedUsers: true,
				category: true,
				claimedBy: true,
				closedBy: true,
				createdBy: true,
				feedback: true,
				guild: true,
				questionAnswers: { include: { question: true } },
			},
			where: interaction.guildId && ticketId.length < 16
				? {
					guildId_number: {
						guildId: interaction.guildId,
						number: parseInt(ticketId),
					},
				}
				: { id: ticketId },
		});

		if (!ticket) throw new Error(`Ticket ${ticketId} does not exist`);

		// `shouldAllowAccess` reads `category.staffRoles` and `fillTemplate` reads
		// `category.channelName`; both are NULL on a category that inherits them,
		// which would deny a staff member their own transcript and then throw on
		// the filename.
		ticket.category = resolveCategory(ticket.category, ticket.guild);

		// `interaction.guild` is null in DMs — this command is reachable there via
		// the transcript button on the closure DM (`src/buttons/transcript.js`),
		// and `shouldAllowAccess` deliberately returns false for a non-creator
		// outside the guild, so both branches below have to source the locale and
		// icon from the ticket's guild rather than the interaction's.
		const getMessage = client.i18n.getLocale(ticket.guild.locale);
		const errorEmbed = key => new ExtendedEmbedBuilder({
			iconURL: client.guilds.cache.get(ticket.guildId)?.iconURL(),
			text: ticket.guild.footer,
		})
			.setColor(ticket.guild.errorColour)
			.setTitle(getMessage(`commands.slash.transcript.${key}.title`))
			.setDescription(getMessage(`commands.slash.transcript.${key}.description`));

		// The server has switched DMs off, so transcripts must not leave it either.
		if (!interaction.guildId && ticket.guild.disableDMs) {
			return await interaction.editReply({ embeds: [errorEmbed('dms_disabled')] });
		}

		if (!this.shouldAllowAccess(interaction, ticket)) {
			return await interaction.editReply({ embeds: [errorEmbed('not_staff')] });
		}

		const {
			fileName,
			transcript,
		} = await this.fillTemplate(ticket);
		const attachment = new AttachmentBuilder()
			.setFile(Buffer.from(transcript))
			.setName(fileName);

		await interaction.editReply({ files: [attachment] });
		// TODO: add portal link
	}
};
