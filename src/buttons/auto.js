const { Button } = require('@eartharoid/dbf');
const { MessageFlags } = require('discord.js');
const { emit } = require('../lib/automations/dispatcher');
const {
	entryButtonTriggers,
	triggerNodes,
} = require('../lib/automations/validate');

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
		// them. Two kinds of button carry no `n` and must name one themselves:
		// those posted before `n` existed, and ticket-controls buttons, which
		// reference an automation by key alone (see `buildButton` in
		// ../lib/components-v2.js — the editor offers no way to pick a node).
		//
		// That fallback used to be "the graph's only button trigger", which broke
		// the moment anyone added a confirm/cancel step: those add button triggers
		// of their own, the count stopped being 1, and a working panel button
		// started answering "no longer connected to anything". Prefer the entry
		// trigger instead, and only give up when it is genuinely ambiguous.
		const triggers = automation ? triggerNodes(automation.graph).filter(n => n.type === 'trigger.button.pressed') : [];
		let node = null;
		if (id.n) {
			node = triggers.find(n => n.id === id.n) ?? null;
		} else if (triggers.length === 1) {
			node = triggers[0];
		} else if (automation) {
			const entries = entryButtonTriggers(automation.graph);
			if (entries.length === 1) node = entries[0];
		}

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
