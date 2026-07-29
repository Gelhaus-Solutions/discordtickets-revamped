const { Button } = require('@eartharoid/dbf');
const { MessageFlags } = require('discord.js');
const { emit } = require('../lib/automations/dispatcher');
const { triggerNodes } = require('../lib/automations/validate');

/**
 * Buttons placed by an admin that set an automation off.
 *
 * The custom_id is `{"action":"auto","k":"<automation key>"}` — 31 characters,
 * against Discord's 100-character limit, which this codebase is already close
 * to. That is why `Automation.key` is a short generated handle rather than the
 * autoincrement primary key.
 *
 * ## Acknowledge first. Always.
 *
 * Discord gives an interaction **3 seconds** before it is dead, and an
 * automation can easily take longer — it may fetch members, call the Discord
 * API several times, or wait on the database. So this handler acknowledges
 * *before* dispatching, and `action.message.reply` edits that acknowledgement
 * afterwards.
 *
 * Getting this wrong does not throw anything you would notice in a log; it
 * shows the user "This interaction failed" and nothing else. Do not move the
 * dispatch above the acknowledgement.
 */
module.exports = class AutomationButton extends Button {
	constructor(client, options) {
		super(client, {
			...options,
			id: 'auto',
		});
	}

	/**
	 * @param {{k: string}} id the parsed custom_id
	 * @param {import("discord.js").ButtonInteraction} interaction
	 */
	async run(id, interaction) {
		/** @type {import("client")} */
		const client = this.client;

		const automations = await client.automations.getForGuild(interaction.guildId);
		const automation = automations.find(a => a.key === id.k);

		// `id.n` names the trigger node, because one graph may hold several of
		// them. Buttons posted before that existed carry no `n`, so they fall back
		// to the graph's only button trigger — which is exactly what they meant.
		const triggers = automation ? triggerNodes(automation.graph).filter(n => n.type === 'trigger.button.pressed') : [];
		const node = id.n
			? triggers.find(n => n.id === id.n)
			: (triggers.length === 1 ? triggers[0] : null);

		// The automation was deleted or disabled after the message was posted.
		// `buildButton` skips unknown keys when rendering, but a live message can
		// outlive the automation it points at.
		if (!automation || !node) {
			return await interaction.reply({
				content: 'That button is no longer connected to anything.',
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

		emit(client, 'trigger.button.pressed', {
			nodeId: node.id,
			categoryId: ticket?.categoryId,
			channelId: interaction.channelId,
			guildId: interaction.guildId,
			interaction,
			messageId: interaction.message?.id,
			ticketId: ticket?.id,
			userId: interaction.user.id,
			vars: {
				displayname: interaction.member?.displayName,
				name: interaction.user.username,
			},
		});
	}
};
