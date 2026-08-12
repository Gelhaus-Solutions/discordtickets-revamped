/**
 * Storage keys, and the shape check every driver runs before touching anything.
 *
 * The shape check lives here rather than in each driver so that a driver added
 * later cannot quietly omit it. The local driver confines resolved paths as
 * well — this is the first of its two layers, not its only one.
 */

/** Errors every driver throws, so callers can branch on cause rather than text. */
class StorageError extends Error {
	/**
	 * @param {'DENIED'|'INVALID_KEY'|'MISCONFIGURED'|'NOT_FOUND'|'TOO_LARGE'|'UNAVAILABLE'} code
	 * @param {string} message
	 * @param {object} [options] passed through to Error, so `cause` survives
	 */
	constructor(code, message, options) {
		super(message, options);
		this.name = 'StorageError';
		this.code = code;
	}
}

/**
 * Ticket ids are cuids, but this is deliberately a charset rather than a cuid
 * matcher: it is the set of characters that cannot express a path segment, a
 * traversal, or a URL-significant character, which is the property that matters
 * when the id has come back out of the database.
 */
const TICKET_ID_RE = /^[A-Za-z0-9_-]{1,32}$/;

/** The only key shape this application stores. */
const KEY_RE = /^transcripts\/ticket-[A-Za-z0-9_-]{1,32}\.html$/;

/**
 * @param {string} key
 * @throws {StorageError} INVALID_KEY
 */
function assertKey(key) {
	if (typeof key !== 'string' || !KEY_RE.test(key)) {
		throw new StorageError('INVALID_KEY', `not a valid storage key: ${JSON.stringify(key)}`);
	}
}

/**
 * @param {string} ticketId
 * @returns {string} the key a ticket's transcript is stored under
 * @throws {StorageError} INVALID_KEY
 */
function keyFor(ticketId) {
	if (typeof ticketId !== 'string' || !TICKET_ID_RE.test(ticketId)) {
		throw new StorageError('INVALID_KEY', `not a valid ticket id: ${JSON.stringify(ticketId)}`);
	}
	return `transcripts/ticket-${ticketId}.html`;
}

/**
 * The ticket id a key belongs to, or null if it is not one of ours. Used by the
 * garbage collector and by the importer, neither of which may trust the string
 * it is holding.
 * @param {string} key
 * @returns {string|null}
 */
function ticketIdFromKey(key) {
	const match = /^transcripts\/ticket-([A-Za-z0-9_-]{1,32})\.html$/.exec(key ?? '');
	return match ? match[1] : null;
}

module.exports = {
	KEY_RE,
	StorageError,
	assertKey,
	keyFor,
	ticketIdFromKey,
};
