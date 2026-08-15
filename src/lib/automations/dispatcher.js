/**
 * The trigger bus.
 *
 * `emit()` is called from every lifecycle chokepoint in the bot and has the same
 * posture as `logAdminEvent`/`logTicketEvent`: it never throws and is never
 * awaited. An automation misbehaving must not break the thing that triggered it.
 *
 * ## Two things this file is careful about
 *
 * **It is on the hot path.** `trigger.message.created` fires for every message
 * in every guild the bot is in. The fast path — no automations, or none for this
 * trigger — is one cache read and an `Array.some` before any parameter is even
 * looked at.
 *
 * **Depth is tracked with `AsyncLocalStorage`.** An automation that closes a
 * ticket causes `finallyClose` to emit `ticket.closed`, two thousand lines away
 * and several awaits deep. Threading a depth parameter through all of that would
 * be miserable and would be forgotten at the first new call site; async context
 * inherits it for free.
 */

const { AsyncLocalStorage } = require('node:async_hooks');
const ms = require('ms');
const { LIMITS } = require('./errors');
const { Context } = require('./context');
const { triggerNodes } = require('./validate');
const { isSuppressed } = require('./discord');
const regex = require('../regex');

/** `{depth, rootRunId}` for the currently-executing automation, if any. */
const store = new AsyncLocalStorage();

const currentDepth = () => store.getStore()?.depth ?? -1;

/**
 * An embed flattened into matchable text.
 *
 * Another bot's output is usually an embed, not message content — a moderation
 * bot's "Member banned" is a title, a reason field and a footer, and
 * `message.content` for it is the empty string. Without this, a message trigger
 * pointed at another bot can only ever match nothing.
 *
 * Built by the listener and only when a message actually carries embeds, so the
 * hot path pays for it on the small minority of messages that have one.
 *
 * @param {import('discord.js').Message} message
 * @returns {?string}
 */
function flattenEmbeds(message) {
	if (!message.embeds?.length) return null;
	const parts = [];
	for (const embed of message.embeds) {
		if (embed.author?.name) parts.push(embed.author.name);
		if (embed.title) parts.push(embed.title);
		if (embed.description) parts.push(embed.description);
		for (const field of embed.fields ?? []) parts.push(`${field.name}\n${field.value}`);
		if (embed.footer?.text) parts.push(embed.footer.text);
	}
	return parts.join('\n') || null;
}

/**
 * The text a message trigger's pattern is tested against.
 *
 * Content and embeds are matched as one blob rather than separately: an admin
 * writing "when it says banned" does not care which half of the message the
 * word was in.
 */
const searchText = (params, payload) => (
	params.searchEmbeds === false || !payload.embedText
		? payload.content ?? ''
		: `${payload.content ?? ''}\n${payload.embedText}`
);

/** What a bot command carries after its prefix — the part a pattern matches. */
const commandArgs = (params, payload) =>
	String(payload.content ?? '').slice(String(params.prefix ?? '').length).trim();

/**
 * Does this automation's trigger actually match what happened?
 *
 * The coarse match is the node's type; this is the per-trigger fine filter,
 * evaluated in memory because the parameter sets are tiny and the whole guild's
 * automations are already cached here.
 */
function matches(node, payload) {
	const params = node.params ?? {};

	switch (node.type) {
	// Every ticket trigger takes the same optional category filter.
	case 'trigger.ticket.created':
	case 'trigger.ticket.claimed':
	case 'trigger.ticket.released':
	case 'trigger.ticket.closeRequested':
	case 'trigger.ticket.closed':
	case 'trigger.ticket.reopened':
	case 'trigger.ticket.stale':
	case 'trigger.ticket.moved':
	case 'trigger.ticket.memberAdded':
		return !params.categoryIds?.length || params.categoryIds.includes(payload.categoryId);

	case 'trigger.ticket.priorityChanged':
		return !params.to || params.to === payload.priority;

	case 'trigger.ticket.feedback':
		return params.ratingBelow === undefined || params.ratingBelow === null || payload.rating < params.ratingBelow;

	case 'trigger.member.roleAdded':
	case 'trigger.member.roleRemoved':
		return params.roleId === payload.roleId;

	case 'trigger.bot.command': {
		// Fails closed on every axis. A row saved before one of these parameters
		// existed, or a graph written straight to the API, must not end up
		// listening to every bot in the server — so a missing parameter is a
		// non-match rather than a wildcard.
		if (payload.isSelf || !payload.isBot) return false;
		// Anyone with Manage Webhooks could otherwise post under any name they
		// like. A webhook has its own id, so it could never match `botId` anyway;
		// this says so out loud.
		if (payload.webhookId) return false;
		if (!params.botId || String(params.botId) !== String(payload.userId)) return false;
		if (!params.channelId || String(params.channelId) !== String(payload.channelId)) return false;

		const prefix = String(params.prefix ?? '');
		if (!prefix.trim()) return false;
		// Content only, never the embed: an embed is arbitrary text from whoever
		// posted it, and a prefix that an embed could satisfy locks nothing.
		if (!String(payload.content ?? '').startsWith(prefix)) return false;

		if (params.pattern && !regex.test(params.pattern, 'i', commandArgs(params, payload))) return false;
		return true;
	}

	case 'trigger.message.created': {
		// Never our own messages, whatever the parameters say. An automation that
		// answers bots would otherwise answer itself, and — unlike a nested emit —
		// each reply arrives as a fresh gateway event, so the depth guard, which
		// only sees one async context, would never see the loop at all.
		if (payload.isSelf) return false;
		if (params.ignoreBots !== false && payload.isBot) return false;
		if (params.botId && String(params.botId) !== String(payload.userId)) return false;
		if (params.scope === 'ticket' && !payload.ticketId) return false;
		if (params.scope === 'nonTicket' && payload.ticketId) return false;
		if (params.scope === 'channels' && !params.channelIds?.includes(payload.channelId)) return false;
		// Runs for every message in every guild, before any rate limit — see
		// src/lib/regex.js for why the pattern is not compiled directly.
		if (params.pattern && !regex.test(params.pattern, 'i', searchText(params, payload))) return false;
		return true;
	}

	default:
		return true;
	}
}

/**
 * Extra substitution variables this trigger node contributes to its own run.
 *
 * Per *node*, not per event: two automations watching the same message with
 * different patterns capture different things, so this cannot be folded into
 * the payload the listener builds.
 *
 * Today that means `{match1}`…`{match9}` from a message pattern, which is what
 * makes reading another bot's output useful — capture the id out of its embed
 * and the rest of the graph can act on it.
 *
 * @returns {?object} null when there is nothing to add
 */
function triggerVars(node, payload) {
	if (!node?.params?.pattern) return null;

	let text;
	if (node.type === 'trigger.message.created') text = searchText(node.params, payload);
	else if (node.type === 'trigger.bot.command') text = commandArgs(node.params, payload);
	else return null;

	const found = regex.match(node.params.pattern, 'i', text);
	if (!found) return null;

	const vars = {};
	for (let i = 1; i < Math.min(found.length, 10); i++) vars['match' + i] = found[i] ?? '';
	return Object.keys(vars).length ? vars : null;
}

/** Per-guild sliding window, the same technique the rename command uses. */
async function rateLimited(client, guildId) {
	if (!Number.isFinite(LIMITS.runsPerMinute)) return false;

	const key = `automations/rate:${guildId}`;
	const now = Date.now();
	const hits = (await client.keyv.get(key) ?? []).filter(at => now - at < 60_000);
	if (hits.length >= LIMITS.runsPerMinute) {
		// Logged once per five minutes rather than 600 times: the run log should
		// show the condition, not drown in it.
		const loggedKey = `automations/rate-logged:${guildId}`;
		if (!await client.keyv.get(loggedKey)) {
			await client.keyv.set(loggedKey, true, ms('5m'));
			client.log.warn('Guild %s hit the automation rate limit', guildId);
		}
		return true;
	}
	hits.push(now);
	await client.keyv.set(key, hits, 60_000);
	return false;
}

/**
 * The (automation, trigger node) pairs an event could start.
 *
 * An automation may hold several triggers, and more than one of them can be of
 * this type — two "a button is pressed" nodes in one graph is the whole point of
 * allowing it. Each is its own entry point, so each is its own run.
 *
 * `automationKey` is what a component interaction knows and a gateway event does
 * not: `src/buttons/auto.js` and `src/menus/auto.js` have already resolved the
 * automation out of the custom_id, and pass it on so nothing else can answer.
 * Without it, `nodeId` alone decides — and node ids are only unique *within* a
 * graph, so duplicating an automation, which copies the graph verbatim, made
 * every copy answer the original's buttons. Three copies, three confirmations,
 * from one press.
 *
 * Split out of `emit` so the scoping is testable without a client; see
 * `scripts/check-automations.js`.
 *
 * @param {Array<{key: string, graph: object}>} all the guild's automations
 * @param {string[]} triggerTypes
 * @param {object} payload
 */
function candidatesFor(all, triggerTypes, payload) {
	const candidates = [];
	for (const automation of all) {
		if (payload.automationKey && automation.key !== payload.automationKey) continue;
		for (const node of triggerNodes(automation.graph)) {
			if (!triggerTypes.includes(node.type)) continue;
			// A button carries the node it belongs to, so only that one runs —
			// otherwise pressing button A would also fire button B's branch.
			if (payload.nodeId && node.id !== payload.nodeId) continue;
			candidates.push({
				automation,
				node,
			});
		}
	}
	return candidates;
}

/**
 * Fire a trigger.
 *
 * @param {import("client")} client
 * @param {string|string[]} triggerType one event may answer to more than one
 *   trigger — a message is both "a message is posted" and, if it came from the
 *   right bot, "another bot sends a command". Passing both here costs one pass
 *   over the guild's automations instead of two, which matters on messageCreate.
 * @param {object} payload trigger-specific; `guildId` is always required, the
 *   rest are the ids the run context is built from.
 */
async function emit(client, triggerType, payload) {
	try {
		if (!client.automations || !payload?.guildId) return;
		const triggerTypes = Array.isArray(triggerType) ? triggerType : [triggerType];

		const all = await client.automations.getForGuild(payload.guildId);
		// The fast path, and the reason this is cheap enough for messageCreate.
		if (!all.length) return;

		const candidates = candidatesFor(all, triggerTypes, payload);
		if (!candidates.length) return;

		// A role change an automation just made must not re-trigger the automation
		// that made it. Validation rejects the single-graph case; this catches two
		// automations pointing at each other.
		if (
			(triggerType === 'trigger.member.roleAdded' || triggerType === 'trigger.member.roleRemoved') &&
			await isSuppressed(client, payload.guildId, payload.userId, payload.roleId)
		) return;

		const depth = currentDepth() + 1;
		if (depth > LIMITS.depth) return;

		for (const {
			automation, node,
		} of candidates) {
			if (!matches(node, payload)) continue;
			// `break`, not `return`: once the guild is over its budget there is
			// nothing left to do for this trigger either way, and returning read as
			// "skip the rest of the list" in a loop that also has work after it.
			if (await rateLimited(client, payload.guildId)) break;

			const ctx = new Context(client, {
				actorId: payload.userId ?? null,
				channelId: payload.channelId ?? null,
				depth,
				guildId: payload.guildId,
				messageId: payload.messageId ?? null,
				selection: payload.selection ?? null,
				ticketId: payload.ticketId ?? null,
				// The node's own type, not the caller's list: a run log saying
				// "a message is posted" for a bot command would be a lie.
				triggerType: node.type,
				vars: {
					...payload.vars ?? {},
					...triggerVars(node, payload) ?? {},
				},
			});
			ctx.interaction = payload.interaction ?? null;

			// Awaited inside the ALS scope so nested emits inherit the depth, but
			// the whole loop is fire-and-forget from the caller's point of view.
			await store.run({
				depth,
				rootRunId: store.getStore()?.rootRunId ?? null,
			}, () => client.automations.run(automation, ctx, node.id));
		}
	} catch (error) {
		client.log?.warn('Automation dispatch failed for %s: %s', String(triggerType), error?.message ?? error);
	}
}

module.exports = {
	candidatesFor,
	currentDepth,
	emit,
	flattenEmbeds,
	matches,
	store,
	triggerVars,
};
