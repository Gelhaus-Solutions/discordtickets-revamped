const { Modal } = require('@eartharoid/dbf');
const {
	EmbedBuilder, MessageFlags,
} = require('discord.js');
const ExtendedEmbedBuilder = require('../lib/embed');
const { logTicketEvent } = require('../lib/logging');
const { rerenderOpeningMessage } = require('../lib/tickets/opening-message');
const {
	formatAnswer,
	isAnswerable,
	readAnswers,
} = require('../lib/tickets/questions');
const { pools } = require('../lib/threads');
const { cleanCodeBlockContent } = require('discord.js');

const { crypto } = pools;

module.exports = class QuestionsModal extends Modal {
	constructor(client, options) {
		super(client, {
			...options,
			id: 'questions',
		});
	}

	/**
	 *
	 * @param {*} id
	 * @param {import("discord.js").ModalSubmitInteraction} interaction
	 */
	async run(id, interaction) {
		/** @type {import("client")} */
		const client = this.client;

		if (id.edit) {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const { category } = await client.prisma.ticket.findUnique({
				select: { category: { select: { customTopic: true } } },
				where: { id: interaction.channel.id },
			});
			const select = {
				createdById: true,
				guild: {
					select: {
						footer: true,
						locale: true,
						primaryColour: true,
						successColour: true,
					},
				},
				id: true,
				openingMessageId: true,
				questionAnswers: { include: { question: true } },
			};
			const original = await client.prisma.ticket.findUnique({
				select,
				where: { id: interaction.channel.id },
			});

			// The modal is keyed by answer id, and only carries the answerable
			// questions (a TEXT_DISPLAY block has no field to read back). Iterating
			// the stored answers rather than `interaction.fields.fields` is what makes
			// non-text types work: the old version assumed every field had a plain
			// `.value`, which is only true of text inputs.
			const answers = original.questionAnswers
				.filter(answer => answer.question && isAnswerable(answer.question))
				.sort((a, b) => a.question.order - b.question.order);
			const answerIds = new Map(answers.map(answer => [answer.question.id, answer.id]));
			const submitted = readAnswers(interaction, answers.map(answer => answer.question), { customIdFor: question => String(answerIds.get(question.id)) });

			// Uploads have to be re-posted for the same reason they are on creation:
			// the modal's attachment URLs expire.
			await client.tickets.repostUploads(submitted, interaction.channel);

			const plainTextAnswers = await Promise.all(
				submitted.map(async (entry, i) => {
					const answer = answers[i];
					const before = answer.value ? await crypto.queue(w => w.decrypt(answer.value)) : '';
					// Discord sends an empty upload field when the user leaves the
					// existing files alone, which is indistinguishable from clearing
					// them — so an empty submission keeps what was already there.
					const after = entry.question.type === 'FILE_UPLOAD' && (!entry.value || entry.value === '[]')
						? before
						: entry.value;
					return {
						after,
						before,
						id: answer.id,
						question: entry.question,
					};
				}),
			);

			let topic;
			if (category.customTopic) {
				const customTopicAnswer = plainTextAnswers.find(a => a.question.id === category.customTopic);
				if (!customTopicAnswer) throw new Error('Custom topic answer not found');
				// Only a text question can supply the topic; anything else stores JSON.
				if (customTopicAnswer.question.type === 'TEXT') topic = customTopicAnswer.after;
			}

			const ticket = await client.prisma.ticket.update({
				data: {
					questionAnswers: {
						update: await Promise.all(
							plainTextAnswers.map(async answer => ({
								data: { value: answer.after ? await crypto.queue(w => w.encrypt(answer.after)) : '' },
								where: { id: answer.id },
							})),
						),
					},
					topic: topic ? await crypto.queue(w => w.encrypt(topic)) : null,
				},
				select,
				where: { id: interaction.channel.id },
			});
			const getMessage = client.i18n.getLocale(ticket.guild.locale);

			if (topic) await interaction.channel.setTopic(`<@${ticket.createdById}> | ${topic}`);

			// Re-render from the category's layout, passing the freshly submitted
			// answers. The previous version patched `embeds[1]` behind an
			// `embeds.length >= 2` check that a Components v2 message never
			// satisfies, so edits were saved but never displayed.
			await rerenderOpeningMessage(client, interaction.channel, {
				answers: plainTextAnswers.map(a => ({
					label: a.question.label,
					value: formatAnswer(a.question, a.after, { getMessage }),
				})),
				topic,
			}).catch(error => client.log.warn('Failed to update opening message after answer edit: %s', error.message));

			await interaction.editReply({
				embeds: [
					new ExtendedEmbedBuilder({
						iconURL: interaction.guild.iconURL(),
						text: ticket.guild.footer,
					})
						.setColor(ticket.guild.successColour)
						.setTitle(getMessage('ticket.edited.title'))
						.setDescription(getMessage('ticket.edited.description')),
				],
			});

			const diff = {
				original: {},
				updated: {},
			};
			const inlineDiffEmbeds = [];

			for (const answer of plainTextAnswers) {
				// The log and the diff show what a human chose, not the JSON the
				// non-text types are stored as.
				const before = formatAnswer(answer.question, answer.before, { getMessage });
				const after = formatAnswer(answer.question, answer.after, { getMessage });
				diff.original[answer.question.label] = before;
				diff.updated[answer.question.label] = after;
				if (answer.before !== answer.after) {
					const from = answer.before ? before.replace(/^/gm, '- ') + '\n' : '';
					const to = answer.after ? after.replace(/^/gm, '+ ') + '\n' : '';
					inlineDiffEmbeds.push(
						new EmbedBuilder()
							.setColor(ticket.guild.primaryColour)
							.setAuthor({
								iconURL: interaction.member.displayAvatarURL(),
								name: interaction.user.username,
							})
							.setTitle(answer.question.label)
							.setDescription(`\`\`\`diff\n${cleanCodeBlockContent(from + to)}\n\`\`\``),
					);
				}
			}

			if (inlineDiffEmbeds.length) {
				await interaction.followUp({ embeds: inlineDiffEmbeds });
			}

			logTicketEvent(this.client, {
				action: 'update',
				diff,
				target: {
					id: ticket.id,
					name: `<#${ticket.id}>`,
				},
				userId: interaction.user.id,
			});
		} else {
			await this.client.tickets.postQuestions({
				...id,
				interaction,
			});
		}
	}
};
