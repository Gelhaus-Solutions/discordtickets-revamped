/**
 * Where transcripts live.
 *
 * The `tickets.htmlTranscript` column has held three different things over the
 * life of this fork: the HTML itself, then a path relative to the data
 * directory, and now a driver-qualified reference like
 * `local:transcripts/ticket-x.html`. `parseRef` understands all three, because
 * nothing rewrites old rows on upgrade and nothing needs to — an unrecognised
 * value simply regenerates, which is always correct if occasionally slow.
 *
 * The qualified form exists because a bare path cannot say *which* driver owns
 * the bytes. With one driver that was fine; with two, a half-finished migration
 * or a flipped `storage.driver` would otherwise be unrecoverable.
 *
 * Nothing here does I/O at require time, and the S3 SDK is only reached when an
 * S3 driver is actually constructed. `scripts/check-transcript-v2.js` requires
 * the transcript module outside a bot process and would break if that changed.
 */
const path = require('path');
const { dataPath } = require('../paths');
const { LocalStorage } = require('./local');
const {
	KEY_RE, StorageError, assertKey, keyFor, ticketIdFromKey,
} = require('./keys');

const DRIVERS = ['local', 's3'];

/** `user/transcripts/ticket-x.html`, optionally with a `./` or `/` in front. */
const LEGACY_RE = /^\.?\/?user\/transcripts\/ticket-[A-Za-z0-9_-]{1,32}\.html$/;

/**
 * Read a `htmlTranscript` value.
 *
 * @param {unknown} value
 * @returns {{driver: string, key: string, kind: 'object'}|{html: string, kind: 'inline'}|null}
 *   null means "nothing usable here" — every caller treats that as "regenerate",
 *   which is why an unparseable value is safe rather than merely tolerated.
 */
function parseRef(value) {
	if (typeof value !== 'string' || value === '') return null;

	const scheme = /^([a-z0-9]+):([\s\S]*)$/.exec(value);
	if (scheme && DRIVERS.includes(scheme[1])) {
		// A qualified ref whose key is not one of ours is not a path we are going
		// to go and look at. Regenerate instead.
		return KEY_RE.test(scheme[2])
			? {
				driver: scheme[1],
				key: scheme[2],
				kind: 'object',
			}
			: null;
	}

	if (LEGACY_RE.test(value)) {
		return {
			driver: 'local',
			key: value.replace(/^\.?\/?user\//, ''),
			kind: 'object',
		};
	}

	// Rows from before transcripts moved to disk. A positive test for markup,
	// not "everything else": garbage like `../../etc/passwd` has to fall through
	// to null rather than be treated as either a path or a document.
	if (/^\s*</.test(value)) {
		return {
			html: value,
			kind: 'inline',
		};
	}

	return null;
}

/**
 * @param {string} driver
 * @param {string} key
 * @returns {string} the value to store in `htmlTranscript`
 */
function formatRef(driver, key) {
	assertKey(key);
	if (!DRIVERS.includes(driver)) throw new StorageError('MISCONFIGURED', `unknown storage driver: ${driver}`);
	return `${driver}:${key}`;
}

/**
 * Build the storage the bot and its scripts share.
 *
 * Takes a config rather than a client on purpose: the maintenance scripts need
 * exactly this and have no client to give it.
 *
 * @param {object} options
 * @param {object} options.config the merged config (see src/lib/config.js)
 * @param {object} [options.log] anything with warn/info; defaults to console
 * @returns {object} the configured driver, plus `for(name)` to reach another
 */
function createStorage({
	config, log = console,
}) {
	const settings = config?.storage ?? {};
	const configured = process.env.STORAGE_DRIVER || settings.driver || 'local';
	if (!DRIVERS.includes(configured)) {
		throw new StorageError('MISCONFIGURED', `unknown storage driver "${configured}" — expected one of ${DRIVERS.join(', ')}`);
	}

	const built = new Map();

	/**
	 * @param {string} name
	 * @returns {object} a driver, constructed on first use
	 */
	const forDriver = name => {
		if (built.has(name)) return built.get(name);

		let driver;
		if (name === 'local') {
			// Relative overrides resolve against DATA_DIR; an absolute one is taken
			// as given. Changing this does not move existing files, which is why
			// the default is the historical location rather than anything tidier.
			const configuredRoot = settings.local?.directory;
			const root = configuredRoot
				? (path.isAbsolute(configuredRoot) ? configuredRoot : dataPath(configuredRoot))
				: dataPath('user');
			driver = new LocalStorage({ root });
		} else if (name === 's3') {
			// Required lazily: an install that never enables S3 must not need the
			// SDK present, and `optionalDependencies` means it may genuinely not be.
			const { S3Storage } = require('./s3');
			driver = new S3Storage({
				log,
				settings: settings.s3 ?? {},
			});
		} else {
			throw new StorageError('MISCONFIGURED', `unknown storage driver: ${name}`);
		}

		built.set(name, driver);
		return driver;
	};

	const active = forDriver(configured);

	// Delegating explicitly rather than returning the driver itself: the methods
	// live on the prototype, so spreading would silently produce an object with
	// its fields and none of its behaviour.
	return {
		/** The driver named in the config — what new transcripts are written to. */
		delete: key => active.delete(key),
		/**
		 * Reach a driver by name, for refs written by a different one. An operator
		 * who switches to S3 without migrating keeps reading their local rows.
		 */
		for: forDriver,
		get: key => active.get(key),
		getStream: key => active.getStream(key),
		list: prefix => active.list(prefix),
		name: active.name,
		put: (key, body) => active.put(key, body),
		stat: key => active.stat(key),
	};
}

module.exports = {
	DRIVERS,
	StorageError,
	createStorage,
	formatRef,
	keyFor,
	parseRef,
	ticketIdFromKey,
};
