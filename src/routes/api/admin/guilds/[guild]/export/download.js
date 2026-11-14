const { createReadStream } = require('node:fs');
const temporal = require('../../../../../../lib/temporal');

module.exports.get = fastify => ({
	/**
	 * Hand over a finished export. A browser navigation, not a fetch, so the
	 * browser saves the attachment and the dashboard stays where it is.
	 * @param {import('fastify').FastifyRequest} req
	 * @param {import('fastify').FastifyReply} res
	 */
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const id = req.params.guild;

		const status = await temporal.getExportStatus(id);
		if (status.state !== 'ready') {
			return res.status(404).type('text/plain').send('There is no export ready to download. Start one from the dashboard.');
		}

		const guild = client.guilds.cache.get(id);
		const cleanGuildName = guild.name.replace(/\W/g, '_').replace(/_+/g, '_');
		const fileName = `tickets-${cleanGuildName}-${new Date().toISOString().slice(0, 10)}.zip`;

		// Only a download that reached the end counts: one cut off half way
		// leaves the file for another try until the export expires.
		res.raw.on('finish', () => {
			temporal.markExportDownloaded(id).catch(error => client.log.warn('Could not mark the export of guild %s as downloaded: %s', id, error.message));
		});
		return res
			.type('application/zip')
			.header('cache-control', 'no-store')
			.header('content-disposition', `attachment; filename="${fileName}"`)
			.send(createReadStream(status.path));
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
