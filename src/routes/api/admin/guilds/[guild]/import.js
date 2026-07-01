const {
	copyFile, unlink,
} = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const temporal = require('../../../../../lib/temporal');

function escapeHtml(str) {
	if (str === null || str === undefined) return '';
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

// put would be better but forms can only get or post
module.exports.post = fastify => ({
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

		client.log.info(`${member.user.username} is importing data to "${guild.name}"`);

		const [zFile] = await req.saveRequestFiles({
			limits: {
				fields: 1,
				files: 1,
			},
		});

		// Copy out of fastify's per-request temp dir so the archive outlives this
		// request and survives a bot restart while the durable workflow runs.
		const archivePath = join(tmpdir(), `tickets-import-${id}-${Date.now()}.zip`);
		await copyFile(zFile.filepath, archivePath);

		res.raw.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });

		const userLog = {
			error(string) {
				this.write('text-red-500 font-bold', 'text-red-700 dark:text-red-200', 'ERROR', string);
			},
			info(string) {
				this.write('text-cyan-500', 'text-cyan-700 dark:text-cyan-200', 'INFO', string);
			},
			success(string) {
				this.write('text-green-500', 'text-green-700 dark:text-green-200', 'SUCCESS', string);
			},
			warn(string) {
				this.write('text-orange-500', 'text-orange-700 dark:text-orange-200', 'WARN', string);
			},
			write(style1, style2, prefix, string) {
				// `string` may originate from caught Error objects whose messages
				// can include attacker-controlled values from the uploaded ZIP.
				// Escape both the prefix and the message before streaming HTML.
				const safeMessage = escapeHtml(string && string.message ? string.message : string);
				res.raw.write(`<p><span class="${escapeHtml(style1)}">[${escapeHtml(prefix)}]</span> <span class="${escapeHtml(style2)}">${safeMessage}</span></p>`);
			},
		};

		try {
			userLog.info('Starting the durable import workflow');
			// Per-guild workflow id (`import-<id>`): Temporal rejects a concurrent
			// import for the same guild.
			const handle = await temporal.startImportGuild({
				archivePath,
				guildId: id,
				requestedBy: req.user.id,
			});
			userLog.info('Importing settings, categories and tickets — this may take a while');
			await handle.result();
			userLog.success('(DONE) All data has been imported');
		} catch (error) {
			if (temporal.isWorkflowAlreadyStarted(error)) {
				userLog.error('An import is already running for this guild. Please wait for it to finish.');
			} else {
				client.log.error(error);
				userLog.error(error);
			}
		} finally {
			unlink(archivePath).catch(() => { });
			res.raw.end();
		}
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
