const { Listener } = require('@eartharoid/dbf');
const temporal = require('../../lib/temporal');

module.exports = class extends Listener {
	constructor(client, options) {
		super(client, {
			...options,
			emitter: client,
			event: 'threadDelete',
		});
	}

	async run(thread) {
		/** @type {import("client")} */
		const client = this.client;

		// Threads used as ticket channels store the thread id as ticket.id
		const ticket = await client.prisma.ticket.findUnique({
			include: { guild: true },
			where: { id: thread.id },
		});

		if (ticket?.open) {
			await temporal.startCloseTicket({
				reason: 'thread deleted',
				ticketId: ticket.id,
			}).catch(err => client.log.error(err));
			client.log.info.tickets(`Closing ticket ${ticket.id} because the thread was deleted`);
		}
	}
};
