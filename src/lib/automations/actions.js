/**
 * The node runners: what each node type actually *does*.
 *
 * Keyed by node type and handed to the interpreter, which never imports them
 * directly — that indirection is what lets `check-automations.js` drive the
 * whole state machine with stubs.
 *
 * ## The contract
 *
 * A runner returns `{handle?, status?, reason?}`:
 *   - `handle` picks which edges to follow. Omitted ⇒ the node's first output.
 *   - `status` is `'ok'` unless the node deliberately did nothing, in which case
 *     `'skip'` with a `reason`. A run whose actions all skipped is `SKIPPED`,
 *     not `SUCCESS`, and that distinction is the whole value of the run log.
 *   - Throwing means the branch stops (or continues, for the nodes that declare
 *     `onError: 'continue'`). Throw for faults; return a skip for outcomes.
 *
 * The difference matters: a member with DMs closed is a *skip*, because nothing
 * is wrong and there is nothing to fix. Missing ManageRoles is also a skip, but
 * one whose reason names the permission — the run log is where an admin finds
 * out why their automation quietly did nothing.
 */

const { LIMITS } = require('./errors');
const { logAutomationEvent } = require('../logging');
const { resolveEmoji } = require('../emoji');
const {
	buildMessage,
	substitute,
} = require('../components-v2');
const { resolveGuildChannel } = require('../misc');
const { pools } = require('../threads');
const { usesLayout } = require('./registry');
const temporal = require('../temporal');
const {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	MessageFlags,
	RESTJSONErrorCodes,
} = require('discord.js');
const {
	addRole,
	automationCustomId,
	removeRole,
} = require('./discord');
const {
	addTicketMember,
	moveTicket,
	removeTicketMember,
	renameTicket,
	setPriority,
	setTicketEmoji,
} = require('../tickets/mutations');
const { evaluateClauses } = require('./conditions');

const skip = reason => ({
	reason,
	status: 'skip',
});

/**
 * Fill in `{name}`, `{num}` and friends.
 *
 * Reuses the layout substitution rather than inventing a second syntax, so the
 * placeholders an admin already knows from panels and opening messages mean the
 * same thing in an automation.
 *
 * Async because `{opener}` and `{num}` come from the ticket rather than from the
 * trigger — `ctx.varsFor` only reads it when the text asks for them. `{name}` is
 * whoever set the run off, which on a button press is the staff member who
 * pressed it; `{opener}` is who the ticket belongs to.
 */
const render = async (content, ctx) => {
	const text = String(content ?? '');
	return substitute(text, await ctx.varsFor(text));
};

/** What Discord says when an interaction token is past its 15 minutes. */
const EXPIRED_INTERACTION = [
	RESTJSONErrorCodes.UnknownInteraction,
	RESTJSONErrorCodes.InvalidWebhookToken,
];

const BUTTON_STYLES = {
	danger: ButtonStyle.Danger,
	primary: ButtonStyle.Primary,
	secondary: ButtonStyle.Secondary,
	success: ButtonStyle.Success,
};

/**
 * Turn a legacy-format button list into an action row.
 *
 * This is what lets one automation hand the member a button that starts
 * another: "ticket opened -> post a button", then "button pressed -> add a
 * role". The custom_id is the same one `src/buttons/auto.js` parses, and the
 * same one the layout renderer produces — the two formats differ in how the
 * button is *authored*, never in what Discord receives.
 *
 * Returns an empty array when there are no buttons, so the caller can spread it
 * into `components` unconditionally.
 */
async function buildButtons(node, ctx) {
	const specs = Array.isArray(node.params?.buttons) ? node.params.buttons : [];
	if (specs.length === 0) return [];

	const buttons = [];
	for (const spec of specs.slice(0, LIMITS.messageButtons)) {
		if (!(spec.nodeId ? ctx.automationKey : spec.automationKey)) continue;
		// An in-graph button carries this automation's own key plus the node,
		// so pressing it comes back to the right branch of the right graph.
		const button = new ButtonBuilder()
			.setCustomId(spec.nodeId
				? automationCustomId(ctx.automationKey, spec.nodeId)
				: automationCustomId(spec.automationKey))
			.setStyle(BUTTON_STYLES[spec.style] ?? ButtonStyle.Primary)
			.setLabel((await render(spec.label, ctx)).slice(0, 80));
		const emoji = spec.emoji ? resolveEmoji(spec.emoji) : null;
		if (emoji) button.setEmoji(emoji);
		buttons.push(button);
	}
	if (buttons.length === 0) return [];

	return [new ActionRowBuilder().addComponents(buttons)];
}

/**
 * Render an `action.message.*` node's stored layout into a message payload.
 *
 * The same renderer panels and opening messages use, so a rich automation
 * message gets containers, images, sections and the whole button model for
 * free — one button implementation in the codebase, two ways of authoring one.
 *
 * Substitution variables are resolved once for the whole document: `ctx.varsFor`
 * only touches the database when the text actually references `{opener}` or
 * `{num}`, and asking it about the serialised layout keeps that property while
 * covering every string in it.
 *
 * @param {'message'|'ephemeral'|'dm'} kind
 * @returns {Promise<{components: Array, flags: number}>}
 */
async function renderLayout(client, node, ctx, kind) {
	const layout = node.params?.layout;
	const settings = await ctx.getSettings();
	const guild = await ctx.getGuild();

	// Only paid for when the layout actually holds a ticket button; both
	// resolutions are memoised for the length of the run.
	const needsCategories = /"kind"\s*:\s*"ticket"/.test(JSON.stringify(layout ?? ''));
	const enabled = await client.automations.getForGuild(ctx.guildId).catch(() => null);

	const payload = buildMessage(layout, {
		// A button that continues this graph carries the automation's own key, so
		// pressing it comes back to the right branch of the right graph.
		automationKey: ctx.automationKey,
		automations: enabled ? new Set(enabled.map(a => a.key)) : null,
		categories: needsCategories ? await ctx.getCategories() : new Map(),
		getMessage: client.i18n.getLocale(settings?.locale),
		guild: {
			footer: settings?.footer ?? null,
			iconURL: guild?.iconURL() ?? null,
			primaryColour: settings?.primaryColour ?? null,
		},
		kind,
		vars: await ctx.varsFor(JSON.stringify(layout ?? '')),
	});

	return {
		components: payload.components,
		flags: payload.flags,
	};
}

/**
 * One message node's payload, in whichever format it was authored.
 *
 * `allowedMentions` is deliberately not taken from `buildMessage` — that
 * derivation is for opening messages, which know their ping roles. Each caller
 * supplies the rule its own code has always used, because a Components v2
 * message has no `content` for Discord to derive mention parsing from and
 * getting it wrong means either silently inert role pings or newly-noisy ones.
 *
 * @param {'message'|'ephemeral'|'dm'} kind
 * @returns {Promise<{content?: string, components: Array, flags?: number}>}
 */
async function renderMessage(client, node, ctx, kind) {
	if (usesLayout(node.params)) return renderLayout(client, node, ctx, kind);
	return {
		components: kind === 'dm' ? [] : await buildButtons(node, ctx),
		content: await render(node.params.content, ctx),
	};
}

/** Resolve where `action.message.send` should post. */
async function resolveTarget(node, ctx) {
	switch (node.params?.target) {
	case 'channel':
		// Scoped to the automation's own guild: `client.channels` covers every
		// guild the bot is in, so this used to be a way to have the bot post
		// admin-authored content into somebody else's server.
		return resolveGuildChannel(ctx.client, ctx.guildId, node.params.channelId);
	case 'triggerChannel':
		return ctx.getChannel();
	default:
		return ctx.getTicketChannel();
	}
}

/**
 * Build the runner map.
 *
 * @param {import('../../client')} client
 * @param {(automationKey: string, ctx: object) => Promise<void>} runNested used
 *   by `action.automation.run`; injected to avoid a cycle with the manager.
 */
function makeRunners(client, runNested) {
	/** Every action is a no-op in dry-run mode, so `POST .../test` is safe to press. */
	const real = fn => async (node, ctx) => (ctx.dryRun ? { reason: 'dry_run' } : fn(node, ctx));

	return {

		/* ── flow ────────────────────────────────────────────────────────────── */

		'flow.if': async (node, ctx) => ({ handle: (await evaluateClauses(node.params, ctx)) ? 'true' : 'false' }),
		'flow.noop': async () => ({}),
		'flow.stop': async node => ({
			reason: node.params?.reason || undefined,
			status: 'stop',
		}),
		// `flow.wait` is never called: the interpreter intercepts durable nodes
		// before dispatching. Present so the map is total.
		'flow.wait': async () => ({}),

		/* ── conditions ──────────────────────────────────────────────────────── */

		'condition.filter': async (node, ctx) => ({ handle: (await evaluateClauses(node.params, ctx)) ? 'true' : 'false' }),

		/* ── triggers ────────────────────────────────────────────────────────── */

		// The trigger has already happened by the time the run starts; executing
		// it is just the entry point.
		...Object.fromEntries(
			['ticket.created',
				'ticket.claimed',
				'ticket.released',
				'ticket.closeRequested',
				'ticket.closed',
				'ticket.reopened',
				'ticket.stale',
				'ticket.feedback',
				'ticket.priorityChanged',
				'ticket.moved',
				'ticket.memberAdded',
				'button.pressed',
				'menu.selected',
				'message.created',
				'member.joined',
				'member.left',
				'member.roleAdded',
				'member.roleRemoved',
				'schedule.cron'].map(name => [`trigger.${name}`, async () => ({})]),
		),

		/* ── roles ───────────────────────────────────────────────────────────── */

		'action.role.add': real(async (node, ctx) => {
			const member = await ctx.resolveSubject(node.params.subject);
			if (!member) return skip('unknown_member');
			const result = await addRole(client, {
				guildId: ctx.guildId,
				reason: 'Automation',
				roleId: node.params.roleId,
				userId: member.id,
			});
			return result.ok ? { reason: result.reason } : skip(result.reason);
		}),

		'action.role.remove': real(async (node, ctx) => {
			const member = await ctx.resolveSubject(node.params.subject);
			if (!member) return skip('unknown_member');
			const result = await removeRole(client, {
				guildId: ctx.guildId,
				reason: 'Automation',
				roleId: node.params.roleId,
				userId: member.id,
			});
			return result.ok ? { reason: result.reason } : skip(result.reason);
		}),

		/* ── messages ────────────────────────────────────────────────────────── */

		'action.message.send': real(async (node, ctx) => {
			const channel = await resolveTarget(node, ctx);
			if (!channel?.send) return skip('unknown_channel');
			await channel.send({
				// A Components v2 message has no `content`, so mention parsing is
				// not derived from anything — without this, a role ping in a rich
				// message is inert and the staff it names are never notified. The
				// legacy format has always passed the same rule.
				allowedMentions: { parse: ['users', 'roles'] },
				...await renderMessage(client, node, ctx, 'message'),
			});
			return {};
		}),

		'action.message.dm': real(async (node, ctx) => {
			const settings = await ctx.getSettings();
			// A guild that turned DMs off means it, even for automations.
			if (settings?.disableDMs) return skip('dms_disabled');
			const member = await ctx.resolveSubject(node.params.subject);
			if (!member) return skip('unknown_member');
			await member.send(await renderMessage(client, node, ctx, 'dm'));
			return {};
		}),

		'action.message.reply': real(async (node, ctx) => {
			const payload = await renderMessage(client, node, ctx, 'message');
			// The tickbox is only meaningful against an interaction: a plain
			// message has no private channel to answer in.
			const priv = node.params?.ephemeral !== false;

			// A button or menu trigger has already acknowledged the interaction —
			// the handler must, inside 3 seconds — so this fills that reply in.
			if (ctx.interaction) {
				try {
					const pending = ctx.interaction.deferred && !ctx.interaction.replied;
					if (priv && pending && ctx.interaction.ephemeral) {
						await ctx.interaction.editReply(payload);
					} else if (priv) {
						await ctx.interaction.followUp({
							...payload,
							flags: (payload.flags ?? 0) | MessageFlags.Ephemeral,
						});
					} else {
						// The handler's ephemeral "working on it" would otherwise sit
						// there spinning forever, because nothing else will fill it in.
						if (pending && ctx.interaction.ephemeral) await ctx.interaction.deleteReply().catch(() => null);
						await ctx.interaction.followUp(payload);
					}
				} catch (error) {
					if (EXPIRED_INTERACTION.includes(error?.code)) return skip('interaction_expired');
					throw error;
				}
				return {};
			}

			const message = await ctx.getMessage();
			if (!message?.reply) return skip('nothing_to_reply_to');
			await message.reply({
				allowedMentions: { repliedUser: false },
				...payload,
			});
			return {};
		}),

		'action.message.ephemeral': real(async (node, ctx) => {
			// Never serialized, so a run that parked on a `flow.wait` has lost it —
			// and the 15-minute token would have expired anyway.
			if (!ctx.interaction) return skip('no_interaction');
			// Buttons here are how a confirmation is built: a private "are you
			// sure?" whose Yes and No each start their own button trigger.
			const payload = await renderMessage(client, node, ctx, 'ephemeral');
			try {
				// The trigger handler already opened an ephemeral reply with
				// `deferReply`, so the first private node fills that in and any
				// later one follows up. After `ack: 'none'` there is no deferred
				// reply to fill in — `ephemeral` is false — so it follows up too.
				if (ctx.interaction.ephemeral && ctx.interaction.deferred && !ctx.interaction.replied) {
					await ctx.interaction.editReply(payload);
				} else {
					await ctx.interaction.followUp({
						...payload,
						flags: (payload.flags ?? 0) | MessageFlags.Ephemeral,
					});
				}
			} catch (error) {
				// A run slower than the token is an outcome the log should name,
				// not a fault: there is nothing an admin could fix in the graph.
				if (EXPIRED_INTERACTION.includes(error?.code)) return skip('interaction_expired');
				throw error;
			}
			return {};
		}),

		'action.message.react': real(async (node, ctx) => {
			const message = await ctx.getMessage();
			if (!message?.react) return skip('unknown_message');
			await message.react(resolveEmoji(node.params.emoji) ?? node.params.emoji);
			return {};
		}),

		/* ── tickets ─────────────────────────────────────────────────────────── */

		'action.ticket.close': real(async (node, ctx) => {
			const ticket = await ctx.getTicket();
			if (!ticket?.open) return skip('not_open');
			// Closing is already durable, so this hands off rather than doing it
			// inline — the run does not wait for the transcript to be written.
			await temporal.startCloseTicket({
				closedBy: null,
				guildId: ctx.guildId,
				reason: node.params.reason ? await render(node.params.reason, ctx) : null,
				ticketId: ticket.id,
			});
			return {};
		}),

		'action.ticket.claim': real(async (node, ctx) => {
			const member = await ctx.resolveSubject(node.params.subject);
			const channel = await ctx.getTicketChannel();
			if (!member || !channel) return skip('unavailable');
			await client.tickets.autoClaim(channel, member.id);
			return {};
		}),

		'action.ticket.setEmoji': real(async (node, ctx) => {
			const clear = node.params.mode === 'clear';
			const result = await setTicketEmoji(client, {
				actorId: ctx.actorId,
				emoji: clear ? null : node.params.emoji,
				scope: clear ? null : node.params.mode,
				ticketId: ctx.ticketId,
			});
			// `rename_deferred` rides back as an ok-with-reason: the override is
			// persisted the moment this returns, and only the channel name lags.
			return result.ok ? { reason: result.reason } : skip(result.reason);
		}),

		'action.ticket.setPriority': real(async (node, ctx) => {
			const result = await setPriority(client, {
				actorId: ctx.actorId,
				priority: node.params.priority,
				ticketId: ctx.ticketId,
			});
			return result.ok ? { reason: result.reason } : skip(result.reason);
		}),

		'action.ticket.move': real(async (node, ctx) => {
			const result = await moveTicket(client, {
				actorId: ctx.actorId,
				categoryId: node.params.categoryId,
				ticketId: ctx.ticketId,
			});
			return result.ok ? { reason: result.reason } : skip(result.reason);
		}),

		'action.ticket.rename': real(async (node, ctx) => {
			const result = await renameTicket(client, {
				actorId: ctx.actorId,
				name: await render(node.params.name, ctx),
				ticketId: ctx.ticketId,
			});
			return result.ok ? { reason: result.reason } : skip(result.reason);
		}),

		'action.ticket.addMember': real(async (node, ctx) => {
			const member = await ctx.resolveSubject(node.params.subject);
			if (!member) return skip('unknown_member');
			const result = await addTicketMember(client, {
				actorId: ctx.actorId,
				ticketId: ctx.ticketId,
				userId: member.id,
			});
			return result.ok ? { reason: result.reason } : skip(result.reason);
		}),

		'action.ticket.removeMember': real(async (node, ctx) => {
			const member = await ctx.resolveSubject(node.params.subject);
			if (!member) return skip('unknown_member');
			const result = await removeTicketMember(client, {
				actorId: ctx.actorId,
				ticketId: ctx.ticketId,
				userId: member.id,
			});
			return result.ok ? { reason: result.reason } : skip(result.reason);
		}),

		'action.ticket.setTopic': real(async (node, ctx) => {
			if (!ctx.ticketId) return skip('unknown_ticket');
			const topic = await render(node.params.topic, ctx);
			await client.prisma.ticket.update({
				// Topics are encrypted at rest, like every other piece of member
				// -supplied text in this schema.
				data: { topic: await pools.crypto.queue(w => w.encrypt(topic)) },
				where: { id: ctx.ticketId },
			});
			return {};
		}),

		/* ── misc ────────────────────────────────────────────────────────────── */

		'action.log': real(async (node, ctx) => {
			logAutomationEvent(client, {
				content: await render(node.params.content, ctx),
				guildId: ctx.guildId,
				userId: ctx.actorId,
			});
			return {};
		}),

		'action.automation.run': real(async (node, ctx) => {
			// Cycles inside one graph are impossible by validation, but A calling B
			// calling A is not detectable at save time — only here.
			if (ctx.atMaxDepth) return skip('max_depth');
			await runNested(node.params.automationKey, ctx);
			return {};
		}),
	};
}

module.exports = {
	makeRunners,
	render,
};
