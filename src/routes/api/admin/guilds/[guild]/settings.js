const { logAdminEvent } = require('../../../../../lib/logging.js');
const { Colors } = require('discord.js');
const temporal = require('../../../../../lib/temporal');
const { GUILD_SETTINGS_FIELDS } = require('../../../../../lib/schemas/importable');
const {
	GUILD_JSON_NULLABLE,
	INHERITED_FIELDS,
	dbNulls,
	guildDefaults,
} = require('../../../../../lib/settings/inheritance');
const { updateStaffRoles } = require('../../../../../lib/users');
const { resolveGuildChannel } = require('../../../../../lib/misc');

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

		// What a category inherits when it overrides nothing — the guild's own
		// values, falling back to the built-ins. The dashboard needs these to show
		// its "Inherited: …" placeholders on a category that does not exist yet,
		// and serving them keeps the built-in defaults defined in one place
		// instead of mirrored into the SvelteKit app where nothing would catch
		// them drifting.
		return {
			...settings,
			inheritable: INHERITED_FIELDS,
			inherited: guildDefaults(settings),
		};
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

// Fields the settings UI is allowed to update. botAvatar/botBio/botUsername
// are intentionally excluded — those go through the customization endpoint
// (with stricter validation). Relations (categories, tags, …) are excluded
// to prevent client payloads from rewriting nested data. Shared with the guild
// importer so the two lists cannot drift.
const ALLOWED_SETTINGS_FIELDS = new Set(GUILD_SETTINGS_FIELDS);

/**
 * Validate the JSON columns the UI can write.
 *
 * Only the field *names* were checked before, so a `Json` column could be set
 * to anything — and `autoTag` being a number rather than an array makes
 * `settings.autoTag.includes(...)` throw in the messageCreate listener, on
 * every message in that guild.
 *
 * @param {Record<string, unknown>} data the whitelisted patch body
 * @throws {Error} with a message the dashboard shows verbatim
 */
function validateJsonFields(data) {
	const isSnowflake = v => typeof v === 'string' && /^\d{17,20}$/.test(v);

	if ('autoTag' in data) {
		const ok = ['all', 'ticket', '!ticket'].includes(data.autoTag) ||
			(Array.isArray(data.autoTag) && data.autoTag.every(isSnowflake));
		if (!ok) throw new Error('autoTag must be "all", "ticket", "!ticket", or an array of channel IDs.');
	}

	if ('blocklist' in data) {
		if (!Array.isArray(data.blocklist) || !data.blocklist.every(isSnowflake)) {
			throw new Error('blocklist must be an array of role/user IDs.');
		}
	}

	// The server-wide category defaults. `null` is meaningful here — it is how a
	// guild says "no default, use the built-in" — so it is allowed through, but
	// anything that is neither null nor a list of role IDs would be read back by
	// `resolveCategory` and handed to `.some(...)` on every ticket creation in
	// every category that inherits it.
	for (const field of ['blockedRoles', 'pingRoles', 'requiredRoles', 'staffRoles']) {
		if (!(field in data) || data[field] === null) continue;
		if (!Array.isArray(data[field]) || !data[field].every(isSnowflake)) {
			throw new Error(`${field} must be an array of role IDs, or null for no server default.`);
		}
	}

	for (const field of ['cooldown', 'memberLimit', 'ratelimit', 'totalLimit']) {
		if (!(field in data) || data[field] === null) continue;
		if (!Number.isInteger(data[field]) || data[field] < 0) {
			throw new Error(`${field} must be a non-negative whole number, or null for no server default.`);
		}
	}

	if ('channelName' in data && data.channelName !== null && typeof data.channelName !== 'string') {
		throw new Error('channelName must be text, or null for no server default.');
	}

	if ('workingHours' in data) {
		const hours = data.workingHours;
		// A closed day is sent as `null` by the dashboard, and read back by
		// lib/working-hours.js the same way.
		const isDay = v => v === null ||
			(Array.isArray(v) && v.length === 2 && v.every(t => typeof t === 'string' && /^\d{1,2}:\d{2}$/.test(t)));
		if (!Array.isArray(hours) || hours.length !== 8 || typeof hours[0] !== 'string' || !hours.slice(1).every(isDay)) {
			throw new Error('workingHours must be a timezone followed by 7 [open, close] pairs (or null for a closed day).');
		}
	}
}

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
		validateJsonFields(data);

		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const id = req.params.guild;

		// The log channel must belong to *this* guild: it was written straight to
		// the database, so an admin could point their audit log at a channel in
		// someone else's server and have the bot narrate it there.
		if (data.logChannel && !resolveGuildChannel(client, id, data.logChannel)) {
			throw new Error('The log channel must be a channel in this server.');
		}
		const original = await client.prisma.guild.findUnique({ where: { id } });
		const settings = await client.prisma.guild.update({
			data: dbNulls(data, GUILD_JSON_NULLABLE),
			include: { categories: { select: { id: true } } },
			where: { id },
		});

		// Update cached categories, which include guild settings
		for (const { id } of settings.categories) await client.tickets.getCategory(id, true);

		// `cache/guild-staff` is what `isStaff` reads for every permission check in
		// the bot, and it is built from the categories' *effective* staff roles —
		// so a change to the server-wide default has to rebuild it. Without this,
		// staff in any category that inherits silently lose access until a category
		// is next saved or the process restarts.
		if ('staffRoles' in data && JSON.stringify(original?.staffRoles ?? null) !== JSON.stringify(settings.staffRoles ?? null)) {
			const guild = client.guilds.cache.get(id);
			if (guild) await updateStaffRoles(guild);
		}

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
