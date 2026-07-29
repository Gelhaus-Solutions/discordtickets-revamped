const ms = require('ms');
const { logAdminEvent } = require('../../../../../../lib/logging');
const { validateTagBody } = require('../../../../../../lib/tags');

module.exports.delete = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guildId = req.params.guild;
		const tagId = Number(req.params.tag);
		if (!Number.isInteger(tagId) || tagId <= 0) return res.status(400).send(new Error('Bad Request'));
		const original = await client.prisma.tag.findUnique({ where: { id: tagId } });
		if (!original || original.guildId !== guildId) return res.status(404).send(new Error('Not Found'));
		const tag = await client.prisma.tag.delete({ where: { id: tagId } });

		const cacheKey = `cache/guild-tags:${guildId}`;
		client.keyv.set(cacheKey, await client.prisma.tag.findMany({
			select: {
				content: true,
				id: true,
				name: true,
				regex: true,
			},
			where: { guildId: guildId },
		}), ms('1h'));

		logAdminEvent(client, {
			action: 'delete',
			guildId: req.params.guild,
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

module.exports.get = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guildId = req.params.guild;
		const tagId = Number(req.params.tag);
		const tag = await client.prisma.tag.findUnique({ where: { id: tagId } });

		if (!tag || tag.guildId !== guildId) return res.status(400).send(new Error('Bad Request'));

		return tag;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.patch = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guildId = req.params.guild;
		const tagId = Number(req.params.tag);
		const guild = client.guilds.cache.get(req.params.guild);

		const original = req.params.tag && await client.prisma.tag.findUnique({ where: { id: tagId } });

		if (!original || original.guildId !== guildId) return res.status(400).send(new Error('Bad Request'));

		// The request body used to be handed to Prisma with only `id` and
		// `createdAt` removed. `guildId` is a writable scalar, so a PATCH could
		// move the tag into a server the caller has no rights over — where an
		// always-matching `regex` then had the bot reply to every message.
		const data = validateTagBody(req.body ?? {}, { partial: true });

		const tag = await client.prisma.tag.update({
			data,
			where: { id: tagId },
		});

		const cacheKey = `cache/guild-tags:${guildId}`;
		client.keyv.set(cacheKey, await client.prisma.tag.findMany({
			select: {
				content: true,
				id: true,
				name: true,
				regex: true,
			},
			where: { guildId: guildId },
		}), ms('1h'));

		logAdminEvent(client, {
			action: 'update',
			diff: {
				original,
				updated: tag,
			},
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
