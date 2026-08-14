/**
 * Interaction-free ticket mutations.
 *
 * `move`, `priority`, `rename`, `add` and `remove` each used to live entirely
 * inside their slash command: load settings, gate on `isStaff`, mutate, reply,
 * log — one method, no seam. That was fine while a slash command was the only
 * way to invoke them. Automations need the same operations without an
 * `interaction`, so the mutation half moved here and the commands became
 * permission gate + call + reply.
 *
 * Every function is behaviour-preserving with respect to the command it came
 * from: same database writes, same Discord calls, same `logTicketEvent`. What
 * they do *not* do is check permissions or reply — that stays with the caller,
 * because an automation has no one to reply to and its authorisation was decided
 * when an admin saved it.
 *
 * Each returns `{ok, reason?}` rather than throwing for the outcomes that are
 * expected (a full category, a rate limit, a member who left), so the run log
 * can say which one happened.
 */

const ms = require('ms');
const { logTicketEvent } = require('../logging');
const { emit } = require('../automations/dispatcher');
const { isValidChannelEmoji } = require('../emoji');
const { resolveGuildChannel } = require('../misc');
const {
	PRIORITY_EMOJI_DEFAULTS,
	resolveCategory,
} = require('../settings/inheritance');
const {
	PARTICIPANT_ALLOW,
	buildOverwrites,
	createChannel,
} = require('./channels');
const { resolveEmojiSettings } = require('./emoji-settings');
const {
	NAME_LIMIT,
	clampName,
	managedName,
	managedPrefix,
	priorityEmoji,
	renderChannelName,
	stripManagedPrefix,
} = require('./naming');

/**
 * The channel-name emoji for a priority, using the built-in defaults.
 *
 * @deprecated Kept because `src/commands/slash/priority.js` re-exports it. New
 * code takes the resolved map: `priorityEmoji(priority, settings.priorityEmojis)`.
 */
const getEmoji = priority => priorityEmoji(priority, PRIORITY_EMOJI_DEFAULTS) || '🔵';

/** Discord's ceiling for `rateLimitPerUser`, in seconds (6 hours). */
const SLOWMODE_LIMIT = 21600;

/**
 * The resolved emoji settings for a ticket.
 *
 * `getCategory` is keyv-cached for 12 hours *with the guild embedded*, so the
 * common path costs no queries and both levels of the chain come from one place.
 *
 * @param {import("client")} client
 * @param {object} ticket a row carrying at least `categoryId` and `guildId`
 * @returns {Promise<object>} EmojiSettings
 */
async function emojiSettingsFor(client, ticket) {
	const category = ticket?.categoryId
		? await client.tickets.getRawCategory(ticket.categoryId)
		: null;
	const guild = category?.guild ?? ticket?.guild ??
		(ticket?.guildId
			? await client.prisma.guild.findUnique({ where: { id: ticket.guildId } })
			: null);
	return resolveEmojiSettings({
		category,
		guild,
	});
}

/**
 * Take one slot from a channel's rename budget.
 *
 * Discord allows two renames per ten minutes per channel and then simply stalls,
 * so the bot keeps its own count rather than discovering the limit by hanging.
 *
 * @returns {Promise<{ok: boolean, freesAt: number}>} `freesAt` is when the
 *   oldest slot ages out, for a caller that wants to try again later.
 */
async function takeRenameBudget(client, ticketId) {
	const key = `rate-limits/channel-rename:${ticketId}`;
	const timestamps = (await client.keyv.get(key) ?? []).filter(at => Date.now() - at < RENAME_WINDOW);
	if (timestamps.length >= RENAME_LIMIT) {
		return {
			freesAt: Math.min(...timestamps) + RENAME_WINDOW,
			ok: false,
		};
	}
	timestamps.push(Date.now());
	await client.keyv.set(key, timestamps, RENAME_WINDOW);
	return {
		freesAt: 0,
		ok: true,
	};
}

/**
 * Bring a ticket channel's name in line with the ticket's state.
 *
 * Every place that used to hand-roll `'✅' + name` or `name.slice(1)` calls this
 * instead. The name is rebuilt from the *current* channel name rather than from
 * the category template, so a manual rename survives a claim or a priority
 * change — which is the behaviour `setPriority` already went out of its way to
 * preserve, now available everywhere.
 *
 * Skips the API call when the name is already right: renames are rate limited,
 * and spending a slot to write the same string is how a later, real rename ends
 * up refused.
 *
 * @returns {Promise<{ok: boolean, reason?: string, name?: string}>}
 */
async function syncChannelName(client, {
	channel, defer = true, reason, settings, ticket,
}) {
	const resolved = channel ?? await client.channels.fetch(ticket.id).catch(() => null);
	if (!resolved) {
		return {
			ok: false,
			reason: 'unknown_channel',
		};
	}
	const emoji = settings ?? await emojiSettingsFor(client, ticket);
	const name = managedName(resolved.name, ticket, emoji);
	if (name === resolved.name) {
		return {
			name,
			ok: true,
			reason: 'noop',
		};
	}

	const budget = await takeRenameBudget(client, ticket.id);
	if (!budget.ok) {
		// Park it rather than drop it. A ticket nothing else happens to would
		// otherwise keep the wrong name forever: "the next name write repairs it"
		// is only true when there is a next name write.
		//
		// The workflow carries no name — the activity recomputes it when a slot
		// frees up, so a claim, a move or a priority change in the meantime is
		// reflected rather than overwritten.
		if (defer) {
			try {
				await require('../temporal').deferChannelRename({
					guildId: ticket.guildId,
					notBefore: budget.freesAt,
					ticketId: ticket.id,
				});
				return {
					name,
					ok: true,
					reason: 'rename_deferred',
				};
			} catch (error) {
				// Temporal being unreachable must not break `/emoji` or an
				// automation. Degrading to the old behaviour — the rename is
				// dropped and repaired by the next name write — is exactly what
				// this branch did before deferral existed.
				client.log?.warn?.('Could not defer a channel rename for %s: %s', ticket.id, error?.message ?? error);
			}
		}
		return {
			freesAt: budget.freesAt,
			name,
			ok: true,
			reason: 'rate_limited',
		};
	}

	await resolved.setName(name, reason).catch(() => null);
	return {
		name,
		ok: true,
	};
}

/**
 * Pin an emoji to a ticket, or clear it.
 *
 * The override replaces the state emoji — the claim tick, or whatever the
 * category configures — and is kept through claims, releases and moves. It is
 * cleared by an automation, by `/emoji`, or by the ticket closing, and by
 * nothing else: an automation set it deliberately, and a move is not consent to
 * undo that.
 *
 * `scope` decides how far it reaches. 'state' leaves the priority emoji alone,
 * because priority answers a different question; 'all' makes the override the
 * entire prefix, which is what an author wants when the emoji *is* the status.
 *
 * @param {import("client")} client
 * @param {{actorId?: string, emoji: ?string, scope?: 'state'|'all', ticketId: string}} options
 * @returns {Promise<{ok: boolean, reason?: string, from?: ?string, to?: ?string}>}
 */
async function setTicketEmoji(client, {
	actorId, emoji, scope, ticketId,
}) {
	const ticket = await client.prisma.ticket.findUnique({ where: { id: ticketId } });
	if (!ticket) {
		return {
			ok: false,
			reason: 'unknown_ticket',
		};
	}

	// One meaning per value: '' and null both mean "no override".
	const next = typeof emoji === 'string' && emoji.trim() ? emoji.trim() : null;
	// Belt and braces — the node's param is validated at save time, but a custom
	// server emoji passes `isValidEmoji` and would render as nothing at all.
	if (next !== null && !isValidChannelEmoji(next)) {
		return {
			ok: false,
			reason: 'invalid_emoji',
		};
	}
	const nextScope = next === null ? null : scope === 'all' ? 'all' : 'state';

	if (next === ticket.emojiOverride && nextScope === ticket.emojiOverrideScope) {
		return {
			from: ticket.emojiOverride,
			ok: true,
			reason: 'noop',
			to: next,
		};
	}

	await client.prisma.ticket.update({
		data: {
			emojiOverride: next,
			emojiOverrideScope: nextScope,
		},
		where: { id: ticketId },
	});

	// The ticket cache is keyed for three minutes and nothing else invalidates
	// it, so a condition node later in the same run would otherwise branch on the
	// pre-write ticket.
	await client.tickets.getTicket(ticketId, true);

	const sync = await syncChannelName(client, {
		reason: `Emoji set by ${actorId ?? client.user.id}`,
		ticket: {
			...ticket,
			emojiOverride: next,
			emojiOverrideScope: nextScope,
		},
	});

	logTicketEvent(client, {
		action: 'update',
		diff: {
			original: { emoji: ticket.emojiOverride },
			updated: { emoji: next },
		},
		target: {
			id: ticket.id,
			name: `<#${ticket.id}>`,
		},
		userId: actorId ?? client.user.id,
	});

	return {
		from: ticket.emojiOverride,
		ok: true,
		// The override is persisted either way; only the visible rename can lag.
		reason: sync.reason === 'rate_limited' || sync.reason === 'rename_deferred' ? 'rename_deferred' : undefined,
		to: next,
	};
}

/**
 * Change a ticket's priority, keeping the channel name's emoji in step.
 *
 * @returns {Promise<{ok: boolean, reason?: string, from?: string, to?: string}>}
 */
async function setPriority(client, {
	actorId, priority, ticketId,
}) {
	const ticket = await client.prisma.ticket.findUnique({ where: { id: ticketId } });
	if (!ticket) {
		return {
			ok: false,
			reason: 'unknown_ticket',
		};
	}
	if (ticket.priority === priority) {
		return {
			from: ticket.priority,
			ok: true,
			reason: 'noop',
			to: priority,
		};
	}

	await syncChannelName(client, {
		reason: `Priority set by ${actorId ?? client.user.id}`,
		ticket: {
			...ticket,
			priority,
		},
	});

	await client.prisma.ticket.update({
		data: { priority },
		where: { id: ticketId },
	});

	logTicketEvent(client, {
		action: 'update',
		diff: {
			original: { priority: ticket.priority },
			updated: { priority },
		},
		target: {
			id: ticket.id,
			name: `<#${ticket.id}>`,
		},
		userId: actorId ?? client.user.id,
	});

	emit(client, 'trigger.ticket.priorityChanged', {
		categoryId: ticket.categoryId,
		guildId: ticket.guildId,
		priority,
		ticketId: ticket.id,
		userId: actorId,
	});

	return {
		from: ticket.priority,
		ok: true,
		to: priority,
	};
}

/**
 * Set one ticket's slow mode.
 *
 * Discord owns this value: it is read back off the channel rather than stored.
 * `Category.ratelimit` seeds `rateLimitPerUser` when the channel is created
 * (`manager.js#create`) and nothing here ever writes it again, not even
 * `moveTicket`, which reparents without touching it. A column would only mirror
 * a number an admin can also change in Discord's own channel settings, and
 * drift from it.
 *
 * @returns {Promise<{ok: boolean, reason?: string, from?: number, to?: number}>}
 */
async function setSlowmode(client, {
	actorId, seconds, ticketId,
}) {
	const ticket = await client.prisma.ticket.findUnique({ where: { id: ticketId } });
	if (!ticket) {
		return {
			ok: false,
			reason: 'unknown_ticket',
		};
	}

	if (!Number.isInteger(seconds) || seconds < 0 || seconds > SLOWMODE_LIMIT) {
		return {
			ok: false,
			reason: 'invalid_duration',
		};
	}

	const channel = await client.channels.fetch(ticketId).catch(() => null);
	if (!channel) {
		return {
			ok: false,
			reason: 'unknown_channel',
		};
	}

	// Undefined on a channel type that has no slow mode, 0 when it is off. Both
	// mean "off", so they collapse before the no-op check below compares them.
	const original = channel.rateLimitPerUser ?? 0;
	if (original === seconds) {
		return {
			from: original,
			ok: true,
			reason: 'noop',
			to: seconds,
		};
	}

	try {
		await channel.setRateLimitPerUser(seconds, `Slow mode set by ${actorId ?? client.user.id}`);
	} catch {
		// Manage Channels can be missing on a single ticket long after it opened.
		// That is a "could not", not a fault, so an automation skips the node
		// rather than failing the branch.
		return {
			ok: false,
			reason: 'missing_permissions',
		};
	}

	logTicketEvent(client, {
		action: 'update',
		diff: {
			original: { slowmode: original },
			updated: { slowmode: seconds },
		},
		target: {
			id: ticket.id,
			name: `<#${ticket.id}>`,
		},
		userId: actorId ?? client.user.id,
	});

	return {
		from: original,
		ok: true,
		to: seconds,
	};
}

/**
 * Move a ticket to another category, reparenting the channel and repairing the
 * in-memory counters.
 *
 * @returns {Promise<{ok: boolean, reason?: string, from?: object, to?: object}>}
 */
async function moveTicket(client, {
	actorId, categoryId, ticketId,
}) {
	const row = await client.prisma.ticket.findUnique({
		include: {
			category: true,
			guild: true,
		},
		where: { id: ticketId },
	});
	if (!row) {
		return {
			ok: false,
			reason: 'unknown_ticket',
		};
	}
	if (row.categoryId === categoryId) {
		return {
			ok: true,
			reason: 'noop',
		};
	}

	// Both sides resolved before they are compared below. A raw category holds
	// NULL where it inherits, so comparing a raw old category against a resolved
	// new one would report a difference between two categories that behave
	// identically — and, worse, hand a NULL `channelName` to the rename.
	const ticket = {
		...row,
		category: resolveCategory(row.category, row.guild),
	};

	const newCategory = await client.tickets.getCategory(categoryId);
	if (!newCategory) {
		return {
			ok: false,
			reason: 'unknown_category',
		};
	}

	const channel = await client.channels.fetch(ticketId).catch(() => null);
	const guild = client.guilds.cache.get(ticket.guildId);
	const discordCategory = await guild?.channels.fetch(newCategory.discordCategory).catch(() => null);

	// Discord caps a category at 50 channels; moving into a full one fails at the
	// API, so it is reported rather than attempted.
	if (discordCategory?.children?.cache.size === 50) {
		return {
			ok: false,
			reason: 'category_full',
		};
	}

	await client.prisma.ticket.update({
		data: { category: { connect: { id: newCategory.id } } },
		where: { id: ticket.id },
	});

	// The counters are in-memory and per-category, so a move has to hand the
	// ticket over rather than let the old category keep counting it (#531).
	const $counters = client.tickets.$count.categories;
	$counters[newCategory.id] ??= {};
	const $old = $counters[ticket.categoryId];
	const $new = $counters[newCategory.id];
	if ($old) {
		$old.total--;
		$old[ticket.createdById]--;
	}
	$new.total ||= 0;
	$new.total++;
	$new[ticket.createdById] ||= 0;
	$new[ticket.createdById]++;

	// The destination's emoji settings, so a move between two categories that
	// differ only in their emojis still repaints the channel.
	const emoji = await emojiSettingsFor(client, {
		...ticket,
		categoryId: newCategory.id,
	});
	const fromEmoji = await emojiSettingsFor(client, ticket);

	if (
		channel && discordCategory && (
			JSON.stringify(newCategory.staffRoles) !== JSON.stringify(ticket.category.staffRoles) ||
			newCategory.channelName !== ticket.category.channelName ||
			newCategory.discordCategory !== ticket.category.discordCategory ||
			managedPrefix(ticket, emoji) !== managedPrefix(ticket, fromEmoji)
		)
	) {
		const creator = await guild.members.fetch(ticket.createdById).catch(() => null);
		// One `edit` rather than setParent/setName/permissionOverwrites in
		// sequence: three API requests where one will do.
		await channel.edit({
			lockPermissions: false,
			name: clampName(managedPrefix(ticket, emoji) + renderChannelName(newCategory.channelName, {
				creator,
				number: ticket.number,
			})),
			parent: discordCategory,
			permissionOverwrites: buildOverwrites({
				access: {
					roleIds: newCategory.staffRoles,
					userIds: creator ? [creator.id] : [],
				},
				clientId: client.user.id,
				guild,
			}),
			reason: `Moved by ${actorId ?? client.user.id}`,
		});
	}

	logTicketEvent(client, {
		action: 'update',
		diff: {
			original: { category: ticket.category.name },
			updated: { category: newCategory.name },
		},
		target: {
			id: ticket.id,
			name: `<#${ticket.id}>`,
		},
		userId: actorId ?? client.user.id,
	});

	emit(client, 'trigger.ticket.moved', {
		categoryId: newCategory.id,
		guildId: ticket.guildId,
		ticketId: ticket.id,
		userId: actorId,
	});

	return {
		from: ticket.category,
		ok: true,
		to: newCategory,
	};
}

/** How many renames Discord tolerates, and over what window. */
const RENAME_LIMIT = 2;
const RENAME_WINDOW = ms('10m');

/**
 * Rename a ticket channel, preserving the managed prefix.
 *
 * Carries the command's rate limit with it. Discord allows two channel renames
 * per ten minutes and then silently stalls the request for the rest of the
 * window — an automation firing on every message is exactly the thing that hits
 * that, so the limit belongs here rather than in the command.
 *
 * @returns {Promise<{ok: boolean, reason?: string, name?: string}>}
 */
async function renameTicket(client, {
	actorId, name: rawName, ticketId,
}) {
	const ticket = await client.prisma.ticket.findUnique({ where: { id: ticketId } });
	if (!ticket) {
		return {
			ok: false,
			reason: 'unknown_ticket',
		};
	}

	const settings = await emojiSettingsFor(client, ticket);
	// Strip first: `/rename ✅foo` should not end up as `✅✅foo`, and a user who
	// pastes the current name back in should get the same name out.
	const name = managedPrefix(ticket, settings) + stripManagedPrefix(rawName, ticket, settings);
	if (name.length < 1 || [...name].length > NAME_LIMIT) {
		return {
			ok: false,
			reason: 'invalid_name',
		};
	}

	// A user-chosen name is not stored anywhere, so a deferred rename could not
	// reproduce it — this one keeps the honest "try again later" answer rather
	// than queueing (unlike the managed-prefix writes, which recompute).
	const budget = await takeRenameBudget(client, ticketId);
	if (!budget.ok) {
		return {
			ok: false,
			reason: 'rate_limited',
		};
	}

	const channel = await client.channels.fetch(ticketId).catch(() => null);
	if (!channel) {
		return {
			ok: false,
			reason: 'unknown_channel',
		};
	}

	const originalName = channel.name;
	await channel.edit({ name });

	logTicketEvent(client, {
		action: 'update',
		diff: {
			original: { name: originalName },
			updated: { name },
		},
		target: {
			id: ticket.id,
			name: `<#${ticket.id}>`,
		},
		userId: actorId ?? client.user.id,
	});

	return {
		name,
		ok: true,
	};
}

/**
 * Give someone access to a ticket.
 *
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
async function addTicketMember(client, {
	actorId, ticketId, userId,
}) {
	const ticket = await client.prisma.ticket.findUnique({ where: { id: ticketId } });
	if (!ticket) {
		return {
			ok: false,
			reason: 'unknown_ticket',
		};
	}

	const channel = await client.channels.fetch(ticketId).catch(() => null);
	if (!channel) {
		return {
			ok: false,
			reason: 'unknown_channel',
		};
	}
	const guild = client.guilds.cache.get(ticket.guildId);
	const member = await guild?.members.fetch(userId).catch(() => null);
	if (!member) {
		return {
			ok: false,
			reason: 'unknown_member',
		};
	}

	// Threads have no per-member overwrites — membership *is* the access.
	if (channel.isThread()) {
		await channel.members.add(member.id);
	} else {
		await channel.permissionOverwrites.edit(
			member,
			{
				AttachFiles: true,
				EmbedLinks: true,
				ReadMessageHistory: true,
				SendMessages: true,
				ViewChannel: true,
			},
			`Added to the ticket by ${actorId ?? client.user.id}`,
		);
	}

	logTicketEvent(client, {
		action: 'update',
		diff: {
			original: {},
			updated: { added: member.user.tag },
		},
		target: {
			id: ticket.id,
			name: `<#${ticket.id}>`,
		},
		userId: actorId ?? client.user.id,
	});

	emit(client, 'trigger.ticket.memberAdded', {
		categoryId: ticket.categoryId,
		guildId: ticket.guildId,
		ticketId: ticket.id,
		userId: actorId,
	});

	return {
		member,
		ok: true,
	};
}

/**
 * Revoke someone's access to a ticket.
 *
 * The bot and the ticket's creator are never removable — the first would lock
 * the bot out of a channel it has to close, the second makes no sense.
 *
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
async function removeTicketMember(client, {
	actorId, ticketId, userId,
}) {
	const ticket = await client.prisma.ticket.findUnique({ where: { id: ticketId } });
	if (!ticket) {
		return {
			ok: false,
			reason: 'unknown_ticket',
		};
	}
	if (userId === client.user.id || userId === ticket.createdById) {
		return {
			ok: false,
			reason: 'not_removable',
		};
	}

	const channel = await client.channels.fetch(ticketId).catch(() => null);
	if (!channel) {
		return {
			ok: false,
			reason: 'unknown_channel',
		};
	}
	const guild = client.guilds.cache.get(ticket.guildId);
	const member = await guild?.members.fetch(userId).catch(() => null);
	if (!member) {
		return {
			ok: false,
			reason: 'unknown_member',
		};
	}

	if (channel.isThread()) {
		await channel.members.remove(member.id).catch(() => null);
	} else {
		await channel.permissionOverwrites.delete(member, `Removed from the ticket by ${actorId ?? client.user.id}`);
	}

	logTicketEvent(client, {
		action: 'update',
		diff: {
			original: { removed: member.user.tag },
			updated: {},
		},
		target: {
			id: ticket.id,
			name: `<#${ticket.id}>`,
		},
		userId: actorId ?? client.user.id,
	});

	return {
		member,
		ok: true,
	};
}

/**
 * Where a ticket's private staff space goes, and what kind of thing it is.
 *
 * Discord cannot put a thread inside a thread, so the arrangement DTREVAMPED-56
 * describes — Channel > Ticket Thread > Staff Thread — is not expressible. For a
 * THREAD ticket the staff thread is a *sibling* on the same parent channel; only
 * a CHANNEL ticket gets the genuinely nested version the ticket describes.
 *
 * A CHANNEL ticket defaults to a *thread* rather than matching its own mode.
 * That looks inconsistent until you count: a Discord category holds 50 channels,
 * and a channel-mode staff channel would burn a second slot per ticket, halving
 * a category's capacity and pushing it into `backupCategory` overflow twice as
 * fast.
 *
 * @returns {{mode: 'CHANNEL'|'THREAD', parentId: string|null}}
 */
function staffChannelTarget(ticket, category) {
	const explicit = category.staffChannelMode;
	const ticketMode = category.channelMode || 'CHANNEL';
	// A private forum post does not exist, so a FORUM category falls back to a
	// channel. The category route refuses to store FORUM here, but a hand-edited
	// row must not produce something Discord will reject.
	const mode = explicit === 'THREAD' || explicit === 'CHANNEL'
		? explicit
		: (ticketMode === 'FORUM' ? 'CHANNEL' : 'THREAD');

	if (mode === 'CHANNEL') {
		return {
			mode,
			parentId: category.staffChannelParent || category.discordCategory,
		};
	}
	// A thread with no override hangs off the ticket itself: nested for a CHANNEL
	// ticket, and beside it for a THREAD one, which `climbToParent` arranges.
	return {
		mode,
		parentId: category.staffChannelParent || ticket.id,
	};
}

/**
 * Open the private staff thread or channel for a ticket, if it has none.
 *
 * Idempotent by design: `/private-channel` and the automatic path both call it,
 * and the command's whole job is to be safe to run on a ticket that may already
 * have one.
 *
 * @returns {Promise<{ok: true, channel: object, created: boolean}|{ok: false, reason: string}>}
 */
async function ensureStaffChannel(client, {
	actorId = null, ticket,
}) {
	const guild = client.guilds.cache.get(ticket.guildId);
	if (!guild) {
		return {
			ok: false,
			reason: 'unknown_guild',
		};
	}

	if (ticket.staffChannelId) {
		const existing = resolveGuildChannel(client, ticket.guildId, ticket.staffChannelId) ??
			await client.channels.fetch(ticket.staffChannelId).catch(() => null);
		if (existing && existing.guildId === ticket.guildId) {
			return {
				channel: existing,
				created: false,
				ok: true,
			};
		}
		// The row points at something that is gone. The delete listeners clear it,
		// but a channel deleted while the bot was offline never fired one, so this
		// falls through and makes a new one rather than refusing forever.
	}

	const category = ticket.category;
	if (!category) {
		return {
			ok: false,
			reason: 'unknown_category',
		};
	}
	const staffRoles = Array.isArray(category.staffRoles) ? category.staffRoles : [];
	if (staffRoles.length === 0) {
		return {
			ok: false,
			reason: 'no_staff_roles',
		};
	}

	const {
		mode, parentId,
	} = staffChannelTarget(ticket, category);
	const creator = await guild.members.fetch(ticket.createdById).catch(() => null);

	const result = await createChannel(client, {
		// Staff only: the opener is deliberately never added. That is the whole
		// point of the channel.
		access: {
			allow: PARTICIPANT_ALLOW,
			roleIds: staffRoles,
		},
		guild,
		mode,
		name: {
			creator,
			fallback: ticket.createdById,
			number: ticket.number,
			// The lock is the only thing distinguishing it from the ticket channel
			// in a channel list, which is worth more than a second name template
			// and the column, dashboard field and export entry it would cost.
			prefix: '🔒',
			template: category.channelName,
		},
		parentId,
		reason: `Private staff channel for ticket #${ticket.number}`,
		// A thread cannot nest inside the ticket thread, so it is created beside
		// it instead. See `staffChannelTarget`.
		thread: { climbToParent: true },
	});
	if (!result.ok) return result;

	await client.prisma.ticket.update({
		data: { staffChannelId: result.channel.id },
		where: { id: ticket.id },
	});
	await client.tickets.getTicket(ticket.id, true);

	logTicketEvent(client, {
		action: 'update',
		diff: {
			original: {},
			updated: { staffChannel: `<#${result.channel.id}>` },
		},
		target: {
			id: ticket.id,
			name: `<#${ticket.id}>`,
		},
		userId: actorId ?? client.user.id,
	});

	return {
		channel: result.channel,
		created: true,
		ok: true,
	};
}

/** How many created channels one ticket will remember. */
const CREATED_CHANNEL_LIMIT = 25;

/**
 * Remember a channel an automation made, so closing the ticket takes it down.
 *
 * Read-modify-write, not a transaction. Two automations creating channels for
 * the same ticket in the same instant can lose one id; the cost of that is a
 * channel that outlives the close and has to be deleted by hand, which is not
 * worth a lock on the ticket row for. The cap is there because the column is
 * cleanup state, not a log: a runaway automation should not grow the row without
 * bound, and the oldest entries are the ones most likely to be gone already.
 *
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
async function recordTicketChannel(client, ticketId, channelId) {
	const ticket = await client.prisma.ticket.findUnique({
		select: { createdChannelIds: true },
		where: { id: ticketId },
	});
	if (!ticket) {
		return {
			ok: false,
			reason: 'unknown_ticket',
		};
	}

	// NULL reads as an empty list, which is why the column has no default: MySQL
	// cannot give a JSON column one.
	const existing = Array.isArray(ticket.createdChannelIds) ? ticket.createdChannelIds : [];
	if (existing.includes(channelId)) {
		return {
			ok: true,
			reason: 'noop',
		};
	}

	await client.prisma.ticket.update({
		data: { createdChannelIds: [...existing, channelId].slice(-CREATED_CHANNEL_LIMIT) },
		where: { id: ticketId },
	});
	// The ticket cache is keyed for three minutes and nothing else invalidates
	// it, so a later step in the same run would otherwise read the pre-write row.
	await client.tickets.getTicket(ticketId, true);

	return { ok: true };
}

// `managedPrefix` and `renderChannelName` are re-exported from ./naming, and
// `PARTICIPANT_ALLOW` from ./channels, so the commands that already import them
// from here keep working; new code should reach for the module that defines
// them.
module.exports = {
	PARTICIPANT_ALLOW,
	SLOWMODE_LIMIT,
	addTicketMember,
	emojiSettingsFor,
	ensureStaffChannel,
	getEmoji,
	managedPrefix,
	moveTicket,
	recordTicketChannel,
	removeTicketMember,
	renameTicket,
	renderChannelName,
	setPriority,
	setSlowmode,
	setTicketEmoji,
	syncChannelName,
	takeRenameBudget,
};
