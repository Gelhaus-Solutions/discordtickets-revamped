const { Modal } = require('@eartharoid/dbf');
const ExtendedEmbedBuilder = require('../lib/embed');
const { MessageFlags } = require('discord.js');
const { pools } = require('../lib/threads');
const { emit } = require('../lib/automations/dispatcher');
const { readAnswers } = require('../lib/tickets/questions');
const {
	feedbackQuestionsFor,
	projectFeedback,
} = require('../lib/tickets/feedback');

const { crypto } = pools;
module.exports = class FeedbackModal extends Modal {
	constructor(client, options) {
		super(client, {
			...options,
			id: 'feedback',
		});
	}

	/**
	 * @param {*} id
	 * @param {import("discord.js").ModalSubmitInteraction} interaction
	 */
	async run(id, interaction) {
		/** @type {import("client")} */
		const client = this.client;

		await interaction.deferReply();

		const ticketId = interaction.channel.id;
		const cached = await client.tickets.getTicket(ticketId);
		const getMessage = client.i18n.getLocale(cached.guild.locale);

		// The same set the modal was built from, resolved the same way. A question
		// added or removed while the modal was open is handled by `readAnswers`,
		// which guards each read individually rather than losing the whole
		// submission.
		const questions = feedbackQuestionsFor(cached.category, getMessage);
		const answers = readAnswers(interaction, questions);

		// `rating` and `comment` are projections of the answers kept for the
		// readers that want them cheaply — the aggregates, the closing DM, the
		// staff log embed, the transcript and `{avgRating}`. See the comment on the
		// Feedback model. Projected before encryption, because the comment is
		// stored encrypted in both places.
		const projected = projectFeedback(answers);

		const encrypt = value => (value?.length > 0 ? crypto.queue(w => w.encrypt(value)) : null);
		const [comment, ...values] = await Promise.all([
			encrypt(projected.comment),
			...answers.map(answer => encrypt(answer.value)),
		]);

		const answerRows = answers.map((answer, i) => ({
			label: String(answer.question.label ?? '').slice(0, 45),
			questionId: String(answer.question.id),
			type: answer.question.type,
			value: values[i],
		}));

		const data = {
			comment,
			guild: { connect: { id: interaction.guild.id } },
			rating: projected.rating,
			user: { connect: { id: interaction.user.id } },
		};
		const nestedAnswers = { createMany: { data: answerRows } };

		// Resubmitting replaces the previous answers rather than adding to them: a
		// second submission is a correction, not a second review, and `Feedback` is
		// keyed by ticket so there is only ever one row to correct.
		//
		// The delete is a *separate* operation on purpose. Prisma runs the nested
		// writes of a single `update` in its own order, and it creates before it
		// deletes — so `answers: { createMany, deleteMany }` inserts the new rows
		// and then deletes them along with the old ones, leaving no answers at all.
		// Verified against Postgres 16 with both `create` and `createMany`.
		//
		// `$transaction` rather than two awaits so a crash between them cannot
		// leave a submission with its answers deleted and its projected columns
		// still showing the old ones.
		const [, ticket] = await client.prisma.$transaction([
			client.prisma.feedbackAnswer.deleteMany({ where: { ticketId } }),
			client.prisma.ticket.update({
				data: {
					feedback: {
						upsert: {
							create: {
								...data,
								answers: nestedAnswers,
							},
							update: {
								...data,
								answers: nestedAnswers,
							},
						},
					},
				},
				include: { guild: true },
				where: { id: ticketId },
			}),
		]);

		// `getTicket` caches the ticket with its feedback for three minutes, so
		// without this the ticket still reads as unrated: the modal is offered
		// again on the next close, and the closing DM and log embed omit the rating
		// that was just given.
		await client.keyv.delete(`cache/ticket+category+feedback+guild:${ticketId}`);

		emit(client, 'trigger.ticket.feedback', {
			categoryId: ticket.categoryId,
			guildId: ticket.guildId,
			rating: projected.rating,
			ticketId: ticket.id,
			userId: interaction.user.id,
		});

		if (id.next === 'requestClose') await client.tickets.requestClose(interaction, id.reason);
		else if (id.next === 'acceptClose') await client.tickets.acceptClose(interaction);

		// `followUp` must go after `reply`/`editReply` (the above). Thanking them
		// is for having written something, so it is keyed off the comment rather
		// than off the rating — a form with no comment question never shows it.
		if (projected.comment) {
			await interaction.followUp({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: ticket.guild.footer,
					})
						.setColor(ticket.guild.primaryColour)
						.setDescription(getMessage('ticket.feedback')),
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	}
};
