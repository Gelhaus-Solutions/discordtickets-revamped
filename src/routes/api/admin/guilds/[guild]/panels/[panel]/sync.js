const {
	describeError,
	syncPanel,
} = require('../../../../../../../lib/panels');

/**
 * POST /api/admin/guilds/:guild/panels/:panel/sync
 *
 * Re-send a panel without changing it. This is the "Re-send" button behind a
 * panel whose message was deleted in Discord: `syncPanel` edits in place when
 * the message is still there and reposts when it is not.
 */
module.exports.post = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guild = client.guilds.cache.get(req.params.guild);
		const panelId = Number(req.params.panel);
		if (!Number.isInteger(panelId) || panelId <= 0) return res.status(400).send(new Error('Bad Request'));

		const panel = await client.prisma.panel.findUnique({ where: { id: panelId } });
		if (!panel || panel.guildId !== req.params.guild) return res.status(404).send(new Error('Not Found'));

		let synced;
		try {
			synced = await syncPanel(client, panel);
		} catch (error) {
			const described = describeError(error, guild);
			if (described) return res.code(described.status).send(described.body);
			throw error;
		}

		if (!synced.synced) {
			// The channel is gone; the row survives so the panel can be pointed
			// at a new one rather than rebuilt from scratch.
			await client.prisma.panel.update({
				data: { messageId: null },
				where: { id: panel.id },
			});
			return res.code(409).send({
				code: synced.reason,
				errors: [{
					message: 'The channel this panel was posted in no longer exists. Edit the panel and choose a new channel.',
					type: synced.reason,
				}],
				statusCode: 409,
			});
		}

		return await client.prisma.panel.update({
			data: { messageId: synced.messageId },
			where: { id: panel.id },
		});
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
