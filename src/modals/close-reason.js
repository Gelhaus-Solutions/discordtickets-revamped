const { Modal } = require('@eartharoid/dbf');

/**
 * Submission of the "Close with Reason" modal opened by the close-reason button.
 * Hands off to the same close path as `/close reason:...`, passing the reason
 * explicitly because a modal interaction has no `options`.
 */
module.exports = class CloseReasonModal extends Modal {
	constructor(client, options) {
		super(client, {
			...options,
			id: 'close-reason',
		});
	}

	/**
	 * @param {*} id
	 * @param {import("discord.js").ModalSubmitInteraction} interaction
	 */
	async run(id, interaction) {
		/** @type {import("client")} */
		const client = this.client;
		const reason = interaction.fields.getTextInputValue('reason')?.trim() || null;
		await client.tickets.beforeRequestClose(interaction, reason);
	}
};
