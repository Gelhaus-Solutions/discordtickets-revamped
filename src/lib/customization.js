const {
	PermissionFlagsBits, Routes,
} = require('discord.js');

/** Columns holding a guild's bot profile. */
const SELECT = {
	botAvatar: true,
	botBanner: true,
	botBio: true,
	botUsername: true,
	id: true,
};

/**
 * Build the Discord "Modify Current Member" body from stored columns.
 *
 * Only fields that are actually set are included: a `null` column means "never
 * customized", and sending `null` would actively clear a nickname or avatar
 * that someone may have set by other means.
 * @param {object} row - Guild row containing the bot* columns.
 * @returns {object} Body for PATCH /guilds/{id}/members/@me.
 */
function buildBody(row) {
	const body = {};
	if (row.botUsername !== null && row.botUsername !== undefined) body.nick = row.botUsername;
	if (row.botAvatar !== null && row.botAvatar !== undefined) body.avatar = row.botAvatar;
	if (row.botBanner !== null && row.botBanner !== undefined) body.banner = row.botBanner;
	if (row.botBio !== null && row.botBio !== undefined) body.bio = row.botBio;
	return body;
}

/**
 * Re-apply a guild's stored bot profile to Discord.
 *
 * Customization is otherwise only pushed at the moment an admin clicks Save, so
 * it was silently lost whenever the bot was kicked and re-added, a moderator
 * reset the nickname, or a database was restored. Failures are logged and
 * swallowed — this runs on startup and must never block it.
 * @param {import('client')} client
 * @param {string} guildId
 * @param {object} [row] - Pre-fetched columns; fetched when omitted.
 * @returns {Promise<boolean>} Whether anything was applied.
 */
async function applyCustomization(client, guildId, row) {
	try {
		const data = row ?? await client.prisma.guild.findUnique({
			select: SELECT,
			where: { id: guildId },
		});
		if (!data) return false;

		const body = buildBody(data);
		if (Object.keys(body).length === 0) return false;

		const guild = client.guilds.cache.get(guildId);
		if (!guild) return false;

		if ('nick' in body) {
			const me = guild.members.me ?? await guild.members.fetch(client.user.id).catch(() => null);
			if (!me?.permissions?.has(PermissionFlagsBits.ChangeNickname)) {
				client.log.warn('Cannot reapply bot nickname in "%s": missing Change Nickname', guild.name);
				delete body.nick;
				if (Object.keys(body).length === 0) return false;
			}
		}

		await client.rest.patch(Routes.guildMember(guildId, '@me'), { body });
		return true;
	} catch (error) {
		client.log.warn('Failed to reapply customization for guild %s: %s', guildId, error?.message ?? error);
		return false;
	}
}

/**
 * Re-apply stored bot profiles across every guild that has one.
 *
 * Only rows with at least one field set are read, so guilds that never used the
 * feature don't pull their (potentially multi-megabyte) avatar columns at boot.
 * @param {import('client')} client
 * @returns {Promise<number>} How many guilds were updated.
 */
async function reconcileCustomization(client) {
	let applied = 0;
	try {
		const rows = await client.prisma.guild.findMany({
			select: SELECT,
			where: {
				OR: [
					{ botUsername: { not: null } },
					{ botAvatar: { not: null } },
					{ botBanner: { not: null } },
					{ botBio: { not: null } },
				],
			},
		});
		for (const row of rows) {
			if (await applyCustomization(client, row.id, row)) applied++;
		}
		if (rows.length) client.log.info(`Reapplied bot customization in ${applied}/${rows.length} guilds`);
	} catch (error) {
		client.log.warn('Customization reconcile sweep failed: %s', error?.message ?? error);
	}
	return applied;
}

module.exports = {
	applyCustomization,
	reconcileCustomization,
};
