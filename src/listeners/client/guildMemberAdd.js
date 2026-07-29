const { Listener } = require('@eartharoid/dbf');
const { emit } = require('../../lib/automations/dispatcher');

/**
 * Exists only for `trigger.member.joined`.
 *
 * The bot had no reason to watch joins before automations — the `GuildMembers`
 * intent was already requested for staff resolution, so this needs no privileged
 * intent change.
 */
module.exports = class GuildMemberAddListener extends Listener {
	constructor(client, options) {
		super(client, {
			...options,
			emitter: client,
			event: 'guildMemberAdd',
		});
	}

	/**
	 * @param {import("discord.js").GuildMember} member
	 */
	async run(member) {
		if (member.user.bot) return;
		emit(this.client, 'trigger.member.joined', {
			guildId: member.guild.id,
			userId: member.id,
			vars: {
				displayname: member.displayName,
				name: member.user.username,
			},
		});
	}
};
