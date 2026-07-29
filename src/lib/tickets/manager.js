
/* eslint-disable max-lines */
const TicketArchiver = require('./archiver');
const { saveHtmlTranscript } = require('./transcript-html');
const archiver = require('archiver');
const unzipper = require('unzipper');
const { createWriteStream } = require('node:fs');
const { Readable } = require('node:stream');
const { createInterface } = require('node:readline');
const { iconURL } = require('../misc');
const pkg = require('../../../package.json');
const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	inlineCode,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	MessageFlags,
} = require('discord.js');
const {
	buildOpeningMessage,
	categoryNeedsStats,
	rerenderOpeningMessage,
} = require('./opening-message');
const {
	buildQuestionComponents,
	formatAnswer,
	readAnswers,
} = require('./questions');
const ms = require('ms');
const ExtendedEmbedBuilder = require('../embed');
const { logTicketEvent } = require('../logging');
const { isStaff } = require('../users');
const { getWorkingHours } = require('../working-hours');
const { emit } = require('../automations/dispatcher');
const { Collection } = require('discord.js');

const { getSUID } = require('../logging');
const {
	getAverageTimes, getAverageRating,
} = require('../stats');
const { pools } = require('../threads');
const temporal = require('../temporal');
const {
	CATEGORY_FIELDS,
	GUILD_FIELDS,
	QUESTION_FIELDS,
	TAG_FIELDS,
	pick,
} = require('../schemas/importable');

const { crypto } = pools;

/**
 * @typedef {import('@prisma/client').Category &
 * 	{guild: import('@prisma/client').Guild} &
 * 	{questions: import('@prisma/client').Question[]}} CategoryGuildQuestions
 */

/**
 * @typedef {import('@prisma/client').Ticket &
 * 	{category: import('@prisma/client').Category} &
 * 	{feedback: import('@prisma/client').Feedback} &
 * 	{guild: import('@prisma/client').Guild}} TicketCategoryFeedbackGuild
 */

module.exports = class TicketManager {
	constructor(client) {
		/** @type {import("client")} */
		this.client = client;
		this.archiver = new TicketArchiver(client);
		this.$count = { categories: {} };
		this.$numbers = {};
		// Transient in-memory state for pending manual close requests
		// ({ closedBy, reason }). The durable inactivity/auto-close lifecycle
		// now lives in the per-ticket `staleTicketWorkflow` (see src/temporal).
		this.$closeRequests = new Collection();
	}

	/**
	 * Retrieve cached category data
	 * @param {string} categoryId the category ID
	 * @param {boolean} force bypass & update the cache?
	 * @returns {Promise<CategoryGuildQuestions>}
	 */
	async getCategory(categoryId, force) {
		const cacheKey = `cache/category+guild+questions:${categoryId}`;
		/** @type {CategoryGuildQuestions} */
		let category = await this.client.keyv.get(cacheKey);
		if (!category || force) {
			category = await this.client.prisma.category.findUnique({
				include: {
					guild: true,
					questions: { orderBy: { order: 'asc' } },
				},
				where: { id: categoryId },
			});
			await this.client.keyv.set(cacheKey, category, ms('12h'));
		}
		return category;
	}

	/**
	 * Retrieve cached ticket data for the closing sequence
	 * @param {string} ticketId the ticket ID
	 * @param {boolean} [force] bypass & update the cache?
	 * @param {string} [guildId] when given, only return the ticket if it belongs
	 * to this guild. Callers that take a ticket id from a request must pass it:
	 * a bare lookup by id is how the automation test endpoint became a way to
	 * ask questions about another server's tickets.
	 * @returns {Promise<TicketCategoryFeedbackGuild>}
	 */
	async getTicket(ticketId, force, guildId) {
		const cacheKey = `cache/ticket+category+feedback+guild:${ticketId}`;
		/** @type {TicketCategoryFeedbackGuild} */
		let ticket = await this.client.keyv.get(cacheKey);
		if (!ticket || force) {
			ticket = await this.client.prisma.ticket.findUnique({
				include: {
					category: true,
					feedback: true,
					guild: true,
				},
				where: { id: ticketId },
			});
			await this.client.keyv.set(cacheKey, ticket, ms('3m'));
		}
		if (guildId && ticket?.guildId !== guildId) return null;
		return ticket;
	}

	// `!count` treats 0 as a cache miss, which is harmless (it re-counts and gets
	// 0 back). A *negative* count is truthy, so it was returned forever — and a
	// negative total means `totalCount >= totalLimit` never trips again, quietly
	// removing the category's ticket cap until the next restart.
	async getTotalCount(categoryId) {
		this.$count.categories[categoryId] ||= {};
		let count = this.$count.categories[categoryId].total;
		if (!count || count < 0) {
			count = await this.client.prisma.ticket.count({
				where: {
					categoryId,
					open: true,
				},
			});
			this.$count.categories[categoryId].total = count;
		}
		return count;
	}

	async getMemberCount(categoryId, memberId) {
		this.$count.categories[categoryId] ||= {};
		let count = this.$count.categories[categoryId][memberId];
		if (!count || count < 0) {
			count = await this.client.prisma.ticket.count({
				where: {
					categoryId: categoryId,
					createdById: memberId,
					open: true,
				},
			});
			this.$count.categories[categoryId][memberId] = count;
		}
		return count;
	}

	async getCooldown(categoryId, memberId) {
		const cacheKey = `cooldowns/category-member:${categoryId}-${memberId}`;
		return await this.client.keyv.get(cacheKey);
	}

	async getNextNumber(guildId) {
		if (this.$numbers[guildId] === undefined) {
			const { _max: { number: max } } = await this.client.prisma.ticket.aggregate({
				_max: { number: true },
				where: { guildId },
			});
			this.client.tickets.$numbers[guildId] = max ?? 0;
		}
		this.$numbers[guildId] += 1;
		return this.$numbers[guildId];
	}

	/**
	 * @param {object} data
	 * @param {string} data.categoryId
	 * @param {import("discord.js").ChatInputCommandInteraction
	 * | import("discord.js").ButtonInteraction
	 * | import("discord.js").SelectMenuInteraction} data.interaction
	 * @param {string?} [data.topic]
	 */
	async create({
		categoryId, interaction, topic, referencesMessageId, referencesTicketId, skipRatelimit = false,
	}) {
		categoryId = Number(categoryId);
		const category = await this.getCategory(categoryId);

		if (!category) {
			let settings;
			if (interaction.guild) {
				settings = await this.client.prisma.guild.findUnique({ where: { id: interaction.guild.id } });
			} else {
				settings = {
					errorColour: 'Red',
					locale: 'en-GB',
				};
			}
			const getMessage = this.client.i18n.getLocale(settings.locale);
			return await interaction.reply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild?.iconURL(),
						text: settings.footer,
					})
						.setColor(settings.errorColour)
						.setTitle(getMessage('misc.unknown_category.title'))
						.setDescription(getMessage('misc.unknown_category.description')),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		/** @type {import("discord.js").Guild} */
		const guild = this.client.guilds.cache.get(category.guild.id);
		const member = interaction.member ?? await guild.members.fetch(interaction.user.id);
		const getMessage = this.client.i18n.getLocale(category.guild.locale);

		// `skipRatelimit` is set when falling back to a backup category. The key is
		// derived from the guild and user only, so it is identical for the
		// recursive call — and this method sets it *before* the capacity checks
		// below, meaning the fallback always tripped its own rate limit and
		// answered "you are being rate limited" instead of opening the ticket.
		const rlKey = `ratelimits/guild-user:${category.guildId}-${interaction.user.id}`;
		const rl = skipRatelimit ? false : await this.client.keyv.get(rlKey);
		if (rl) {
			return await interaction.reply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: guild.iconURL(),
						text: category.guild.footer,
					})
						.setColor(category.guild.errorColour)
						.setTitle(getMessage('misc.ratelimited.title'))
						.setDescription(getMessage('misc.ratelimited.description')),
				],
				flags: MessageFlags.Ephemeral,
			});
		} else {
			this.client.keyv.set(rlKey, true, ms('5s'));
		}

		const sendError = name => interaction.reply({
			embeds: [
				new ExtendedEmbedBuilder({
					iconURL: guild.iconURL(),
					text: category.guild.footer,
				})
					.setColor(category.guild.errorColour)
					.setTitle(getMessage(`misc.${name}.title`))
					.setDescription(getMessage(`misc.${name}.description`)),
			],
			flags: MessageFlags.Ephemeral,
		});

		if (category.guild.blocklist.length !== 0) {
			const blocked = category.guild.blocklist.some(r => member.roles.cache.has(r));
			if (blocked) return await sendError('blocked');
		}

		// Don't let timed out users open tickets, they won't be able to write anything inside
		if (member.isCommunicationDisabled()) {
			return await sendError('blocked');
		}

		// Staff bypass the three *per-user* gates below: the roles a member needs to
		// use a category, the cap on how many tickets one member may have open in
		// it, and the per-member cooldown. Staff routinely open tickets to test a
		// category or to handle one on a member's behalf, and being turned away by
		// the limits they administer is never the intent.
		//
		// Deliberately NOT bypassed: the blocklist and timeout checks above (a
		// timed-out user cannot write in the ticket anyway), the 5-second anti-spam
		// ratelimit, and the category capacity checks below — those protect the
		// server and Discord's own 50-channels-per-category limit, not the user.
		const staff = await isStaff(guild, interaction.user.id);

		if (!staff && category.requiredRoles.length !== 0) {
			const missing = category.requiredRoles.some(r => !member.roles.cache.has(r));
			if (missing) return await sendError('missing_roles');
		}

		// Check if category is full (Discord category channels limit = 50, or totalLimit in DB)
		// For CHANNEL mode: check discord category child count
		// For THREAD/FORUM mode: no Discord category child limit applies
		if (category.channelMode === 'CHANNEL' || !category.channelMode) {
			const discordCategory = guild.channels.cache.get(category.discordCategory);
			if (discordCategory && discordCategory.children.cache.size >= 50) {
				// Try backup category first before erroring
				if (category.backupCategoryId && !skipRatelimit) {
					return this.create({
						categoryId: category.backupCategoryId,
						interaction,
						referencesMessageId,
						referencesTicketId,
						skipRatelimit: true,
						topic,
					});
				}
				return await sendError('category_full');
			}
		}

		const totalCount = await this.getTotalCount(category.id);
		if (totalCount >= category.totalLimit) {
			// Try backup category first before erroring
			if (category.backupCategoryId && !skipRatelimit) {
				return this.create({
					categoryId: category.backupCategoryId,
					interaction,
					referencesMessageId,
					referencesTicketId,
					skipRatelimit: true,
					topic,
				});
			}
			return await sendError('category_full');
		}

		const memberCount = staff ? 0 : await this.getMemberCount(category.id, interaction.user.id);
		if (!staff && memberCount >= category.memberLimit) {
			return await interaction.reply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: guild.iconURL(),
						text: category.guild.footer,
					})
						.setColor(category.guild.errorColour)
						.setTitle(getMessage('misc.member_limit.title', memberCount, memberCount))
						.setDescription(getMessage('misc.member_limit.description', memberCount)),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		const cooldown = staff ? null : await this.getCooldown(category.id, interaction.user.id);
		if (cooldown) {
			return await interaction.reply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: guild.iconURL(),
						text: category.guild.footer,
					})
						.setColor(category.guild.errorColour)
						.setTitle(getMessage('misc.cooldown.title'))
						.setDescription(getMessage('misc.cooldown.description', { time: ms(cooldown - Date.now()) })),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		if (category.questions.length >= 1) {
			await interaction.showModal(
				new ModalBuilder()
					.setCustomId(JSON.stringify({
						action: 'questions',
						categoryId,
						referencesMessageId,
						referencesTicketId,
					}))
					.setTitle(category.name)
					.setComponents(buildQuestionComponents(category.questions)),
			);
		} else if (category.requireTopic && !topic) {
			await interaction.showModal(
				new ModalBuilder()
					.setCustomId(JSON.stringify({
						action: 'topic',
						categoryId,
						referencesMessageId,
						referencesTicketId,
					}))
					.setTitle(category.name)
					.setComponents(
						new ActionRowBuilder()
							.setComponents(
								new TextInputBuilder()
									.setCustomId('topic')
									.setLabel(getMessage('modals.topic.label'))
									.setStyle(TextInputStyle.Paragraph)
									.setMaxLength(1000)
									.setMinLength(5)
									.setPlaceholder(getMessage('modals.topic.placeholder'))
									.setRequired(true),
							),
					),
			);
		} else {
			await this.postQuestions({
				categoryId,
				interaction,
				referencesMessageId,
				referencesTicketId,
				topic,
			});
		}
	}

	/**
	 * Move modal uploads somewhere permanent.
	 *
	 * A file uploaded through a modal is served from an ephemeral CDN URL that
	 * stops resolving within about a day, so storing it verbatim would leave a
	 * dead link in the ticket, the export and the HTML transcript. Re-posting it
	 * into the ticket channel gives it a message-attachment URL that lives as long
	 * as the message does, and — because it is now an ordinary message — the
	 * archiver picks it up with everything else.
	 *
	 * Best-effort: a guild that has revoked Attach Files, or a file over the
	 * guild's upload limit, must not take the whole ticket down with it. The
	 * original (expiring) URLs are kept in that case, which is still better than
	 * nothing.
	 *
	 * Mutates `submitted` in place.
	 *
	 * @param {?{question: object, value: string, attachments: ?import('discord.js').Collection}[]} submitted
	 * @param {import('discord.js').GuildTextBasedChannel} channel
	 * @returns {Promise<boolean>} whether any answer's stored value changed
	 */
	async repostUploads(submitted, channel) {
		if (!submitted) return false;
		let changed = false;
		for (const answer of submitted) {
			const files = [...(answer.attachments?.values() ?? [])];
			answer.attachments = null;
			if (!files.length) continue;
			try {
				const posted = await channel.send({
					content: `**${answer.question.label}**`,
					files: files.map(file => ({
						attachment: file.url,
						description: file.description ?? undefined,
						name: file.name,
					})),
				});
				answer.value = JSON.stringify([...posted.attachments.values()].map(attachment => ({
					name: attachment.name,
					url: attachment.url,
				})));
				changed = true;
			} catch (error) {
				this.client.log.warn(
					'Failed to re-post %d upload(s) for question %s in %s: %s',
					files.length, answer.question.id, channel.id, error.message,
				);
			}
		}
		return changed;
	}

	/**
	 * @param {object} data
	 * @param {string} data.category
	 * @param {import("discord.js").ButtonInteraction
	 * | import("discord.js").SelectMenuInteraction
	 * | import("discord.js").ModalSubmitInteraction} data.interaction
	 * @param {string?} [data.topic]
	 */
	async postQuestions({
		action, categoryId, interaction, topic, referencesMessageId, referencesTicketId,
	}) {
		const [, category] = await Promise.all([
			interaction.deferReply({ flags: MessageFlags.Ephemeral }),
			this.getCategory(categoryId),
		]);

		// The submitted answers, decrypted and with the attachments (if any) still
		// attached — they are re-posted into the ticket further down, once its
		// channel exists, because Discord's modal attachment URLs expire.
		/** @type {?{question: object, value: string, attachments: ?import('discord.js').Collection}[]} */
		let submitted = null;
		if (interaction.isModalSubmit()) {
			if (action === 'questions') {
				submitted = readAnswers(interaction, category.questions);
				if (category.customTopic) {
					// Only a text question can be the topic: everything else stores JSON,
					// and a channel topic of `["123"]` helps nobody.
					const custom = submitted.find(a => a.question.id === category.customTopic && a.question.type === 'TEXT');
					if (custom) topic = custom.value;
				}
			} else if (action === 'topic') {
				topic = interaction.fields.getTextInputValue('topic');
			}
		}

		/** @type {import("discord.js").Guild} */
		const guild = this.client.guilds.cache.get(category.guild.id);
		const getMessage = this.client.i18n.getLocale(category.guild.locale);
		const creator = await guild.members.fetch(interaction.user.id);
		const number = await this.getNextNumber(category.guild.id);
		const channelName = category.channelName
			.replace(/{+\s?(user)?name\s?}+/gi, creator.user.username)
			.replace(/{+\s?(nick|display)(name)?\s?}+/gi, creator.displayName)
			.replace(/{+\s?num(ber)?\s?}+/gi, number === 1488 ? '1487b' : number);
		const allow = ['ViewChannel', 'ReadMessageHistory', 'SendMessages', 'EmbedLinks', 'AttachFiles'];
		const channelMode = category.channelMode || 'CHANNEL';

		/** @type {import("discord.js").TextChannel|import("discord.js").ThreadChannel} */
		let channel;
		/** @type {import("discord.js").ForumChannel|null} */
		let forumChannel;

		if (channelMode === 'THREAD') {
			// Create a private/public thread inside an existing channel
			const parentChannel = guild.channels.cache.get(category.threadChannelId || category.discordCategory);
			if (!parentChannel) {
				return await interaction.editReply({
					embeds: [
						new ExtendedEmbedBuilder({
							iconURL: guild.iconURL(),
							text: category.guild.footer,
						})
							.setColor(category.guild.errorColour)
							.setTitle(getMessage('misc.error.title'))
							.setDescription('Thread parent channel not found. Please contact an administrator.'),
					],
				});
			}
			channel = await parentChannel.threads.create({
				autoArchiveDuration: 10080, // 7 days
				invitable: false,
				name: channelName,
				reason: `${creator.user.username} created a ticket`,
				type: ChannelType.PrivateThread,
			});
			// Add the creator, the bot, and every staff member to the private
			// thread. A private thread is only visible to explicit members (or
			// users with Manage Threads) — mentioning a role in the opening
			// message does not grant its members access, so without this loop
			// staff simply could not see THREAD-mode tickets at all.
			//
			// Failures are tolerated: the thread already exists at this point, and
			// throwing here would abandon it with no database row.
			const threadMemberIds = new Set([creator.id, this.client.user.id]);
			for (const roleId of category.staffRoles) {
				const role = guild.roles.cache.get(roleId);
				if (!role) continue;
				for (const staffMember of role.members.values()) threadMemberIds.add(staffMember.id);
			}
			for (const memberId of threadMemberIds) {
				await channel.members.add(memberId).catch(error =>
					this.client.log.warn('Could not add %s to ticket thread %s: %s', memberId, channel.id, error.message),
				);
			}
		} else if (channelMode === 'FORUM') {
			// Create a forum post (thread) in a forum channel
			forumChannel = guild.channels.cache.get(category.threadChannelId || category.discordCategory);
			if (!forumChannel) {
				return await interaction.editReply({
					embeds: [
						new ExtendedEmbedBuilder({
							iconURL: guild.iconURL(),
							text: category.guild.footer,
						})
							.setColor(category.guild.errorColour)
							.setTitle(getMessage('misc.error.title'))
							.setDescription('Forum channel not found. Please contact an administrator.'),
					],
				});
			}
		} else {
			// Default: CHANNEL mode — create a new text channel in a Discord category
			channel = await guild.channels.create({
				name: channelName,
				parent: category.discordCategory,
				permissionOverwrites: [
					{
						deny: ['ViewChannel'],
						id: guild.roles.everyone.id,
					},
					{
						allow,
						id: this.client.user.id,
					},
					{
						allow,
						id: creator.id,
					},
					...category.staffRoles.map(id => ({
						allow,
						id,
					})),
				],
				rateLimitPerUser: category.ratelimit,
				reason: `${creator.user.username} created a ticket`,
				topic: `${creator}${topic?.length > 0 ? ` | ${topic}` : ''}`,
			});
		}

		// Scans the whole layout, not just `openingMessage` — once the text lives
		// in blocks, testing the raw column alone would leave {avgResponseTime}
		// rendering as `undefined`.
		const needsStats = categoryNeedsStats(category);
		const statsCacheKey = `cache/category-stats/${categoryId}`;
		let stats = await this.client.keyv.get(statsCacheKey);
		if (needsStats && !stats) {
			const closedTickets = await this.client.prisma.ticket.findMany({
				select: {
					closedAt: true,
					createdAt: true,
					feedback: { select: { rating: true } },
					firstResponseAt: true,
				},
				where: {
					categoryId: category.id,
					firstResponseAt: { not: null },
					open: false,
				},
			});
			const {
				avgResolutionTime,
				avgResponseTime,
			} = await getAverageTimes(closedTickets);
			const avgRating = await getAverageRating(closedTickets);
			stats = {
				avgRating: avgRating.toFixed(1),
				avgResolutionTime: ms(avgResolutionTime, { long: true }),
				avgResponseTime: ms(avgResponseTime, { long: true }),
			};
			this.client.keyv.set(statsCacheKey, stats, ms('1h'));
		}

		// The whole message — ping line, body, answers, controls — comes from the
		// category's block layout. A Components v2 message cannot carry `content`
		// or `embeds` at all, so the role pings that used to live in `content` are
		// a text component now, and `allowedMentions` has to be explicit or they
		// would not notify anyone.
		//
		// Rendered from `submitted` rather than re-read from the interaction: the
		// previous version called `getTextInputValue()` on every question, including
		// the non-TEXT ones the answer list above deliberately skipped, so a single
		// select or checkbox would have thrown here.
		const renderOpeningMessage = () => buildOpeningMessage(this.client, {
			answers: submitted
				? submitted.map(a => ({
					label: a.question.label,
					value: formatAnswer(a.question, a.value, { getMessage }),
				}))
				: null,
			category,
			creator,
			creatorId: interaction.user.id,
			guild,
			number,
			stats,
			topic,
		});
		const openingMessageData = renderOpeningMessage();

		// For FORUM mode, the opening message is created in threads.create()
		// For other modes, we send a new message
		let sent;
		if (channelMode === 'FORUM') {
			channel = await forumChannel.threads.create({
				autoArchiveDuration: 10080, // 7 days
				message: openingMessageData,
				name: channelName,
				reason: `${creator.user.username} created a ticket`,
			});
			sent = await channel.messages.fetch(channel.id).catch(err => {
				this.client.log.error(err);
				return null;
			});
			if (!sent) throw new Error(`Failed to fetch opening message for forum ticket ${channel.id}. The message may not exist or the bot may be missing permissions.`);
		} else {
			// CHANNEL and THREAD modes: send a new message with embeds and components
			sent = await channel.send(openingMessageData);
		}

		// Files uploaded through the modal live on an ephemeral CDN URL that expires
		// within a day, so anything stored as-is would be a dead link by the time
		// anyone read the transcript. Re-posting them into the ticket gives them a
		// permanent URL *and* puts them where the archiver will capture them.
		if (await this.repostUploads(submitted, channel)) {
			await sent.edit(renderOpeningMessage()).catch(error =>
				this.client.log.warn('Failed to update opening message with re-posted uploads: %s', error.message));
		}

		sent.pin({ reason: 'Ticket opening message' })
			.then(() => {
				const recent = channel.messages.cache.last(3);
				for (const message of recent) {
					if (message.system) {
						message
							.delete({ reason: 'Cleaning up system message' })
							.catch(() => this.client.log.warn('Failed to delete system pin message'));
					}
				}
			})
			.catch(this.client.log.error);

		/** @type {import("discord.js").Message|undefined} */
		let message;
		if (referencesMessageId) {
			/** @type {import("discord.js").Message} */
			message = await interaction.channel.messages.fetch(referencesMessageId);
			if (message) {
				// not worth the effort of making system messages work atm
				if (message.system || !message.content) {
					referencesMessageId = null;
					message = null;
				} else {
					if (!message.member) {
						try {
							message.member = await message.guild.members.fetch(message.author.id);
						} catch {
							this.client.log.verbose('Failed to fetch member %s of %s', message.author.id, message.guild.id);
						}
					}
					channel.send({
						embeds: [
							new ExtendedEmbedBuilder()
								.setColor(category.guild.primaryColour)
								.setTitle(getMessage('ticket.references_message.title'))
								.setDescription(
									getMessage('ticket.references_message.description', {
										author: message.author.toString(),
										timestamp: `<t:${Math.ceil(message.createdTimestamp / 1000)}:R>`,
										url: message.url,
									})),
							new ExtendedEmbedBuilder({
								iconURL: guild.iconURL(),
								text: category.guild.footer,
							})
								.setColor(category.guild.primaryColour)
								.setAuthor({
									iconURL: message.member?.displayAvatarURL(),
									name: message.member?.displayName || 'Unknown',
								})
								.setDescription(message.content.substring(0, 1000) + (message.content.length > 1000 ? '...' : '')),
						],
					}).catch(this.client.log.error);
				}

			}
		} else if (referencesTicketId) {
			// TODO: add portal url
			const ticket = await this.client.prisma.ticket.findUnique({ where: { id: referencesTicketId } });
			if (ticket) {
				const embed = new ExtendedEmbedBuilder({
					iconURL: guild.iconURL(),
					text: category.guild.footer,
				})
					.setColor(category.guild.primaryColour)
					.setTitle(getMessage('ticket.references_ticket.title'))
					.setDescription(getMessage('ticket.references_ticket.description'))
					.setFields([
						{
							inline: true,
							name: getMessage('ticket.references_ticket.fields.number'),
							value: inlineCode(ticket.number),
						},
						{
							inline: true,
							name: getMessage('ticket.references_ticket.fields.date'),
							value: `<t:${Math.ceil(ticket.createdAt / 1000)}:f>`,
						},
					]);
				if (ticket.topic) {
					embed.addFields({
						inline: false,
						name: getMessage('ticket.references_ticket.fields.topic'),
						value: await crypto.queue(w => w.decrypt(ticket.topic)),
					});
				}
				channel.send({
					components: category.guild.archive
						? [
							new ActionRowBuilder()
								.addComponents(
									new ButtonBuilder()
										.setCustomId(JSON.stringify({
											action: 'transcript',
											ticket: referencesTicketId,
										}))
										.setStyle(ButtonStyle.Primary)
										.setEmoji(getMessage('buttons.transcript.emoji'))
										.setLabel(getMessage('buttons.transcript.text')),

								),
						]
						: [],
					embeds: [embed],
				}).catch(this.client.log.error);
			}
		}

		const data = {
			category: { connect: { id: categoryId } },
			createdBy: {
				connectOrCreate: {
					create: { id: interaction.user.id },
					where: { id: interaction.user.id },
				},
			},
			guild: { connect: { id: category.guild.id } },
			id: channel.id,
			number,
			openingMessageId: sent.id,
			topic: topic ? await crypto.queue(w => w.encrypt(topic)) : null,
		};
		if (referencesTicketId) data.referencesTicket = { connect: { id: referencesTicketId } };
		if (submitted) {
			data.questionAnswers = {
				createMany: {
					data: await Promise.all(submitted.map(async a => ({
						questionId: a.question.id,
						userId: interaction.user.id,
						value: a.value ? await crypto.queue(w => w.encrypt(a.value)) : '',
					}))),
				},
			};
		}

		await interaction.editReply({
			components: [],
			embeds: [
				new ExtendedEmbedBuilder({
					iconURL: guild.iconURL(),
					text: category.guild.footer,
				})
					.setColor(category.guild.successColour)
					.setTitle(getMessage('ticket.created.title'))
					.setDescription(getMessage('ticket.created.description', { channel: channel.toString() })),
			],
		});

		try {
			const ticket = await this.client.prisma.ticket.create({ data });
			this.$count.categories[categoryId].total++;
			this.$count.categories[categoryId][creator.id]++;

			// Start the durable per-ticket inactivity workflow (unless public bot).
			if (process.env.PUBLIC_BOT !== 'true') {
				temporal.ensureStaleWorkflow({
					guildId: ticket.guildId,
					lastActivityAt: ticket.createdAt.getTime(),
					ticketId: ticket.id,
				}).catch(error => this.client.log.error(error));
			}

			if (category.cooldown) {
				const cacheKey = `cooldowns/category-member:${category.id}-${ticket.createdById}`;
				const expiresAt = ticket.createdAt.getTime() + category.cooldown;
				const TTL = category.cooldown;
				await this.client.keyv.set(cacheKey, expiresAt, TTL);
			}

			if (category.guild.archive && message) {
				if (
					await this.client.prisma.archivedMessage.findUnique({ where: { id: message.id } }) ||
					await this.archiver.saveMessage(ticket.id, message, true)
				) {
					await this.client.prisma.ticket.update({
						data: { referencesMessageId: message.id },
						where: { id: ticket.id },
					});
				}
			}

			logTicketEvent(this.client, {
				action: 'create',
				target: {
					id: ticket.id,
					name: channel.toString(),
				},
				userId: interaction.user.id,
			});

			emit(this.client, 'trigger.ticket.created', {
				categoryId: ticket.categoryId,
				guildId: ticket.guildId,
				ticketId: ticket.id,
				userId: ticket.createdById,
				vars: { name: creator?.user?.username },
			});
		} catch (error) {
			const ref = getSUID();
			this.client.log.warn.tickets('An error occurred whilst creating ticket', channel.id);
			this.client.log.error.tickets(ref);
			this.client.log.error.tickets(error);

			// The channel/thread exists in Discord by this point, with its
			// overwrites and pinned opening message — but there is no ticket row
			// behind it, so nothing can ever close it and the member is looking at
			// a channel the bot does not know about. Take it back down.
			await channel.delete('Ticket creation failed').catch(() => null);

			// `$numbers` is an in-memory counter, so the number this attempt took
			// is otherwise burned. On a unique-constraint collision it is the
			// counter itself that is wrong (another process, or a restart mid
			// create), so drop it and let the next call re-read the database.
			if (error?.code === 'P2002') delete this.$numbers[category.guild.id];
			else if (this.$numbers[category.guild.id] === number) this.$numbers[category.guild.id] -= 1;

			await interaction.editReply({
				components: [],
				embeds: [
					new ExtendedEmbedBuilder()
						.setColor('Orange')
						.setTitle(getMessage('misc.error.title'))
						.setDescription(getMessage('misc.error.description'))
						.addFields({
							name: getMessage('misc.error.fields.identifier'),
							value: inlineCode(ref),
						}),
				],
			});
			return;
		}

		try {
			const {
				nextOpenAt, when, working,
			} = getWorkingHours(category.guild.workingHours);

			if (!working && nextOpenAt) {
				channel.send({
					embeds: [
						new ExtendedEmbedBuilder()
							.setColor(category.guild.primaryColour)
							.setTitle(getMessage(`ticket.working_hours.${when}.title`))
							.setDescription(getMessage(`ticket.working_hours.${when}.description`, { timestamp: nextOpenAt })),
					],
				}).catch(this.client.log.error);
			}

			if (working && process.env.PUBLIC_BOT !== 'true') {
				let online = 0;
				for (const [, member] of channel.members) {
					if (member.user.bot) continue;
					if (!await isStaff(channel.guild, member.id)) continue;
					if (member.presence && member.presence !== 'offline') online++;
				}
				if (online === 0) {
					channel.send({
						embeds: [
							new ExtendedEmbedBuilder()
								.setColor(category.guild.primaryColour)
								.setTitle(getMessage('ticket.offline.title'))
								.setDescription(getMessage('ticket.offline.description')),
						],
					}).catch(this.client.log.error);
					this.client.keyv.set(`offline/${channel.id}`, Date.now(), ms('1h'));
				}
			}
		} catch (error) {
			this.client.log.error(error);
		}
	}

	/**
	 * Auto-claim a ticket when the first staff member responds (no interaction required).
	 * @param {import("discord.js").TextChannel|import("discord.js").ThreadChannel} channel
	 * @param {string} userId - the staff member's Discord user ID
	 */
	async autoClaim(channel, userId) {
		const ticket = await this.client.prisma.ticket.findUnique({
			include: { guild: true },
			where: { id: channel.id },
		});
		if (!ticket || ticket.claimedById) return; // already claimed or not a ticket

		await this.client.prisma.ticket.update({
			data: {
				claimedBy: {
					connectOrCreate: {
						create: { id: userId },
						where: { id: userId },
					},
				},
			},
			where: { id: channel.id },
		});

		// Add checkmark to channel name
		const currentName = channel.name;
		if (!currentName.startsWith('✅')) {
			await channel.setName('✅' + currentName, 'Auto-assigned to first staff responder').catch(() => null);
		}

		// For private threads: ensure the assigned user is a member
		if (channel.isThread?.()) {
			await channel.members.add(userId).catch(() => null);
		}

		logTicketEvent(this.client, {
			action: 'claim',
			target: {
				id: ticket.id,
				name: channel.toString(),
			},
			userId,
		});

		emit(this.client, 'trigger.ticket.claimed', {
			categoryId: ticket.categoryId,
			guildId: ticket.guildId,
			ticketId: ticket.id,
			userId: ticket.claimedById,
		});
	}

	/**
	 * @param {import("discord.js").ChatInputCommandInteraction|import("discord.js").ButtonInteraction} interaction
	 */
	async claim(interaction) {
		const ticket = await this.client.prisma.ticket.findUnique({
			include: {
				_count: { select: { questionAnswers: true } },
				category: true,
				guild: true,
			},
			where: { id: interaction.channel.id },
		});
		const getMessage = this.client.i18n.getLocale(ticket.guild.locale);

		if (!(await isStaff(interaction.guild, interaction.user.id))) { // if user is not staff
			return await interaction.reply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: ticket.guild.footer,
					})
						.setColor(ticket.guild.errorColour)
						.setTitle(getMessage('commands.slash.claim.not_staff.title'))
						.setDescription(getMessage('commands.slash.claim.not_staff.description')),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		await interaction.deferReply();

		const channelIsThread = interaction.channel.isThread?.();
		const claimReason = `Ticket claimed by ${interaction.user.username}`;

		// For threads: ensure claimer is added as a thread member
		if (channelIsThread) {
			await interaction.channel.members.add(interaction.user.id).catch(() => null);
		}

		// Add ✅ prefix to signal the ticket is claimed — all staff can still see it
		const currentName = interaction.channel.name;
		if (!currentName.startsWith('✅')) {
			await interaction.channel.setName('✅' + currentName, claimReason).catch(() => null);
		}

		await this.client.prisma.ticket.update({
			data: {
				claimedBy: {
					connectOrCreate: {
						create: { id: interaction.user.id },
						where: { id: interaction.user.id },
					},
				},
			},
			where: { id: interaction.channel.id },
		});

		// Re-render the whole message rather than replacing its components with a
		// bare action row: the old code dropped the "Close with Reason" button and,
		// under Components v2, would have wiped the message body outright.
		await rerenderOpeningMessage(this.client, interaction.channel, { claimed: true })
			.catch(error => this.client.log.warn('Failed to update opening message after claim: %s', error.message));

		await interaction.editReply({
			embeds: [
				new ExtendedEmbedBuilder()
					.setColor(ticket.guild.primaryColour)
					.setDescription(getMessage('ticket.claimed', { user: interaction.user.toString() })),
			],
		});

		logTicketEvent(this.client, {
			action: 'claim',
			target: {
				id: ticket.id,
				name: interaction.channel.toString(),
			},
			userId: interaction.user.id,
		});

		emit(this.client, 'trigger.ticket.claimed', {
			categoryId: ticket.categoryId,
			guildId: ticket.guildId,
			ticketId: ticket.id,
			userId: ticket.claimedById,
		});
	}

	/**
	 * @param {import("discord.js").ChatInputCommandInteraction|import("discord.js").ButtonInteraction} interaction
	 */
	async release(interaction) {
		const ticket = await this.client.prisma.ticket.findUnique({
			include: {
				_count: { select: { questionAnswers: true } },
				category: true,
				guild: true,
			},
			where: { id: interaction.channel.id },
		});
		const getMessage = this.client.i18n.getLocale(ticket.guild.locale);

		if (!(await isStaff(interaction.guild, interaction.user.id))) { // if user is not staff
			return await interaction.reply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: ticket.guild.footer,
					})
						.setColor(ticket.guild.errorColour)
						.setTitle(getMessage('commands.slash.claim.not_staff.title'))
						.setDescription(getMessage('commands.slash.claim.not_staff.description')),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		await interaction.deferReply();

		const channelIsThread = interaction.channel.isThread?.();
		const releaseReason = `Ticket released by ${interaction.user.username}`;

		// For threads: remove claimer from thread members
		if (channelIsThread) {
			await interaction.channel.members.remove(interaction.user.id).catch(() => null);
		}

		// Strip ✅ prefix from channel name (added when ticket was claimed)
		const currentName = interaction.channel.name;
		if (currentName.startsWith('✅')) {
			await interaction.channel.setName(currentName.slice(1), releaseReason).catch(() => null);
		}

		await this.client.prisma.ticket.update({
			data: { claimedBy: { disconnect: true } },
			where: { id: interaction.channel.id },
		});

		// See the equivalent call in claim(): re-render the whole message, not
		// just the button row.
		await rerenderOpeningMessage(this.client, interaction.channel, { claimed: false })
			.catch(error => this.client.log.warn('Failed to update opening message after release: %s', error.message));

		await interaction.editReply({
			embeds: [
				new ExtendedEmbedBuilder()
					.setColor(ticket.guild.primaryColour)
					.setDescription(getMessage('ticket.released', { user: interaction.user.toString() })),
			],
		});

		logTicketEvent(this.client, {
			action: 'unclaim',
			target: {
				id: ticket.id,
				name: interaction.channel.toString(),
			},
			userId: interaction.user.id,
		});

		emit(this.client, 'trigger.ticket.released', {
			categoryId: ticket.categoryId,
			guildId: ticket.guildId,
			ticketId: ticket.id,
			userId: interaction.user.id,
		});
	}

	buildFeedbackModal(locale, id) {
		const getMessage = this.client.i18n.getLocale(locale);
		return new ModalBuilder()
			.setCustomId(JSON.stringify({
				action: 'feedback',
				...id,
			}))
			.setTitle(getMessage('modals.feedback.title'))
			.setComponents(
				new ActionRowBuilder()
					.setComponents(
						new TextInputBuilder()
							.setCustomId('rating')
							.setLabel(getMessage('modals.feedback.rating.label'))
							.setStyle(TextInputStyle.Short)
							.setMaxLength(3)
							.setMinLength(1)
							.setPlaceholder(getMessage('modals.feedback.rating.placeholder'))
							.setRequired(true),
					),
				new ActionRowBuilder()
					.setComponents(
						new TextInputBuilder()
							.setCustomId('comment')
							.setLabel(getMessage('modals.feedback.comment.label'))
							.setStyle(TextInputStyle.Paragraph)
							.setMaxLength(1000)
							.setMinLength(4)
							.setPlaceholder(getMessage('modals.feedback.comment.placeholder'))
							.setRequired(false),
					),
			);
	}


	/**
	 * @param {import("discord.js").ChatInputCommandInteraction
	 * | import("discord.js").ButtonInteraction
	 * | import("discord.js").ModalSubmitInteraction} interaction
	 * @param {?string} [reasonOverride] Reason supplied out-of-band, e.g. by the
	 * "Close with Reason" modal, where `interaction.options` doesn't exist.
	 */
	async beforeRequestClose(interaction, reasonOverride = null) {
		const ticket = await this.getTicket(interaction.channel.id);
		if (!ticket) {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });
			const {
				errorColour,
				footer,
				locale,
			} = await this.client.prisma.guild.findUnique({
				select: {
					errorColour: true,
					locale: true,
				},
				where: { id: interaction.guild.id },
			});
			const getMessage = this.client.i18n.getLocale(locale);
			return await interaction.editReply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: footer,
					})
						.setColor(errorColour)
						.setTitle(getMessage('misc.not_ticket.title'))
						.setDescription(getMessage('misc.not_ticket.description')),
				],
			});
		}

		const getMessage = this.client.i18n.getLocale(ticket.guild.locale);
		const staff = await isStaff(interaction.guild, interaction.user.id);
		const reason = reasonOverride || interaction.options?.getString('reason', false) || null; // ?. because it could be a button interaction

		if (ticket.createdById !== interaction.user.id && !staff) {
			return await interaction.editReply({
				embeds: [
					new ExtendedEmbedBuilder()
						.setColor(ticket.guild.errorColour)
						.setTitle(getMessage('ticket.close.forbidden.title'))
						.setDescription(getMessage('ticket.close.forbidden.description')),
				],
			});
		}

		// `interaction.showModal` is absent on ModalSubmitInteraction — Discord
		// does not allow opening a modal in response to a modal submit. Callers
		// arriving from a modal (the "Close with Reason" flow) show the feedback
		// modal themselves beforehand where appropriate, so skip it here rather
		// than throwing a TypeError.
		if (
			ticket.createdById === interaction.user.id &&
			ticket.category.enableFeedback &&
			!ticket.feedback &&
			typeof interaction.showModal === 'function'
		) {
			return await interaction.showModal(this.buildFeedbackModal(ticket.guild.locale, {
				next: 'requestClose',
				reason, // known issue: a reason longer than a few words will cause an error due to 100 character custom_id limit
			}));
		}

		// not showing feedback, so send the close request

		// defer asap
		await interaction.deferReply();

		// if the creator isn't in the guild , close the ticket immediately
		// (although leaving should cause the ticket to be closed anyway)
		try {
			await interaction.guild.members.fetch(ticket.createdById);
		} catch {
			return this.finallyClose(ticket.id, { reason });
		}

		this.requestClose(interaction, reason);
	}

	/**
	 * @param {import("discord.js").ChatInputCommandInteraction
	 * | import("discord.js").ButtonInteraction
	 * | import("discord.js").ModalSubmitInteraction} interaction
	 * @param {string} reason
	 */
	async requestClose(interaction, reason) {
		// interaction could be command, button. or modal
		const ticket = await this.getTicket(interaction.channel.id);
		const getMessage = this.client.i18n.getLocale(ticket.guild.locale);
		const staff = interaction.user.id !== ticket.createdById && await isStaff(interaction.guild, interaction.user.id);
		const closeButtonId = {
			action: 'close',
			expect: staff ? 'user' : 'staff',
		};
		const embed = new ExtendedEmbedBuilder(/* {
			iconURL: interaction.guild.iconURL(),
			text: ticket.guild.footer,
		} */)
			.setColor(ticket.guild.primaryColour)
			.setTitle(getMessage(`ticket.close.${staff ? 'staff' : 'user'}_request.title`, { requestedBy: interaction.member.displayName }));

		if (staff) {
			embed.setDescription(
				getMessage('ticket.close.staff_request.description', { requestedBy: interaction.user.toString() }) +
				(ticket.guild.archive ? getMessage('ticket.close.staff_request.archived') : ''),
			);
		}

		await interaction.editReply({
			components: [
				new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId(JSON.stringify({
								accepted: true,
								...closeButtonId,
							}))
							.setStyle(ButtonStyle.Success)
							.setEmoji(getMessage('buttons.accept_close_request.emoji'))
							.setLabel(getMessage('buttons.accept_close_request.text')),
						new ButtonBuilder()
							.setCustomId(JSON.stringify({
								accepted: false,
								...closeButtonId,
							}))
							.setStyle(ButtonStyle.Danger)
							.setEmoji(getMessage('buttons.reject_close_request.emoji'))
							.setLabel(getMessage('buttons.reject_close_request.text')),
					),
			],
			content: staff ? `<@${ticket.createdById}>` : '', // ticket.category.pingRoles.map(r => `<@&${r}>`).join(' ')
			embeds: [embed],
		});

		this.$closeRequests.set(ticket.id, {
			closedBy: interaction.user.id,
			reason,
		});

		// Durable auto-close if the request is ignored (survives restarts).
		// guildId and reopenWindow are passed so an ignored request gets the same
		// grace window (and search attributes) as an accepted one.
		if (ticket.guild.autoClose) {
			temporal.startCloseRequestTimeout(ticket.id, ticket.guild.autoClose, {
				closedBy: interaction.user.id,
				guildId: ticket.guildId,
				reason,
				reopenWindowMs: Number(ticket.guild.reopenWindow ?? 0),
			}).catch(error => this.client.log.error(error));
		}

		if (ticket.priority && ticket.priority !== 'LOW') {
			await this.client.prisma.ticket.update({
				data: { priority: 'LOW' },
				where: { id: ticket.id },
			});
		}

		emit(this.client, 'trigger.ticket.closeRequested', {
			categoryId: ticket.categoryId,
			guildId: ticket.guildId,
			ticketId: ticket.id,
			userId: interaction.user.id,
		});
	}

	/**
	 * @param {import("discord.js").ChatInputCommandInteraction
	 * | import("discord.js").ButtonInteraction
	 * | import("discord.js").ModalSubmitInteraction} interaction
	 */
	async acceptClose(interaction) {
		const ticket = await this.getTicket(interaction.channel.id);
		const getMessage = this.client.i18n.getLocale(ticket.guild.locale);
		const ticketId = interaction.channel.id;
		const pending = this.$closeRequests.get(ticketId) || {};

		// The durable close is started *before* confirming to the user. This ran
		// the other way round, and unlike every other temporal.* call site it had
		// no .catch() — so with Temporal unreachable the handler threw after the
		// user had already been shown "✅ Ticket closed", and the ticket stayed
		// open indefinitely.
		try {
			// Cancel the durable "auto-close if ignored" timeout, then close now.
			await temporal.cancelCloseRequestTimeout(ticketId);
			const reopenWindow = Number(ticket.guild.reopenWindow ?? 0);
			if (reopenWindow > 0) {
				// Grace window: soft-close now, terminal close when the window expires.
				await temporal.startReopenWindow({
					closedBy: pending.closedBy ?? interaction.user.id,
					guildId: ticket.guildId,
					reason: pending.reason ?? null,
					ticketId,
					windowMs: reopenWindow,
				});
			} else {
				await temporal.startCloseTicket({
					closedBy: pending.closedBy ?? interaction.user.id,
					reason: pending.reason ?? null,
					ticketId,
				});
			}
		} catch (error) {
			this.client.log.error('Failed to start close for ticket %s: %s', ticketId, error?.message ?? error);
			return await interaction.editReply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: ticket.guild.footer,
					})
						.setColor(ticket.guild.errorColour)
						.setTitle(getMessage('misc.error.title'))
						.setDescription(getMessage('misc.error.description')),
				],
			});
		}

		this.$closeRequests.delete(ticketId);

		await interaction.editReply({
			embeds: [
				new ExtendedEmbedBuilder({
					iconURL: interaction.guild.iconURL(),
					text: ticket.guild.footer,
				})
					.setColor(ticket.guild.successColour)
					.setTitle(getMessage('ticket.close.closed.title'))
					.setDescription(getMessage('ticket.close.closed.description')),
			],
		});
	}

	/**
	 * Send the inactivity warning for a stale ticket. Called by the durable
	 * `staleTicketWorkflow`. Returns the auto-close epoch (ms) or null.
	 * @param {string} ticketId
	 * @returns {Promise<number | null>}
	 */
	async sendStaleWarning(ticketId) {
		const ticket = await this.getTicket(ticketId);
		if (!ticket) return null;
		const guild = ticket.guild;
		const getMessage = this.client.i18n.getLocale(guild.locale);
		const closeCommand = this.client.application.commands.cache.find(c => c.name === 'close');
		const channel = this.client.channels.cache.get(ticketId) || await this.client.channels.fetch(ticketId).catch(() => null);
		if (!channel) {
			await this.finallyClose(ticketId, { reason: 'channel deleted' });
			return null;
		}

		const messages = (await channel.messages.fetch({ limit: 5 })).filter(m => m.author.id !== this.client.user.id);
		let ping = '';
		if (messages.size > 0) {
			const lastMessage = messages.first();
			const staff = await isStaff(channel.guild, lastMessage.author.id);
			if (staff) ping = `<@${ticket.createdById}>`;
			else ping = (ticket.category?.pingRoles || []).map(r => `<@&${r}>`).join(' ');
		}

		await channel.send({
			components: [
				new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId(JSON.stringify({ action: 'close' }))
							.setStyle(ButtonStyle.Danger)
							.setEmoji(getMessage('buttons.close.emoji'))
							.setLabel(getMessage('buttons.close.text')),
					),
			],
			content: ping,
			embeds: [
				new ExtendedEmbedBuilder({
					iconURL: channel.guild.iconURL(),
					text: guild.footer,
				})
					.setColor(guild.primaryColour)
					.setTitle(getMessage('ticket.inactive.title'))
					.setDescription(getMessage('ticket.inactive.description', {
						close: closeCommand ? `</${closeCommand.name}:${closeCommand.id}>` : '`/close`',
						timestamp: Math.floor((ticket.lastMessageAt || ticket.createdAt).getTime() / 1000),
					})),
			],
		});

		emit(this.client, 'trigger.ticket.stale', {
			categoryId: ticket.categoryId,
			guildId: ticket.guildId,
			ticketId,
			userId: ticket.createdById,
		});

		return guild.autoClose ? Date.now() + guild.autoClose : null;
	}

	/**
	 * Send the "closing soon" reminder. Called by the `staleTicketWorkflow`.
	 * @param {string} ticketId
	 * @param {number} closeAtEpoch epoch ms at which the ticket will auto-close
	 */
	async sendClosingSoon(ticketId, closeAtEpoch) {
		const ticket = await this.getTicket(ticketId);
		if (!ticket) return;
		const guild = ticket.guild;
		const getMessage = this.client.i18n.getLocale(guild.locale);
		const channel = this.client.channels.cache.get(ticketId) || await this.client.channels.fetch(ticketId).catch(() => null);
		if (!channel) return;
		await channel.send({
			embeds: [
				new ExtendedEmbedBuilder()
					.setColor(guild.primaryColour)
					.setTitle(getMessage('ticket.closing_soon.title'))
					.setDescription(getMessage('ticket.closing_soon.description', { timestamp: Math.floor(closeAtEpoch / 1000) })),
			],
		});
	}

	/**
	 * Soft-close a ticket at the start of its reopen grace window: mark it
	 * pending-close, silence the stale/close automations, lock the channel
	 * (never delete here) and post the reopen prompt. Called by the durable
	 * `reopenWindowWorkflow`.
	 * @param {string} ticketId
	 * @param {number} closeAtEpoch epoch ms at which the ticket will be terminally closed
	 */
	async softClose(ticketId, closeAtEpoch) {
		const ticket = await this.getTicket(ticketId);
		if (!ticket) return;
		const getMessage = this.client.i18n.getLocale(ticket.guild.locale);

		await this.client.prisma.ticket.update({
			data: { pendingCloseAt: new Date() },
			where: { id: ticketId },
		});
		this.$closeRequests.delete(ticketId);
		// The grace window owns the close now: stop the stale workflow and any
		// pending close-request timeout.
		temporal.cancelStaleWorkflow(ticketId).catch(() => {});
		temporal.cancelCloseRequestTimeout(ticketId).catch(() => {});

		const channel = this.client.channels.cache.get(ticketId) || await this.client.channels.fetch(ticketId).catch(() => null);
		if (!channel) return;

		// Send the prompt before locking (mirrors finallyClose's thread ordering)
		// so it is delivered even if the lock fails.
		await channel.send({
			components: [
				new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId(JSON.stringify({ action: 'reopen' }))
							.setStyle(ButtonStyle.Primary)
							.setEmoji(getMessage('buttons.reopen.emoji'))
							.setLabel(getMessage('buttons.reopen.text')),
					),
			],
			embeds: [
				new ExtendedEmbedBuilder({
					iconURL: channel.guild.iconURL(),
					text: ticket.guild.footer,
				})
					.setColor(ticket.guild.primaryColour)
					.setTitle(getMessage('ticket.reopen.closed.title'))
					.setDescription(getMessage('ticket.reopen.closed.description', { timestamp: Math.floor(closeAtEpoch / 1000) })),
			],
		}).catch(err => this.client.log.warn('Failed to send the reopen prompt in %s: %s', ticketId, err.message));

		// Lock without deleting/archiving so the ticket can be restored. Locked
		// (but unarchived) threads keep buttons clickable for everyone.
		try {
			if (channel.isThread?.()) {
				await channel.setLocked(true, 'Ticket pending close (reopen window)');
			} else {
				await channel.permissionOverwrites.edit(
					ticket.createdById,
					{ SendMessages: false },
					{ reason: 'Ticket pending close (reopen window)' },
				);
			}
		} catch (err) {
			this.client.log.warn('Failed to lock %s for the reopen window: %s', ticketId, err.message);
		}
	}

	/**
	 * Restore a soft-closed ticket within its reopen grace window: clear the
	 * pending-close marker, unlock the channel, and re-arm the stale workflow.
	 * Called by the durable `reopenWindowWorkflow` after the `reopen` signal.
	 * @param {string} ticketId
	 */
	async reopen(ticketId) {
		const ticket = await this.getTicket(ticketId);
		if (!ticket) return;

		// Reopening counts as activity, so the fresh stale timer starts from now.
		await this.client.prisma.ticket.update({
			data: {
				lastMessageAt: new Date(),
				pendingCloseAt: null,
			},
			where: { id: ticketId },
		});

		const channel = this.client.channels.cache.get(ticketId) || await this.client.channels.fetch(ticketId).catch(() => null);
		if (channel) {
			try {
				if (channel.isThread?.()) {
					if (channel.archived) await channel.setArchived(false, 'Ticket reopened');
					await channel.setLocked(false, 'Ticket reopened');
				} else {
					await channel.permissionOverwrites.edit(
						ticket.createdById,
						{ SendMessages: true },
						{ reason: 'Ticket reopened' },
					);
				}
			} catch (err) {
				this.client.log.warn('Failed to unlock %s after reopen: %s', ticketId, err.message);
			}
		}

		temporal.ensureStaleWorkflow({
			guildId: ticket.guildId,
			lastActivityAt: Date.now(),
			ticketId,
		}).catch(error => this.client.log.error(error));

		emit(this.client, 'trigger.ticket.reopened', {
			categoryId: ticket.categoryId,
			guildId: ticket.guildId,
			ticketId,
			userId: ticket.createdById,
		});
	}

	/**
	 * Export a guild's data to a ZIP on disk. Runs inside the durable
	 * `exportGuildWorkflow` activity; safe to retry (the output file is
	 * truncated and rewritten). Heartbeats once per ticket batch.
	 * @param {string} guildId
	 * @param {string} outputPath absolute path the ZIP is written to
	 * @param {() => void} [heartbeat]
	 * @returns {Promise<string>} outputPath
	 */
	async exportGuildToFile(guildId, outputPath, heartbeat = () => { }) {
		const client = this.client;
		const guild = client.guilds.cache.get(guildId);
		if (!guild) throw new Error(`Guild ${guildId} is not cached; cannot export`);

		const settings = await client.prisma.guild.findUnique({
			include: {
				categories: { include: { questions: true } },
				tags: true,
			},
			where: { id: guildId },
		});
		if (!settings) throw new Error(`Guild ${guildId} does not exist in the database`);

		delete settings.id;
		settings.categories = settings.categories.map(c => {
			delete c.guildId;
			return c;
		});
		settings.tags = settings.tags.map(t => {
			delete t.guildId;
			return t;
		});

		// TODO: sign so the importer can ensure files haven't been added (important for attachments)
		const archive = archiver('zip', {
			comment: JSON.stringify({
				exportedAt: new Date().toISOString(),
				exportedFromClientId: client.user.id,
				originalGuildId: guildId,
				originalGuildName: guild.name,
				version: pkg.version,
			}),
		});

		const output = createWriteStream(outputPath);
		const written = new Promise((resolve, reject) => {
			output.on('close', resolve);
			output.on('error', reject);
			archive.on('error', reject);
		});
		archive.on('warning', err => {
			if (err.code === 'ENOENT') client.log.warn(err);
			else archive.emit('error', err);
		});
		archive.pipe(output);

		async function* ticketsGenerator() {
			let done = false;
			const take = 50;
			const findOptions = {
				include: {
					archivedChannels: true,
					archivedMessages: true,
					archivedRoles: true,
					archivedUsers: true,
					feedback: true,
					questionAnswers: true,
				},
				orderBy: { id: 'asc' },
				take,
				where: { guildId },
			};
			do {
				const batch = await client.prisma.ticket.findMany(findOptions);
				heartbeat();
				if (batch.length < take) {
					done = true;
				} else {
					findOptions.skip = 1;
					findOptions.cursor = { id: batch[take - 1].id };
				}
				// ! map (parallel) not for...of (serial)
				yield* batch.map(async ticket => await pools.export.queue(w => w.exportTicket(ticket)) + '\n');
			} while (!done);
		}
		const ticketsStream = Readable.from(ticketsGenerator());

		const icon = await fetch(iconURL(guild));
		archive.append(Readable.from(icon.body), { name: 'icon.png' });
		archive.append(JSON.stringify(settings), { name: 'settings.json' });
		archive.append(ticketsStream, { name: 'tickets.jsonl' });
		await archive.finalize();
		await written;
		return outputPath;
	}

	/**
	 * Import a guild's data from a ZIP on disk. Runs inside the durable
	 * `importGuildWorkflow` activity. Destructive: replaces the guild's
	 * settings/categories and adds the archived tickets.
	 * @param {string} guildId
	 * @param {string} archivePath absolute path of the uploaded archive
	 * @param {() => void} [heartbeat]
	 */
	async importGuildFromArchive(guildId, archivePath, heartbeat = () => { }) {
		const client = this.client;
		client.keyv.delete(`cache/stats/guild:${guildId}`);

		// comment needs to be less than 512B
		const zip = await unzipper.Open.file(archivePath, { tailSize: 512 });
		const { files } = zip;
		try {
			const comment = JSON.parse(zip.comment);
			client.log.info(`Importing guild ${guildId} from export v${comment.version} of "${comment.originalGuildName}"`);
		} catch {
			client.log.warn('Import archive comment is not parsable');
		}

		const settingsFile = files.find(f => f.path === 'settings.json');
		if (!settingsFile) throw new Error('Archive does not contain settings.json');
		// `settingsJSON` is frozen, `settings` can be mutated
		const settingsJSON = JSON.parse(await settingsFile.buffer());
		Object.freeze(settingsJSON);
		const settings = structuredClone(settingsJSON);
		const { categories } = settings;
		heartbeat();

		// Nothing from the archive is spread into a Prisma create. Prisma's
		// create inputs accept nested relation operations, so
		// `{ ...settings }` let an archive carry
		// `tickets: { connect: [{ guildId_number: { guildId: "<other guild>", number: 1 } }] }`
		// and reassign another guild's tickets — with their encrypted topics,
		// answers and message history — to the importing guild. Every payload is
		// rebuilt from an explicit column list instead, and an unrecognised key
		// aborts the import rather than being dropped silently.
		const guildData = pick(settings, GUILD_FIELDS, 'guild setting', ['categories', 'createdAt', 'id', 'tags']);
		const tagData = (settings.tags ?? []).map(tag => pick(tag, TAG_FIELDS, 'tag', ['createdAt', 'guildId', 'id']));

		await client.prisma.$transaction([
			client.prisma.guild.delete({
				select: { id: true },
				where: { id: guildId },
			}),
			client.prisma.guild.create({
				data: {
					...guildData,
					id: guildId,
					tags: { createMany: { data: tagData } },
				},
				// select ID so it doesn't return everything else
				select: { id: true },
			}),
		]);
		heartbeat();

		const newCategories = await client.prisma.$transaction(
			categories.map(category => {
				const questions = (category.questions ?? [])
					.map(question => pick(question, QUESTION_FIELDS, 'question', ['categoryId', 'createdAt']));
				return client.prisma.category.create({
					data: {
						...pick(category, CATEGORY_FIELDS, 'category', ['backupCategoryId', 'createdAt', 'guildId', 'id', 'questions']),
						guild: { connect: { id: guildId } },
						questions: { createMany: { data: questions } },
					},
					select: { id: true },
				});
			}),
		);
		heartbeat();

		// settingsJSON.categories because `categories` has been mutated (no id)
		const categoryMap = new Map(settingsJSON.categories.map((cat, idx) => ([cat.id, newCategories[idx].id])));

		// Backup categories are self-references, so they can only be restored
		// once every category has its new id. They used to be spread in with the
		// *exporting* instance's ids, which pointed at whatever category happened
		// to hold that id here (or at nothing at all).
		const backupLinks = settingsJSON.categories
			.map((cat, idx) => ({
				backupId: categoryMap.get(cat.backupCategoryId),
				id: newCategories[idx].id,
			}))
			.filter(link => link.backupId !== undefined);
		if (backupLinks.length) {
			await client.prisma.$transaction(backupLinks.map(link => client.prisma.category.update({
				data: { backupCategoryId: link.backupId },
				select: { id: true },
				where: { id: link.id },
			})));
			heartbeat();
		}

		const ticketsFile = files.find(f => f.path === 'tickets.jsonl');
		const ticketsPromises = [];
		if (ticketsFile) {
			const lines = createInterface({
				crlfDelay: Infinity,
				input: ticketsFile.stream(),
			});
			for await (const line of lines) {
				// do not await in the loop
				ticketsPromises.push(pools.import.queue(worker => worker.importTicket(line, guildId, categoryMap)));
				if (ticketsPromises.length % 50 === 0) heartbeat();
			}
		}

		const ticketsResolved = await Promise.all(ticketsPromises);
		heartbeat();
		const queries = [];
		const allMessages = [];

		for (const [ticket, ticketMessages] of ticketsResolved) {
			queries.push(
				client.prisma.ticket.create({
					data: ticket,
					select: { id: true },
				}),
			);
			allMessages.push(...ticketMessages);
		}

		if (allMessages.length > 0) {
			queries.push(client.prisma.archivedMessage.createMany({ data: allMessages }));
		}

		await client.prisma.$transaction(queries);
		heartbeat();
		client.log.success(`Imported ${settingsJSON.categories.length} categories and ${ticketsResolved.length} tickets into guild ${guildId}`);
	}

	/**
	 * close a ticket
	 * @param {string} ticketId
	 */
	async finallyClose(ticketId, {
		closedBy = null,
		lock = false,
		reason = null,
	}) {
		// This runs as a Temporal activity with retries, and it is not naturally
		// idempotent: a second pass would decrement the in-memory category
		// counters again (making a category falsely report itself full), send the
		// closure DM again, and post a second entry in the log channel.
		//
		// The claim on the ticket is the `open: true -> false` write further down,
		// which is a conditional update: only one caller can win it. Reading
		// `open` here first is a cheap early exit for the common case, not the
		// guard — a read followed by an unconditional write let two concurrent
		// closes (an activity retry racing /force-close) both get through.
		let ticket = await this.getTicket(ticketId);
		if (!ticket) return;

		const getMessage = this.client.i18n.getLocale(ticket.guild.locale);

		const { _count: { archivedMessages } } = await this.client.prisma.ticket.findUnique({
			select: { _count: { select: { archivedMessages: true } } },
			where: { id: ticket.id },
		});

		// `closedById` rather than a `closedBy` relation write: the claim below is
		// an `updateMany`, which does not accept nested relation operations. The
		// user row is ensured separately.
		if (closedBy) {
			await this.client.prisma.user.upsert({
				create: { id: closedBy },
				select: { id: true },
				update: {},
				where: { id: closedBy },
			});
		}

		/** @type {import("@prisma/client").Ticket} */
		const data = {
			closedAt: new Date(),
			closedById: closedBy || undefined,
			closedReason: reason && await crypto.queue(w => w.encrypt(reason)),
			messageCount: archivedMessages,
			open: false,
			pendingCloseAt: null,
		};

		// Falls back to a fetch, matching sendStaleWarning/softClose/reopen. An
		// archived thread is evicted from the channel cache, so a THREAD or FORUM
		// ticket that auto-archived before this ran was treated as deleted: its
		// pinned message ids were never recorded, the "Ticket Archived" embed was
		// skipped, and the thread link button was omitted from the DM and the log.
		/** @type {import("discord.js").TextChannel} */
		const channel = this.client.channels.cache.get(ticketId) || await this.client.channels.fetch(ticketId).catch(() => null);
		if (channel) {
			const pinned = await channel.messages.fetchPinned().catch(() => null);
			if (pinned) data.pinnedMessageIds = [...pinned.keys()];
		}

		try {
			// Claim the close. `updateMany` is the only Prisma call that takes a
			// non-unique `where`, which is what makes this a compare-and-swap: the
			// loser gets `count: 0` and stops here, instead of repeating the whole
			// closure sequence.
			const { count } = await this.client.prisma.ticket.updateMany({
				data,
				where: {
					id: ticket.id,
					open: true,
				},
			});
			if (count === 0) {
				this.client.log.info('Ticket %s is already closed; skipping duplicate close', ticketId);
				return;
			}
			ticket = await this.client.prisma.ticket.findUnique({
				include: {
					category: true,
					feedback: true,
					guild: true,
				},
				where: { id: ticket.id },
			});
			if (!ticket) return;
			this.$closeRequests.delete(ticketId);
			// Terminal close: stop the durable inactivity workflow for this ticket.
			temporal.cancelStaleWorkflow(ticketId).catch(() => {});
			// Clamped: a count that went negative is never treated as a cache miss
			// (`-1` is truthy), so it would stick forever and permanently disable
			// the category's ticket limit.
			const counts = this.$count.categories[ticket.categoryId] ??= {};
			counts.total = Math.max(0, (counts.total ?? 1) - 1);
			counts[ticket.createdById] = Math.max(0, (counts[ticket.createdById] ?? 1) - 1);
		} catch (error) {
			this.client.log.error(error);
			return;
		}

		const guild = this.client.guilds.cache.get(ticket.guildId);

		// Close/archive channel or thread depending on mode
		const channelMode = ticket.category?.channelMode || 'CHANNEL';
		if (channel) {
			const member = closedBy ? channel.guild?.members.cache.get(closedBy) : null;
			const closeReason = 'Ticket closed' + (member ? ` by ${member.displayName}` : '') + (reason ? `: ${reason}` : '');
			try {
				if (channelMode === 'THREAD' || channelMode === 'FORUM' || channel.isThread?.()) {
					// Strip managed prefixes (✅ claim + priority emoji) from thread name before archiving
					const cleanName = channel.name
						.replace(/^✅/, '')                          // remove claim checkmark (U+2705)
						.replace(/^\p{Emoji_Presentation}/u, '');    // remove leading priority emoji
					if (cleanName !== channel.name) {
						await channel.setName(cleanName, closeReason).catch(() => null);
					}

					// For threads/forum posts: keep the original opening message intact
					// and just send a new archived message below it.
					// Send the final "archived" message first — sending to an archived
					// thread would unarchive it, so this must happen while it's still active.
					// The actual archive/lock happens via the channel.edit() call below.
					try {
						await channel.send({
							embeds: [
								new ExtendedEmbedBuilder({
									iconURL: guild.iconURL(),
									text: ticket.guild.footer,
								})
									.setColor(ticket.guild.primaryColour)
									.setTitle('📦 Ticket Archived')
									.setDescription('This ticket has been closed and archived.'),
							],
						}).catch(() => null);
					} catch (err) {
						// Silently fail if we can't send the archived message
					}

					// Close (archive) the thread — and optionally lock it — as the final action
					await channel.edit({
						archived: true,
						locked: lock,
						reason: closeReason,
					}).catch(err => this.client.log.warn('Failed to close thread %s: %s', ticket.id, err.message));
				} else if (channel.deletable) {
					await channel.delete(closeReason);
				}
			} catch (err) {
				this.client.log.warn('Failed to close channel/thread %s: %s', ticket.id, err.message);
			}
		}

		// Components used in DM (file-based transcript button) and log (HTML link button)
		const dmComponents = [];
		const logComponents = [];

		// For threads/forum, add button to access the archived thread
		if ((channelMode === 'THREAD' || channelMode === 'FORUM') && channel) {
			const threadButton = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setURL(channel.url)
						.setEmoji('🔗')
						.setLabel('View Archived Thread'),
				);
			dmComponents.push(threadButton);
			logComponents.push(threadButton);
		}

		if (ticket.guild.archive) {
			// Await transcript so we can include the URL in the log button
			const transcriptPath = await saveHtmlTranscript(this.client, ticket.id)
				.catch(err => {
					this.client.log.warn('HTML transcript failed for %s: %s', ticket.id, err.message);
					return null;
				});

			// DM: existing file-based "Show Transcript" button
			dmComponents.push(
				new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setCustomId(JSON.stringify({
								action: 'transcript',
								ticket: ticket.id,
							}))
							.setStyle(ButtonStyle.Primary)
							.setEmoji(getMessage('buttons.transcript.emoji'))
							.setLabel(getMessage('buttons.transcript.text')),
					),
			);

			// Log: HTML link button (only when transcript was successfully saved)
			if (transcriptPath && process.env.HTTP_EXTERNAL) {
				const transcriptUrl = `${process.env.HTTP_EXTERNAL}/api/admin/guilds/${ticket.guildId}/tickets/${ticket.id}/transcript`;
				logComponents.push(
					new ActionRowBuilder()
						.addComponents(
							new ButtonBuilder()
								.setStyle(ButtonStyle.Link)
								.setURL(transcriptUrl)
								.setEmoji('📄')
								.setLabel(getMessage('buttons.transcript.text')),
						),
				);
			}
		}

		const fields = {
			closed: {
				inline: true,
				name: getMessage('dm.closed.fields.closed.name'),
				value: getMessage('dm.closed.fields.closed.value', {
					duration: ms(ticket.closedAt - ticket.createdAt, { long: true }),
					timestamp: `<t:${Math.floor(ticket.closedAt / 1000)}:f>`,
				}),
			},
			closedById: ticket.closedById && {
				inline: true,
				name: getMessage('dm.closed.fields.closed_by'),
				value: `<@${ticket.closedById}>`,
			},
			created: {
				inline: true,
				name: getMessage('dm.closed.fields.created'),
				value: `<t:${Math.floor(ticket.createdAt / 1000)}:f>`,
			},
			feedback: ticket.feedback && {
				inline: true,
				name: getMessage('dm.closed.fields.feedback'),
				value: Array(ticket.feedback.rating).fill('⭐').join(' ') + ` (${ticket.feedback.rating}/5)`,
			},
			firstResponseAt: ticket.firstResponseAt && {
				inline: true,
				name: getMessage('dm.closed.fields.response'),
				value: ms(ticket.firstResponseAt - ticket.createdAt, { long: true }),
			},
			reason: reason && {
				inline: true,
				name: getMessage('dm.closed.fields.reason'),
				value: reason,
			},
			ticket: {
				inline: true,
				name: getMessage('dm.closed.fields.ticket'),
				value: `${ticket.category.name} **#${ticket.number}**`,
			},
			topic: ticket.topic && {
				inline: true,
				name: getMessage('dm.closed.fields.topic'),
				value: await crypto.queue(w => w.decrypt(ticket.topic)),
			},
		};

		const dmEmbed = new ExtendedEmbedBuilder({
			iconURL: guild.iconURL(),
			text: ticket.guild.footer,
		})
			.setColor(ticket.guild.primaryColour)
			.setTitle(getMessage('dm.closed.title'));

		dmEmbed.addFields(fields.ticket);
		if (ticket.topic) dmEmbed.addFields(fields.topic);
		dmEmbed.addFields(fields.created, fields.closed);
		if (ticket.firstResponseAt) dmEmbed.addFields(fields.firstResponseAt);
		if (ticket.feedback) dmEmbed.addFields(fields.feedback);
		if (ticket.closedById) dmEmbed.addFields(fields.closedById);
		if (reason) dmEmbed.addFields(fields.reason);

		// `ticket` was reassigned from the update() above, so `ticket.guild` is
		// straight from the database — not the 3-minute getTicket cache — and the
		// setting takes effect on the next close.
		if (!ticket.guild.disableDMs) {
			try {
				const creator = guild.members.cache.get(ticket.createdById);
				if (creator) {
					await creator.send({
						components: dmComponents,
						embeds: [dmEmbed],
					});
				}
			} catch (error) {
				this.client.log.error(error);
			}
		}

		const fieldsArray = [];
		if (ticket.topic) fieldsArray.push(fields.topic);
		fieldsArray.push(fields.created, fields.closed);
		if (ticket.firstResponseAt) fieldsArray.push(fields.firstResponseAt);
		if (fields.feedback) {
			fieldsArray.push(
				{
					...fields.feedback,
					inline: true,
					name: getMessage('modals.feedback.rating.label'),
				},
				{
					inline: true,
					name: getMessage('modals.feedback.comment.label'),
					value: (ticket.feedback.comment && await crypto.queue(w => w.decrypt(ticket.feedback.comment))) || getMessage('ticket.answers.no_value'),
				});
		}
		if (reason) fieldsArray.push(fields.reason);

		logTicketEvent(this.client, {
			action: 'close',
			payload: {
				components: logComponents,
				fields: fieldsArray,
			},
			target: {
				id: ticket.id,
				name: `${ticket.category.name} **#${ticket.number}**`,
			},
			userId: closedBy || this.client.user.id,
		});

		emit(this.client, 'trigger.ticket.closed', {
			categoryId: ticket.categoryId,
			guildId: ticket.guildId,
			ticketId: ticket.id,
			userId: closedBy ?? ticket.createdById,
		});

	}
};
