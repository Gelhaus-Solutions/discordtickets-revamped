const { Listener } = require('@eartharoid/dbf');
const { emit } = require('../../lib/automations/dispatcher');

/**
 * Role changes, for `trigger.member.roleAdded` / `trigger.member.roleRemoved`.
 *
 * **This is a high-volume event.** Discord fires `guildMemberUpdate` for
 * nickname changes, avatar changes, timeouts, boost state — everything. The
 * overwhelming majority of them touch no roles at all, so the role-set
 * comparison happens first and returns before any cache read, database query or
 * dispatcher call.
 *
 * The suppression check that stops an automation re-triggering itself lives in
 * the dispatcher rather than here, so it applies to every path into these
 * triggers rather than just this one.
 */
module.exports = class GuildMemberUpdateListener extends Listener {
	constructor(client, options) {
		super(client, {
			...options,
			emitter: client,
			event: 'guildMemberUpdate',
		});
	}

	/**
	 * @param {import("discord.js").GuildMember} oldMember
	 * @param {import("discord.js").GuildMember} newMember
	 */
	async run(oldMember, newMember) {
		if (newMember.user.bot) return;

		const before = oldMember.roles.cache;
		const after = newMember.roles.cache;
		// The fast path: identical size and identical membership means this update
		// was about something else entirely.
		if (before.size === after.size && before.every((_, id) => after.has(id))) return;

		const vars = {
			displayname: newMember.displayName,
			name: newMember.user.username,
		};

		for (const [roleId] of after.filter((_, id) => !before.has(id))) {
			emit(this.client, 'trigger.member.roleAdded', {
				guildId: newMember.guild.id,
				roleId,
				userId: newMember.id,
				vars,
			});
		}

		for (const [roleId] of before.filter((_, id) => !after.has(id))) {
			emit(this.client, 'trigger.member.roleRemoved', {
				guildId: newMember.guild.id,
				roleId,
				userId: newMember.id,
				vars,
			});
		}
	}
};
