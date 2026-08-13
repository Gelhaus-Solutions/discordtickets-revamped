const { createHash } = require('crypto');
module.exports.md5 = str => createHash('md5').update(str).digest('hex');

/**
 * Resolve a channel id, but only if it belongs to the given guild.
 *
 * `client.channels` is the whole cache, across every guild the bot is in, so
 * `client.channels.fetch(id)` happily returns someone else's channel. Panels,
 * the log channel and the automation "send a message" action all took an id
 * straight from an admin's request and resolved it that way — which let an
 * admin of one server point them at a channel in another and have the bot post
 * their content there, under its own identity.
 *
 * @param {import('client')} client
 * @param {string} guildId the guild the caller administrates
 * @param {unknown} channelId the requested channel id
 * @returns {import("discord.js").GuildBasedChannel|null} null if it is not a
 * channel of that guild (or is not cached)
 */
module.exports.resolveGuildChannel = (client, guildId, channelId) => {
	if (typeof channelId !== 'string' && typeof channelId !== 'number') return null;
	const channel = client.channels.cache.get(String(channelId));
	return channel?.guildId === guildId ? channel : null;
};

/**
 * Is this a redirect target that can only land back on this dashboard?
 *
 * `/auth/login` takes the target from `?r=` and `/auth/callback` takes it back
 * out of the state cookie, so both ends have to agree on what is safe, or the
 * stricter end is just a formality. Anything that is not an absolute path on
 * this origin is rejected: protocol-relative (`//evil.example`), scheme URLs
 * (`javascript:`, `https://…`), the backslash variants some browsers normalise
 * into them (`/\evil.example`), and anything carrying control, whitespace or
 * quote characters that could break out of a URL or HTML context.
 *
 * @param {unknown} value the requested redirect target
 * @returns {boolean} whether it is safe to redirect there
 */
module.exports.isSafeRedirect = value =>
	typeof value === 'string' &&
	value.startsWith('/') &&
	!value.startsWith('//') &&
	!value.startsWith('/\\') &&
	// eslint-disable-next-line no-control-regex
	!/[\x00-\x20\x7f"'<>\\]/.test(value);

module.exports.iconURL = guildLike => guildLike.icon
	? guildLike.client.rest.cdn.icon(guildLike.id, guildLike.icon)
	: `https://api.dicebear.com/8.x/initials/png?seed=${encodeURIComponent(guildLike.name)}&size=96&backgroundType=gradientLinear&fontWeight=600`;
