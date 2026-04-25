const {
	PermissionFlagsBits, Routes,
} = require('discord.js');

/**
 * Whitelist + validate guild customization PATCH input. Only `botUsername`,
 * `botBio`, `botAvatar`, `botBanner` are accepted. Avatar/banner must be
 * `null` or a `data:image/...;base64,...` data URI; arbitrary URLs are
 * rejected because Discord renders them client-side and they can be used
 * as tracking pixels or to leak data.
 */
function validateCustomization(data) {
	const out = {};
	if (Object.prototype.hasOwnProperty.call(data, 'botUsername')) {
		if (data.botUsername === null || data.botUsername === '') {
			out.botUsername = null;
		} else if (typeof data.botUsername === 'string' && data.botUsername.length <= 32) {
			out.botUsername = data.botUsername;
		} else {
			throw new Error('Invalid botUsername (must be string ≤ 32 chars or null)');
		}
	}
	if (Object.prototype.hasOwnProperty.call(data, 'botBio')) {
		if (data.botBio === null || data.botBio === '') {
			out.botBio = null;
		} else if (typeof data.botBio === 'string' && data.botBio.length <= 190) {
			out.botBio = data.botBio;
		} else {
			throw new Error('Invalid botBio (must be string ≤ 190 chars or null)');
		}
	}
	for (const field of ['botAvatar', 'botBanner']) {
		if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
		const v = data[field];
		if (v === null || v === '') {
			out[field] = null;
		} else if (typeof v === 'string' && /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/.test(v) && v.length < 8 * 1024 * 1024) {
			out[field] = v;
		} else {
			throw new Error(`Invalid ${field} (must be data:image/<png|jpeg|gif|webp>;base64,... under 8 MiB, or null)`);
		}
	}
	return out;
}

module.exports.patch = fastify => ({
	handler: async req => {
		const data = req.body ?? {};
		const filteredData = validateCustomization(data);
		const client = req.routeOptions.config.client;
		const id = req.params.guild;

		// 1. Update DB first
		const customization = await client.prisma.guild.upsert({
			create: {
				id,
				...filteredData,
			},
			update: filteredData,
			where: { id },
			select: {
				botAvatar: true,
				botBio: true,
				botUsername: true,
			},
		});

		// 2. Prep Discord REST body (use Routes.guildMember to PATCH /guilds/:guild/members/@me)
		const body = {};
		if (typeof filteredData.botUsername === 'string') body.nick = filteredData.botUsername || null;
		if (typeof filteredData.botAvatar === 'string') body.avatar = filteredData.botAvatar; // expect data URI
		if (filteredData.botAvatar === null) body.avatar = null;

		const guild = client.guilds.cache.get(id);
		if (guild) {
			try {
				const me = guild.members.me || await guild.members.fetch(client.user.id);
				client.log.info('Bot user id: ' + client.user.id);
				client.log.info('Guild id: ' + id);
				client.log.info('Bot highest role position: ' + (me.roles?.highest?.position ?? 'unknown'));

				// Permission check for changing nickname
				const canChangeNick = me.permissions?.has(PermissionFlagsBits.ChangeNickname);
				client.log.info('Has CHANGE_NICKNAME: ' + !!canChangeNick);
				if (body.nick && !canChangeNick) {
					client.log.warn('Bot lacks CHANGE_NICKNAME — nickname update may fail');
				}

				// Use REST PATCH for the guild member @me endpoint for more explicit control
				const url = Routes.guildMember(id, '@me');
				const res = await client.rest.patch(url, { body });
				client.log.info(`[SUCCESS] Guild member @me patched for ${id}`);
				// If banner or global avatar/bio changes are present, attempt user-level patch
				if (typeof filteredData.botBanner === 'string' || filteredData.botBanner === null) {
					const userBody = {};
					if (typeof filteredData.botBanner === 'string') userBody.banner = filteredData.botBanner;
					if (filteredData.botBanner === null) userBody.banner = null;
					try {
						await client.rest.patch(Routes.user(client.user.id), { body: userBody });
						client.log.info(`[SUCCESS] User-level profile patched (banner) for ${client.user.id}`);
					} catch (userErr) {
						client.log.error('[DISCORD USER PATCH ERROR] ' + (userErr?.message || userErr));
					}
				}

				// return REST result when successful
				return res;
			} catch (error) {
				client.log.error('[DISCORD ERROR] Failed to update guild member @me: ' + (error?.message || error));
				if (error?.status) client.log.error('HTTP status: ' + error.status);
				if (error?.code) client.log.error('Discord API code: ' + error.code);
				if (error?.body) client.log.error('Error body: ' + JSON.stringify(error.body));
				// Fall through — we already updated DB, return stored customization below
			}
		}

		return customization;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
