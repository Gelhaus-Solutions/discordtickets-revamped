
/* eslint-disable max-lines */
const TicketArchiver = require('./archiver');
const { saveHtmlTranscript } = require('./transcript-html');
const {
	archiveEntryFor, deleteTranscripts, formatRef, keyFor, parseRef, ticketIdFromArchiveEntry,
} = require('../storage');

/**
 * Ceiling on a single transcript restored from an import archive. Generously
 * above any real transcript, and low enough that a crafted archive cannot fill
 * the disk one entry at a time.
 */
const MAX_TRANSCRIPT_BYTES = 32 * 1024 * 1024;
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
const { resolveEmojiSettings } = require('./emoji-settings');
const {
	cooldownExpiry,
	cooldownKey,
} = require('./cooldown');
const {
	PARTICIPANT_ALLOW,
	createChannel,
} = require('./channels');
const {
	clampName,
	managedPrefix,
	renderChannelName,
} = require('./naming');
const {
	ensureStaffChannel, syncChannelName,
} = require('./mutations');
const {
	buildQuestionComponents,
	formatAnswer,
	readAnswers,
} = require('./questions');
const ms = require('ms');
const ExtendedEmbedBuilder = require('../embed');
const { logTicketEvent } = require('../logging');
const { recordTicket } = require('../metrics');
const { isStaff } = require('../users');
const {
	CATEGORY_JSON_NULLABLE,
	GUILD_JSON_NULLABLE,
	dbNulls,
	resolveCategory,
} = require('../settings/inheritance');
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

/**
 * What to tell a member whose ticket could not be created.
 *
 * Deliberately not internationalised, matching the two hardcoded English strings
 * this replaced. Every one of these is a misconfiguration only an administrator
 * can fix, so the useful half of the message is the instruction to go and get
 * one, which the member understands in whichever language they were going to ask
 * their question in anyway.
 */
const CREATION_ERRORS = {
	channel_limit: 'This ticket category is full. Please contact an administrator.',
	create_failed: 'The ticket could not be created. Please contact an administrator.',
	invalid_name: 'This ticket category has an invalid channel name. Please contact an administrator.',
	missing_permission: 'The bot is missing permissions to create the ticket. Please contact an administrator.',
	no_parent: 'The ticket category is misconfigured. Please contact an administrator.',
	rate_limited: 'Tickets are being created too quickly. Please try again in a moment.',
	wrong_parent_type: 'The ticket category is misconfigured. Please contact an administrator.',
};

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
	 * Retrieve cached category data exactly as stored, NULLs intact.
	 *
	 * Only wanted by callers that need to tell an override apart from an
	 * inherited value — the dashboard, and the exporter. Everything that just
	 * wants to know what the category *does* wants `getCategory`.
	 *
	 * @param {string} categoryId the category ID
	 * @param {boolean} force bypass & update the cache?
	 * @returns {Promise<CategoryGuildQuestions>}
	 */
	async getRawCategory(categoryId, force) {
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
	 * Retrieve cached category data with every inheritable setting resolved —
	 * built-in default, then the guild's, then the category's own.
	 *
	 * Resolution happens here rather than at each call site so that none of them
	 * can forget, and on the way *out* of the cache rather than into it, so the
	 * stored entry stays raw and a guild settings change needs no extra
	 * invalidation beyond the sweep the settings route already does.
	 *
	 * @param {string} categoryId the category ID
	 * @param {boolean} force bypass & update the cache?
	 * @returns {Promise<CategoryGuildQuestions>}
	 */
	async getCategory(categoryId, force) {
		return resolveCategory(await this.getRawCategory(categoryId, force));
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
		// The embedded category is stored raw like everywhere else, and the ticket
		// carries its guild, so it can be resolved without a second read. Callers
		// reach for `ticket.category.pingRoles` and friends expecting a value, not
		// a NULL that means "ask the guild".
		if (ticket?.category) {
			return {
				...ticket,
				category: resolveCategory(ticket.category, ticket.guild),
			};
		}
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

	/**
	 * When this member may next open a ticket in this category, or null if now.
	 *
	 * The cache holds the last creation time and `cooldownExpiry` derives the
	 * rest, so a category whose cooldown was just shortened stops turning people
	 * away immediately — see src/lib/tickets/cooldown.js for why that is worth a
	 * file of its own.
	 *
	 * A miss falls back to the database rather than to "no cooldown", so
	 * *lengthening* one takes effect too: entries are written with the cooldown
	 * of the moment as their TTL, and a longer one outlives its cache. Cheap
	 * enough to be worth the correctness — this runs once per attempt to open a
	 * ticket, behind the five-second ratelimit, and only for a category that
	 * sets a cooldown at all.
	 *
	 * @param {CategoryGuildQuestions} category resolved, so `cooldown` is the
	 * effective value rather than a NULL meaning "inherit"
	 * @param {string} memberId
	 * @returns {Promise<?number>} epoch ms, or null
	 */
	async getCooldown(category, memberId) {
		if (!category?.cooldown) return null;
		const cacheKey = cooldownKey(category.id, memberId);
		let createdAt = await this.client.keyv.get(cacheKey);
		if (!createdAt) {
			const last = await this.client.prisma.ticket.findFirst({
				orderBy: { createdAt: 'desc' },
				select: { createdAt: true },
				where: {
					categoryId: category.id,
					createdById: memberId,
				},
			});
			if (!last) return null;
			createdAt = last.createdAt.getTime();
			await this.client.keyv.set(cacheKey, createdAt, category.cooldown);
		}
		return cooldownExpiry(createdAt, category.cooldown);
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

		// The per-category deny list, alongside the guild-wide one above and for
		// the same reason: it is checked *before* the staff bypass and before
		// `requiredRoles`, so holding a blocked role loses you the category even
		// if you also hold every role it requires. That precedence is the whole
		// point — an allow list you cannot be excluded from is not a deny list.
		// `Array.isArray` rather than a truthy length check: this is a JSON column,
		// so a category imported from a hand-edited export could hold anything,
		// and a deny list that throws would take the category down for everyone.
		if (Array.isArray(category.blockedRoles) && category.blockedRoles.length !== 0) {
			const blocked = category.blockedRoles.some(r => member.roles.cache.has(r));
			if (blocked) return await sendError('blocked_roles');
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

		const cooldown = staff ? null : await this.getCooldown(category, interaction.user.id);
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
		// The template, plus whatever prefix an unclaimed ticket in this category
		// carries. Clamped, because a 100-character template plus an emoji is over
		// Discord's limit and `channels.create` rejects the whole call — the
		// member's ticket would simply fail to open.
		//
		// With nothing configured the prefix is empty and this is byte-identical
		// to the name the bot produced before any of it was configurable.
		const emojiSettings = resolveEmojiSettings({
			category,
			guild: category.guild,
		});
		const channelName = clampName(
			managedPrefix({
				// A ticket nobody has answered is waiting on staff, and the row
				// below is created saying so. This literal has to agree with it,
				// or the channel is created without the waiting emoji and the
				// first message pays a rename to add it.
				awaitingResponseFrom: 'STAFF',
				claimedById: null,
				open: true,
				priority: null,
			}, emojiSettings) +
			renderChannelName(category.channelName, {
				creator,
				number,
			}),
		);
		const channelMode = category.channelMode || 'CHANNEL';
		const createReason = `${creator.user.username} created a ticket`;
		// Everyone who should be able to see the ticket. `createChannel` turns this
		// into overwrites for a channel and into thread members for a thread, which
		// is the difference the three branches here used to spell out by hand.
		const access = {
			allow: PARTICIPANT_ALLOW,
			roleIds: category.staffRoles,
			userIds: [creator.id],
		};

		/**
		 * Tell the member their ticket could not be opened, and why.
		 *
		 * Creation used to sit outside the try that starts further down, so a
		 * missing ManageChannels threw past this reply and into the framework's
		 * dispatcher: the member was left looking at a deferred ephemeral that
		 * never resolved. `createChannel` returns its failures instead, so every
		 * one of them lands here.
		 */
		const creationFailed = reason => interaction.editReply({
			embeds: [
				new ExtendedEmbedBuilder({
					iconURL: guild.iconURL(),
					text: category.guild.footer,
				})
					.setColor(category.guild.errorColour)
					.setTitle(getMessage('misc.error.title'))
					.setDescription(CREATION_ERRORS[reason] ?? CREATION_ERRORS.create_failed),
			],
		});

		/** @type {import("discord.js").TextChannel|import("discord.js").ThreadChannel} */
		let channel;

		if (channelMode === 'FORUM') {
			// A forum post *is* its first message, so it cannot be made until the
			// opening message has been rendered further down. Checking the forum
			// exists here anyway keeps the early exit early: there is no reason to
			// gather stats and render a message for a ticket that cannot be posted.
			if (!guild.channels.cache.get(category.threadChannelId || category.discordCategory)) {
				return await creationFailed('no_parent');
			}
		} else {
			const created = await createChannel(this.client, {
				access,
				guild,
				// `memberCap` is left at Infinity, matching the loop this replaced.
				// Capping it is worth doing, but it would change who can see a
				// THREAD ticket in a guild with a very large staff role, and that
				// belongs in a commit of its own rather than inside a refactor.
				memberCap: Infinity,
				mode: channelMode,
				name: { text: channelName },
				parentId: channelMode === 'THREAD'
					? (category.threadChannelId || category.discordCategory)
					: category.discordCategory,
				// Only CHANNEL mode has ever applied the category's slow mode. The
				// helper supports it everywhere, but widening it here would be a
				// behaviour change smuggled into a refactor: THREAD-mode tickets
				// silently ignoring `category.ratelimit` is its own bug to fix.
				rateLimitPerUser: channelMode === 'CHANNEL' ? category.ratelimit : null,
				reason: createReason,
				thread: {
					autoArchiveDuration: 10080, // 7 days
					// Discord cannot nest a thread in a thread, and a category whose
					// parent is one is misconfigured. Failing says so; quietly
					// creating the ticket somewhere else would not.
					climbToParent: false,
					invitable: false,
					private: true,
				},
				topic: channelMode === 'CHANNEL' ? `${creator}${topic?.length > 0 ? ` | ${topic}` : ''}` : null,
			});
			if (!created.ok) return await creationFailed(created.reason);
			channel = created.channel;
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
			const created = await createChannel(this.client, {
				guild,
				message: openingMessageData,
				mode: 'FORUM',
				name: { text: channelName },
				parentId: category.threadChannelId || category.discordCategory,
				reason: createReason,
			});
			if (!created.ok) return await creationFailed(created.reason);
			channel = created.channel;
			sent = created.message;
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
			// Nobody has replied yet, so the ticket starts out waiting on staff.
			// The migration backfills nothing, but a ticket opened from here on
			// reads correctly in the dashboard from the moment it exists rather
			// than looking the same as one that has already been answered.
			awaitingResponseFrom: 'STAFF',
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
				// The creation time, not the expiry it implies: `getCooldown` derives
				// the expiry when the next ticket is attempted, so shortening a
				// category's cooldown takes effect at once. The TTL is the cooldown of
				// the moment, and a lengthened one outlives the entry.
				const cacheKey = cooldownKey(category.id, ticket.createdById);
				await this.client.keyv.set(cacheKey, ticket.createdAt.getTime(), category.cooldown);
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

			recordTicket('created');

			// After the row exists, because there is nothing to write
			// `staffChannelId` on before it, and in its own try because a missing
			// staff channel must never cost the member their ticket: the catch
			// below deletes the channel and reports a failure, which is far worse
			// than opening without one.
			if (category.staffChannel) {
				try {
					const staff = await ensureStaffChannel(this.client, {
						actorId: interaction.user.id,
						ticket: {
							...ticket,
							category,
						},
					});
					if (!staff.ok) {
						this.client.log.warn.tickets('No staff channel for ticket %s: %s', ticket.id, staff.reason);
					}
				} catch (error) {
					this.client.log.warn.tickets('No staff channel for ticket %s: %s', ticket.id, error.message);
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

		// The claim emoji is configurable, so the name is rebuilt rather than
		// prefixed by hand — and rebuilt *after* the write above, so the ticket
		// passed in already reads as claimed.
		await syncChannelName(this.client, {
			channel,
			reason: 'Auto-assigned to first staff responder',
			ticket: {
				...ticket,
				claimedById: userId,
			},
		});

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

		// Signal the claim in the channel name — all staff can still see it.
		await syncChannelName(this.client, {
			channel: interaction.channel,
			reason: claimReason,
			ticket: {
				...ticket,
				claimedById: interaction.user.id,
			},
		});

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

		// Drop the claim emoji. `.slice(1)` used to do this, which removed one
		// UTF-16 code unit — fine for U+2705 by luck, and corrupting for anything
		// wider the moment the emoji became configurable.
		await syncChannelName(this.client, {
			channel: interaction.channel,
			reason: releaseReason,
			ticket: {
				...ticket,
				claimedById: null,
			},
		});

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

		// Transcripts, as their own entries. They live outside the database, so
		// an export without them is a guild whose entire ticket history reads as
		// "transcript unavailable" on the other side.
		//
		// A second query rather than collecting references during the generator
		// above: `archive.append` queues, while `Readable.from` consumes the
		// generator lazily, so gathering them there would race the append order.
		const stored = await client.prisma.ticket.findMany({
			select: {
				htmlTranscript: true,
				id: true,
			},
			where: {
				guildId,
				htmlTranscript: { not: null },
			},
		});
		let appended = 0;
		for (const ticket of stored) {
			const ref = parseRef(ticket.htmlTranscript);
			if (!ref) continue;
			try {
				const body = ref.kind === 'inline'
					? Readable.from([ref.html])
					: await client.storage.for(ref.driver).getStream(ref.key);
				archive.append(body, { name: archiveEntryFor(ticket.id) });
				appended++;
			} catch (error) {
				// A transcript that has gone is not a reason to fail an export —
				// it regenerates from the archived messages, which are in here.
				client.log.warn('Could not add the transcript for %s to the export: %s', ticket.id, error.message);
			}
			if (appended % 50 === 0) heartbeat();
		}
		client.log.info('Added %d transcripts to the export of guild %s', appended, guildId);

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

		// Read before the delete below cascades these rows away, so the stored
		// transcripts they point at can be cleaned up afterwards.
		const oldTranscripts = await client.prisma.ticket.findMany({
			select: {
				htmlTranscript: true,
				id: true,
			},
			where: {
				guildId,
				htmlTranscript: { not: null },
			},
		});

		await client.prisma.$transaction([
			client.prisma.guild.delete({
				select: { id: true },
				where: { id: guildId },
			}),
			client.prisma.guild.create({
				data: {
					// An archive from a guild with no server-wide defaults carries
					// nulls for them, and a bare null on a Json column stores the
					// JSON `null` literal rather than SQL NULL.
					...dbNulls(guildData, GUILD_JSON_NULLABLE),
					id: guildId,
					tags: { createMany: { data: tagData } },
				},
				// select ID so it doesn't return everything else
				select: { id: true },
			}),
		]);

		// After the transaction, and best-effort: an orphan is tidied up by
		// `scripts/transcripts.mjs --gc`, whereas deleting the transcripts of
		// tickets that survived a rollback is not recoverable.
		await deleteTranscripts(client, oldTranscripts);
		heartbeat();

		const newCategories = await client.prisma.$transaction(
			categories.map(category => {
				const questions = (category.questions ?? [])
					.map(question => pick(question, QUESTION_FIELDS, 'question', ['categoryId', 'createdAt']));
				return client.prisma.category.create({
					data: {
						// Same as the guild above: a category that inherits a role
						// field exports it as null, and null on a Json column has to
						// be `Prisma.DbNull` to become a real SQL NULL.
						...dbNulls(
							pick(category, CATEGORY_FIELDS, 'category', ['backupCategoryId', 'createdAt', 'guildId', 'id', 'questions']),
							CATEGORY_JSON_NULLABLE,
						),
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

		// Transcripts, for the tickets this import actually created.
		//
		// The archive's filename is never used as a path. It is only a lookup of
		// an id we have just created, and the storage key is rebuilt by
		// `keyFor(id)` — so a crafted entry name cannot reach outside storage,
		// and an entry for a ticket that is not ours is ignored rather than
		// written. That is why `importable.js` can go on excluding
		// `htmlTranscript` from the ticket payload outright: the reference is
		// never taken from the archive, only ever recomputed here.
		const imported = new Set(ticketsResolved.map(([ticket]) => ticket.id));
		let restored = 0;
		for (const file of files) {
			const ticketId = ticketIdFromArchiveEntry(file.path);
			if (!ticketId || !imported.has(ticketId)) continue;
			// A zip bomb would otherwise be a way to fill the volume.
			if (file.uncompressedSize > MAX_TRANSCRIPT_BYTES) {
				client.log.warn('Skipping the transcript for %s: %d bytes is over the limit', ticketId, file.uncompressedSize);
				continue;
			}
			try {
				const key = keyFor(ticketId);
				await client.storage.put(key, await file.buffer());
				await client.prisma.ticket.update({
					data: { htmlTranscript: formatRef(client.storage.name, key) },
					where: { id: ticketId },
				});
				restored++;
			} catch (error) {
				client.log.warn('Could not restore the transcript for %s: %s', ticketId, error.message);
			}
			if (restored % 50 === 0) heartbeat();
		}

		client.log.success(`Imported ${settingsJSON.categories.length} categories, ${ticketsResolved.length} tickets and ${restored} transcripts into guild ${guildId}`);
	}

	/**
	 * close a ticket
	 * @param {string} ticketId
	 */
	/**
	 * Apply a rename that Discord's rate limit refused earlier.
	 *
	 * The entry point for `deferredRenameWorkflow`, and the reason the parked
	 * request carries no name: the managed name is recomputed here, from the row
	 * as it is *now*. A ticket claimed, moved or re-prioritised while the rename
	 * was parked gets the name it should have, not the one it should have had.
	 *
	 * @param {string} ticketId
	 * @returns {Promise<?number>} null when there is nothing more to do; an epoch
	 *   to retry at when the budget is somehow still exhausted.
	 */
	async applyDeferredRename(ticketId) {
		const ticket = await this.client.prisma.ticket.findUnique({ where: { id: ticketId } });
		if (!ticket) return null;

		const channel = await this.client.channels.fetch(ticketId).catch(() => null);
		// The channel is gone, which for a CHANNEL-mode ticket is what closing
		// means. Returning rather than throwing keeps the activity from burning
		// five retries on something that is never coming back.
		if (!channel) return null;

		const result = await syncChannelName(this.client, {
			channel,
			// The workflow owns the retry; deferring again from inside a deferral
			// would race it.
			defer: false,
			reason: 'Deferred rename',
			ticket,
		});
		if (result?.reason !== 'rate_limited') return null;
		return result.freesAt ?? Date.now() + ms('1m');
	}

	/**
	 * Apply the rename owed to a ticket's waiting-on-staff status changing.
	 *
	 * The entry point for `awaitingRenameWorkflow`. Like the deferred rename it
	 * recomputes from the row as it is now rather than being told a name, so a
	 * status that flipped back while the debounce was counting down costs one
	 * query and a `noop` instead of a wrong rename.
	 *
	 * Unlike the deferred rename it passes `defer: true` and ignores the result:
	 * this path decides *when* to try, and an exhausted budget hands off to the
	 * deferral ladder, which is the thing that knows how to wait for a slot.
	 *
	 * @param {string} ticketId
	 * @returns {Promise<void>}
	 */
	async applyAwaitingRename(ticketId) {
		const ticket = await this.client.prisma.ticket.findUnique({ where: { id: ticketId } });
		// A closed ticket waits on nobody, and `finallyClose` has already written
		// the name it should end up with.
		if (!ticket || !ticket.open) return;

		const channel = await this.client.channels.fetch(ticketId).catch(() => null);
		if (!channel) return;

		await syncChannelName(this.client, {
			channel,
			defer: true,
			reason: 'Waiting-on-staff status changed',
			ticket,
		});
	}

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
			// A closed ticket waits on nobody. Left set, it would also outrank the
			// closed emoji in `ticketState`, so an archived thread would sit there
			// wearing the waiting badge for ever — the same trap as the override
			// below, for the same reason: nothing fires on a closed ticket to
			// clear it later.
			awaitingResponseFrom: null,
			closedAt: new Date(),
			closedById: closedBy || undefined,
			closedReason: reason && await crypto.queue(w => w.encrypt(reason)),
			// No trigger fires on a closed ticket, so an override left in place
			// here could never be cleared — an archived thread wearing 🔥 for ever.
			// Clearing it on close is also what keeps the precedence table down to
			// one rule instead of a closed-beats-override special case.
			emojiOverride: null,
			emojiOverrideScope: null,
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
			// And any waiting-status rename still counting down. Unlike the
			// deferred rename below this is not load-bearing — the activity reads
			// a row that now says closed and no-ops — but it saves a pointless
			// wake-up and a channel fetch, and it belongs here rather than in the
			// thread/forum branch because the debounce is dead in both channel
			// modes the moment the compare-and-swap above wins.
			temporal.cancelAwaitingRename(ticketId).catch(() => {});
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
		// Hoisted out of the branch below because the staff-channel clean-up
		// further down needs the same audit-log line, and a ticket whose channel
		// is already gone still has one to take down.
		const closedByMember = closedBy ? guild?.members.cache.get(closedBy) : null;
		const closeReason = 'Ticket closed' + (closedByMember ? ` by ${closedByMember.displayName}` : '') + (reason ? `: ${reason}` : '');
		if (channel) {
			try {
				if (channelMode === 'THREAD' || channelMode === 'FORUM' || channel.isThread?.()) {
					// Drop any rename parked while the ticket was open, *before*
					// writing the closed name. Otherwise the deferral wakes minutes
					// later and paints the ticket back to whatever it was — and it
					// would be recomputed from a row that now says closed anyway, so
					// the only thing it could add is a second rename nobody asked for.
					await temporal.cancelDeferredRename(ticket.id).catch(() => null);

					// Repaint the name for the closed state. The two `.replace()` calls
					// this used to do both matched a single code point, so a ZWJ
					// sequence or a skin-tone modifier was left half-stripped.
					await syncChannelName(this.client, {
						channel,
						reason: closeReason,
						ticket: {
							...ticket,
							awaitingResponseFrom: null,
							emojiOverride: null,
							open: false,
						},
					});

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

		// The staff channel and anything an automation made while this ticket was
		// open. A private channel is deleted, matching what happens to a CHANNEL
		// ticket; a thread is archived and locked, matching the ticket thread it
		// sits beside — deleting one while the other stays readable would be an
		// odd asymmetry to explain to the staff who were talking in it.
		//
		// Read off the post-compare-and-swap row rather than the keyv-cached one,
		// so a channel recorded moments ago is not missed. Failures are logged
		// individually: one channel an admin already deleted by hand must not stop
		// the rest from being cleaned up.
		const extraChannelIds = [
			ticket.staffChannelId,
			...(Array.isArray(ticket.createdChannelIds) ? ticket.createdChannelIds : []),
		].filter(Boolean);
		for (const id of extraChannelIds) {
			try {
				const extra = this.client.channels.cache.get(id) ?? await this.client.channels.fetch(id).catch(() => null);
				// Dead ids accumulate here by design: `createdChannelIds` is never
				// pruned when a channel is deleted by hand, because a read-modify-
				// write on every channelDelete across the whole bot is not worth it.
				if (!extra || extra.guildId !== ticket.guildId) continue;
				if (extra.isThread?.()) {
					await extra.edit({
						archived: true,
						locked: true,
						reason: closeReason,
					});
				} else if (extra.deletable) {
					await extra.delete(closeReason);
				}
			} catch (err) {
				this.client.log.warn('Failed to clean up channel %s for ticket %s: %s', id, ticket.id, err.message);
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

		recordTicket('closed');

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
