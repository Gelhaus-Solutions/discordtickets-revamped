/**
 * Build the SvelteKit dashboard when the bundle is missing or out of date.
 *
 * `src/dashboard/build` is generated, not committed. src/http.js imports its
 * `handler.js` directly, so without it the bot boots with no dashboard at all.
 * Each skip below is a real installation, not defensive coding:
 *
 *   - bundle already present *and* built from these exact sources: rebuilding
 *     would only churn its content-hashed filenames, and postinstall runs on
 *     every `npm ci`.
 *   - no src/dashboard/package.json: the release tarball (.tarballignore strips
 *     the sources and ships the bundle prebuilt) and the Docker builder stage,
 *     whose `npm ci` runs before the sources are copied in. Neither can build
 *     it, and neither needs to — the Dockerfile has a `dashboard` stage.
 *   - DT_SKIP_DASHBOARD_BUILD: CI jobs that exercise the bot rather than the
 *     dashboard, and anyone who wants a fast install and will run
 *     `npm run dashboard.build` themselves.
 *
 * "Out of date" is the case this used to miss, and it is the ordinary upgrade:
 * `git pull && npm install` on a bare-metal or panel install found a bundle
 * sitting in `build/`, returned early, and left the operator running the
 * *previous* release's dashboard against the new bot, with no warning and no
 * hint that `npm run dashboard.build` was the missing step. So the inputs are
 * fingerprinted and the digest is stamped into the bundle: an unchanged tree
 * still skips, a changed one rebuilds.
 *
 * postinstall calls this at install time only, never on the boot path — see the
 * REQUIRED check there.
 *
 * A failure warns rather than exits: a bot without a dashboard still runs
 * tickets, and src/http.js says so at boot.
 *
 * Depends on nothing outside node's standard library — `preinstall` has no
 * node_modules to import from, and this module sits beside it.
 */

const { spawnSync } = require('child_process');
const { createHash } = require('crypto');
const {
	existsSync, readdirSync, readFileSync, writeFileSync,
} = require('fs');
const {
	join, relative,
} = require('path');
const { appPath } = require('./paths');

/** Generated or vendored; none of it is an input to `vite build`. */
const NOT_AN_INPUT = new Set(['.git', '.svelte-kit', 'build', 'node_modules']);

/** Where the digest of the inputs that produced the current bundle is kept. */
const STAMP = join('build', '.dt-build-inputs');

/**
 * A digest of everything `vite build` reads: the sources, `static/`, the four
 * config files, and both manifests, so a dependency bump counts as a change
 * too, not just a `.svelte` edit.
 *
 * Paths go into the hash alongside contents, so moving a file is a change even
 * when nothing in it is.
 *
 * @param {string} dir src/dashboard
 */
function fingerprintInputs(dir) {
	const hash = createHash('sha256');
	const walk = current => {
		const entries = readdirSync(current, { withFileTypes: true })
			.sort((a, b) => a.name.localeCompare(b.name));
		for (const entry of entries) {
			if (NOT_AN_INPUT.has(entry.name)) continue;
			const full = join(current, entry.name);
			if (entry.isDirectory()) walk(full);
			else if (entry.isFile()) hash.update(relative(dir, full).replace(/\\/g, '/')).update(readFileSync(full));
		}
	};
	walk(dir);
	return hash.digest('hex');
}

/** @param {string} file @returns {string|null} */
function readStamp(file) {
	try {
		return existsSync(file) ? readFileSync(file, 'utf8').trim() : null;
	} catch {
		return null;
	}
}

/**
 * @param {(...strings: string[]) => void} log where to report progress
 * @param {{ force?: boolean }} [options] `force` rebuilds even when the stamp matches
 * @returns {boolean} whether the bundle exists once this returns
 */
function buildDashboard(log = console.log, { force = false } = {}) { // eslint-disable-line no-console
	const dir = appPath('./src/dashboard');
	const bundle = join(dir, 'build', 'handler.js');
	const built = existsSync(bundle);

	if (!force && process.env.DT_SKIP_DASHBOARD_BUILD === 'true') return built;
	// Checked before the fingerprint, because there is nothing to fingerprint:
	// these installs ship the bundle without the sources that made it.
	if (!existsSync(join(dir, 'package.json'))) {
		if (force) log('no dashboard sources here: this install ships the bundle prebuilt.');
		return built;
	}

	const stamp = join(dir, STAMP);
	const inputs = fingerprintInputs(dir);
	if (!force && built && readStamp(stamp) === inputs) return true;

	// An existing bundle with no stamp was built before this check existed, so
	// its age is unknowable; rebuild it once and stamp it.
	log(built
		? 'the dashboard bundle does not match the current sources, rebuilding it'
		: 'building the dashboard: this takes a minute, and only happens once');

	// `--include=dev` is not optional: vite, SvelteKit and Tailwind are all
	// devDependencies of the dashboard, and NODE_ENV=production makes npm omit
	// exactly those. postinstall calls loadEnv() before this, so a production
	// .env — or the Docker image's own ENV — puts NODE_ENV=production in the
	// environment this inherits. Without the flag npm installs 38 of 305
	// packages, exits 0, and `vite build` then fails with "vite: not found".
	//
	// spawnSync rather than a promisified exec: vite reports progress as it
	// goes, and inheriting the streams is the difference between seeing that and
	// staring at a silent minute.
	for (const args of [['ci', '--include=dev', '--no-audit', '--no-fund'], ['run', 'build']]) {
		const {
			error, status,
		} = spawnSync('npm', args, {
			cwd: dir,
			shell: process.platform === 'win32', // npm is npm.cmd there
			stdio: 'inherit',
		});
		if (error || status !== 0) {
			log('dashboard build failed — the bot will run without a dashboard.');
			log('Build it by hand with: npm run dashboard.build');
			return false;
		}
	}

	if (!existsSync(bundle)) return false;

	// Written after the build, because `adapter-node` rimrafs `build/` before
	// writing into it. A read-only application directory costs a rebuild next
	// install rather than a broken one, so it is not worth failing over.
	try {
		writeFileSync(stamp, inputs + '\n');
	} catch (error) {
		log('could not record the dashboard build fingerprint: ' + (error?.message ?? error));
	}

	return true;
}

module.exports = { buildDashboard };
