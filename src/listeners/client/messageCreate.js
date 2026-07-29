const { Listener } = require('@eartharoid/dbf');
const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle: { Success },
	ChannelType,
	ComponentType,
	EmbedBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} = require('discord.js');
const {
	getCommonGuilds,
	isStaff,
} = require('../../lib/users');
const temporal = require('../../lib/temporal');
const ms = require('ms');
const {
	emit,
	flattenEmbeds,
} = require('../../lib/automations/dispatcher');
const { resolveEmoji } = require('../../lib/emoji');
const regex = require('../../lib/regex');

module.exports = class extends Listener {
	constructor(client, options) {
		super(client, {
			...options,
			emitter: client,
			event: 'messageCreate',
		});
	}

	/**
 	 * @param {import('@prisma/client').Guild} settings
	 * @param {import("discord.js").ButtonInteraction|import("discord.js").SelectMenuInteraction} interaction
	 */
	async useGuild(settings, interaction, topic) {
		// Both entry points wait up to 30 seconds for the user to press a button
		// or pick a server, so DMs may have been disabled since the prompt was
		// sent. Acknowledge silently and clean the prompt up, as the timeout
		// handlers do.
		if (settings.disableDMs) {
			await interaction.deferUpdate().catch(() => null);
			await interaction.message.delete().catch(() => null);
			return;
		}
		const getMessage = this.client.i18n.getLocale(settings.locale);
		if (settings.categories.length === 0) {
			interaction.update({
				components: [],
				embeds: [
					new EmbedBuilder()
						.setColor(settings.errorColour)
						.setTitle(getMessage('misc.no_categories.title'))
						.setDescription(getMessage('misc.no_categories.description', { url: `${process.env.HTTP_EXTERNAL}/settings/${interaction.guildId}` })),
				],
			});
		} else if (settings.categories.length === 1) {
			await this.client.tickets.create({
				categoryId: settings.categories[0].id,
				interaction,
				topic,
			});
		} else {
			await interaction.update({
				components: [
					new ActionRowBuilder()
						.setComponents(
							new StringSelectMenuBuilder()
								.setCustomId(JSON.stringify({
									action: 'create',
									topic,
								}))
								.setPlaceholder(getMessage('menus.category.placeholder'))
								.setOptions(
									settings.categories.map(category => {
										const option = new StringSelectMenuOptionBuilder()
											.setValue(String(category.id))
											.setLabel(category.name)
											.setDescription(category.description);
										const categoryEmoji = resolveEmoji(category.emoji);
										if (categoryEmoji) option.setEmoji(categoryEmoji);
										return option;
									}),
								),
						),
				],
			});
			interaction.message.awaitMessageComponent({
				componentType: ComponentType.SelectMenu,
				filter: () => true,
				time: ms('30s'),
			})
				.then(async () => {
					interaction.message.delete();
				})
				.catch(error => {
					if (error) this.client.log.error(error);
					interaction.message.delete();
				});
		}

	}

	/**
	 * @param {import("discord.js").Message} message
	 */
	async run(message) {
		/** @type {import("client")} */
		const client = this.client;

		if (message.channel.type === ChannelType.DM) {
			if (message.author.bot) return false;
			let commonGuilds = await getCommonGuilds(client, message.author.id);
			// Servers with DMs disabled are invisible to this flow: if it was the
			// user's only common server the listener falls into the silent
			// `size === 0` return below, and otherwise it simply isn't offered in
			// the guild picker.
			if (commonGuilds.size > 0) {
				const disabled = new Set(
					(await client.prisma.guild.findMany({
						select: { id: true },
						where: {
							disableDMs: true,
							id: { in: commonGuilds.map(guild => guild.id) },
						},
					})).map(guild => guild.id),
				);
				if (disabled.size > 0) commonGuilds = commonGuilds.filter(guild => !disabled.has(guild.id));
			}
			if (commonGuilds.size === 0) {
				return false;
			} else if (commonGuilds.size === 1) {
				const settings = await client.prisma.guild.findUnique({
					select: {
						categories: true,
						disableDMs: true,
						errorColour: true,
						locale: true,
						primaryColour: true,
					},
					where: { id: commonGuilds.at(0).id },
				});
				const getMessage = client.i18n.getLocale(settings.locale);
				const sent = await message.reply({
					components: [
						new ActionRowBuilder()
							.setComponents(
								new ButtonBuilder()
									.setCustomId(message.id)
									.setStyle(Success)
									.setLabel(getMessage('buttons.confirm_open.text'))
									.setEmoji(getMessage('buttons.confirm_open.emoji')),
							),
					],
					embeds: [
						new EmbedBuilder()
							.setColor(settings.primaryColour)
							.setTitle(getMessage('dm.confirm_open.title'))
							.setDescription(message.content),
					],
				});
				sent.awaitMessageComponent({
					componentType: ComponentType.Button,
					filter: () => true,
					time: ms('30s'),
				})
					.then(async interaction => await this.useGuild(settings, interaction, message.content))
					.catch(error => {
						if (error) client.log.error(error);
						sent.delete();
					});
			} else {
				const getMessage = client.i18n.getLocale();
				const sent = await message.reply({
					components: [
						new ActionRowBuilder()
							.setComponents(
								new StringSelectMenuBuilder()
									.setCustomId(message.id)
									.setPlaceholder(getMessage('menus.guild.placeholder'))
									.setOptions(
										commonGuilds.map(g =>
											new StringSelectMenuOptionBuilder()
												.setValue(String(g.id))
												.setLabel(g.name),
										),
									),
							),

					],
				});
				sent.awaitMessageComponent({
					componentType: ComponentType.SelectMenu,
					filter: () => true,
					time: ms('30s'),
				})
					.then(async interaction => {
						const settings = await client.prisma.guild.findUnique({
							select: {
								categories: true,
								disableDMs: true,
								errorColour: true,
								locale: true,
								primaryColour: true,
							},
							where: { id: interaction.values[0] },
						});
						await this.useGuild(settings, interaction, message.content);
					})
					.catch(error => {
						if (error) client.log.error(error);
						sent.delete();
					});
			}
		} else {
			const settings = await client.prisma.guild.findUnique({ where: { id: message.guild.id } });
			if (!settings) return;
			const getMessage = client.i18n.getLocale(settings.locale);
			let ticket = await client.prisma.ticket.findUnique({
				include: { category: { select: { autoAssign: true } } },
				where: { id: message.channel.id },
			});

			if (ticket) {
				// archive messages
				if (settings.archive) {
					client.tickets.archiver.saveMessage(ticket.id, message)
						.catch(error => {
							client.log.warn('Failed to archive message', message.id);
							client.log.error(error);
							message.react('❌').catch(client.log.error);
						});
				}

				if (!message.author.bot) {
					// update user's message count
					client.prisma.user.upsert({
						create: {
							id: message.author.id,
							messageCount: 1,
						},
						update: { messageCount: { increment: 1 } },
						where: { id: message.author.id },
					}).catch(client.log.error);

					// set first and last message timestamps
					const data = { lastMessageAt: new Date() };
					const isStaffMember = await isStaff(message.guild, message.author.id);
					if (ticket.firstResponseAt === null && isStaffMember) data.firstResponseAt = new Date();
					// The `include` must be repeated here: `update()` returns scalars
					// only, so reassigning `ticket` from it dropped the `category`
					// relation loaded above — leaving the autoAssign guard below
					// permanently false, and the whole feature (column, migration,
					// dashboard toggle and TicketManager#autoClaim) dead.
					ticket = await client.prisma.ticket.update({
						data,
						include: { category: { select: { autoAssign: true } } },
						where: { id: ticket.id },
					});

					// auto-assign to first staff responder (per-category opt-in)
					if (
						isStaffMember &&
					ticket.category?.autoAssign &&
					!ticket.claimedById
					) {
						client.tickets.autoClaim(message.channel, message.author.id)
							.catch(err => client.log.warn('Auto-assign failed for ticket %s: %s', ticket.id, err.message));
					}
					// Reset the durable inactivity timer for this ticket. Skipped while
					// the ticket sits in a reopen grace window — signal-with-start would
					// otherwise spawn a fresh stale workflow for a soft-closed ticket.
					if (process.env.PUBLIC_BOT !== 'true' && !ticket.pendingCloseAt) {
						temporal.signalTicketActivity({
							guildId: message.guild.id,
							lastActivityAt: Date.now(),
							ticketId: ticket.id,
						}).catch(err => client.log.error(err));
					}
				}

				if (process.env.PUBLIC_BOT !== 'true' &&
					!message.author.bot &&
					!await isStaff(message.channel.guild, message.author.id)
				) {
					const key = `offline/${message.channel.id}`;
					let online = 0;
					for (const [, member] of message.channel.members) {
						if (member.user.bot) continue;
						if (!await isStaff(message.channel.guild, member.id)) continue;
						if (member.presence && member.presence !== 'offline') online++;
					}
					if (online === 0 && ! await client.keyv.has(key)) {
						await message.channel.send({
							embeds: [
								new EmbedBuilder()
									.setColor(settings.primaryColour)
									.setTitle(getMessage('ticket.offline.title'))
									.setDescription(getMessage('ticket.offline.description')),
							],
						});
						client.keyv.set(key, Date.now(), ms('1h'));
					}
				}
			}

			// Beside the auto-tag block on purpose: `settings` and `ticket` are
			// already loaded here, so the hot path costs one cache read in the
			// dispatcher and nothing else.
			// One pass over the guild's automations for both triggers: a message is
			// always "a message is posted", and — if it clears every check on the
			// node — also "another bot sends a command".
			emit(client, ['trigger.message.created', 'trigger.bot.command'], {
				categoryId: ticket?.categoryId,
				channelId: message.channel.id,
				content: message.content,
				// Another bot's output usually lives in an embed, so a trigger
				// watching one has to be able to see it. Only built when there is
				// one to build — this runs for every message in every guild.
				embedText: message.embeds?.length ? flattenEmbeds(message) : null,
				guildId: message.guild.id,
				isBot: message.author.bot,
				isSelf: message.author.id === client.user.id,
				// Anyone with Manage Webhooks can choose a webhook's name and
				// avatar, so a bot command trigger refuses them outright.
				webhookId: message.webhookId ?? null,
				messageId: message.id,
				ticketId: ticket?.id,
				userId: message.author.id,
				vars: {
					displayname: message.member?.displayName,
					name: message.author.username,
				},
			});

			// auto-tag
			if (
				!message.author.bot &&
				(
					(settings.autoTag === 'all') ||
					(settings.autoTag === 'ticket' && ticket) ||
					(settings.autoTag === '!ticket' && !ticket) ||
					(settings.autoTag.includes(message.channel.id))
				)
			) {
				const cacheKey = `cache/guild-tags:${message.guild.id}`;
				let tags = await client.keyv.get(cacheKey);
				if (!tags) {
					tags = (await client.prisma.tag.findMany({
						select: {
							content: true,
							id: true,
							name: true,
							regex: true,
						},
						where: { guildId: message.guild.id },
					}))
						.sort((a, b) => (b.regex ? b.regex.length : 0) - (a.regex ? a.regex.length : 0));
					client.keyv.set(cacheKey, tags, ms('1h'));
				}

				// Tag patterns are admin-supplied and run against every message, so
				// they go through the shared guard rather than `new RegExp` — see
				// src/lib/regex.js. A pattern that fails the check simply never
				// matches, which is also what happens to rows saved before the
				// tags API started validating them.
				const tag = tags.find(tag => tag.regex && regex.test(tag.regex, 'mi', message.content));
				if (tag) {
					await message.reply({
						embeds: [
							new EmbedBuilder()
								.setColor(settings.primaryColour)
								.setDescription(tag.content),
						],
					});
				}

			}
		}
	}
};
