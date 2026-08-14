const { Listener } = require('@eartharoid/dbf');
const temporal = require('../../lib/temporal');

module.exports = class extends Listener {
	constructor(client, options) {
		super(client, {
			...options,
			emitter: client,
			event: 'channelDelete',
		});
	}

	async run(channel) {
		/** @type {import("client")} */
		const client = this.client;

		// Panels in a deleted channel keep their rows — the layout is worth
		// preserving — but lose their message id, so the dashboard reports them
		// as needing a new channel rather than silently pointing at nothing.
		await client.prisma.panel.updateMany({
			data: { messageId: null },
			where: { channelId: channel.id },
		}).catch(() => null);

		// A staff channel deleted by hand must not leave the ticket pointing at a
		// dead id, or `/private-channel` would refuse to make a new one forever.
		// This never matches the ticket's own channel — a ticket's id *is* that
		// channel — so it cannot interfere with the close below.
		await client.prisma.ticket.updateMany({
			data: { staffChannelId: null },
			where: { staffChannelId: channel.id },
		}).catch(() => null);

		const ticket = await client.prisma.ticket.findUnique({
			include: { guild: true },
			where: { id: channel.id },
		});

		if (ticket?.open) {
			await temporal.startCloseTicket({
				reason: 'channel deleted',
				ticketId: ticket.id,
			}).catch(err => client.log.error(err));
			this.client.log.info.tickets(`Closing ticket ${ticket.id} because the channel was deleted`);
		}
	}
};
