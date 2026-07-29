const { Menu } = require('@eartharoid/dbf');
const { MessageFlags } = require('discord.js');
const { emit } = require('../lib/automations/dispatcher');
const { triggerNode } = require('../lib/automations/validate');

/**
 * Select menus placed by an admin that set an automation off.
 *
 * The sibling of `src/buttons/auto.js`, and the same hard rule applies:
 * **acknowledge before dispatching**, because Discord's 3-second window is
 * shorter than an automation can take. See that file for why.
 *
 * What a menu adds is `selection` — the chosen values — which becomes the
 * `selection` capability on the run context.
 */
module.exports = class AutomationMenu extends Menu {
	constructor(client, options) {
		super(client, {
			...options,
			id: 'auto',
		});
	}

	/**
	 * @param {{k: string}} id the parsed custom_id
	 * @param {import("discord.js").StringSelectMenuInteraction} interaction
	 */
	async run(id, interaction) {
		/** @type {import("client")} */
		const client = this.client;

		const automations = await client.automations.getForGuild(interaction.guildId);
		const automation = automations.find(a => a.key === id.k && a.triggerType === 'trigger.menu.selected');

		if (!automation) {
			return await interaction.reply({
				content: 'That menu is no longer connected to anything.',
				flags: MessageFlags.Ephemeral,
			});
		}

		const node = triggerNode(automation.graph);
		if (node?.params?.ack === 'none') await interaction.deferUpdate();
		else await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const ticket = await client.prisma.ticket.findUnique({
			select: {
				categoryId: true,
				id: true,
			},
			where: { id: interaction.channelId },
		});

		emit(client, 'trigger.menu.selected', {
			categoryId: ticket?.categoryId,
			channelId: interaction.channelId,
			guildId: interaction.guildId,
			interaction,
			messageId: interaction.message?.id,
			selection: interaction.values,
			ticketId: ticket?.id,
			userId: interaction.user.id,
			vars: {
				displayname: interaction.member?.displayName,
				name: interaction.user.username,
			},
		});
	}
};
