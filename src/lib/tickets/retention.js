/**
 * How long a ticket's transcript is kept after the ticket closed.
 *
 * A closed ticket's transcript, meaning its archived messages, archived users
 * and roles, archived channels, the answers to its questions, its feedback and
 * the stored HTML transcript, is deleted 24 months after the ticket was closed.
 * The ticket row itself stays: counts, numbers, categories and who opened it
 * are what the statistics and the ticket numbering are made of, and none of it
 * is transcript.
 *
 * A reopened ticket is `open` again and is left alone; when it closes a second
 * time `closedAt` is written afresh, so the 24 months start over.
 *
 * Deletes in batches of tickets, each batch in one transaction, so a backlog
 * never holds one long transaction or one huge `IN` list. Reports counts only:
 * nothing about a ticket, its author or its words reaches the log.
 */
const { deleteTranscripts } = require('../storage');

/** Months a closed ticket's transcript is kept. */
const TRANSCRIPT_RETENTION_MONTHS = 24;

/** Tickets per transaction. A ticket can hold thousands of messages. */
const BATCH_SIZE = 25;

/**
 * The moment before which a ticket must have closed for its transcript to be due.
 * Calendar months, so 24 months before 2026-10-02 is 2024-10-02.
 * @param {Date} [now]
 * @returns {Date}
 */
function retentionCutoff(now = new Date()) {
	const cutoff = new Date(now);
	// A month shorter than the day of the month rolls over (31 March - 1 month),
	// which would keep a transcript a few days too long, never too short, but
	// the day is clamped anyway so the cutoff is the same date 24 months back.
	const day = cutoff.getUTCDate();
	cutoff.setUTCDate(1);
	cutoff.setUTCMonth(cutoff.getUTCMonth() - TRANSCRIPT_RETENTION_MONTHS);
	const last = new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate();
	cutoff.setUTCDate(Math.min(day, last));
	return cutoff;
}

/**
 * Delete the transcripts of every ticket closed at least 24 months ago.
 *
 * @param {object} client the bot client (`prisma`, `log`, and `storage` for stored transcripts)
 * @param {object} [options]
 * @param {Date} [options.now]
 * @param {number} [options.batchSize]
 * @param {() => void} [options.heartbeat] called after every batch
 * @returns {Promise<Record<'tickets'|'messages'|'users'|'roles'|'channels'|'answers'|'feedback'|'files', number>>}
 */
async function purgeExpiredTranscripts(client, {
	batchSize = BATCH_SIZE,
	heartbeat = () => { },
	now = new Date(),
} = {}) {
	const cutoff = retentionCutoff(now);
	const totals = {
		answers: 0,
		channels: 0,
		feedback: 0,
		files: 0,
		messages: 0,
		roles: 0,
		tickets: 0,
		users: 0,
	};

	// Walked by id rather than re-queried from the top, so a ticket whose
	// deletion keeps failing cannot be picked up again and again.
	let after = '';
	for (;;) {
		const batch = await client.prisma.ticket.findMany({
			orderBy: { id: 'asc' },
			select: {
				htmlTranscript: true,
				id: true,
			},
			take: batchSize,
			where: {
				OR: [
					{ archivedChannels: { some: {} } },
					{ archivedMessages: { some: {} } },
					{ archivedRoles: { some: {} } },
					{ archivedUsers: { some: {} } },
					{ feedback: { isNot: null } },
					{ htmlTranscript: { not: null } },
					{ questionAnswers: { some: {} } },
				],
				closedAt: { lt: cutoff },
				id: { gt: after },
				open: false,
			},
		});
		if (batch.length === 0) break;
		after = batch[batch.length - 1].id;

		const ticketId = { in: batch.map(ticket => ticket.id) };
		const [
			messages,
			users,
			roles,
			channels,
			answers,
			feedback,
		] = await client.prisma.$transaction([
			client.prisma.archivedMessage.deleteMany({ where: { ticketId } }),
			client.prisma.archivedUser.deleteMany({ where: { ticketId } }),
			client.prisma.archivedRole.deleteMany({ where: { ticketId } }),
			client.prisma.archivedChannel.deleteMany({ where: { ticketId } }),
			client.prisma.questionAnswer.deleteMany({ where: { ticketId } }),
			client.prisma.feedback.deleteMany({ where: { ticketId } }),
			client.prisma.ticket.updateMany({
				data: { htmlTranscript: null },
				where: {
					htmlTranscript: { not: null },
					id: ticketId,
				},
			}),
		]);

		// After the commit, best-effort, as everywhere else: an orphaned file is
		// tidied up by `scripts/transcripts.mjs --gc`, a file deleted for a row
		// that survived a rollback is not recoverable.
		totals.files += await deleteTranscripts(client, batch);
		totals.tickets += batch.length;
		totals.messages += messages.count;
		totals.users += users.count;
		totals.roles += roles.count;
		totals.channels += channels.count;
		totals.answers += answers.count;
		totals.feedback += feedback.count;
		heartbeat();
		if (batch.length < batchSize) break;
	}

	client.log.info(
		'Transcript retention: %d tickets closed before %s, %d messages, %d users, %d roles, %d channels, %d answers, %d feedback, %d files deleted',
		totals.tickets,
		cutoff.toISOString().slice(0, 10),
		totals.messages,
		totals.users,
		totals.roles,
		totals.channels,
		totals.answers,
		totals.feedback,
		totals.files,
	);
	return totals;
}

module.exports = {
	BATCH_SIZE,
	TRANSCRIPT_RETENTION_MONTHS,
	purgeExpiredTranscripts,
	retentionCutoff,
};
