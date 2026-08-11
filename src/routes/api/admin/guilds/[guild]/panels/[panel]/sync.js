const { logAdminEvent } = require('../../../../../../../lib/logging');
const {
	describeError,
	syncPanel,
} = require('../../../../../../../lib/panels');

/**
 * POST /api/admin/guilds/:guild/panels/:panel/sync[?mode=repost]
 *
 * Push a panel to Discord again without changing it, in one of two ways:
 *
 * - `?mode=repost` — the "Re-send" button. Posts a new message and deletes the
 *   old one, putting the panel back at the bottom of the channel.
 * - anything else — the "Update" button. Edits the message where it is.
 *
 * The default is the edit, so a client that has not learned about the parameter
 * keeps the behaviour it had.
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

		const mode = req.query.mode === 'repost' ? 'repost' : 'edit';

		let synced;
		try {
			synced = await syncPanel(client, panel, { mode });
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

		const updated = await client.prisma.panel.update({
			data: { messageId: synced.messageId },
			where: { id: panel.id },
		});

		logAdminEvent(client, {
			// 'update' rather than a truer verb like 'resend': `logAdminEvent`
			// resolves `log.admin.verb.${action}` through i18n, so a new verb is a
			// new key in every locale file — and `check-i18n` runs in `npm test`.
			action: 'update',
			guildId: req.params.guild,
			target: {
				id: updated.id,
				name: updated.name,
				type: 'panel',
			},
			userId: req.user.id,
		});

		// `removedOld: false` is the one thing the dashboard cannot work out for
		// itself: the re-send succeeded, but the old panel is still sitting in the
		// channel and somebody has to go and delete it.
		return {
			...updated,
			recreated: Boolean(synced.recreated),
			removedOld: synced.removedOld,
		};
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
