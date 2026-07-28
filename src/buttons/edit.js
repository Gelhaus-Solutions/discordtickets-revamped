const { Button } = require('@eartharoid/dbf');
const {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} = require('discord.js');
const {
	buildQuestionComponents,
	isAnswerable,
} = require('../lib/tickets/questions');
const { pools } = require('../lib/threads');

const { crypto } = pools;

module.exports = class EditButton extends Button {
	constructor(client, options) {
		super(client, {
			...options,
			id: 'edit',
		});
	}

	async run(id, interaction) {
		/** @type {import("client")} */
		const client = this.client;

		const ticket = await client.prisma.ticket.findUnique({
			select: {
				category: { select: { name: true } },
				guild: { select: { locale: true } },
				questionAnswers: { include: { question: true } },
				topic: true,
			},
			where: { id: interaction.channel.id },
		});

		const getMessage = client.i18n.getLocale(ticket.guild.locale);

		if (ticket.questionAnswers.length === 0) {
			const field = new TextInputBuilder()
				.setCustomId('topic')
				.setLabel(getMessage('modals.topic.label'))
				.setStyle(TextInputStyle.Paragraph)
				.setMaxLength(100)
				.setMinLength(5)
				.setPlaceholder(getMessage('modals.topic.placeholder'))
				.setRequired(true);
			if (ticket.topic) field.setValue(await crypto.queue(w => w.decrypt(ticket.topic)));
			await interaction.showModal(
				new ModalBuilder()
					.setCustomId(JSON.stringify({
						action: 'topic',
						edit: true,
					}))
					.setTitle(ticket.category.name)
					.setComponents(
						new ActionRowBuilder()
							.setComponents(field),
					),
			);
		} else {
			// Components are keyed by *answer* id here, not question id, so the
			// questions modal knows which row each submitted value updates. The
			// prefill map stays keyed by question id, which is what the builder
			// looks values up by.
			const answers = ticket.questionAnswers
				.filter(answer => answer.question && isAnswerable(answer.question))
				.sort((a, b) => a.question.order - b.question.order);
			const answerIds = new Map(answers.map(answer => [answer.question.id, answer.id]));
			const prefill = new Map(
				await Promise.all(answers.map(async answer => [
					answer.question.id,
					answer.value ? await crypto.queue(w => w.decrypt(answer.value)) : '',
				])),
			);
			await interaction.showModal(
				new ModalBuilder()
					.setCustomId(JSON.stringify({
						action: 'questions',
						edit: true,
					}))
					.setTitle(ticket.category.name)
					.setComponents(
						buildQuestionComponents(answers.map(answer => answer.question), {
							customIdFor: question => String(answerIds.get(question.id)),
							prefill,
						}),
					),
			);
		}
	}
};
