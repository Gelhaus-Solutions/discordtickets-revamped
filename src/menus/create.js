const { Menu } = require('@eartharoid/dbf');

module.exports = class CreateMenu extends Menu {
	constructor(client, options) {
		super(client, {
			...options,
			id: 'create',
		});
	}

	/**
	 * @param {*} id
	 * @param {import("discord.js").SelectMenuInteraction} interaction
	 */
	async run(id, interaction) {
		// A panel's select menu used to be reset by echoing the message's own
		// components back at it. Under Components v2 that would round-trip an
		// entire container tree on every ticket creation, and the edit would drop
		// the IS_COMPONENTS_V2 flag and be rejected. Modern clients clear the
		// selection themselves once the interaction is acknowledged, so the hack
		// is no longer needed — and it never applied to ephemeral pickers anyway.
		await this.client.tickets.create({
			...id,
			categoryId: interaction.values[0],
			interaction,
		});
	}
};
