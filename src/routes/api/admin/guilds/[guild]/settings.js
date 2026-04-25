const { logAdminEvent } = require('../../../../../lib/logging.js');
const { Colors } = require('discord.js');

module.exports.get = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const id = req.params.guild;
		const settings = await client.prisma.guild.findUnique({ where: { id } }) ??
			await client.prisma.guild.create({ data: { id } });

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
	'errorColour',
	'footer',
	'locale',
	'logChannel',
	'primaryColour',
	'staleAfter',
	'successColour',
	'workingHours',
]);

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
