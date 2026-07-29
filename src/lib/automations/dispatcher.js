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
const { triggerNode } = require('./validate');
const { isSuppressed } = require('./discord');

/** `{depth, rootRunId}` for the currently-executing automation, if any. */
const store = new AsyncLocalStorage();

const currentDepth = () => store.getStore()?.depth ?? -1;

/**
 * Does this automation's trigger actually match what happened?
 *
 * The coarse match is the indexed `triggerType` column; this is the per-trigger
 * fine filter, evaluated in memory because the parameter sets are tiny and
 * neither database is used with JSON-path querying anywhere in this codebase.
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

	case 'trigger.message.created': {
		if (params.ignoreBots !== false && payload.isBot) return false;
		if (params.scope === 'ticket' && !payload.ticketId) return false;
		if (params.scope === 'nonTicket' && payload.ticketId) return false;
		if (params.scope === 'channels' && !params.channelIds?.includes(payload.channelId)) return false;
		if (params.pattern) {
			try {
				if (!new RegExp(params.pattern, 'i').test(payload.content ?? '')) return false;
			} catch {
				return false;
			}
		}
		return true;
	}

	default:
		return true;
	}
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
 * Fire a trigger.
 *
 * @param {import("client")} client
 * @param {string} triggerType
 * @param {object} payload trigger-specific; `guildId` is always required, the
 *   rest are the ids the run context is built from.
 */
async function emit(client, triggerType, payload) {
	try {
		if (!client.automations || !payload?.guildId) return;

		const all = await client.automations.getForGuild(payload.guildId);
		// The fast path, and the reason this is cheap enough for messageCreate.
		if (!all.length) return;
		const candidates = all.filter(a => a.triggerType === triggerType);
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

		for (const automation of candidates) {
			const node = triggerNode(automation.graph);
			if (!node || !matches(node, payload)) continue;
			if (await rateLimited(client, payload.guildId)) return;

			const ctx = new Context(client, {
				actorId: payload.userId ?? null,
				channelId: payload.channelId ?? null,
				depth,
				guildId: payload.guildId,
				messageId: payload.messageId ?? null,
				selection: payload.selection ?? null,
				ticketId: payload.ticketId ?? null,
				triggerType,
				vars: payload.vars ?? {},
			});
			ctx.interaction = payload.interaction ?? null;

			// Awaited inside the ALS scope so nested emits inherit the depth, but
			// the whole loop is fire-and-forget from the caller's point of view.
			await store.run({
				depth,
				rootRunId: store.getStore()?.rootRunId ?? null,
			}, () => client.automations.run(automation, ctx));
		}
	} catch (error) {
		client.log?.warn('Automation dispatch failed for %s: %s', triggerType, error?.message ?? error);
	}
}

module.exports = {
	currentDepth,
	emit,
	matches,
	store,
};
