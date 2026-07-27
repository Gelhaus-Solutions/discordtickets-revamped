const { PermissionsBitField } = require('discord.js');

module.exports.get = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const id = req.params.guild;
		const guild = client.guilds.cache.get(id);
		const settings = await client.prisma.guild.findUnique({ where: { id } }) ??
			await client.prisma.guild.create({ data: { id } });
		const problems = [];

		if (settings.logChannel) {
			const permissions = guild.members.me.permissionsIn(settings.logChannel);

			if (!permissions.has(PermissionsBitField.Flags.SendMessages)) {
				problems.push({
					id: 'logChannelMissingPermission',
					permission: 'SendMessages',
				});
			}

			if (!permissions.has(PermissionsBitField.Flags.EmbedLinks)) {
				problems.push({
					id: 'logChannelMissingPermission',
					permission: 'EmbedLinks',
				});
			}

		}

		// Nested inside `if (settings.logChannel)` before this, so it never fired
		// for a guild without a log channel — which is exactly a guild that has
		// not finished setting the bot up.
		if (process.env.PUBLIC_BOT !== 'true' && client.application.botPublic) {
			problems.push({ id: 'botPublic' });
		}

		// Panels are tracked now, so the states that used to be invisible —
		// message deleted by hand, channel removed, category deleted out from
		// under a button — can be surfaced instead of silently doing nothing.
		const panels = await client.prisma.panel.findMany({ where: { guildId: id } });
		if (panels.length) {
			const categoryIds = new Set(
				(await client.prisma.category.findMany({
					select: { id: true },
					where: { guildId: id },
				})).map(c => c.id),
			);

			for (const panel of panels) {
				const channel = client.channels.cache.get(panel.channelId);

				if (!channel) {
					problems.push({
						id: 'panelChannelMissing',
						panel: panel.name,
						panelId: panel.id,
					});
					continue;
				}

				if (!panel.messageId) {
					problems.push({
						id: 'panelNotPosted',
						panel: panel.name,
						panelId: panel.id,
					});
				}

				if (!guild.members.me.permissionsIn(channel).has(PermissionsBitField.Flags.SendMessages)) {
					problems.push({
						id: 'panelChannelMissingPermission',
						panel: panel.name,
						panelId: panel.id,
						permission: 'SendMessages',
					});
				}

				const orphaned = (Array.isArray(panel.categories) ? panel.categories : [])
					.filter(categoryId => !categoryIds.has(categoryId));
				if (orphaned.length) {
					problems.push({
						id: 'panelOrphanedCategories',
						panel: panel.name,
						panelId: panel.id,
					});
				}
			}
		}

		return problems;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
