/**
 * The two directories everything else is resolved against.
 *
 * `process.cwd()` used to decide where `.env`, `user/` and `logs/` lived, while
 * the install scripts resolved the same files against the repository — so the
 * file `preinstall` wrote was not always the file the bot read. In Docker the
 * working directory is `/home/container` and the app is `/app`; under a systemd
 * unit without `WorkingDirectory=`, the cwd is `/`. Both produced the same
 * confusing outcome: a `.env` sitting right there, and a bot insisting
 * `DB_CONNECTION_URL` is required.
 *
 *   APP_DIR   the code. Read-only at runtime (except `prisma/` on upgrade).
 *   DATA_DIR  the state: `.env`, `user/`, `logs/`. The only path written to.
 *
 * Both can be overridden — `DT_APP_DIR`, `DT_DATA_DIR`, `DT_ENV_FILE` — which
 * is how the container and the panel eggs point the bot at their persistent
 * volume without any code branching on "am I in Docker".
 *
 * This module has **no dependencies**, deliberately: npm runs `preinstall`
 * before `node_modules` exists, and the Docker build only copies `scripts/`
 * and `package.json` into the first layer.
 */

const {
	accessSync, constants, existsSync, statSync,
} = require('fs');
const {
	isAbsolute, join, resolve,
} = require('path');

/** Read an absolute-path override, rejecting a relative one loudly. */
const override = name => {
	const value = process.env[name];
	if (!value) return null;
	if (!isAbsolute(value)) throw new Error(`${name} must be an absolute path (got "${value}")`);
	return value;
};

/** Directory containing package.json — i.e. the application itself. */
const APP_DIR = override('DT_APP_DIR') ?? resolve(__dirname, '../..');

/** Directory holding .env, user/ and logs/. Defaults to the app directory. */
const DATA_DIR = override('DT_DATA_DIR') ?? APP_DIR;

/** The one .env file this installation uses. */
const ENV_FILE = override('DT_ENV_FILE') ?? join(DATA_DIR, '.env');

/** @param {...string} segments @returns {string} a path inside APP_DIR */
const appPath = (...segments) => join(APP_DIR, ...segments);

/** @param {...string} segments @returns {string} a path inside DATA_DIR */
const dataPath = (...segments) => join(DATA_DIR, ...segments);

/**
 * Treat an empty environment variable as unset.
 *
 * dotenv never overwrites a key that is already in `process.env`, and
 * `hasOwnProperty` is true for `""`. Pterodactyl and Pelican inject *every*
 * declared variable, blank ones included, so `ENCRYPTION_KEY=` from the panel
 * would shadow the real value in `.env` and the bot would refuse to start with
 * a key it was looking straight at. Compose files have the same trap with a
 * bare `KEY:`.
 *
 * Both `src/env.js` and `src/temporal/config.ts` already treat `''` as unset,
 * so this only makes the rest of the process agree with them.
 */
function stripEmpty() {
	for (const [key, value] of Object.entries(process.env)) {
		if (value === '') delete process.env[key];
	}
}

let loaded = false;

/**
 * Load `.env` from the one authoritative location. Safe to call repeatedly.
 *
 * @param {object} [options] passed through to dotenv (`path` is defaulted)
 */
function loadEnv(options = {}) {
	if (loaded) return;
	loaded = true;
	stripEmpty();
	// Required lazily: `preinstall` runs before dependencies are installed, and
	// has no environment file to read at that point anyway.
	try {
		require('dotenv').config({
			path: ENV_FILE,
			...options,
		});
	} catch (error) {
		if (error.code !== 'MODULE_NOT_FOUND') throw error;
	}
}

/**
 * Is DATA_DIR usable? Returns a reason when it is not.
 *
 * @returns {string|null} null when writable
 */
function dataDirProblem() {
	if (!existsSync(DATA_DIR)) return 'does not exist';
	if (!statSync(DATA_DIR).isDirectory()) return 'is not a directory';
	try {
		accessSync(DATA_DIR, constants.W_OK);
	} catch {
		return 'is not writable';
	}
	return null;
}

/**
 * Is the env file readable by anyone other than its owner?
 *
 * It holds the bot token and the encryption key, so on a shared host that is
 * worth a warning — but never a hard failure, because the mode can be dictated
 * by a volume mount the operator does not control.
 *
 * @returns {boolean}
 */
function envFileIsExposed() {
	try {
		return existsSync(ENV_FILE) && (statSync(ENV_FILE).mode & 0o077) !== 0;
	} catch {
		return false;
	}
}

module.exports = {
	APP_DIR,
	DATA_DIR,
	ENV_FILE,
	appPath,
	dataDirProblem,
	dataPath,
	envFileIsExposed,
	loadEnv,
	stripEmpty,
};
