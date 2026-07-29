const { Listener } = require('@eartharoid/dbf');
const temporal = require('../../lib/temporal');

module.exports = class extends Listener {
	constructor(client, options) {
		super(client, {
			...options,
			emitter: client,
			event: 'guildDelete',
		});
	}

	async run(guild) {
		/** @type {import("client")} */
		const client = this.client;
		client.log.info(`Removed from guild ${guild.id} (${guild.name})`);

		// The Guild row survives being kicked, so the automations do too — only
		// their schedules are torn down. Re-adding the bot restores them at the
		// next reconcile, which is the behaviour an admin would expect.
		client.automations?.invalidate(guild.id).catch(() => null);
		try {
			const crons = await client.prisma.automation.findMany({
				select: { key: true },
				where: {
					guildId: guild.id,
					triggerType: 'trigger.schedule.cron',
				},
			});
			for (const { key } of crons) await temporal.deleteAutomationSchedule(guild.id, key);
		} catch (error) {
			client.log.warn('Could not remove automation schedules for %s: %s', guild.id, error?.message ?? error);
		}
	}
};
