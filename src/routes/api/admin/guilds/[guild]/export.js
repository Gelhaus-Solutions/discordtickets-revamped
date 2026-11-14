const { tmpdir } = require('node:os');
const { join } = require('node:path');
const temporal = require('../../../../../lib/temporal');

/**
 * A guild export runs in the background: POST starts it, GET reports where it
 * stands, and `export/download` hands over the ZIP once it is ready.
 *
 * It used to be awaited inside one GET that sent nothing until the ZIP was
 * complete, so a reverse proxy timed the request out (504) on any guild that
 * took longer than its read timeout, and the close that followed terminated
 * the export.
 */

/**
 * @param {Awaited<ReturnType<typeof temporal.getExportStatus>>} status
 * @returns {{state: string}} without the server-side path
 */
const publicStatus = status => ({ state: status.state });

module.exports.get = fastify => ({
	/**
	 * @param {import('fastify').FastifyRequest} req
	 * @param {import('fastify').FastifyReply} res
	 */
	handler: async (req, res) => {
		res.header('cache-control', 'no-store');
		return publicStatus(await temporal.getExportStatus(req.params.guild));
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});

module.exports.post = fastify => ({
	/**
	 * Start an export, or join the one already running or waiting to be
	 * downloaded. Either way the answer is where it stands now.
	 * @param {import('fastify').FastifyRequest} req
	 * @param {import('fastify').FastifyReply} res
	 */
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const id = req.params.guild;
		res.header('cache-control', 'no-store');

		const current = await temporal.getExportStatus(id);
		if (current.state === 'running' || current.state === 'ready') return publicStatus(current);

		// Unique path per run so a fresh export can never truncate a file a
		// previous one is still handing to its requester.
		const outputPath = join(tmpdir(), `tickets-export-${id}-${Date.now()}.zip`);
		try {
			await temporal.startExportGuild({
				guildId: id,
				outputPath,
				requestedBy: req.user.id,
			});
		} catch (error) {
			// Another admin started one between the status read and here.
			if (temporal.isWorkflowAlreadyStarted(error)) return { state: 'running' };
			throw error;
		}

		const guild = client.guilds.cache.get(id);
		client.log.info(`${req.user.username ?? req.user.id} requested an export of "${guild.name}"`);
		return res.status(202).send({ state: 'running' });
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
