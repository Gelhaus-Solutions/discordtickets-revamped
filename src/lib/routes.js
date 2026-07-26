const { join } = require('path');
const { readdirSync } = require('fs');

/**
 * Recursively collect route modules under `dir`.
 *
 * This replaces node-dir's `files()`, which had two failure modes the route
 * loader depended on not hitting: its `match`/`exclude` options are silently
 * ignored (they're only implemented in `readfiles()`), so it handed back
 * anything it found — an `index.js.bak` left in the tree registered a live
 * shadow endpoint, and a stray `.md`/`.json` would be a startup SyntaxError
 * that took down the entire HTTP server. It also returns `undefined` for an
 * empty directory, which its own parent walker then dereferences, so a single
 * empty folder anywhere under `src/routes` threw before any route loaded.
 * @param {string} dir - Directory to walk.
 * @returns {string[]} Absolute paths of `.js` files, depth-first.
 */
function collectRouteFiles(dir) {
	const found = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name.startsWith('.')) continue;
		const full = join(dir, entry.name);
		if (entry.isDirectory()) found.push(...collectRouteFiles(full));
		else if (entry.isFile() && entry.name.endsWith('.js')) found.push(full);
	}
	return found;
}

module.exports = { collectRouteFiles };
