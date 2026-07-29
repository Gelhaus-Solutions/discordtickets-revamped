const { Listener } = require('@eartharoid/dbf');
const temporal = require('../../lib/temporal');
const { schedulesFor } = require('../../lib/automations/schedules');

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
			const automations = await client.prisma.automation.findMany({
				select: {
					enabled: true,
					graph: true,
					guildId: true,
					id: true,
					key: true,
				},
				where: { guildId: guild.id },
			});
			// Disabled ones have no schedules, but a graph's cron nodes are the same
			// either way — force `enabled` so every one gets torn down.
			for (const automation of automations) {
				for (const schedule of schedulesFor({
					...automation,
					enabled: true,
				})) {
					await temporal.deleteAutomationSchedule(schedule.guildId, schedule.key, schedule.nodeId);
				}
			}
		} catch (error) {
			client.log.warn('Could not remove automation schedules for %s: %s', guild.id, error?.message ?? error);
		}
	}
};
