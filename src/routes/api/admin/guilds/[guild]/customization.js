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
		if (!match) throw new Error(`${field} must be a valid image URI.`);
		
		const imageSize = getBase64ByteLength(match[2]);
		if (imageSize > MAX_IMAGE_BYTES[field]) {
			throw new Error(`${field} exceeds 1MB limit.`);
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
			select: { botAvatar: true, botBio: true, botUsername: true },
		});

		return guild || { botAvatar: null, botBio: null, botUsername: null };
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.patch = fastify => ({
	handler: async req => {
		const data = req.body ?? {};
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
			// Using fetch(client.user.id) instead of .me to ensure we have the member object
			const botMember = await guild.members.fetch(client.user.id).catch(() => null);
			
			if (botMember) {
				const editData = {};
				
				if (Object.prototype.hasOwnProperty.call(filteredData, 'botUsername')) {
					editData.nick = filteredData.botUsername || null;
				}

				if (Object.prototype.hasOwnProperty.call(filteredData, 'botAvatar')) {
					if (filteredData.botAvatar === null) {
						editData.avatar = null;
					} else {
						// CRITICAL FIX: Convert the base64 string to a Buffer.
						// discord.js handles Buffers much better than raw base64 strings
						const base64Data = filteredData.botAvatar.split(',')[1];
						editData.avatar = Buffer.from(base64Data, 'base64');
					}
				}

				if (Object.keys(editData).length > 0) {
					try {
						// We use edit() which hits PATCH /guilds/{guild.id}/members/@me
						await botMember.edit(editData);
					} catch (error) {
						// If it still says Missing Permissions here, it is because discord.js 
						// thinks it lacks permissions based on its internal cache.
						client.log.warn(`API Error: ${error.message}`);
					}
				}
			}
		}

		logAdminEvent(client, {
			action: 'update',
			diff: {
				original: original ? { botBio: original.botBio, botUsername: original.botUsername } : null,
				updated: customization ? { botBio: customization.botBio, botUsername: customization.botUsername } : null,
			},
			guildId: id,
			target: { id, name: guild?.name || id, type: 'customization' },
			userId: req.user.id,
		});

		return customization;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
