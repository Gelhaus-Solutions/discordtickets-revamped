/**
 * The run context: everything a node is allowed to look at, and the only thing
 * that survives a `flow.wait`.
 *
 * The hard rule here is that **`serialize()` must return plain JSON**. A parked
 * run is handed to Temporal, so anything that cannot survive
 * `JSON.parse(JSON.stringify(...))` — a Map, a Date, a discord.js object — is a
 * bug that only shows up days later when the run resumes. `check-automations.js`
 * asserts the round-trip for exactly that reason.
 *
 * Live objects are therefore never stored. They are resolved on demand from ids
 * and memoised for the length of one run, so a graph that never asks for the
 * member never pays for fetching them.
 */

const { LIMITS } = require('./errors');

class Context {
	/**
	 * @param {import('../../client')} client
	 * @param {object} state the serializable half — see `serialize()`
	 */
	constructor(client, state = {}) {
		this.client = client;

		this.runId = state.runId ?? null;
		this.automationId = state.automationId ?? null;
		/** The automation's short key, so a button it posts can point back at it. */
		this.automationKey = state.automationKey ?? null;
		this.triggerType = state.triggerType ?? null;

		this.guildId = state.guildId ?? null;
		this.actorId = state.actorId ?? null;
		this.ticketId = state.ticketId ?? null;
		this.channelId = state.channelId ?? null;
		this.messageId = state.messageId ?? null;
		/** Values chosen in a select menu, for `trigger.menu.selected`. */
		this.selection = state.selection ?? null;

		/** Substitution variables for `{name}`, `{num}` and friends. */
		this.vars = state.vars ?? {};
		/** How many automations deep this run is, for the recursion guard. */
		this.depth = state.depth ?? 0;
		this.budget = { steps: state.stepsUsed ?? 0 };
		this.executed = state.executed ?? [];
		this.trace = state.trace ?? [];

		/**
		 * True when the run is already inside a Temporal activity, so the caller
		 * must hand a further wait back to the workflow rather than starting a
		 * second one.
		 */
		this.durable = false;
		/** True for `POST .../test`: actions report success without doing anything. */
		this.dryRun = false;

		/**
		 * The live interaction, for button and menu triggers only.
		 *
		 * Not serialized, and deliberately so: an interaction token expires in
		 * 15 minutes, so a run that parks on a `flow.wait` cannot reply to it
		 * afterwards. `action.message.reply` falls back to the message, or skips.
		 */
		this.interaction = null;

		/** Live objects, resolved on demand. Never serialized. */
		this._cache = new Map();
	}

	/**
	 * The JSON half of the context.
	 *
	 * Ids only. If you are tempted to add something here, ask whether it will
	 * still be true in three days, because that is how long a `flow.wait` can be.
	 */
	serialize() {
		return {
			actorId: this.actorId,
			automationId: this.automationId,
			automationKey: this.automationKey,
			channelId: this.channelId,
			depth: this.depth,
			guildId: this.guildId,
			messageId: this.messageId,
			runId: this.runId,
			selection: this.selection,
			stepsUsed: this.budget.steps,
			ticketId: this.ticketId,
			triggerType: this.triggerType,
			vars: this.vars,
		};
	}

	/** Memoise one resolution for the length of the run. */
	async _once(key, resolve) {
		if (this._cache.has(key)) return this._cache.get(key);
		let value = null;
		try {
			value = await resolve();
		} catch {
			value = null;
		}
		this._cache.set(key, value);
		return value;
	}

	getGuild() {
		return this._once('guild', () => this.client.guilds.cache.get(this.guildId) ?? null);
	}

	getSettings() {
		return this._once('settings', () => this.client.prisma.guild.findUnique({ where: { id: this.guildId } }));
	}

	/**
	 * The guild's ticket categories, keyed by id, for a layout that holds a ticket
	 * button.
	 *
	 * A Map because that is what `components-v2.js#buildButton` expects, and the
	 * same shape `renderPanel` builds from the guild's settings. Resolved on demand
	 * like everything else here: a message with no ticket button never pays for it.
	 */
	getCategories() {
		return this._once('categories', async () => {
			const categories = await this.client.prisma.category.findMany({ where: { guildId: this.guildId } });
			return new Map(categories.map(c => [c.id, c]));
		});
	}

	getMember() {
		return this._once('member', async () => {
			if (!this.actorId) return null;
			const guild = await this.getGuild();
			return guild ? guild.members.fetch(this.actorId) : null;
		});
	}

	// Everything a context resolves is scoped to its own guild. Ids can reach a
	// context from a request body (the dry-run endpoint) as well as from a
	// trigger, and both `prisma.ticket.findUnique` and `client.channels` are
	// global — so without the guild filter, clauses like `ticket.answer`
	// (which decrypts) would answer questions about other servers' tickets.

	getTicket() {
		return this._once('ticket', () => {
			if (!this.ticketId) return null;
			return this.client.tickets.getTicket(this.ticketId, false, this.guildId);
		});
	}

	getTicketChannel() {
		return this._once('ticketChannel', async () => {
			if (!this.ticketId) return null;
			const channel = await this.client.channels.fetch(this.ticketId).catch(() => null);
			return channel?.guildId === this.guildId ? channel : null;
		});
	}

	getChannel() {
		return this._once('channel', async () => {
			if (!this.channelId) return null;
			const channel = await this.client.channels.fetch(this.channelId).catch(() => null);
			return channel?.guildId === this.guildId ? channel : null;
		});
	}

	getMessage() {
		return this._once('message', async () => {
			if (!this.messageId) return null;
			const channel = await this.getChannel();
			return channel?.messages ? channel.messages.fetch(this.messageId) : null;
		});
	}

	/**
	 * The ticket-derived placeholders: `{opener}`, `{openerdisplayname}`,
	 * `{openermention}` and `{num}`.
	 *
	 * Kept out of `vars` — and out of `serialize()` — because they cost a
	 * database read and a member fetch, and most graphs never ask for them. A
	 * parked run resolves them again when it wakes, which is also the right
	 * answer: the ticket may have been renumbered or the member may have left.
	 */
	ticketVars() {
		return this._once('ticketVars', async () => {
			const ticket = await this.getTicket();
			if (!ticket) return {};

			const id = ticket.createdById;
			// The opener is often gone by the time a closing automation runs, so
			// fall back to the user — a username still beats an empty string —
			// and then to the mention, which needs no fetch at all.
			const member = id ? await this.resolveSubject('ticketCreator') : null;
			const user = member?.user ?? (id ? await this.client.users.fetch(id).catch(() => null) : null);

			return {
				num: ticket.number ?? '',
				opener: user?.username ?? '',
				openerdisplayname: member?.displayName ?? user?.displayName ?? user?.username ?? '',
				openermention: id ? `<@${id}>` : '',
			};
		});
	}

	/**
	 * The variables one string needs, resolved.
	 *
	 * Only touches the database when the text actually references a ticket
	 * placeholder: an automation that posts a fixed string should not pay for a
	 * ticket lookup to find that out.
	 */
	async varsFor(text) {
		if (!/{+\s?(opener\w*|num(ber)?)\s?}+/i.test(String(text ?? ''))) return this.vars;
		return {
			...await this.ticketVars(),
			// Trigger-supplied values win: `{num}` never comes from a trigger
			// today, but a trigger that knows better should not be overruled.
			...this.vars,
		};
	}

	/**
	 * Resolve a `subject` param to a member.
	 *
	 * Returns null rather than throwing when the person is gone — a member who
	 * left is a normal outcome, and the node reports it as a skip.
	 */
	async resolveSubject(subject) {
		const guild = await this.getGuild();
		if (!guild) return null;

		const fetch = async id => {
			if (!id) return null;
			try {
				return await guild.members.fetch(id);
			} catch {
				return null;
			}
		};

		if (typeof subject === 'string' && subject.startsWith('user:')) return fetch(subject.slice(5));

		switch (subject) {
		case 'actor':
			return this.getMember();
		case 'messageAuthor': {
			const message = await this.getMessage();
			return fetch(message?.author?.id);
		}
		case 'ticketClaimer': {
			const ticket = await this.getTicket();
			return fetch(ticket?.claimedById);
		}
		case 'ticketCreator': {
			const ticket = await this.getTicket();
			return fetch(ticket?.createdById);
		}
		default:
			return null;
		}
	}

	/** A child context for `action.automation.run`, one level deeper. */
	descend(automationId, runId, automationKey = null) {
		const child = new Context(this.client, {
			...this.serialize(),
			automationId,
			automationKey,
			depth: this.depth + 1,
			runId,
			// The step budget is shared: a chain of automations gets one budget
			// between them, not one each.
			stepsUsed: this.budget.steps,
		});
		child.dryRun = this.dryRun;
		child.durable = this.durable;
		// Live objects are safe to share — same guild, same actor, same ticket.
		child._cache = this._cache;
		return child;
	}

	get atMaxDepth() {
		return this.depth >= LIMITS.depth;
	}
}

module.exports = { Context };
