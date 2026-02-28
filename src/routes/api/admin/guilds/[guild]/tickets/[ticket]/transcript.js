'use strict';
const path = require('path');
const fs = require('fs');
// Resolve `transcript-html` from a number of common locations because the
// running container's current working directory may differ from the repo root.
const transcriptCandidates = [
	path.join(__dirname, '../../../../../../lib/tickets/transcript-html.js'),
	path.join(__dirname, '../../../../lib/tickets/transcript-html.js'),
	path.join(process.cwd(), 'src', 'lib', 'tickets', 'transcript-html.js'),
	path.join('/app', 'src', 'lib', 'tickets', 'transcript-html.js'),
	path.join('/home/container', 'src', 'lib', 'tickets', 'transcript-html.js'),
];
let transcriptPath = null;
for (const p of transcriptCandidates) {
	if (fs.existsSync(p)) { transcriptPath = p; break; }
}
if (!transcriptPath) {
	throw new Error('transcript-html module not found; checked common locations');
}
const { generateHtmlTranscript } = require(transcriptPath);

/**
 * GET /api/admin/guilds/:guild/tickets/:ticket/transcript
 * Returns the HTML transcript for a ticket.
 * Query params:
 *   ?regen=1    – force regeneration even if cached
 *   ?download=1 – send as attachment (Content-Disposition: attachment)
 */
module.exports.get = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const { guild: guildId, ticket: ticketId } = req.params;
		const forceRegen = req.query.regen === '1';
		const asDownload = req.query.download === '1';

		// Validate ticket belongs to guild. Older DBs may not have `htmlTranscript`;
		// attempt the full select and fall back to a safer select if the column
		// is missing (Prisma P2022).
		let ticket;
		try {
			ticket = await client.prisma.ticket.findUnique({
				select: {
					guildId: true,
					htmlTranscript: true,
					id: true,
					number: true,
					open: true,
				},
				where: { id: ticketId },
			});
		} catch (err) {
			client.log.warn('Prisma select with htmlTranscript failed, retrying without it: %s', err.message);
			ticket = await client.prisma.ticket.findUnique({
				select: {
					guildId: true,
					id: true,
					number: true,
					open: true,
				},
				where: { id: ticketId },
			});
			if (ticket) ticket.htmlTranscript = null;
		}

		if (!ticket || ticket.guildId !== guildId) {
			return res.code(404).send({
				error: 'Not Found',
				message: 'Ticket not found.',
				statusCode: 404,
			});
		}

		// Try to serve from disk cache first (unless regen requested)
		if (!forceRegen && ticket.htmlTranscript) {
			const filepath = path.join(process.cwd(), ticket.htmlTranscript);
			if (fs.existsSync(filepath)) {
				const html = fs.readFileSync(filepath, 'utf8');
				if (asDownload) {
					res.header('Content-Disposition', `attachment; filename="ticket-${ticket.number}-transcript.html"`);
				}
				return res.type('text/html; charset=utf-8').send(html);
			}
		}

		// Generate fresh HTML transcript
		const html = await generateHtmlTranscript(client, ticketId);
		if (!html) {
			return res.code(500).send({
				error: 'Internal Server Error',
				message: 'Failed to generate transcript.',
				statusCode: 500,
			});
		}

		// Cache to disk asynchronously
		try {
			const dir = path.join(process.cwd(), 'user', 'transcripts');
			if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
			const filepath = path.join(dir, `ticket-${ticketId}.html`);
			fs.writeFileSync(filepath, html, 'utf8');
			const relativePath = `user/transcripts/ticket-${ticketId}.html`;
			await client.prisma.ticket.update({
				data: { htmlTranscript: relativePath },
				where: { id: ticketId },
			});
		} catch (err) {
			client.log.warn('Failed to cache transcript for %s: %s', ticketId, err.message);
		}

		if (asDownload) {
			res.header('Content-Disposition', `attachment; filename="ticket-${ticket.number}-transcript.html"`);
		}
		return res.type('text/html; charset=utf-8').send(html);
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
