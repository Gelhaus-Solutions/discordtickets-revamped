const { PermissionsBitField } = require('discord.js');

/**
 *
 * @param {import("discord.js").Client} client
 * @param {string} userId
 * @returns {Promise<Collection<import("discord.js").Guild>}
 */
module.exports.getCommonGuilds = (client, userId) => client.guilds.cache.filter(guild => guild.members.cache.has(userId));

/**
 * Every role that is staff *somewhere* in this guild, cached for `isStaff`.
 *
 * A category's `staffRoles` may be NULL, meaning "use the server-wide default",
 * so the guild's own column is fetched alongside and stood in for it. Getting
 * this wrong is not a cosmetic bug: this list backs every permission decision
 * the bot makes, and a category that inherits would otherwise contribute no
 * staff at all — or throw, since NULL has no spread.
 *
 * @param {import("discord.js").Guild} guild
 * @returns {Promise<string[]>}
 */
const updateStaffRoles = async guild => {
	const {
		categories, staffRoles: guildDefault,
	} = await guild.client.prisma.guild.findUnique({
		select: {
			categories: { select: { staffRoles: true } },
			staffRoles: true,
		},
		where: { id: guild.id },
	});
	const fallback = guildDefault ?? [];
	const staffRoles = [
		...new Set(
			categories.reduce((acc, c) => {
				acc.push(...(c.staffRoles ?? fallback));
				return acc;
			}, []),
		),
	];
	await guild.client.keyv.set(`cache/guild-staff:${guild.id}`, staffRoles);
	return staffRoles;
};

module.exports.updateStaffRoles = updateStaffRoles;

/**
 *
 * @param {import("discord.js").Guild} guild
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
module.exports.isStaff = async (guild, userId) => {
	/** @type {import("client")} */
	const client = guild.client;
	if (client.supers.includes(userId)) return true;
	try {
		const guildMember = guild.members.cache.get(userId) || await guild.members.fetch(userId);
		if (guildMember.permissions.has(PermissionsBitField.Flags.ManageGuild)) return true;
		const staffRoles = await client.keyv.get(`cache/guild-staff:${guild.id}`) || await updateStaffRoles(guild);
		return staffRoles.some(r => guildMember.roles.cache.has(r));
	} catch {
		return false;
	}
};

/**
 *
 * @param {import("discord.js")} member
 * @returns {Promise<number>}
 * 	- `4` = OPERATOR (SUPER)
 *  - `3` = GUILD_OWNER
 *  - `2` = GUILD_ADMIN
 *  - `1` = GUILD_STAFF
 *  - `0` = GUILD_MEMBER
 *  - `-1` = NONE (NOT A MEMBER)
 */
module.exports.getPrivilegeLevel = async member => {
	if (!member) return -1;
	else if (member.guild.client.supers.includes(member.id)) return 4;
	else if (member.guild.ownerId === member.id) return 3;
	else if (member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return 2;
	else if (await this.isStaff(member.guild, member.id)) return 1;
	else return 0;
};
