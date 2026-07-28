const { logAdminEvent } = require('../../../../../lib/logging.js');
const { Colors } = require('discord.js');
const temporal = require('../../../../../lib/temporal');

// The bot profile fields live behind the customization endpoint. botAvatar and
// botBanner are base64 data URIs of up to 8 MiB each, so returning them here
// would ship several megabytes on every settings page load.
const CUSTOMIZATION_FIELDS = ['botAvatar', 'botBanner', 'botBio', 'botUsername'];

module.exports.get = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const id = req.params.guild;
		const settings = await client.prisma.guild.findUnique({ where: { id } }) ??
			await client.prisma.guild.create({ data: { id } });

		for (const field of CUSTOMIZATION_FIELDS) delete settings[field];

		return settings;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

// Fields the settings UI is allowed to update. botAvatar/botBio/botUsername
// are intentionally excluded — those go through the customization endpoint
// (with stricter validation). Relations (categories, tags, …) are excluded
// to prevent client payloads from rewriting nested data.
const ALLOWED_SETTINGS_FIELDS = new Set([
	'archive',
	'autoClose',
	'autoTag',
	'blocklist',
	'claimButton',
	'closeButton',
	'closeReasonButton',
	'disableDMs',
	'errorColour',
	'footer',
	'locale',
	'logChannel',
	'primaryColour',
	'reopenWindow',
	'staleAfter',
	'successColour',
	'workingHours',
]);

/**
 * Push a changed `staleAfter` into the running per-ticket stale workflows so
 * they re-arm immediately (no need to wait for the next message signal).
 * Workflows that exited because stale handling was disabled are restarted.
 * @param {import('client')} client
 * @param {string} guildId
 * @param {number} staleAfterMs new threshold; <= 0 stops the workflows
 */
async function reconfigureStaleWorkflows(client, guildId, staleAfterMs) {
	const tickets = await client.prisma.ticket.findMany({
		select: { id: true },
		where: {
			guildId,
			open: true,
			pendingCloseAt: null,
		},
	});
	for (const { id } of tickets) {
		try {
			const updated = await temporal.reconfigureStaleWorkflow(id, staleAfterMs);
			// Not running (stale handling was previously disabled): start it fresh;
			// lastActivityAt 0 makes the workflow read the DB value.
			if (!updated && staleAfterMs > 0) {
				await temporal.ensureStaleWorkflow({
					guildId,
					lastActivityAt: 0,
					ticketId: id,
				});
			}
		} catch (error) {
			client.log.warn('Failed to reconfigure stale workflow for ticket %s: %s', id, error.message);
		}
	}
}

module.exports.patch = fastify => ({
	handler: async req => {
		const body = req.body ?? {};
		const data = {};
		for (const key of Object.keys(body)) {
			if (ALLOWED_SETTINGS_FIELDS.has(key)) data[key] = body[key];
		}
		const colours = ['errorColour', 'primaryColour', 'successColour'];
		for (const c of colours) {
			if (data[c] && !data[c].startsWith('#') && !(data[c] in Colors)) { // if not null/empty and not hex
				throw new Error(`${data[c]} is not a valid colour. Valid colours are HEX and: ${Object.keys(Colors).join(', ')}`);
			}
		}

		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const id = req.params.guild;
		const original = await client.prisma.guild.findUnique({ where: { id } });
		const settings = await client.prisma.guild.update({
			data: data,
			include: { categories: { select: { id: true } } },
			where: { id },
		});

		// Update cached categories, which include guild settings
		for (const { id } of settings.categories) await client.tickets.getCategory(id, true);

		// Live-reconfigure running stale workflows when the threshold changed
		// (fire-and-forget; must not delay or fail the settings response).
		if ('staleAfter' in data && Number(original?.staleAfter ?? 0) !== Number(settings.staleAfter ?? 0)) {
			reconfigureStaleWorkflows(client, id, Number(settings.staleAfter ?? 0))
				.catch(error => client.log.warn('Stale workflow reconfigure sweep failed: %s', error.message));
		}

		// don't log the categories
		delete settings.categories;

		logAdminEvent(client, {
			action: 'update',
			diff: {
				original,
				updated: settings,
			},
			guildId: id,
			target: {
				id,
				name: client.guilds.cache.get(id).name,
				type: 'settings',
			},
			userId: req.user.id,
		});
		return settings;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
