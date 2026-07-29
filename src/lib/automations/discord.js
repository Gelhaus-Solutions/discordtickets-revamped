/**
 * The Discord side-effects automations need that nothing else in the bot did.
 *
 * Role management is entirely new — before automations, this bot never added or
 * removed a role. That makes it the one place where a misconfiguration has
 * consequences outside the ticket system, so every precondition is checked
 * *before* the API call and reported as its own status rather than surfacing as
 * a generic 403 in the run log.
 */

const { PermissionFlagsBits } = require('discord.js');

/** How long a role change made by an automation suppresses the matching trigger. */
const SUPPRESS_MS = 10_000;

const suppressKey = (guildId, userId, roleId) => `automations/suppress-role:${guildId}-${userId}-${roleId}`;

/**
 * Was this role change made by an automation moments ago?
 *
 * `guildMemberUpdate` asks before firing `trigger.member.role*`. Without it, an
 * automation that adds a role in response to a role being added re-triggers
 * itself; the depth counter would eventually stop it, but only after doing the
 * work several times. Validation rejects the obvious same-role case at save
 * time — this catches the ones built out of two automations pointing at each
 * other.
 */
async function isSuppressed(client, guildId, userId, roleId) {
	return Boolean(await client.keyv.get(suppressKey(guildId, userId, roleId)));
}

/**
 * Everything that has to be true before the bot can touch a role.
 *
 * @returns {Promise<{ok: boolean, reason?: string, guild?: *, member?: *, role?: *}>}
 */
async function checkRole(client, {
	guildId, roleId, userId,
}) {
	const guild = client.guilds.cache.get(guildId);
	if (!guild) {
		return {
			ok: false,
			reason: 'unknown_guild',
		};
	}

	const me = guild.members.me ?? await guild.members.fetchMe().catch(() => null);
	if (!me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
		return {
			ok: false,
			reason: 'missing_permissions',
		};
	}

	const role = guild.roles.cache.get(roleId) ?? await guild.roles.fetch(roleId).catch(() => null);
	if (!role) {
		return {
			ok: false,
			reason: 'unknown_role',
		};
	}
	// @everyone cannot be assigned, and a managed role belongs to an integration
	// or a boost — Discord rejects both, so say which it was.
	if (role.id === guild.id || role.managed) {
		return {
			ok: false,
			reason: 'unmanageable_role',
		};
	}
	// Discord only lets a bot touch roles below its own highest.
	if (role.position >= me.roles.highest.position) {
		return {
			ok: false,
			reason: 'role_too_high',
		};
	}

	const member = await guild.members.fetch(userId).catch(() => null);
	if (!member) {
		return {
			ok: false,
			reason: 'unknown_member',
		};
	}

	return {
		guild,
		member,
		ok: true,
		role,
	};
}

/**
 * Give a member a role.
 *
 * @returns {Promise<{ok: boolean, reason?: string}>} `reason: 'noop'` when they
 * already had it, so a re-run is cheap and the run log stays honest about what
 * actually changed.
 */
async function addRole(client, {
	guildId, reason, roleId, userId,
}) {
	const check = await checkRole(client, {
		guildId,
		roleId,
		userId,
	});
	if (!check.ok) return check;
	if (check.member.roles.cache.has(roleId)) {
		return {
			ok: true,
			reason: 'noop',
		};
	}

	// Set before the call, not after: the gateway event can arrive while the
	// REST request is still resolving.
	await client.keyv.set(suppressKey(guildId, userId, roleId), true, SUPPRESS_MS);
	await check.member.roles.add(roleId, reason ?? 'Automation');
	return { ok: true };
}

/**
 * Take a role away from a member.
 *
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
async function removeRole(client, {
	guildId, reason, roleId, userId,
}) {
	const check = await checkRole(client, {
		guildId,
		roleId,
		userId,
	});
	if (!check.ok) return check;
	if (!check.member.roles.cache.has(roleId)) {
		return {
			ok: true,
			reason: 'noop',
		};
	}

	await client.keyv.set(suppressKey(guildId, userId, roleId), true, SUPPRESS_MS);
	await check.member.roles.remove(roleId, reason ?? 'Automation');
	return { ok: true };
}

module.exports = {
	SUPPRESS_MS,
	addRole,
	checkRole,
	isSuppressed,
	removeRole,
	suppressKey,
};
