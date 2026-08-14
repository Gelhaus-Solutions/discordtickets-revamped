const { logAdminEvent } = require('../../../../../../lib/logging');
const { updateStaffRoles } = require('../../../../../../lib/users');
const { STATE_FIELDS } = require('../../../../../../lib/tickets/emoji-settings');
const { buildOverwrites } = require('../../../../../../lib/tickets/channels');
const {
	displayEmoji, isValidChannelEmoji, isValidEmoji,
} = require('../../../../../../lib/emoji');
const {
	CATEGORY_JSON_NULLABLE,
	dbNulls,
} = require('../../../../../../lib/settings/inheritance');
const {
	QuestionError,
	validateQuestions,
} = require('../../../../../../lib/questions-validate');
const {
	ApplicationCommandPermissionType,
	ChannelType: { GuildCategory },
} = require('discord.js');
const ms = require('ms');
const {
	getAverageTimes, getAverageRating,
} = require('../../../../../../lib/stats');

/**
 * Validate the per-priority emoji map.
 *
 * This column is read on every channel-name write, so a string, an array or a
 * non-emoji value here breaks claim, release, priority and close for every
 * ticket in the category — long after the admin saved it.
 *
 * @param {unknown} value
 * @returns {?string} a message the dashboard shows verbatim, or null
 */
function priorityEmojisError(value) {
	if (value === null || value === undefined) return null;
	if (typeof value !== 'object' || Array.isArray(value)) return 'priorityEmojis must be an object';
	for (const [key, v] of Object.entries(value)) {
		if (!['HIGH', 'LOW', 'MEDIUM', 'NONE'].includes(key)) return `priorityEmojis has an unknown key "${key}"`;
		if (v === null) continue;
		if (typeof v !== 'string') return `priorityEmojis.${key} must be text`;
		// '' is a deliberate "no emoji for this priority".
		if (v !== '' && !isValidChannelEmoji(v)) return `priorityEmojis.${key} cannot be shown in a channel name`;
	}
	return null;
}

/**
 * Validate the three state-emoji columns.
 *
 * `null` (inherit) and `''` (deliberately none) both pass untouched; only a
 * non-empty value has to resolve to something Discord will actually draw.
 *
 * @param {Record<string, unknown>} data
 * @returns {?string}
 */
function stateEmojiError(data) {
	for (const field of STATE_FIELDS) {
		if (!data[field]) continue;
		if (!isValidChannelEmoji(data[field])) {
			return `${field} must be an emoji that can appear in a channel name`;
		}
	}
	return priorityEmojisError(data.priorityEmojis);
}

module.exports.get = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;

		let { categories } = await client.prisma.guild.findUnique({
			select: {
				categories: {
					select: {
						autoAssign: true,
						backupCategoryId: true,
						blockedRoles: true,
						channelMode: true,
						createdAt: true,
						description: true,
						discordCategory: true,
						emoji: true,
						id: true,
						image: true,
						name: true,
						requiredRoles: true,
						staffRoles: true,
						tickets: {
							select: {
								closedAt: true,
								createdAt: true,
							    feedback: { select: { rating: true } },
								firstResponseAt: true,
							},
							where: {
								firstResponseAt: { not: null },
								open: false,
							},
						},
					},
				},
			},
			where: { id: req.params.guild },
		});

		categories = await Promise.all(
			categories.map(async category => {
				const {
					avgResolutionTime,
					avgResponseTime,
				} = await getAverageTimes(category.tickets);
				const avgRating = await getAverageRating(category.tickets);
				category = {
					...category,
					stats: {
						avgRating: avgRating.toFixed(1),
						avgResolutionTime: ms(avgResolutionTime),
						avgResponseTime: ms(avgResponseTime),
					},
				};
				delete category.tickets;
				return category;
			}),
		);

		return categories;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.post = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;

		const user = await client.users.fetch(req.user.id);
		const guild = client.guilds.cache.get(req.params.guild);
		const data = req.body;

		// Derived, read-only sidecars the GET adds; the dashboard round-trips the
		// whole object, and an unknown key spread into `create` throws.
		delete data.inherited;
		delete data.inheritable;

		// A new category leaves inheritable fields unset, so the Discord category
		// created below has to be given the *effective* staff roles rather than the
		// (possibly absent) ones on the request.
		const settings = await client.prisma.guild.findUnique({
			select: { staffRoles: true },
			where: { id: req.params.guild },
		});
		const staffRoles = data.staffRoles ?? settings?.staffRoles ?? [];

		if (staffRoles.length === 0) {
			const badRequest = new Error('A category needs at least one staff role, here or as a server default');
			badRequest.statusCode = 400;
			throw badRequest;
		}

		if (!data.discordCategory) {
			let name = data.name;
			const categoryEmoji = displayEmoji(data.emoji);
			if (categoryEmoji) name = `${categoryEmoji} ${name}`;
			const channel = await guild.channels.create({
				name,
				permissionOverwrites: buildOverwrites({
					access: { roleIds: staffRoles },
					clientId: client.user.id,
					guild,
				}),
				position: 1,
				reason: `Tickets category created by ${user.tag}`,
				type: GuildCategory,
			});
			data.discordCategory = channel.id;
		}

		// Left unset on purpose. A new category with no template inherits the
		// server default (and, failing that, the built-in `ticket-{num}`); filling
		// one in here would make every new category an override that never tracks
		// the server setting again. '' arrives from the legacy dashboard meaning
		// "unset", so it is normalised rather than stored as a blank name.
		if (data.channelName === '') data.channelName = null;

		// Same three as the PATCH route, and for the same reasons: a forum cannot
		// hold a private post, and '' from a cleared select means "use the
		// default", which is what NULL means in the column.
		if (data.staffChannelMode === 'FORUM') {
			const badRequest = new Error('A staff channel can be a channel or a thread. Forums cannot hold private posts.');
			badRequest.statusCode = 400;
			throw badRequest;
		}
		if (data.staffChannelMode === '') data.staffChannelMode = null;
		if (data.staffChannelParent === '') data.staffChannelParent = null;

		// Same reasoning as the PATCH route: an out-of-range question or an
		// unresolvable emoji is only discovered when a member tries to open a
		// ticket, so it has to be caught at the point the admin saves it.
		try {
			validateQuestions(data.questions);
		} catch (error) {
			if (error instanceof QuestionError) {
				const badRequest = new Error('Invalid questions');
				badRequest.statusCode = 400;
				badRequest.errors = error.errors;
				throw badRequest;
			}
			throw error;
		}

		if (data.emoji !== undefined && data.emoji !== null && data.emoji !== '' && !isValidEmoji(data.emoji)) {
			const badRequest = new Error('emoji must be a Unicode emoji, a custom emoji ID, or a <:name:id> tag');
			badRequest.statusCode = 400;
			throw badRequest;
		}

		const emojiProblem = stateEmojiError(data);
		if (emojiProblem) {
			const badRequest = new Error(emojiProblem);
			badRequest.statusCode = 400;
			throw badRequest;
		}

		// Prepare category data for Prisma
		const categoryData = { ...data };

		// Strip any client-supplied fields that could override the trusted scope
		// via spread (cross-guild create / id collision).
		delete categoryData.guild;
		delete categoryData.guildId;
		delete categoryData.id;
		delete categoryData.createdAt;
		delete categoryData.tickets;
		delete categoryData.primaryCategories;

		// For THREAD and FORUM modes, don't send totalLimit (it's not applicable)
		if (categoryData.channelMode === 'THREAD' || categoryData.channelMode === 'FORUM') {
			delete categoryData.totalLimit;
		}

		// Handle backupCategory relation.
		//
		// The id is client-supplied and `Category.backupCategoryId` is a bare FK
		// with no guild constraint, so this must verify ownership. Without it, an
		// admin of one guild could point a category's overflow at another guild's
		// category and have tickets created in that guild's Discord category,
		// with its staff roles.
		if (categoryData.backupCategoryId) {
			const backup = await client.prisma.category.findUnique({
				select: { guildId: true },
				where: { id: categoryData.backupCategoryId },
			});
			if (backup?.guildId !== guild.id) {
				const error = new Error('backupCategoryId must reference a category in this guild');
				error.statusCode = 400;
				throw error;
			}
			categoryData.backupCategory = { connect: { id: categoryData.backupCategoryId } };
		}
		delete categoryData.backupCategoryId;

		const category = await client.prisma.category.create({
			data: {
				...dbNulls(categoryData, CATEGORY_JSON_NULLABLE),
				guild: { connect: { id: guild.id } },
				questions: { createMany: { data: categoryData.questions ?? [] } },
			},
		});

		// update caches
		await client.tickets.getCategory(category.id, true);
		await updateStaffRoles(guild);

		if (req.user.accessToken) {
			Promise.all([
				'Create ticket for user',
				'claim',
				'emoji',
				'force-close',
				'move',
				'priority',
				'private-channel',
				'release',
			].map(name =>
				client.application.commands.permissions.set({
					command: client.application.commands.cache.find(cmd => cmd.name === name),
					guild,
					permissions: [
						{
							id: guild.id, // @everyone
							permission: false,
							type: ApplicationCommandPermissionType.Role,
						},
						// The effective list computed above, not the stored column: a
						// new category that inherits its staff roles holds NULL there.
						...staffRoles.map(id => ({
							id,
							permission: true,
							type: ApplicationCommandPermissionType.Role,
						})),
					],
					token: req.user.accessToken,
				}),
			))
				.then(() => client.log.success('Updated application command permissions in "%s"', guild.name))
				.catch(error => client.log.error(error));
		}

		logAdminEvent(client, {
			action: 'create',
			guildId: guild.id,
			target: {
				id: category.id,
				name: category.name,
				type: 'category',
			},
			userId: req.user.id,
		});

		return category;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
