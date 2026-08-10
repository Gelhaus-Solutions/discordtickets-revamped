/**
 * Validation for the tags API.
 *
 * Two things went wrong here before, and both are the kind that only show up in
 * someone else's server:
 *
 *   - the PATCH handler passed `req.body` straight to `prisma.tag.update`, and
 *     `guildId` is a writable scalar — so `{"guildId": "<other server>"}` moved
 *     the tag out of the guild the caller administrates and into one they do
 *     not, where the bot then replies with its content;
 *   - `regex` was stored unvalidated and run against every message in the
 *     guild, so `(a+)+$` was a whole-process denial of service.
 *
 * Both routes now build their payload here instead.
 */

const {
	MAX_PATTERN_LENGTH, isSafePattern,
} = require('./regex');

/**
 * The substitution variables a tag's content is rendered with.
 *
 * Tags did not substitute anything at all: the dashboard previewed `{name}`
 * being filled in and the bot posted the braces. Both call sites — `/tag` and
 * the pattern match in `messageCreate` — now go through here, so the preview and
 * the message agree.
 *
 * `{name}` is a mention rather than a username, matching what it means in an
 * opening message: a tag is a reply to a person.
 */
function tagVars({
	guild = null, member = null,
} = {}) {
	return {
		displayname: member?.displayName ?? '',
		members: guild?.memberCount ?? '',
		name: member?.id ? `<@${member.id}>` : '',
		server: guild?.name ?? '',
	};
}

class TagError extends Error {
	constructor(message) {
		super(message);
		this.name = 'TagError';
		this.statusCode = 400;
	}
}

/**
 * Build a safe `data` payload for a tag create/update.
 *
 * @param {Record<string, unknown>} body the request body (untrusted)
 * @param {{ partial?: boolean }} [options] `partial` for PATCH, where an absent
 * field means "leave it alone" rather than "set it to the default"
 * @returns {{ content?: string, name?: string, regex?: string|null }}
 * @throws {TagError} on an unusable value
 */
function validateTagBody(body, { partial = true } = {}) {
	const data = {};

	if (!partial || body.content !== undefined) {
		data.content = typeof body.content === 'string' ? body.content : '';
	}

	if (!partial || body.name !== undefined) {
		data.name = typeof body.name === 'string' ? body.name : '';
	}

	if (!partial || body.regex !== undefined) {
		if (body.regex === null || body.regex === undefined || body.regex === '') {
			data.regex = null;
		} else if (typeof body.regex !== 'string') {
			throw new TagError('The pattern must be text.');
		} else {
			try {
				new RegExp(body.regex, 'mi');
			} catch {
				throw new TagError('The pattern is not a valid regular expression.');
			}
			if (!isSafePattern(body.regex)) {
				throw new TagError(
					'The pattern is too complex to run safely. Avoid a repeat applied to a group that already repeats ' +
					`(like "(a+)+"), and keep it under ${MAX_PATTERN_LENGTH} characters.`,
				);
			}
			data.regex = body.regex;
		}
	}

	return data;
}

module.exports = {
	TagError,
	tagVars,
	validateTagBody,
};
