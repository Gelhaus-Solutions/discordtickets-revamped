module.exports.patch = fastify => ({
	handler: async req => {
		const data = req.body ?? {};
		const filteredData = validateCustomization(data);
		const client = req.routeOptions.config.client;
		const id = req.params.guild;

		// 1. Update DB first
		const customization = await client.prisma.guild.upsert({
			create: { id, ...filteredData },
			update: filteredData,
			where: { id },
			select: { botAvatar: true, botBio: true, botUsername: true },
		});

		// 2. Prep Discord Payload
		const payload = {};
		if (filteredData.botUsername !== undefined) payload.nick = filteredData.botUsername;
		
		// If there is an avatar, ensure it's a Buffer
		if (filteredData.botAvatar) {
			const base64Data = filteredData.botAvatar.split(',')[1];
			// Discord.js handles the conversion to the correct API format 
			// much better when it starts as a Buffer.
			payload.avatar = Buffer.from(base64Data, 'base64');
		} else if (filteredData.botAvatar === null) {
			payload.avatar = null;
		}

		const guild = client.guilds.cache.get(id);
		if (guild) {
			try {
				// We use .me to hit the @me endpoint specifically
				const me = guild.members.me || await guild.members.fetch(client.user.id);
				
				// We use .edit() but specifically check the result
				await me.edit(payload);
				client.log.info(`[SUCCESS] Profile updated for ${id}`);
			} catch (error) {
				// This log is the key. 
				// If it says "Missing Permissions," we check the 'code'
				client.log.error(`[DISCORD ERROR] ${error.code} - ${error.message}`);
				
				// If it's error 50013, it means Discord literally doesn't 
				// think the bot is allowed to touch its own member object.
			}
		}

		return customization;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
