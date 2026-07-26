const { logAdminEvent } = require('../../../../../lib/logging.js');
const {
	PermissionFlagsBits, Routes,
} = require('discord.js');

// Discord's own limits for the Modify Current Member endpoint.
const NICK_MAX_LENGTH = 32;
const BIO_MAX_LENGTH = 190;
// Kept in step with the fastify `bodyLimit` in src/http.js. A data URI is
// ~4/3 the size of the source image, so this is roughly a 6 MB upload.
const IMAGE_MAX_LENGTH = 8 * 1024 * 1024;
const IMAGE_DATA_URI = /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/;

/** Fields stored for a guild's bot profile, in the shape the dashboard expects. */
const CUSTOMIZATION_SELECT = {
	botAvatar: true,
	botBanner: true,
	botBio: true,
	botUsername: true,
};

/** The response shape when a guild has no stored customization yet. */
const EMPTY_CUSTOMIZATION = {
	botAvatar: null,
	botBanner: null,
	botBio: null,
	botUsername: null,
};

/** A client mistake. Carries a status so fastify answers 400 rather than 500. */
class ValidationError extends Error {
	constructor(message) {
		super(message);
		this.statusCode = 400;
	}
}

/**
 * Whitelist + validate guild customization PATCH input. Only `botUsername`,
 * `botBio`, `botAvatar` and `botBanner` are accepted. Avatar/banner must be
 * `null` or a `data:image/...;base64,...` data URI; arbitrary URLs are
 * rejected because Discord renders them client-side and they can be used
 * as tracking pixels or to leak data.
 *
 * Only keys actually present in the payload are returned, so the dashboard can
 * send a partial update without blanking the fields it didn't touch.
 * @param {object} data - Raw request body.
 * @returns {object} Validated subset, keyed by column name.
 */
function validateCustomization(data) {
	const out = {};
	if (Object.prototype.hasOwnProperty.call(data, 'botUsername')) {
		if (data.botUsername === null || data.botUsername === '') {
			out.botUsername = null;
		} else if (typeof data.botUsername === 'string' && data.botUsername.length <= NICK_MAX_LENGTH) {
			out.botUsername = data.botUsername;
		} else {
			throw new ValidationError(`Invalid botUsername (must be a string of at most ${NICK_MAX_LENGTH} characters, or null)`);
		}
	}
	if (Object.prototype.hasOwnProperty.call(data, 'botBio')) {
		if (data.botBio === null || data.botBio === '') {
			out.botBio = null;
		} else if (typeof data.botBio === 'string' && data.botBio.length <= BIO_MAX_LENGTH) {
			out.botBio = data.botBio;
		} else {
			throw new ValidationError(`Invalid botBio (must be a string of at most ${BIO_MAX_LENGTH} characters, or null)`);
		}
	}
	for (const field of ['botAvatar', 'botBanner']) {
		if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
		const v = data[field];
		if (v === null || v === '') {
			out[field] = null;
		} else if (typeof v === 'string' && IMAGE_DATA_URI.test(v) && v.length < IMAGE_MAX_LENGTH) {
			out[field] = v;
		} else {
			throw new ValidationError(`Invalid ${field} (must be data:image/<png|jpeg|gif|webp>;base64,... under 8 MiB, or null)`);
		}
	}
	return out;
}

/**
 * Map stored columns onto the Discord "Modify Current Member" body.
 * All four fields are per-guild: PATCH /guilds/{guild.id}/members/@me accepts
 * `nick`, `avatar`, `banner` and `bio`.
 * @param {object} fields - Validated columns.
 * @returns {object} Request body for the Discord REST call.
 */
function toDiscordBody(fields) {
	const body = {};
	if ('botUsername' in fields) body.nick = fields.botUsername;
	if ('botAvatar' in fields) body.avatar = fields.botAvatar;
	if ('botBanner' in fields) body.banner = fields.botBanner;
	if ('botBio' in fields) body.bio = fields.botBio;
	return body;
}

module.exports.get = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guild = await client.prisma.guild.findUnique({
			select: CUSTOMIZATION_SELECT,
			where: { id: req.params.guild },
		});
		return guild ?? EMPTY_CUSTOMIZATION;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.patch = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const id = req.params.guild;
		const fields = validateCustomization(req.body ?? {});

		if (Object.keys(fields).length === 0) {
			return await client.prisma.guild.findUnique({
				select: CUSTOMIZATION_SELECT,
				where: { id },
			}) ?? EMPTY_CUSTOMIZATION;
		}

		const guild = client.guilds.cache.get(id);
		if (!guild) {
			return res.code(404).send({
				error: 'Not Found',
				message: 'The requested resource could not be found.',
				statusCode: 404,
			});
		}

		// Apply to Discord *before* persisting, so the database never claims a
		// profile Discord rejected. This previously ran the other way round and
		// swallowed the failure, returning 200 while nothing had actually changed.
		const body = toDiscordBody(fields);
		if ('nick' in body) {
			const me = guild.members.me ?? await guild.members.fetch(client.user.id).catch(() => null);
			if (!me?.permissions?.has(PermissionFlagsBits.ChangeNickname)) {
				return res.code(403).send({
					error: 'Forbidden',
					message: 'The bot is missing the Change Nickname permission in this server.',
					statusCode: 403,
				});
			}
		}

		try {
			await client.rest.patch(Routes.guildMember(id, '@me'), { body });
		} catch (error) {
			client.log.warn('Failed to apply customization to guild %s: %s', id, error?.message ?? error);
			return res.code(502).send({
				error: 'Bad Gateway',
				message: `Discord rejected the profile update: ${error?.rawError?.message ?? error?.message ?? 'unknown error'}`,
				statusCode: 502,
			});
		}

		const original = await client.prisma.guild.findUnique({
			select: CUSTOMIZATION_SELECT,
			where: { id },
		});
		const customization = await client.prisma.guild.upsert({
			create: {
				id,
				...fields,
			},
			select: CUSTOMIZATION_SELECT,
			update: fields,
			where: { id },
		});

		logAdminEvent(client, {
			action: 'update',
			diff: {
				original,
				updated: customization,
			},
			guildId: id,
			target: {
				id,
				name: guild.name,
				type: 'customization',
			},
			userId: req.user.id,
		});

		return customization;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
