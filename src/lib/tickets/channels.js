/**
 * How a channel, a thread or a forum post gets made.
 *
 * There was one caller of `guild.channels.create` that mattered, ticket
 * creation, and it grew a branch per `channelMode` inline. Three things then
 * copied the permission-overwrite array out of it (`moveTicket`, `/escalate`,
 * the category POST route) and drifted: the same five permissions spelled out
 * four times, `rateLimitPerUser` applied in the CHANNEL branch and nowhere
 * else, and the private-thread member loop existing in exactly one place.
 *
 * Adding three "create a channel" automation nodes and a per-ticket staff
 * channel on top of that would have made eight copies. So: one function that
 * knows the three modes, one place that builds overwrites, one place that
 * clamps a name.
 *
 * Nothing in here throws. Every caller either has a member waiting on a
 * deferred reply or is an automation run that wants the reason in its trace,
 * and both are better served by `{ok: false, reason}` than by an exception
 * unwinding through a Discord handler. `postQuestions` in particular used to
 * let a missing ManageChannels escape into the framework's dispatcher, which
 * left the member staring at a deferred ephemeral that never resolved.
 *
 * Deliberately thin on dependencies, the same rule `naming.js` states for
 * itself: `discord.js`, `./naming` and the guild-scoping helper from `../misc`
 * (which is `crypto` and nothing else). That keeps it importable from
 * `scripts/check-tickets.js` with no database, no gateway and no Temporal.
 */

const {
	ChannelType,
	RESTJSONErrorCodes,
} = require('discord.js');
const { resolveGuildChannel } = require('../misc');
const {
	clampName,
	renderChannelName,
} = require('./naming');

/** The permissions a ticket participant gets. */
const PARTICIPANT_ALLOW = ['ViewChannel', 'ReadMessageHistory', 'SendMessages', 'EmbedLinks', 'AttachFiles'];

/**
 * Discord's "too many active threads" code.
 *
 * Hardcoded because the pinned `discord-api-types` does not name it, and a
 * thread-per-ticket category hits it long before it hits anything that is
 * named. Same reason `stale-discord-api-types` exists elsewhere in this repo.
 */
const MAXIMUM_ACTIVE_THREADS = 160006;

/** The channel types each mode can be created inside. */
const PARENT_TYPES = {
	CHANNEL: [ChannelType.GuildCategory],
	FORUM: [ChannelType.GuildForum],
	THREAD: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
};

/** How many members a thread will be filled with before the loop gives up. */
const DEFAULT_MEMBER_CAP = 50;

/**
 * Turn a Discord error into one of the reasons a caller can act on.
 *
 * The 50-children-per-category limit is the awkward one: it does not have a
 * code of its own, it comes back as a form-body rejection naming `parent_id`.
 * Reading it as a generic validation failure would tell an admin their name
 * was wrong when their category is full.
 *
 * @param {unknown} error
 * @returns {string}
 */
function classifyError(error) {
	const code = error?.code;
	if (code === RESTJSONErrorCodes.MissingPermissions || code === RESTJSONErrorCodes.MissingAccess) return 'missing_permission';
	if (code === RESTJSONErrorCodes.MaximumNumberOfGuildChannelsReached || code === MAXIMUM_ACTIVE_THREADS) return 'channel_limit';
	if (code === RESTJSONErrorCodes.InvalidFormBodyOrContentType) {
		const fields = error?.rawError?.errors ?? {};
		if ('parent_id' in fields) return 'channel_limit';
		return 'invalid_name';
	}
	if (error?.status === 429 || error?.name === 'RateLimitError') return 'rate_limited';
	return 'create_failed';
}

/**
 * The final channel name, clamped.
 *
 * Takes the template rather than a finished string on purpose. Clamping is
 * load-bearing (see `clampName`): a 100-character template plus a one-character
 * prefix makes Discord reject the whole create call, so a member's ticket
 * simply fails to open. Making this the only place that can forget is the
 * point of the parameter shape.
 *
 * @param {{text?: string, template?: string, prefix?: string, creator?: object, fallback?: string, number?: number}} name
 * @returns {string}
 */
function resolveName(name) {
	if (typeof name === 'string') return clampName(name);
	if (name?.text !== undefined) return clampName(String(name.prefix ?? '') + name.text);
	return clampName(String(name?.prefix ?? '') + renderChannelName(name?.template, {
		creator: name?.creator,
		fallback: name?.fallback ?? '',
		number: name?.number,
	}));
}

/**
 * The overwrite array for a channel only some people should see.
 *
 * Order matters to nobody in Discord but matters here: the four sites this
 * replaces all wrote everyone-deny, bot, users, roles, and keeping it means a
 * diff of the refactor is readable.
 *
 * @param {object} options
 * @param {import("discord.js").Guild} options.guild
 * @param {string} options.clientId
 * @param {{roleIds?: string[], userIds?: string[], allow?: string[]}} [options.access]
 * @param {boolean} [options.everyoneDenied]
 * @returns {object[]}
 */
function buildOverwrites({
	access = {}, clientId, everyoneDenied = true, guild,
}) {
	const allow = access.allow ?? PARTICIPANT_ALLOW;
	return [
		...(everyoneDenied ? [{
			deny: ['ViewChannel'],
			id: guild.roles.everyone.id,
		}] : []),
		{
			allow,
			id: clientId,
		},
		...(access.userIds ?? []).map(id => ({
			allow,
			id,
		})),
		...(access.roleIds ?? []).map(id => ({
			allow,
			id,
		})),
	];
}

/**
 * Everyone who should be added to a private thread, by id.
 *
 * A private thread is only visible to its explicit members: mentioning a role
 * in the opening message does not grant that role's members access, which is
 * why THREAD-mode tickets need this at all.
 *
 * Capped, which the loop this came from was not. A staff role with a few
 * thousand members meant that many sequential `members.add` calls while
 * somebody watched a deferred reply.
 *
 * @param {object} options
 * @param {import("discord.js").Guild} options.guild
 * @param {{roleIds?: string[], userIds?: string[]}} options.access
 * @param {string} options.clientId
 * @param {number} options.memberCap
 * @returns {{ids: string[], truncated: boolean}}
 */
function threadMemberIds({
	access, clientId, guild, memberCap,
}) {
	const ids = new Set([clientId, ...(access.userIds ?? [])]);
	let truncated = false;
	for (const roleId of access.roleIds ?? []) {
		const role = guild.roles.cache.get(roleId);
		if (!role) continue;
		for (const member of role.members.values()) {
			if (ids.size >= memberCap) {
				truncated = true;
				break;
			}
			ids.add(member.id);
		}
		if (truncated) break;
	}
	return {
		ids: [...ids],
		truncated,
	};
}

/**
 * Resolve the channel a new channel/thread/post goes inside.
 *
 * Guild-scoped through `resolveGuildChannel` for the reason that helper
 * documents: an id that arrives from an admin's request would otherwise happily
 * resolve to a channel in somebody else's server.
 *
 * `climbToParent` is what "allow on a parent thread" means. Discord has no
 * thread inside a thread, so a thread asked for on a thread is created beside
 * it, on the same channel, rather than failing.
 *
 * @returns {{ok: true, parent: object|null} | {ok: false, reason: string}}
 */
function resolveParent(client, {
	climbToParent, guild, mode, parentId,
}) {
	if (!parentId) {
		// Only a plain channel can be created with no parent, at the top of the
		// channel list. A thread or a post has nothing to hang from.
		if (mode === 'CHANNEL') {
			return {
				ok: true,
				parent: null,
			};
		}
		return {
			ok: false,
			reason: 'no_parent',
		};
	}

	let parent = resolveGuildChannel(client, guild.id, parentId);
	if (!parent) {
		return {
			ok: false,
			reason: 'no_parent',
		};
	}

	if (mode === 'THREAD' && parent.isThread?.()) {
		if (!climbToParent) {
			return {
				ok: false,
				reason: 'wrong_parent_type',
			};
		}
		parent = parent.parent;
		if (!parent) {
			return {
				ok: false,
				reason: 'no_parent',
			};
		}
	}

	if (!PARENT_TYPES[mode].includes(parent.type)) {
		return {
			ok: false,
			reason: 'wrong_parent_type',
		};
	}

	return {
		ok: true,
		parent,
	};
}

/**
 * Create a channel, a private thread or a forum post.
 *
 * @param {import('client')} client
 * @param {object} options
 * @param {'CHANNEL'|'THREAD'|'FORUM'} options.mode
 * @param {import("discord.js").Guild} options.guild a live guild; never resolved
 *   from an id in here, because every caller already has one and resolving it
 *   would be a second place that could get the wrong server
 * @param {string} [options.parentId] Discord category (CHANNEL), text channel
 *   (THREAD) or forum (FORUM)
 * @param {object|string} options.name `{template, prefix, creator, fallback,
 *   number}` or `{text}` or a plain string
 * @param {{roleIds?: string[], userIds?: string[], allow?: string[]}} [options.access]
 * @param {boolean} [options.everyoneDenied]
 * @param {number} [options.rateLimitPerUser] seconds
 * @param {string} [options.topic] CHANNEL only
 * @param {string} options.reason audit-log reason
 * @param {object} [options.message] a send payload; required for FORUM, posted
 *   after creation otherwise
 * @param {object} [options.thread] `{private, invitable, autoArchiveDuration,
 *   climbToParent}`
 * @param {number} [options.memberCap]
 * @returns {Promise<{ok: true, channel: object, message?: object, name: string, reason?: string}|{ok: false, reason: string, error?: Error}>}
 */
async function createChannel(client, {
	access = {},
	everyoneDenied = true,
	guild,
	memberCap = DEFAULT_MEMBER_CAP,
	message = null,
	mode = 'CHANNEL',
	name,
	parentId = null,
	rateLimitPerUser = null,
	reason,
	thread = {},
	topic = null,
}) {
	if (!PARENT_TYPES[mode]) {
		return {
			ok: false,
			reason: 'unknown_mode',
		};
	}
	if (mode === 'FORUM' && !message) {
		// A forum post *is* its first message; there is no post without one.
		return {
			ok: false,
			reason: 'no_message',
		};
	}

	const parent = resolveParent(client, {
		climbToParent: thread.climbToParent !== false,
		guild,
		mode,
		parentId,
	});
	if (!parent.ok) return parent;

	const channelName = resolveName(name);
	if (!channelName) {
		return {
			ok: false,
			reason: 'invalid_name',
		};
	}

	let channel;
	let starter;
	let softReason;

	try {
		if (mode === 'CHANNEL') {
			channel = await guild.channels.create({
				name: channelName,
				parent: parent.parent?.id ?? null,
				permissionOverwrites: buildOverwrites({
					access,
					clientId: client.user.id,
					everyoneDenied,
					guild,
				}),
				rateLimitPerUser: rateLimitPerUser ?? undefined,
				reason,
				topic: topic ?? undefined,
			});
		} else if (mode === 'THREAD') {
			channel = await parent.parent.threads.create({
				autoArchiveDuration: thread.autoArchiveDuration ?? 10080, // 7 days
				invitable: thread.invitable ?? false,
				name: channelName,
				rateLimitPerUser: rateLimitPerUser ?? undefined,
				reason,
				type: thread.private === false ? ChannelType.PublicThread : ChannelType.PrivateThread,
			});
		} else {
			channel = await parent.parent.threads.create({
				autoArchiveDuration: thread.autoArchiveDuration ?? 10080,
				message,
				name: channelName,
				rateLimitPerUser: rateLimitPerUser ?? undefined,
				reason,
			});
		}
	} catch (error) {
		client.log?.error?.(error);
		return {
			error,
			ok: false,
			reason: classifyError(error),
		};
	}

	// Past this point the channel exists. Nothing below may return `ok: false`,
	// because a caller that treats a failure as "nothing happened" would abandon
	// a real channel with no row pointing at it.

	if (mode === 'THREAD') {
		const {
			ids, truncated,
		} = threadMemberIds({
			access,
			clientId: client.user.id,
			guild,
			memberCap,
		});
		for (const id of ids) {
			await channel.members.add(id).catch(error =>
				client.log?.warn?.('Could not add %s to thread %s: %s', id, channel.id, error.message),
			);
		}
		if (truncated) softReason = 'members_truncated';
		// An empty expansion means a private thread nobody but the bot can see.
		// It is almost always a role cache that was never populated, so it is
		// worth saying in a run log rather than silently producing a dead thread.
		else if (ids.length <= 1) softReason = 'no_members_resolved';
	}

	if (mode === 'FORUM') {
		// The starter message is the post itself, and its id is the thread's.
		starter = await channel.messages.fetch(channel.id).catch(() => null);
		if (Object.keys(access).length > 0) softReason ??= 'forum_access_ignored';
	} else if (message) {
		starter = await channel.send(message).catch(error => {
			client.log?.warn?.('Could not post the first message in %s: %s', channel.id, error.message);
			return null;
		});
	}

	return {
		channel,
		message: starter ?? undefined,
		name: channelName,
		ok: true,
		reason: softReason,
	};
}

module.exports = {
	PARTICIPANT_ALLOW,
	buildOverwrites,
	classifyError,
	createChannel,
	resolveName,
	resolveParent,
	threadMemberIds,
};
