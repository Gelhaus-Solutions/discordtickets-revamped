const { ChannelType: { GuildText } } = require('discord.js');
const { logAdminEvent } = require('../../../../../../lib/logging');
const {
	collectCategoryIds,
	describeError,
	syncPanel,
	validatePanelLayout,
} = require('../../../../../../lib/panels');
const { defaultPanelLayout } = require('../../../../../../lib/components-v2');

/**
 * Panels a caller may not set directly — `categories` is derived from the
 * layout and `messageId` is owned by the sync path.
 */
function safePanelData(body) {
	return {
		channelId: typeof body.channel === 'string' ? body.channel : null,
		layout: body.layout ?? null,
		name: typeof body.name === 'string' ? body.name.slice(0, 100).trim() : '',
	};
}

/** Everything the dashboard needs to render the panel list. */
function panelStatus(client, panel) {
	const channel = client.channels.cache.get(panel.channelId);
	if (!channel) return 'channel_missing';
	if (!panel.messageId) return 'unposted';
	return 'ok';
}

module.exports.get = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guildId = req.params.guild;

		const panels = await client.prisma.panel.findMany({
			orderBy: { createdAt: 'asc' },
			where: { guildId },
		});

		// Resolved from the cache only — a list view must not fan out one API
		// call per panel.
		return panels.map(panel => ({
			...panel,
			channelName: client.channels.cache.get(panel.channelId)?.name ?? null,
			status: panelStatus(client, panel),
		}));
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.post = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guild = client.guilds.cache.get(req.params.guild);
		const data = safePanelData(req.body);

		const settings = await client.prisma.guild.findUnique({
			select: {
				categories: true,
				footer: true,
				locale: true,
				primaryColour: true,
			},
			where: { id: guild.id },
		});

		// `layout` is the modern shape; the legacy `{type, categories, title, …}`
		// body is still accepted so an older client keeps working.
		let layout = data.layout;
		if (!layout) {
			layout = defaultPanelLayout({
				categories: Array.isArray(req.body.categories) ? req.body.categories : [],
				description: req.body.description,
				image: req.body.image,
				thumbnail: req.body.thumbnail,
				title: req.body.title,
				type: req.body.type,
			});
		}

		try {
			validatePanelLayout(layout, settings.categories);
		} catch (error) {
			const described = describeError(error, guild);
			if (described) return res.code(described.status).send(described.body);
			throw error;
		}

		// Reuse the requested channel, or make the familiar #create-a-ticket one.
		/** @type {import("discord.js").TextChannel} */
		let channel;
		let createdChannel = false;
		if (data.channelId) {
			channel = await client.channels.fetch(data.channelId).catch(() => null);
			if (!channel) {
				return res.code(400).send({
					code: 'unknown_channel',
					errors: [{
						message: 'That channel no longer exists.',
						type: 'unknown_channel',
					}],
					statusCode: 400,
				});
			}
		} else {
			channel = await guild.channels.create({
				name: 'create-a-ticket',
				permissionOverwrites: [
					{
						allow: ['ViewChannel', 'ReadMessageHistory'],
						deny: ['AddReactions', 'AttachFiles', 'SendMessages'],
						id: guild.roles.everyone,
					},
				],
				position: 1,
				rateLimitPerUser: 15,
				reason: 'New ticket panel',
				type: GuildText,
			});
			createdChannel = true;
		}

		// Persist before talking to Discord: an outage then costs a message id,
		// never the layout the admin just wrote.
		const panel = await client.prisma.panel.create({
			data: {
				categories: collectCategoryIds(layout, settings.categories.map(c => c.id)),
				channelId: channel.id,
				createdById: req.user.id,
				guildId: guild.id,
				layout,
				name: data.name || 'Ticket panel',
			},
		});

		let synced;
		try {
			synced = await syncPanel(client, panel);
		} catch (error) {
			// The row is kept so the layout is not lost, but a channel we made
			// ourselves for a panel that never posted is just litter.
			if (createdChannel) await channel.delete('Failed to send panel').catch(() => null);
			await client.prisma.panel.delete({ where: { id: panel.id } }).catch(() => null);
			const described = describeError(error, guild);
			if (described) return res.code(described.status).send(described.body);
			throw error;
		}

		const updated = await client.prisma.panel.update({
			data: { messageId: synced.messageId },
			where: { id: panel.id },
		});

		logAdminEvent(client, {
			action: 'create',
			guildId: guild.id,
			target: {
				id: updated.id,
				name: updated.name,
				type: 'panel',
			},
			userId: req.user.id,
		});

		return updated;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
