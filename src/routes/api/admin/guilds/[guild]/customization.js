const { logAdminEvent } = require('../../../../../lib/logging.js');

const BASE64_IMAGE_REGEX = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=]+)$/;
const MAX_IMAGE_BYTES = {
	botAvatar: 1024 * 1024, // 1MB
	botBanner: 5 * 1024 * 1024, // 5MB
};

function getBase64ByteLength(base64) {
	const padding = base64.endsWith('==') ? 2 : (base64.endsWith('=') ? 1 : 0);
	return Math.floor((base64.length * 3) / 4) - padding;
}

function validateCustomization(data) {
	const validated = {};
	const allowedFields = ['botAvatar', 'botBio', 'botBanner', 'botUsername'];

	for (const field of allowedFields) {
		if (!Object.prototype.hasOwnProperty.call(data, field)) continue;
		const value = data[field];

		if (value === null || value === '') {
			validated[field] = null;
			continue;
		}

		if (typeof value !== 'string') throw new Error(`${field} must be a string.`);

		if (field === 'botBio') {
			if (value.length > 500) throw new Error('botBio cannot exceed 500 characters.');
			validated[field] = value;
			continue;
		}

		if (field === 'botUsername') {
			if (value.length > 80) throw new Error('botUsername cannot exceed 80 characters.');
			validated[field] = value;
			continue;
		}

		const match = value.match(BASE64_IMAGE_REGEX);
		if (!match) throw new Error(`${field} must be a valid PNG, JPEG/JPG, WEBP, or GIF image.`);
		const imageSize = getBase64ByteLength(match[2]);
		if (imageSize > MAX_IMAGE_BYTES[field]) {
			throw new Error(`${field} exceeds the ${Math.round(MAX_IMAGE_BYTES[field] / 1024 / 1024)}MB size limit.`);
		}
		validated[field] = value;
	}

	return validated;
}

module.exports.get = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const id = req.params.guild;
		const guild = await client.prisma.guild.findUnique({
			where: { id },
			select: {
				botAvatar: true,
				botBio: true,
				botBanner: true,
				botUsername: true,
			},
		});

		if (!guild) {
			return {
				botAvatar: null,
				botBio: null,
				botBanner: null,
				botUsername: null,
			};
		}

		return guild;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.patch = fastify => ({
	handler: async req => {
		const data = req.body ?? {};
		if (typeof data !== 'object' || Array.isArray(data)) {
			throw new Error('Invalid customization payload.');
		}
		const filteredData = validateCustomization(data);

		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const id = req.params.guild;
		const original = await client.prisma.guild.findUnique({
			where: { id },
			select: {
				botAvatar: true,
				botBio: true,
				botBanner: true,
				botUsername: true,
			},
		});

		const customization = await client.prisma.guild.upsert({
			create: {
				id,
				...filteredData,
			},
			data: filteredData,
			where: { id },
			select: {
				botAvatar: true,
				botBio: true,
				botBanner: true,
				botUsername: true,
			},
		});

		// Apply customization to the bot in the guild if avatar or username is set
		try {
			const guild = client.guilds.cache.get(id);
			if (guild) {
				const botMember = await guild.members.fetchMe();

				// Set custom nickname for the guild
				if (filteredData.botUsername) {
					await botMember.setNickname(filteredData.botUsername);
				} else if (original?.botUsername) {
					await botMember.setNickname(null);
				}
			}
		} catch (error) {
			client.log.warn(`Failed to apply bot customization to guild ${id}: ${error.message}`);
		}

		// Create a diff without image data (base64 strings are too long for Discord embeds)
		const diffForLogging = {
			original: original ? {
				botBio: original.botBio,
				botUsername: original.botUsername,
			} : null,
			updated: customization ? {
				botBio: customization.botBio,
				botUsername: customization.botUsername,
			} : null,
		};

		logAdminEvent(client, {
			action: 'update',
			diff: diffForLogging,
			guildId: id,
			target: {
				id,
				name: client.guilds.cache.get(id)?.name || id,
				type: 'customization',
			},
			userId: req.user.id,
		});

		return customization;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
