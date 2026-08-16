/**
 * The Discord side-effects automations need that nothing else in the bot did.
 *
 * Role management is entirely new — before automations, this bot never added or
 * removed a role. That makes it the one place where a misconfiguration has
 * consequences outside the ticket system, so every precondition is checked
 * *before* the API call and reported as its own status rather than surfacing as
 * a generic 403 in the run log.
 *
 * Banning and kicking arrived the same way and are held to the same rule, only
 * more so: a role can be handed back, and somebody removed from the server
 * cannot be. `checkModeration` therefore refuses several things Discord itself
 * would happily allow — see the comments on it.
 */

const { PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('../users');

/**
 * The `custom_id` of a button that sets an automation off.
 *
 * About 45 characters with a node id, against Discord's 100-character limit —
 * which this codebase is already close to, and why `Automation.key` is a short
 * generated handle rather than the autoincrement primary key.
 *
 * `n` names which trigger node to start from, because a graph may hold several
 * "a button is pressed" nodes. It is omitted when there is nothing to
 * disambiguate, which is also what every button posted before multi-trigger
 * automations existed looks like — those still resolve to the graph's only
 * button trigger.
 *
 * Defined here so the layout renderer, the `action.message.send` buttons and
 * `src/buttons/auto.js` cannot drift apart; `scripts/check-automations.js` pins
 * the length.
 */
const AUTOMATION_BUTTON_ACTION = 'auto';

const automationCustomId = (key, nodeId = null) => JSON.stringify(nodeId
	? {
		action: AUTOMATION_BUTTON_ACTION,
		k: key,
		n: nodeId,
	}
	: {
		action: AUTOMATION_BUTTON_ACTION,
		k: key,
	});

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

/**
 * Everything that has to be true before the bot removes someone from a server.
 *
 * Discord's own rules are the floor, not the ceiling. `member.bannable` covers
 * the guild owner, the role hierarchy and the bot's permission, and this adds
 * two refusals on top:
 *
 *   - **the bot itself**, which Discord allows and which ends the automation,
 *     the ticket system and every other automation in that server at once.
 *   - **staff**, when the node asks for it. A ban node behind a message-pattern
 *     trigger is one paste away from removing the moderator who quoted the
 *     phrase they were about to ban someone for, and unlike everything else in
 *     this file that mistake cannot be undone by re-running the automation.
 *     Off is a supported choice — a graph built to remove a rogue moderator is
 *     a real thing — but it has to be chosen.
 *
 * The staff check is last because it is the only one that costs a database
 * read: a run stopped by the hierarchy never pays for it.
 *
 * @param {'ban'|'kick'} action
 * @returns {Promise<{ok: boolean, reason?: string, guild?: *, member?: *}>}
 */
async function checkModeration(client, {
	action, guildId, protectStaff = true, userId,
}) {
	const guild = client.guilds.cache.get(guildId);
	if (!guild) {
		return {
			ok: false,
			reason: 'unknown_guild',
		};
	}

	const permission = action === 'ban' ? PermissionFlagsBits.BanMembers : PermissionFlagsBits.KickMembers;
	const me = guild.members.me ?? await guild.members.fetchMe().catch(() => null);
	if (!me?.permissions.has(permission)) {
		return {
			ok: false,
			reason: 'missing_permissions',
		};
	}

	const member = await guild.members.fetch(userId).catch(() => null);
	if (!member) {
		return {
			ok: false,
			reason: 'unknown_member',
		};
	}
	if (member.id === client.user?.id) {
		return {
			ok: false,
			reason: 'self',
		};
	}
	if (member.id === guild.ownerId) {
		return {
			ok: false,
			reason: 'guild_owner',
		};
	}
	// Covers the hierarchy — Discord only lets a bot act on members below its own
	// highest role — and re-checks the permission for us.
	if (!(action === 'ban' ? member.bannable : member.kickable)) {
		return {
			ok: false,
			reason: 'member_too_high',
		};
	}
	if (protectStaff && await isStaff(guild, member.id)) {
		return {
			ok: false,
			reason: 'is_staff',
		};
	}

	return {
		guild,
		member,
		ok: true,
	};
}

/**
 * Ban a member.
 *
 * @param {number} [deleteMessageSeconds] how much of their recent history to
 * delete with them, 0 to seven days. Discord's own parameter, passed straight
 * through.
 * @returns {Promise<{ok: boolean, reason?: string}>} `reason: 'noop'` when they
 * were banned already, so a re-run neither fails nor rewrites the audit log
 * entry that says why they went.
 */
async function banMember(client, {
	deleteMessageSeconds = 0, guildId, protectStaff, reason, userId,
}) {
	const check = await checkModeration(client, {
		action: 'ban',
		guildId,
		protectStaff,
		userId,
	});
	if (!check.ok) return check;

	const existing = await check.guild.bans.fetch(userId).catch(() => null);
	if (existing) {
		return {
			ok: true,
			reason: 'noop',
		};
	}

	await check.guild.bans.create(userId, {
		deleteMessageSeconds,
		reason: reason ?? 'Automation',
	});
	return { ok: true };
}

/**
 * Kick a member.
 *
 * No `noop` case: unlike a ban there is no state to already be in, and someone
 * who is not in the server has already come back as `unknown_member`.
 *
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
async function kickMember(client, {
	guildId, protectStaff, reason, userId,
}) {
	const check = await checkModeration(client, {
		action: 'kick',
		guildId,
		protectStaff,
		userId,
	});
	if (!check.ok) return check;

	await check.member.kick(reason ?? 'Automation');
	return { ok: true };
}

module.exports = {
	AUTOMATION_BUTTON_ACTION,
	SUPPRESS_MS,
	automationCustomId,
	addRole,
	banMember,
	checkModeration,
	checkRole,
	isSuppressed,
	kickMember,
	removeRole,
	suppressKey,
};
