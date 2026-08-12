'use strict';
// A plain relative require. `require` resolves against this file's directory,
// never the working directory, so the previous candidate-path search was
// unnecessary — and actively harmful: two of its five candidates were at the
// wrong depth, it only worked via its cwd fallbacks, and a miss was a top-level
// `throw` at require time that took down the entire HTTP server rather than
// just this route.
const { generateHtmlTranscript } = require('../../../../../../../lib/tickets/transcript-html.js');
const {
	formatRef, keyFor, parseRef,
} = require('../../../../../../../lib/storage');

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
 * Send a transcript with a restrictive CSP.
 *
 * Takes a stream as readily as a string, which is why stored transcripts are
 * never buffered just to be sent. This is also why S3 transcripts are streamed
 * through here rather than handed out as presigned URLs: the CSP above is a
 * header on *this* response, and a redirect to a bucket would drop it, along
 * with `nosniff` and the admin check that guards every view.
 *
 * @param {import('fastify').FastifyReply} res
 * @param {import('stream').Readable|string} html
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

		const setDisposition = () => {
			if (asDownload) {
				res.header('Content-Disposition', `attachment; filename="ticket-${ticket.number}-transcript.html"`);
			}
		};

		// Serve what is already stored, unless a regeneration was asked for.
		//
		// `parseRef` is the only thing that reads this column, and it is strict:
		// a value it does not recognise — including anything that looks like a
		// path escape — comes back as null and falls through to regeneration
		// rather than being resolved against anything.
		const ref = forceRegen ? null : parseRef(ticket.htmlTranscript);

		if (ref?.kind === 'object') {
			try {
				const driver = client.storage.for(ref.driver);
				// `stat` first, then stream. Not "stream and catch": once the first
				// byte is on the wire there is no falling back to regenerating, so
				// the existence check has to happen while there is still a choice.
				if (await driver.stat(ref.key)) {
					setDisposition();
					return sendTranscript(res, await driver.getStream(ref.key));
				}
			} catch (err) {
				// A storage outage degrades to a slower transcript, not a missing
				// one — the archived messages are still in the database.
				client.log.warn('Could not read the stored transcript for %s, regenerating: %s', ticketId, err.message);
			}
		}

		if (ref?.kind === 'inline') {
			// A row from before transcripts moved out of the database. Serve it,
			// then move it into storage so the next view takes the path above. This
			// is what makes the backfill script a convenience rather than a
			// prerequisite.
			setDisposition();
			const response = sendTranscript(res, ref.html);
			try {
				const key = keyFor(ticketId);
				await client.storage.put(key, ref.html);
				await client.prisma.ticket.update({
					data: { htmlTranscript: formatRef(client.storage.name, key) },
					where: { id: ticketId },
				});
			} catch (err) {
				client.log.warn('Could not move the inline transcript for %s into storage: %s', ticketId, err.message);
			}
			return response;
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

		// Cache for next time. Best-effort: the transcript is already rendered and
		// the caller should get it whether or not it can be stored.
		try {
			const key = keyFor(ticketId);
			await client.storage.put(key, html);
			await client.prisma.ticket.update({
				data: { htmlTranscript: formatRef(client.storage.name, key) },
				where: { id: ticketId },
			});
		} catch (err) {
			client.log.warn('Failed to cache transcript for %s: %s', ticketId, err.message);
		}

		setDisposition();
		return sendTranscript(res, html);
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
