const { logAdminEvent } = require('../../../../../../lib/logging');
const {
	collectCategoryIds,
	deletePanelMessage,
	describeError,
	syncPanel,
	validatePanelLayout,
} = require('../../../../../../lib/panels');
const { loadRefs } = require('../../../../../../lib/automations/http');
const { resolveGuildChannel } = require('../../../../../../lib/misc');

/**
 * Load a panel and confirm it belongs to the guild in the path, so a panel id
 * from one guild cannot be read or written through another guild's route.
 */
async function loadPanel(client, req, res) {
	const panelId = Number(req.params.panel);
	if (!Number.isInteger(panelId) || panelId <= 0) {
		res.status(400).send(new Error('Bad Request'));
		return null;
	}
	const panel = await client.prisma.panel.findUnique({ where: { id: panelId } });
	if (!panel || panel.guildId !== req.params.guild) {
		res.status(404).send(new Error('Not Found'));
		return null;
	}
	return panel;
}

module.exports.get = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const panel = await loadPanel(client, req, res);
		if (!panel) return;
		return {
			...panel,
			channelName: client.channels.cache.get(panel.channelId)?.name ?? null,
		};
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.patch = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guild = client.guilds.cache.get(req.params.guild);
		const original = await loadPanel(client, req, res);
		if (!original) return;

		const settings = await client.prisma.guild.findUnique({
			select: { categories: true },
			where: { id: guild.id },
		});

		const layout = req.body.layout ?? original.layout;
		const { buttonAutomationKeys } = await loadRefs(client, guild.id);
		try {
			validatePanelLayout(layout, settings.categories, buttonAutomationKeys);
		} catch (error) {
			const described = describeError(error, guild);
			if (described) return res.code(described.status).send(described.body);
			throw error;
		}

		// A moved panel must stay inside this guild — see resolveGuildChannel.
		let channelId = original.channelId;
		if (typeof req.body.channel === 'string' && req.body.channel !== original.channelId) {
			if (!resolveGuildChannel(client, guild.id, req.body.channel)) {
				return res.code(400).send({
					code: 'unknown_channel',
					errors: [{
						message: 'That channel is not in this server.',
						type: 'unknown_channel',
					}],
					statusCode: 400,
				});
			}
			channelId = req.body.channel;
		}
		const movedChannel = channelId !== original.channelId;

		// Moving a panel: take the old message down first, so the panel does not
		// end up existing twice.
		if (movedChannel) await deletePanelMessage(client, original).catch(() => null);

		const updated = await client.prisma.panel.update({
			data: {
				categories: collectCategoryIds(layout, settings.categories.map(c => c.id)),
				channelId,
				layout,
				// A panel that moved has no message in its new channel yet.
				messageId: movedChannel ? null : original.messageId,
				name: typeof req.body.name === 'string' ? req.body.name.slice(0, 100).trim() : original.name,
			},
			where: { id: original.id },
		});

		let synced;
		try {
			synced = await syncPanel(client, updated);
		} catch (error) {
			const described = describeError(error, guild);
			// The layout is already saved, so report the send failure without
			// losing the admin's edit.
			if (described) {
				return res.code(described.status).send({
					...described.body,
					panel: updated,
					synced: false,
				});
			}
			throw error;
		}

		const result = await client.prisma.panel.update({
			data: { messageId: synced.messageId },
			where: { id: updated.id },
		});

		logAdminEvent(client, {
			action: 'update',
			diff: {
				original,
				updated: result,
			},
			guildId: guild.id,
			target: {
				id: result.id,
				name: result.name,
				type: 'panel',
			},
			userId: req.user.id,
		});

		return {
			...result,
			recreated: Boolean(synced.recreated),
			synced: synced.synced,
			...(synced.synced ? {} : { reason: synced.reason }),
		};
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.delete = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const panel = await loadPanel(client, req, res);
		if (!panel) return;

		// Best-effort: a message that is already gone is not an error, and the
		// channel is never touched — it may hold other panels or real history.
		const deletedMessage = await deletePanelMessage(client, panel).catch(() => false);
		await client.prisma.panel.delete({ where: { id: panel.id } });

		logAdminEvent(client, {
			action: 'delete',
			guildId: req.params.guild,
			target: {
				id: panel.id,
				name: panel.name,
				type: 'panel',
			},
			userId: req.user.id,
		});

		return {
			...panel,
			deletedMessage,
		};
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
