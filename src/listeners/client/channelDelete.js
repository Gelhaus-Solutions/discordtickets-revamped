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
