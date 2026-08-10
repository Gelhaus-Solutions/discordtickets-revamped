/**
 * How a ticket channel is named.
 *
 * The bot manages a prefix on every ticket channel: an emoji for the ticket's
 * state, then one for its priority, then the category's rendered template. That
 * convention used to be re-implemented at every site that touched a name —
 * `'✅' + name` to claim, `name.slice(1)` to release, a `/^✅/` strip on close,
 * a `.replace(oldEmoji, newEmoji)` on a priority change — and they disagreed.
 * A rename dropped the priority emoji, a transfer dropped both.
 *
 * Worse, two of them were wrong in a way that only showed up once the emoji
 * stopped being `✅`. `.slice(1)` removes one UTF-16 *code unit*: fine for
 * U+2705 by luck, but it cuts 🔴 (a surrogate pair) in half and leaves five
 * units of 🏳️‍🌈 behind. Making the emoji configurable would have turned a
 * latent bug into a routine one.
 *
 * So: one definition of the prefix, one strip that removes exactly what it
 * matched, and one rebuild that is idempotent — which is what makes every call
 * site safe to run twice.
 *
 * Deliberately dependency-free apart from the emoji resolver, so
 * `scripts/check-tickets.js` can exercise it without a database, a Discord
 * gateway, or the Temporal layer that `mutations.js` pulls in at require time.
 */

const { displayEmoji } = require('../emoji');

/** Discord's channel-name limit, counted in code points rather than units. */
const NAME_LIMIT = 100;

/**
 * The ticket's state, as far as the channel name is concerned.
 *
 * @param {object} ticket
 * @returns {'closed'|'claimed'|'unclaimed'}
 */
const ticketState = ticket =>
	ticket?.open === false ? 'closed' : ticket?.claimedById ? 'claimed' : 'unclaimed';

/**
 * The emoji for a ticket's current state, from already-resolved settings.
 *
 * Everything is run through `displayEmoji`, which returns `''` for a custom
 * server emoji — those have no textual form, so one stored here would otherwise
 * put a literal `<:urgent:123…>` in the channel name.
 *
 * @param {object} ticket
 * @param {object} settings resolved emoji settings (see emoji-settings.js)
 * @returns {string}
 */
function stateEmoji(ticket, settings) {
	const state = ticketState(ticket);
	const configured = settings?.[`${state}Emoji`];
	return displayEmoji(configured ?? '');
}

/**
 * The emoji for a priority, from an already-merged map.
 *
 * @param {?string} priority
 * @param {Record<string, string>} [priorityEmojis]
 * @returns {string}
 */
const priorityEmoji = (priority, priorityEmojis) =>
	displayEmoji(priorityEmojis?.[String(priority ?? 'NONE').toUpperCase()] ?? '');

/**
 * The prefix the bot manages on a ticket channel's name.
 *
 * `settings` is required and must already be resolved — no default parameter,
 * because an implicit "just use the category" would quietly mean "ignore the
 * server defaults", which is the exact drift this split exists to prevent.
 *
 * @param {object} ticket
 * @param {object} settings resolved emoji settings
 * @returns {string}
 */
function managedPrefix(ticket, settings) {
	const override = displayEmoji(ticket?.emojiOverride ?? '');
	// 'all' means the override *is* the prefix — no state emoji, no priority.
	// Anything else (including a hand-edited row) behaves as 'state'.
	if (override && ticket?.emojiOverrideScope === 'all') return override;
	return (override || stateEmoji(ticket, settings)) +
		priorityEmoji(ticket?.priority, settings?.priorityEmojis);
}

/**
 * Remove anything the bot manages from the front of a name.
 *
 * Strips repeatedly, because the prefix is two slots and a name may be carrying
 * an older configuration's emoji in either of them.
 *
 * @param {string} name
 * @param {object} ticket
 * @param {object} settings resolved emoji settings, including `historical`
 * @returns {string}
 */
function stripManagedPrefix(name, ticket, settings) {
	// Longest first: if one configured emoji is a prefix of another (`✅` vs
	// `✅🔥`, `👍` vs `👍🏽`), stripping the shorter one first strands the rest.
	const candidates = [...new Set([
		displayEmoji(ticket?.emojiOverride ?? ''),
		...(settings?.historical ?? []),
	])]
		.filter(Boolean)
		.sort((a, b) => b.length - a.length);

	let out = String(name ?? '');
	for (let again = true; again;) {
		again = false;
		for (const emoji of candidates) {
			// `slice(emoji.length)` is code-unit-exact because `emoji` is the string
			// that just matched — which is what `.slice(1)` never was.
			if (out.startsWith(emoji)) {
				out = out.slice(emoji.length);
				again = true;
			}
		}
	}
	return out;
}

/**
 * Trim a name to Discord's limit without splitting a surrogate pair.
 *
 * New, and load-bearing: adding an unclaimed emoji to a 100-character template
 * pushes it over, and `guild.channels.create` rejects the whole call — so a
 * member's ticket would simply fail to open.
 *
 * @param {string} name
 * @returns {string}
 */
const clampName = name => [...String(name ?? '')].slice(0, NAME_LIMIT).join('');

/**
 * Rebuild a channel name: strip what the bot manages, prepend what it now wants.
 *
 * Idempotent, which is the property that makes it safe to call from a path that
 * may already have run.
 *
 * @param {string} currentName
 * @param {object} ticket
 * @param {object} settings resolved emoji settings
 * @returns {string}
 */
const managedName = (currentName, ticket, settings) =>
	clampName(managedPrefix(ticket, settings) + stripManagedPrefix(currentName, ticket, settings));

/**
 * A category's `channelName` template, filled in for a ticket.
 *
 * `fallback` is what stands in for a creator who has left the guild — `escalate`
 * uses their id so the channel is still identifiable, which is worth keeping.
 *
 * @param {string} template
 * @param {{creator?: object, fallback?: string, number: number}} vars
 * @returns {string}
 */
function renderChannelName(template, {
	creator, fallback = '', number,
}) {
	return String(template ?? '')
		.replace(/{+\s?(user)?name\s?}+/gi, creator?.user?.username ?? fallback)
		.replace(/{+\s?(nick|display)(name)?\s?}+/gi, creator?.displayName ?? fallback)
		// 1488 is a neo-Nazi numeric symbol; upstream skips it.
		.replace(/{+\s?num(ber)?\s?}+/gi, number === 1488 ? '1487b' : number);
}

module.exports = {
	NAME_LIMIT,
	clampName,
	managedName,
	managedPrefix,
	priorityEmoji,
	renderChannelName,
	stateEmoji,
	stripManagedPrefix,
	ticketState,
};
