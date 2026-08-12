const fs = require('fs');
const { join } = require('path');
const YAML = require('yaml');
const { dataPath } = require('./paths');

/**
 * The shipped config, which doubles as the defaults.
 *
 * `src/index.js` seeds this file into the data directory with `force: false`,
 * so an operator's copy is whatever it was when they first installed — every
 * key added since is simply absent from it. Using the shipped file as the
 * defaults rather than a hand-maintained object means there is nothing to keep
 * in step: a new key documented with its comments here is a new key with a
 * working default there.
 */
const DEFAULTS_FILE = join(__dirname, '..', 'user', 'config.yml');

const isPlainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Merge an operator's config over the defaults.
 *
 * Three rules, all load-bearing:
 *
 * - Arrays replace wholesale rather than merging element-wise. `presence.activities`
 *   is an array; merging it would resurrect activities the operator deleted.
 * - Key *presence* decides, not `!== undefined`. An explicit `null` is a
 *   deliberate value and must beat the default.
 * - Only plain objects recurse. Anything else replaces.
 *
 * @param {any} defaults
 * @param {any} user
 * @returns {any}
 */
function mergeDefaults(defaults, user) {
	if (!isPlainObject(defaults) || !isPlainObject(user)) return user;
	const merged = { ...defaults };
	for (const key of Object.keys(user)) {
		merged[key] = isPlainObject(defaults[key]) && isPlainObject(user[key])
			? mergeDefaults(defaults[key], user[key])
			: user[key];
	}
	return merged;
}

/**
 * Read the operator's config, filled in from the shipped defaults.
 *
 * Pure apart from the two reads, and takes no client — the maintenance scripts
 * need the same view of the config and have no client to hand.
 *
 * @returns {object}
 */
function loadConfig() {
	const defaults = YAML.parse(fs.readFileSync(DEFAULTS_FILE, 'utf8'));
	const user = YAML.parse(fs.readFileSync(dataPath('user', 'config.yml'), 'utf8')) ?? {};
	return mergeDefaults(defaults, user);
}

module.exports = {
	loadConfig,
	// Exported for `scripts/check-config.js`.
	mergeDefaults,
};
