'use strict';
const path = require('path');
const { dataPath } = require('../../../../../../../lib/paths');
const fs = require('fs');
// A plain relative require. `require` resolves against this file's directory,
// never the working directory, so the previous candidate-path search was
// unnecessary — and actively harmful: two of its five candidates were at the
// wrong depth, it only worked via its cwd fallbacks, and a miss was a top-level
// `throw` at require time that took down the entire HTTP server rather than
// just this route.
const { generateHtmlTranscript } = require('../../../../../../../lib/tickets/transcript-html.js');

// Transcripts are HTML built from user-authored Discord messages and served
// from the same origin as the session cookie. The generator escapes its input,
// but this is the second line of defence: no scripts at all, images only from
// Discord's CDN, and nothing may frame or be framed. Applied per-response
// because the global helmet config leaves CSP off for the SvelteKit dashboard,
// which needs its own inline hydration scripts.
const TRANSCRIPT_CSP = [
	'default-src \'none\'',
	'img-src \'self\' https://cdn.discordapp.com data:',
	'style-src \'unsafe-inline\'',
	'font-src data:',
	'base-uri \'none\'',
	'form-action \'none\'',
	'frame-ancestors \'none\'',
].join('; ');

/**
 * Send generated transcript HTML with a restrictive CSP.
 * @param {import('fastify').FastifyReply} res
 * @param {string} html
 */
function sendTranscript(res, html) {
	return res
		.header('Content-Security-Policy', TRANSCRIPT_CSP)
		.header('X-Content-Type-Options', 'nosniff')
		.type('text/html; charset=utf-8')
		.send(html);
}

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
		const {
			guild: guildId, ticket: ticketId,
		} = req.params;
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
			// Resolved against DATA_DIR, and confined to it: `htmlTranscript` is a
			// column, and a column is only ever as trustworthy as everything that
			// can write to it (an import archive, historically).
			const filepath = path.resolve(dataPath(ticket.htmlTranscript));
			if (filepath.startsWith(path.resolve(dataPath('user', 'transcripts')) + path.sep) && fs.existsSync(filepath)) {
				const html = fs.readFileSync(filepath, 'utf8');
				if (asDownload) {
					res.header('Content-Disposition', `attachment; filename="ticket-${ticket.number}-transcript.html"`);
				}
				return sendTranscript(res, html);
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
			const dir = dataPath('user', 'transcripts');
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
		return sendTranscript(res, html);
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
