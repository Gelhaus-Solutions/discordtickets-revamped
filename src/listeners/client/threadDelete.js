const { Listener } = require('@eartharoid/dbf');

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
			await client.tickets.finallyClose(ticket.id, { reason: 'thread deleted' });
			client.log.info.tickets(`Closed ticket ${ticket.id} because the thread was deleted`);
		}
	}
};
