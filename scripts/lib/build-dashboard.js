/**
 * Build the SvelteKit dashboard when the bundle is missing.
 *
 * `src/dashboard/build` is generated, not committed. src/http.js imports its
 * `handler.js` directly, so without it the bot boots with no dashboard at all.
 * Each skip below is a real installation, not defensive coding:
 *
 *   - bundle already present: rebuilding would only churn its content-hashed
 *     filenames, and postinstall runs on every `npm ci`.
 *   - no src/dashboard/package.json: the release tarball (.tarballignore strips
 *     the sources and ships the bundle prebuilt) and the Docker builder stage,
 *     whose `npm ci` runs before the sources are copied in. Neither can build
 *     it, and neither needs to — the Dockerfile has a `dashboard` stage.
 *   - DT_SKIP_DASHBOARD_BUILD: CI jobs that exercise the bot rather than the
 *     dashboard, and anyone who wants a fast install and will run
 *     `npm run dashboard.build` themselves.
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
const { existsSync } = require('fs');
const { join } = require('path');
const { appPath } = require('./paths');

/**
 * @param {(...strings: string[]) => void} log where to report progress
 * @returns {boolean} whether the bundle exists once this returns
 */
function buildDashboard(log = console.log) { // eslint-disable-line no-console
	const dir = appPath('./src/dashboard');
	const bundle = join(dir, 'build', 'handler.js');

	if (existsSync(bundle)) return true;
	if (process.env.DT_SKIP_DASHBOARD_BUILD === 'true') return false;
	if (!existsSync(join(dir, 'package.json'))) return false;

	log('building the dashboard — this takes a minute, and only happens once');

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

	return existsSync(bundle);
}

module.exports = { buildDashboard };
