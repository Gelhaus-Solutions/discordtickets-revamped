const { Listener } = require('@eartharoid/dbf');
const temporal = require('../../lib/temporal');

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
	}
};
