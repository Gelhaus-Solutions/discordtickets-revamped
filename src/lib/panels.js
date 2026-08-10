const ms = require('ms');
const { MessageFlags } = require('discord.js');
const {
	LayoutError,
	buildMessage,
	needsStats,
	validateLayout,
} = require('./components-v2');
const {
	getAverageRating,
	getAverageTimes,
} = require('./stats');

/**
 * The Discord side of ticket panels.
 *
 * Panels used to be fire-and-forget — the API built a message, sent it, and kept
 * no record — so the dashboard told people to "just delete the message in
 * Discord". They are now rows in `panels`, and everything that talks to Discord
 * about them lives here so the routes stay thin and the listeners can reuse it.
 */

/** Discord error codes we treat as "the thing is already gone / not ours". */
const UNKNOWN_MESSAGE = 10008;
const MISSING_ACCESS = 50001;
const MISSING_PERMISSIONS = 50013;

/**
 * The substitution variables a panel is rendered with.
 *
 * Pure and synchronous: the stats are worked out by {@link panelStats} and
 * handed in, so this is the one function `check-placeholders.js` can call to
 * assert that everything the `panel` context advertises is actually supplied.
 *
 * @param {?import('discord.js').Guild} guild
 * @param {?object} [stats] the three averages, or null
 */
function panelVars(guild, { stats = null } = {}) {
	return {
		// Free: both come off the guild object the client already has cached.
		members: guild?.memberCount ?? '',
		server: guild?.name ?? '',
		...(stats ?? {
			avgRating: '',
			avgResolutionTime: '',
			avgResponseTime: '',
		}),
	};
}

/**
 * The three averages across the categories a panel opens.
 *
 * Aggregated over the raw tickets, **not** by averaging the per-category
 * averages that are already cached: an unweighted mean of means is wrong the
 * moment two categories have different volumes, and a category with three
 * tickets would swing the headline number as hard as one with three thousand.
 *
 * Cached on the sorted category list rather than the panel id, so two panels
 * covering the same categories share the work.
 *
 * A panel is rendered once, when an admin saves it, and never again — nothing
 * re-renders it on a timer. Averages tolerate that, which is why they are here
 * and a live "3 tickets are open right now" is not.
 *
 * @returns {Promise<?object>} null when the panel's message asks for no stats
 */
async function panelStats(client, categoryIds) {
	const ids = [...new Set(categoryIds ?? [])].sort((a, b) => a - b);
	if (ids.length === 0) return null;

	const cacheKey = `cache/panel-stats:${ids.join(',')}`;
	const cached = await client.keyv.get(cacheKey);
	if (cached) return cached;

	const closedTickets = await client.prisma.ticket.findMany({
		select: {
			closedAt: true,
			createdAt: true,
			feedback: { select: { rating: true } },
			firstResponseAt: true,
		},
		where: {
			categoryId: { in: ids },
			firstResponseAt: { not: null },
			open: false,
		},
	});

	const {
		avgResolutionTime,
		avgResponseTime,
	} = await getAverageTimes(closedTickets);
	const stats = {
		avgRating: (await getAverageRating(closedTickets)).toFixed(1),
		avgResolutionTime: ms(avgResolutionTime, { long: true }),
		avgResponseTime: ms(avgResponseTime, { long: true }),
	};

	await client.keyv.set(cacheKey, stats, ms('1h'));
	return stats;
}

/**
 * Render a stored panel into a Components v2 payload.
 *
 * Touches the database only for the guild's settings and, when the layout asks
 * for them, the category averages — so a `LayoutError` from here still means the
 * caller can answer 400 with nothing having been changed.
 *
 * @param {import('client')} client
 * @param {object} panel a `panels` row
 * @param {object} [settings] the guild's settings, fetched if not supplied
 */
async function renderPanel(client, panel, settings) {
	settings = settings ?? await client.prisma.guild.findUnique({
		select: {
			categories: true,
			footer: true,
			locale: true,
			primaryColour: true,
		},
		where: { id: panel.guildId },
	});

	const categories = new Map(settings.categories.map(c => [c.id, c]));
	const guild = client.guilds.cache.get(panel.guildId);

	// `renderPanel` sits inside the save path, so a stats failure must cost the
	// admin their averages, never their edit.
	let stats = null;
	if (needsStats(panel.layout)) {
		try {
			// `Panel.categories` is derived and persisted on every write, including
			// the expansion of a select menu that covers "all".
			stats = await panelStats(client, panel.categories);
		} catch (error) {
			client.log.warn('Could not work out the stats for panel %s: %s', panel.id, error?.message ?? error);
		}
	}

	return buildMessage(panel.layout, {
		categories,
		getMessage: client.i18n.getLocale(settings.locale),
		guild: {
			footer: settings.footer,
			iconURL: guild?.iconURL() ?? null,
			primaryColour: settings.primaryColour,
		},
		kind: 'panel',
		vars: panelVars(guild, { stats }),
	});
}

/**
 * Collect the category ids a layout actually references, so `Panel.categories`
 * is derived server-side and a client can never make it drift from the layout.
 *
 * @param {object} layout
 * @param {number[]} allCategoryIds ids to assume for a select menu that covers "all"
 * @returns {number[]}
 */
function collectCategoryIds(layout, allCategoryIds = []) {
	const found = new Set();
	const walk = blocks => {
		for (const block of blocks ?? []) {
			if (!block || typeof block !== 'object') continue;
			switch (block.type) {
			case 'container':
				walk(block.blocks);
				break;
			case 'buttons':
				for (const b of block.buttons ?? []) {
					if (b?.kind === 'ticket' && Number.isInteger(b.categoryId)) found.add(b.categoryId);
				}
				break;
			case 'section':
				if (block.accessory?.kind === 'button' && block.accessory.button?.kind === 'ticket') {
					if (Number.isInteger(block.accessory.button.categoryId)) found.add(block.accessory.button.categoryId);
				}
				break;
			case 'select':
				for (const id of block.categoryIds ?? allCategoryIds) found.add(id);
				break;
			}
		}
	};
	walk(layout?.blocks);
	return [...found];
}

/**
 * Post or update a panel's message, healing itself when the message has gone.
 *
 * The layout is expected to have been persisted *before* this is called and the
 * returned `messageId` persisted *after*, so a Discord outage can only ever cost
 * a message id, never an admin's work.
 *
 * @returns {Promise<{synced: boolean, messageId: ?string, reason?: string, recreated?: boolean}>}
 */
async function syncPanel(client, panel) {
	const channel = await client.channels.fetch(panel.channelId).catch(() => null);
	if (!channel) {
		// Deliberately does not create a channel: that only happens on create,
		// with a channel the admin explicitly asked for.
		return {
			messageId: null,
			reason: 'channel_missing',
			synced: false,
		};
	}

	const payload = await renderPanel(client, panel);

	if (panel.messageId) {
		const existing = await channel.messages.fetch(panel.messageId).catch(() => null);
		// Never touch a message we do not own.
		if (existing && existing.author?.id === client.user.id) {
			try {
				// The flag must be re-asserted on every edit, or the message
				// silently reverts to a non-v2 payload and Discord rejects it.
				await existing.edit({
					allowedMentions: payload.allowedMentions,
					components: payload.components,
					flags: MessageFlags.IsComponentsV2,
				});
				return {
					messageId: existing.id,
					synced: true,
				};
			} catch (error) {
				if (error.code !== UNKNOWN_MESSAGE) throw error;
				// Deleted between the fetch and the edit — fall through and repost.
			}
		}
	}

	const sent = await channel.send(payload);
	return {
		messageId: sent.id,
		recreated: Boolean(panel.messageId),
		synced: true,
	};
}

/**
 * Delete a panel's message. Never deletes channels — not even one the bot
 * created — because a channel may hold other panels or unrelated history.
 *
 * @returns {Promise<boolean>} whether a message was actually deleted
 */
async function deletePanelMessage(client, panel) {
	if (!panel.messageId) return false;
	const channel = await client.channels.fetch(panel.channelId).catch(() => null);
	if (!channel) return false;
	const message = await channel.messages.fetch(panel.messageId).catch(() => null);
	if (!message || message.author?.id !== client.user.id) return false;
	try {
		await message.delete();
		return true;
	} catch (error) {
		if ([UNKNOWN_MESSAGE, MISSING_ACCESS, MISSING_PERMISSIONS].includes(error.code)) return false;
		throw error;
	}
}

/**
 * Validate a layout against a guild's categories.
 * Throws {@link LayoutError}, which routes map to a 400.
 */
function validatePanelLayout(layout, categories, automationKeys = null) {
	return validateLayout(layout, {
		// Null means "don't check", which is what a caller with no automation list
		// gets — the button handler still refuses an automation that has gone.
		automationKeys: automationKeys && new Set(automationKeys),
		categoryIds: new Map(categories.map(c => [c.id, c])),
		kind: 'panel',
	});
}

/**
 * Turn an error from the render/send path into an HTTP response shape.
 *
 * Builders throw a plain `Error` from `toJSON()`, which is indistinguishable
 * from a server fault unless it is handled explicitly — so a malformed layout
 * must not surface as a 500.
 */
function describeError(error, guild) {
	if (error instanceof LayoutError) {
		return {
			body: {
				code: 'invalid_layout',
				errors: error.errors.map(e => ({
					message: e.path ? `${e.path}: ${e.message}` : e.message,
					type: e.code,
				})),
				statusCode: 400,
			},
			status: 400,
		};
	}

	if (error.code === MISSING_PERMISSIONS) {
		return {
			body: {
				code: 'missing_permissions',
				errors: [{
					message: `The bot does not have permission to post in that channel${guild ? '' : ''}. Give it View Channel and Send Messages, then try again.`,
					type: 'missing_permissions',
				}],
				statusCode: 403,
			},
			status: 403,
		};
	}

	return null;
}

module.exports = {
	collectCategoryIds,
	deletePanelMessage,
	describeError,
	panelStats,
	panelVars,
	renderPanel,
	syncPanel,
	validatePanelLayout,
};
