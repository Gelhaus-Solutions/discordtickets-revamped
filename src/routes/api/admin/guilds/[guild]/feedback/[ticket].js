'use strict';
const { logAdminEvent } = require('../../../../../../lib/logging');

/**
 * Deleting one feedback submission.
 *
 * There was no delete path at all: both feedback routes were reads, and the only
 * removals were the cascades from a ticket, guild or user being deleted, plus
 * `scripts/prune.mjs`. Resubmitting overwrites, but that needs the ticket still
 * open enough to press Close, so it is no use against a fake review already
 * sitting in the log.
 *
 * `Feedback` is keyed by `ticketId`, so the ticket id is the handle and no new
 * identifier is needed. `feedbackAnswers` cascades from it.
 */
module.exports.delete = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const guildId = req.params.guild;
		const ticketId = req.params.ticket;

		// The ownership check is not optional. A ticket id is a Discord snowflake,
		// so it is guessable, and `isAdmin` only proves the caller administers
		// *this* guild — not that the submission belongs to it.
		const original = await client.prisma.feedback.findUnique({
			include: { ticket: { select: { number: true } } },
			where: { ticketId },
		});
		if (!original || original.guildId !== guildId) return res.status(404).send(new Error('Not Found'));

		const feedback = await client.prisma.feedback.delete({ where: { ticketId } });

		// `getTicket` caches the ticket with its feedback for three minutes. Left
		// alone, the ticket still reads as rated, so a reopened ticket would not
		// re-offer the modal and the closing DM would show a rating that no longer
		// exists. The guild stats cache holds the average this submission fed.
		await client.keyv.delete(`cache/ticket+category+feedback+guild:${ticketId}`);
		await client.keyv.delete(`cache/stats/guild:${guildId}`);

		logAdminEvent(client, {
			action: 'delete',
			guildId,
			target: {
				id: ticketId,
				// Feedback has no name of its own, and the ticket number is what an
				// admin reading the log would recognise it by.
				name: original.ticket?.number ? `Ticket #${original.ticket.number}` : ticketId,
				type: 'feedback',
			},
			userId: req.user.id,
		});

		return feedback;
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
