const { expose } = require('threads/worker');
const { encrypt } = require('../crypto');
const {
	ARCHIVED_CHANNEL_FIELDS,
	ARCHIVED_MESSAGE_FIELDS,
	ARCHIVED_ROLE_FIELDS,
	ARCHIVED_USER_FIELDS,
	FEEDBACK_FIELDS,
	QUESTION_ANSWER_FIELDS,
	TICKET_FIELDS,
	pick,
} = require('../schemas/importable');

expose({
	/**
	 * Turn one line of an archive's `tickets.jsonl` into a Prisma create payload.
	 *
	 * Every object here comes from an uploaded file, so nothing is passed
	 * through wholesale: each is rebuilt from the scalar columns of its model.
	 * Passing the parsed JSON on meant an archive could set primary keys, point
	 * `htmlTranscript` at any path on disk, or attach archived messages to a
	 * *different* ticket than the one being imported (`archivedMessages` is
	 * written with `createMany`, which honours whatever `ticketId` it is given).
	 */
	importTicket(stringified, guildId, categoryMap) {
		const raw = JSON.parse(stringified);
		const ticket = pick(raw, TICKET_FIELDS, 'ticket', [
			'archivedChannels',
			'archivedMessages',
			'archivedRoles',
			'archivedUsers',
			'categoryId',
			'feedback',
			'guildId',
			'htmlTranscript',
			'questionAnswers',
		]);
		const ticketId = ticket.id;

		ticket.archivedChannels = {
			create: (raw.archivedChannels ?? []).map(channel =>
				pick(channel, ARCHIVED_CHANNEL_FIELDS, 'archived channel', ['ticketId'])),
		};

		ticket.archivedUsers = {
			create: (raw.archivedUsers ?? []).map(row => {
				const user = pick(row, ARCHIVED_USER_FIELDS, 'archived user', ['ticketId']);
				user.displayName &&= encrypt(user.displayName);
				user.username &&= encrypt(user.username);
				return user;
			}),
		};

		ticket.archivedRoles = {
			create: (raw.archivedRoles ?? []).map(row =>
				pick(row, ARCHIVED_ROLE_FIELDS, 'archived role', ['ticketId'])),
		};

		// Messages are inserted with a single createMany after all the tickets
		// exist, so they carry their own ticketId — pinned to *this* ticket.
		const messages = (raw.archivedMessages ?? []).map(row => {
			const message = pick(row, ARCHIVED_MESSAGE_FIELDS, 'archived message');
			message.ticketId = ticketId;
			message.content &&= encrypt(message.content);
			return message;
		});

		// Tickets whose category was deleted before the export have no category.
		const categoryId = categoryMap.get(raw.categoryId);
		if (categoryId !== undefined) ticket.category = { connect: { id: categoryId } };

		if (ticket.claimedById) {
			ticket.claimedBy = {
				connectOrCreate: {
					create: { id: ticket.claimedById },
					where: { id: ticket.claimedById },
				},
			};
		}
		delete ticket.claimedById;

		if (ticket.closedById) {
			ticket.closedBy = {
				connectOrCreate: {
					create: { id: ticket.closedById },
					where: { id: ticket.closedById },
				},
			};
		}
		delete ticket.closedById;

		if (ticket.createdById) {
			ticket.createdBy = {
				connectOrCreate: {
					create: { id: ticket.createdById },
					where: { id: ticket.createdById },
				},
			};
		}
		delete ticket.createdById;

		ticket.closedReason &&= encrypt(ticket.closedReason);

		if (raw.feedback) {
			const feedback = pick(raw.feedback, FEEDBACK_FIELDS, 'feedback', ['guildId', 'ticketId']);
			feedback.guild = { connect: { id: guildId } };
			feedback.comment &&= encrypt(feedback.comment);
			if (feedback.userId) {
				feedback.user = {
					connectOrCreate: {
						create: { id: feedback.userId },
						where: { id: feedback.userId },
					},
				};
				delete feedback.userId;
			}
			ticket.feedback = { create: feedback };
		} else {
			ticket.feedback = undefined;
		}

		ticket.guild = { connect: { id: guildId } };

		if (raw.questionAnswers?.length) {
			ticket.questionAnswers = {
				create: raw.questionAnswers.map(row => {
					const answer = pick(row, QUESTION_ANSWER_FIELDS, 'question answer', ['id', 'ticketId']);
					answer.value &&= encrypt(answer.value);
					return answer;
				}),
			};
		} else {
			ticket.questionAnswers = undefined;
		}

		if (ticket.referencesTicketId) {
			ticket.referencesTicket = { connect: { id: ticket.referencesTicketId } };
		}
		delete ticket.referencesTicketId;

		ticket.topic &&= encrypt(ticket.topic);

		return [ticket, messages];

	},
});
