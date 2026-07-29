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
const { substitute } = require('../components-v2');
const { resolveGuildChannel } = require('../misc');
const { pools } = require('../threads');
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
 */
const render = (content, ctx) => substitute(String(content ?? ''), ctx.vars);

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
 * Turn an `action.message.send` button list into an action row.
 *
 * This is what lets one automation hand the member a button that starts
 * another: "ticket opened -> post a button", then "button pressed -> add a
 * role". The custom_id is the same one `src/buttons/auto.js` parses.
 *
 * Returns an empty array when there are no buttons, so the caller can spread it
 * into `components` unconditionally.
 */
function buildButtons(node, ctx) {
	const specs = Array.isArray(node.params?.buttons) ? node.params.buttons : [];
	if (specs.length === 0) return [];

	const row = new ActionRowBuilder().addComponents(
		specs.slice(0, LIMITS.messageButtons)
			.filter(spec => spec.nodeId ? ctx.automationKey : spec.automationKey)
			.map(spec => {
			// An in-graph button carries this automation's own key plus the node,
			// so pressing it comes back to the right branch of the right graph.
				const button = new ButtonBuilder()
					.setCustomId(spec.nodeId
						? automationCustomId(ctx.automationKey, spec.nodeId)
						: automationCustomId(spec.automationKey))
					.setStyle(BUTTON_STYLES[spec.style] ?? ButtonStyle.Primary)
					.setLabel(render(spec.label, ctx).slice(0, 80));
				const emoji = spec.emoji ? resolveEmoji(spec.emoji) : null;
				if (emoji) button.setEmoji(emoji);
				return button;
			}),
	);
	return [row];
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
				allowedMentions: { parse: ['users', 'roles'] },
				components: buildButtons(node, ctx),
				content: render(node.params.content, ctx),
			});
			return {};
		}),

		'action.message.dm': real(async (node, ctx) => {
			const settings = await ctx.getSettings();
			// A guild that turned DMs off means it, even for automations.
			if (settings?.disableDMs) return skip('dms_disabled');
			const member = await ctx.resolveSubject(node.params.subject);
			if (!member) return skip('unknown_member');
			await member.send({ content: render(node.params.content, ctx) });
			return {};
		}),

		'action.message.reply': real(async (node, ctx) => {
			const content = render(node.params.content, ctx);
			// A button or menu trigger has already acknowledged the interaction —
			// the handler must, inside 3 seconds — so this edits that reply.
			if (ctx.interaction) {
				await ctx.interaction.editReply({ content });
				return {};
			}
			const message = await ctx.getMessage();
			if (!message?.reply) return skip('nothing_to_reply_to');
			await message.reply({
				allowedMentions: { repliedUser: false },
				content,
			});
			return {};
		}),

		'action.message.ephemeral': real(async (node, ctx) => {
			// Never serialized, so a run that parked on a `flow.wait` has lost it —
			// and the 15-minute token would have expired anyway.
			if (!ctx.interaction) return skip('no_interaction');
			const content = render(node.params.content, ctx);
			try {
				// The trigger handler already opened an ephemeral reply with
				// `deferReply`, so the first private node fills that in and any
				// later one follows up. After `ack: 'none'` there is no deferred
				// reply to fill in — `ephemeral` is false — so it follows up too.
				if (ctx.interaction.ephemeral && ctx.interaction.deferred && !ctx.interaction.replied) {
					await ctx.interaction.editReply({ content });
				} else {
					await ctx.interaction.followUp({
						content,
						flags: MessageFlags.Ephemeral,
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
				reason: node.params.reason ? render(node.params.reason, ctx) : null,
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
				name: render(node.params.name, ctx),
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
			await client.prisma.ticket.update({
				// Topics are encrypted at rest, like every other piece of member
				// -supplied text in this schema.
				data: { topic: await pools.crypto.queue(w => w.encrypt(render(node.params.topic, ctx))) },
				where: { id: ctx.ticketId },
			});
			return {};
		}),

		/* ── misc ────────────────────────────────────────────────────────────── */

		'action.log': real(async (node, ctx) => {
			logAutomationEvent(client, {
				content: render(node.params.content, ctx),
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
