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

/** The channel-name emoji for a priority. Unrecognised values get the neutral one. */
const getEmoji = priority => {
	const emojis = {
		'HIGH': '🔴',
		'MEDIUM': '🟠',
		'LOW': '🟢', // eslint-disable-line sort-keys
	};
	return emojis[priority?.toUpperCase()] ?? '🔵';
};

/**
 * The prefix the bot manages on a ticket channel's name: the claim tick, then
 * the priority emoji.
 *
 * This convention was re-implemented in five places (`manager.js` twice,
 * `move.js`, `priority.js`, `rename.js`), which is why a rename used to drop the
 * priority emoji depending on which command you used. One definition now.
 */
const managedPrefix = ticket => (ticket.claimedById ? '✅' : '') + (ticket.priority ? getEmoji(ticket.priority) : '');

/**
 * A category's `channelName` template, filled in for a ticket.
 *
 * `fallback` is what stands in for a creator who has left the guild — `escalate`
 * uses their id so the channel is still identifiable, which is worth keeping.
 */
function renderChannelName(template, {
	creator, fallback = '', number,
}) {
	return template
		.replace(/{+\s?(user)?name\s?}+/gi, creator?.user?.username ?? fallback)
		.replace(/{+\s?(nick|display)(name)?\s?}+/gi, creator?.displayName ?? fallback)
		// 1488 is a neo-Nazi numeric symbol; upstream skips it.
		.replace(/{+\s?num(ber)?\s?}+/gi, number === 1488 ? '1487b' : number);
}

/** The permissions a ticket participant gets. */
const PARTICIPANT_ALLOW = ['ViewChannel', 'ReadMessageHistory', 'SendMessages', 'EmbedLinks', 'AttachFiles'];

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

	const channel = await client.channels.fetch(ticketId).catch(() => null);
	if (channel) {
		// Rewritten from the *current* channel name rather than rebuilt from the
		// category template, so a manual rename survives a priority change.
		const claimedPrefix = channel.name.startsWith('✅') ? '✅' : '';
		const unprefixed = claimedPrefix ? channel.name.slice(1) : channel.name;
		const name = ticket.priority
			? claimedPrefix + unprefixed.replace(getEmoji(ticket.priority), getEmoji(priority))
			: claimedPrefix + getEmoji(priority) + unprefixed;
		await channel.setName(name).catch(() => null);
	}

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
 * Move a ticket to another category, reparenting the channel and repairing the
 * in-memory counters.
 *
 * @returns {Promise<{ok: boolean, reason?: string, from?: object, to?: object}>}
 */
async function moveTicket(client, {
	actorId, categoryId, ticketId,
}) {
	const ticket = await client.prisma.ticket.findUnique({
		include: {
			category: true,
			guild: true,
		},
		where: { id: ticketId },
	});
	if (!ticket) {
		return {
			ok: false,
			reason: 'unknown_ticket',
		};
	}
	if (ticket.categoryId === categoryId) {
		return {
			ok: true,
			reason: 'noop',
		};
	}

	const newCategory = await client.prisma.category.findUnique({ where: { id: categoryId } });
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

	if (
		channel && discordCategory && (
			newCategory.staffRoles !== ticket.category.staffRoles ||
			newCategory.channelName !== ticket.category.channelName ||
			newCategory.discordCategory !== ticket.category.discordCategory
		)
	) {
		const creator = await guild.members.fetch(ticket.createdById).catch(() => null);
		// One `edit` rather than setParent/setName/permissionOverwrites in
		// sequence: three API requests where one will do.
		await channel.edit({
			lockPermissions: false,
			name: managedPrefix(ticket) + renderChannelName(newCategory.channelName, {
				creator,
				number: ticket.number,
			}),
			parent: discordCategory,
			permissionOverwrites: [
				{
					deny: ['ViewChannel'],
					id: guild.roles.everyone,
				},
				{
					allow: PARTICIPANT_ALLOW,
					id: client.user.id,
				},
				...(creator ? [{
					allow: PARTICIPANT_ALLOW,
					id: creator.id,
				}] : []),
				...newCategory.staffRoles.map(id => ({
					allow: PARTICIPANT_ALLOW,
					id,
				})),
			],
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

	const name = managedPrefix(ticket) + rawName;
	if (name.length < 1 || name.length > 100) {
		return {
			ok: false,
			reason: 'invalid_name',
		};
	}

	const key = `rate-limits/channel-rename:${ticketId}`;
	const timestamps = (await client.keyv.get(key) ?? []).filter(at => Date.now() - at < RENAME_WINDOW);
	if (timestamps.length >= RENAME_LIMIT) {
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
	timestamps.push(Date.now());
	await client.keyv.set(key, timestamps, RENAME_WINDOW);
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

module.exports = {
	PARTICIPANT_ALLOW,
	addTicketMember,
	getEmoji,
	managedPrefix,
	moveTicket,
	removeTicketMember,
	renameTicket,
	renderChannelName,
	setPriority,
};
