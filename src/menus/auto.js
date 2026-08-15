const { Menu } = require('@eartharoid/dbf');
const { MessageFlags } = require('discord.js');
const { emit } = require('../lib/automations/dispatcher');
const { triggerNodes } = require('../lib/automations/validate');

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
		const automation = automations.find(a => a.key === id.k);

		// `id.n` names the trigger node, because one graph may hold several of
		// them. Buttons posted before that existed carry no `n`, so they fall back
		// to the graph's only menu trigger — which is exactly what they meant.
		const triggers = automation ? triggerNodes(automation.graph).filter(n => n.type === 'trigger.menu.selected') : [];
		const node = id.n
			? triggers.find(n => n.id === id.n)
			: (triggers.length === 1 ? triggers[0] : null);

		if (!automation || !node) {
			return await interaction.reply({
				content: 'That menu is no longer connected to anything.',
				flags: MessageFlags.Ephemeral,
			});
		}

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
			// See the same line in src/buttons/auto.js: the node id alone would let
			// a duplicate of this automation answer this menu too.
			automationKey: automation.key,
			categoryId: ticket?.categoryId,
			channelId: interaction.channelId,
			guildId: interaction.guildId,
			interaction,
			messageId: interaction.message?.id,
			nodeId: node.id,
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
