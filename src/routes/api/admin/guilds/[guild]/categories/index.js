const { logAdminEvent } = require('../../../../../../lib/logging');
const { updateStaffRoles } = require('../../../../../../lib/users');
const {
	displayEmoji, isValidEmoji,
} = require('../../../../../../lib/emoji');
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
		const allow = ['ViewChannel', 'ReadMessageHistory', 'SendMessages', 'EmbedLinks', 'AttachFiles'];

		if (!data.discordCategory) {
			let name = data.name;
			const categoryEmoji = displayEmoji(data.emoji);
			if (categoryEmoji) name = `${categoryEmoji} ${name}`;
			const channel = await guild.channels.create({
				name,
				permissionOverwrites: [
					...[
						{
							deny: ['ViewChannel'],
							id: guild.roles.everyone,
						},
						{
							allow: allow,
							id: client.user.id,
						},
					],
					...data.staffRoles.map(id => ({
						allow: allow,
						id,
					})),
				],
				position: 1,
				reason: `Tickets category created by ${user.tag}`,
				type: GuildCategory,
			});
			data.discordCategory = channel.id;
		}

		data.channelName ||= 'ticket-{num}'; // not ??=, expect empty string

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
				...categoryData,
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
				'force-close',
				'move',
				'priority',
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
						...category.staffRoles.map(id => ({
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
