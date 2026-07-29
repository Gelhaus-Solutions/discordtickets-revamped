const { Listener } = require('@eartharoid/dbf');
const temporal = require('../../lib/temporal');
const { emit } = require('../../lib/automations/dispatcher');

module.exports = class extends Listener {
	constructor(client, options) {
		super(client, {
			...options,
			emitter: client,
			event: 'guildMemberRemove',
		});
	}

	/**
	 *
	 * @param {import("discord.js").GuildMember} member
	 */
	async run(member) {
		/** @type {import("client")} */
		const client = this.client;

		// Durable parent workflow fans out to a child close per open ticket.
		await temporal.startCascadeCloseUser({
			guildId: member.guild.id,
			reason: 'user left server',
			userId: member.id,
		}).catch(err => client.log.error(err));

		// No `member` capability: they are already gone, so an automation can act
		// on their id but cannot fetch them.
		emit(client, 'trigger.member.left', {
			guildId: member.guild.id,
			userId: member.id,
			vars: { name: member.user?.username },
		});
	}
};
