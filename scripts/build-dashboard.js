/* eslint-disable no-console */
/**
 * `npm run dashboard.build`.
 *
 * This used to be two raw npm commands in package.json, which built the bundle
 * without recording what it was built from — so the very next `npm install`
 * saw an unstamped bundle and built it all over again. Going through the same
 * function postinstall uses keeps one code path, and one stamp.
 *
 * Always rebuilds: it is what an operator reaches for when they want a rebuild.
 */
const { short } = (() => {
	try {
		return require('leeks.js');
	} catch {
		return { short: s => s.replace(/&[0-9a-fklmnor]/gi, '') };
	}
})();
const { buildDashboard } = require('./lib/build-dashboard');

function log(...strings) {
	console.log(short('&9[dashboard]&r'), ...strings);
}

if (!buildDashboard(log, { force: true })) {
	console.error(short('&cThe dashboard bundle was not produced.&r'));
	process.exit(1);
}

log('done.');
