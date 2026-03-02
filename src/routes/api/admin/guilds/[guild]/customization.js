const { logAdminEvent } = require('../../../../../lib/logging.js');

const BASE64_IMAGE_REGEX = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,([A-Za-z0-9+/=]+)$/;
const MAX_IMAGE_BYTES = { botAvatar: 1024 * 1024 }; // 1MB

function getBase64ByteLength(base64) {
	const padding = base64.endsWith('==') ? 2 : (base64.endsWith('=') ? 1 : 0);
	return Math.floor((base64.length * 3) / 4) - padding;
}

function validateCustomization(data) {
	const validated = {};
	const allowedFields = ['botAvatar', 'botBio', 'botUsername'];

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
		const client = req.routeOptions.config.client;
		const id = req.params.guild;
		const guild = await client.prisma.guild.findUnique({
			where: { id },
			select: {
				botAvatar: true,
				botBio: true,
				botUsername: true,
			},
		});

		if (!guild) {
			return {
				botAvatar: null,
				botBio: null,
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

		const client = req.routeOptions.config.client;
		const id = req.params.guild;
		
		const original = await client.prisma.guild.findUnique({
			where: { id },
			select: { botAvatar: true, botBio: true, botUsername: true },
		});

		const customization = await client.prisma.guild.upsert({
			create: { id, ...filteredData },
			update: filteredData,
			where: { id },
			select: { botAvatar: true, botBio: true, botUsername: true },
		});

		const guild = client.guilds.cache.get(id);
		if (guild) {
			const botMember = guild.members.me || await guild.members.fetch(client.user.id).catch(() => null);
			if (botMember) {
				const editData = {};
				
				// Handle Nickname
				if (Object.prototype.hasOwnProperty.call(filteredData, 'botUsername')) {
					editData.nick = filteredData.botUsername || null;
				}

				// Handle Avatar: Convert Base64 string to Buffer for Discord API
				if (Object.prototype.hasOwnProperty.call(filteredData, 'botAvatar')) {
					const avatarData = filteredData.botAvatar;
					if (avatarData === null) {
						editData.avatar = null;
					} else {
						// Extract the base64 part and convert to Buffer
						const base64Part = avatarData.split(',')[1];
						editData.avatar = Buffer.from(base64Part, 'base64');
					}
				}

				if (Object.keys(editData).length > 0) {
					try {
						// Ensure bot has permissions to manage itself
						if (!botMember.permissions.has('ManageNicknames')) {
							client.log.warn(`Missing "Manage Nicknames" permission in guild ${id}`);
						}
						
						await botMember.edit(editData);
					} catch (error) {
						// Specific handling for common Discord API errors
						client.log.warn(`Failed to apply bot guild profile to guild ${id}: ${error.message}`);
					}
				}
			}
		}

		const diffForLogging = {
			original: original ? { botBio: original.botBio, botUsername: original.botUsername } : null,
			updated: customization ? { botBio: customization.botBio, botUsername: customization.botUsername } : null,
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
