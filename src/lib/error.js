const { getSUID } = require('./logging');
const Sentry = require('@sentry/node');
const {
	EmbedBuilder,
	codeBlock,
} = require('discord.js');

/**
 * Report an interaction failure to Sentry, tagged with the same short id the
 * user is shown. A support ticket quoting that code then resolves directly to
 * an issue instead of a log search.
 *
 * The log bridge in src/lib/logger.js cannot do this: leekslazylogger runs
 * `util.format` over log content before any transport sees it, so the real
 * Error — with its stack and `code` — never survives that far.
 *
 * @param {Error} error
 * @param {import("discord.js").Interaction} interaction
 * @param {string} ref
 * @param {string} kind
 * @param {string} name
 */
const report = (error, interaction, ref, kind, name) => {
	try {
		Sentry.withScope(scope => {
			scope.setTag('ref', ref);
			scope.setTag('interaction.type', kind);
			scope.setTag('interaction.name', name);
			// IDs only — no usernames or message content, and only when the
			// operator has opted into PII.
			if (interaction.guild) scope.setTag('guild', interaction.guild.id);
			scope.setContext('interaction', {
				channel: interaction.channel?.id ?? null,
				guild: interaction.guild?.id ?? null,
				locale: interaction.locale ?? null,
				name,
				type: kind,
			});
			Sentry.captureException(error);
		});
	} catch {
		// Reporting a failure must never itself become a failure: this runs on
		// the path that tells the user something went wrong.
	}
};

/**
 *
 * @param {Object} event
 * @param {import("discord.js").Interaction<"cached">} event.interaction
 * @param {Error} event.error
 * @returns
 */
module.exports.handleInteractionError = async event => {
	const {
		interaction,
		error,
	} = event;
	const { client } = interaction;

	const ref = getSUID();

	let kind = 'unknown';
	let name = 'unknown';

	if (interaction.isAnySelectMenu()) {
		kind = 'menu';
		name = event.menu.id;
		client.log.error.menus(`[${ref}] "${name}" menu execution error:`, error);
	} else if (interaction.isButton()) {
		kind = 'button';
		name = event.button.id;
		client.log.error.buttons(`[${ref}] "${name}" button execution error:`, error);
	} else if (interaction.isModalSubmit()) {
		kind = 'modal';
		name = event.modal.id;
		client.log.error.modals(`[${ref}] "${name}" modal execution error:`, error);
	} else if (interaction.isCommand()) {
		kind = 'command';
		name = event.command.name;
		client.log.error.commands(`[${ref}] "${name}" command execution error:`, error);
	} else {
		client.log.error.listeners(`[${ref}] interaction execution error:`, error);
	}

	report(error, interaction, ref, kind, name);


	let locale = null;
	if (interaction.guild) {
		locale = (await client.prisma.guild.findUnique({
			select: { locale: true },
			where: { id: interaction.guild.id },
		})).locale;
	}
	const getMessage = client.i18n.getLocale(locale);

	const data = {
		components: [],
		embeds: [],
	};

	if (error.code === 10011 || (error.code === 'Invalid Type' && /Role/.test(error.message))) {
		data.embeds.push(
			new EmbedBuilder()
				.setColor('Orange')
				.setTitle(getMessage('misc.role_error.title'))
				.setDescription(getMessage('misc.role_error.description'))
				.addFields([
					{
						name: getMessage('misc.role_error.fields.for_admins.name'),
						value: getMessage('misc.role_error.fields.for_admins.value', { url: 'https://discordtickets.app/self-hosting/troubleshooting/#invalid-user-or-role' }),
					},
				]),
		);
	} else if (/Missing (Access|Permissions)/.test(error.message)) {
		data.embeds.push(
			new EmbedBuilder()
				.setColor('Orange')
				.setTitle(getMessage('misc.permissions_error.title'))
				.setDescription(getMessage('misc.permissions_error.description'))
				.addFields([
					{
						name: getMessage('misc.permissions_error.fields.for_admins.name'),
						value: getMessage('misc.permissions_error.fields.for_admins.value', { url: 'https://discordtickets.app/self-hosting/troubleshooting/#missing-permissions' }),
					},
				]),
		);
	} else {
		data.embeds.push(
			new EmbedBuilder()
				.setColor('Orange')
				.setTitle(getMessage('misc.error.title'))
				.setDescription(getMessage('misc.error.description'))
				.addFields([
					{
						name: getMessage('misc.error.fields.identifier'),
						value: codeBlock(ref),
					},
				]),
		);
	}



	return interaction.reply(data).catch(() => interaction.editReply(data));
};
