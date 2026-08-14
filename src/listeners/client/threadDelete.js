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

		// A staff thread deleted by hand must not leave the ticket pointing at a
		// dead id, or `/private-channel` would refuse to make a new one forever.
		// It cannot match the ticket's own thread, whose id *is* the ticket id.
		await client.prisma.ticket.updateMany({
			data: { staffChannelId: null },
			where: { staffChannelId: thread.id },
		}).catch(() => null);

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
