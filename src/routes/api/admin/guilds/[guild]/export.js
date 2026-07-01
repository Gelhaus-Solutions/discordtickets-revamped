const { createReadStream } = require('node:fs');
const { unlink } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const temporal = require('../../../../../lib/temporal');

module.exports.get = fastify => ({
	/**
	 *
	 * @param {import('fastify').FastifyRequest} req
	 * @param {import('fastify').FastifyReply} res
	 */
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const id = req.params.guild;
		const guild = client.guilds.cache.get(id);
		const member = await guild.members.fetch(req.user.id);

		client.log.info(`${member.user.username} requested an export of "${guild.name}"`);

		// Unique path per request so a fresh export can never truncate a file a
		// previous request is still streaming to its requester.
		const outputPath = join(tmpdir(), `tickets-export-${id}-${Date.now()}.zip`);

		// The workflow id is per-guild (`export-<id>`), so Temporal itself rejects
		// a concurrent export for the same guild — no in-memory lock needed.
		let handle;
		try {
			handle = await temporal.startExportGuild({
				guildId: id,
				outputPath,
				requestedBy: req.user.id,
			});
		} catch (error) {
			if (temporal.isWorkflowAlreadyStarted(error)) {
				return res.status(429).send('An export is already running. Please wait for it to finish and try again afterwards.');
			}
			throw error;
		}

		// If the requester disconnects while the export is still being generated,
		// stop the workflow — nobody is left to download the file.
		let settled = false;
		req.raw.on('close', () => {
			if (!settled) {
				handle.terminate('export request aborted').catch(() => { });
				unlink(outputPath).catch(() => { });
			}
		});

		try {
			await handle.result();
			settled = true;
		} catch (error) {
			settled = true;
			client.log.error(error);
			unlink(outputPath).catch(() => { });
			return res.status(500).send('Export failed. Please check the logs and try again.');
		}

		const cleanGuildName = guild.name.replace(/\W/g, '_').replace(/_+/g, '_');
		const fileName = `tickets-${cleanGuildName}-${new Date().toISOString().slice(0, 10)}.zip`;

		const stream = createReadStream(outputPath);
		stream.on('close', () => unlink(outputPath).catch(() => { }));
		return res
			.type('application/zip')
			.header('content-disposition', `attachment; filename="${fileName}"`)
			.send(stream);
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
