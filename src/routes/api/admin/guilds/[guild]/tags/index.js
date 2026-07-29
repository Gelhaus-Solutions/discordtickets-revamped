const ms = require('ms');
const { logAdminEvent } = require('../../../../../../lib/logging');
const { validateTagBody } = require('../../../../../../lib/tags');

module.exports.get = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;

		const { tags } = await client.prisma.guild.findUnique({
			select: { tags: true },
			where: { id: req.params.guild },
		});

		return tags;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});


module.exports.post = fastify => ({
	handler: async req => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guild = client.guilds.cache.get(req.params.guild);
		// Whitelist: prevent client-supplied `guild`, `guildId`, `id`, `createdAt`
		// from overriding the trusted scope via object spread. `regex` is checked
		// for catastrophic backtracking, because it is run against every message.
		const safeData = validateTagBody(req.body ?? {}, { partial: false });
		const tag = await client.prisma.tag.create({
			data: {
				...safeData,
				guild: { connect: { id: guild.id } },
			},
		});

		const cacheKey = `cache/guild-tags:${guild.id}`;
		let tags = await client.keyv.get(cacheKey);
		if (!tags) {
			tags = await client.prisma.tag.findMany({
				select: {
					content: true,
					id: true,
					name: true,
					regex: true,
				},
				where: { guildId: guild.id },
			});
			client.keyv.set(cacheKey, tags, ms('1h'));
		} else {
			tags.push(tag);
			client.keyv.set(cacheKey, tags, ms('1h'));
		}

		logAdminEvent(client, {
			action: 'create',
			guildId: guild.id,
			target: {
				id: tag.id,
				name: tag.name,
				type: 'tag',
			},
			userId: req.user.id,
		});

		return tag;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
