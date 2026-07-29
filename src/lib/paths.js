/**
 * APP_DIR / DATA_DIR resolution, shared with the install scripts.
 *
 * The implementation lives under `scripts/` because `preinstall` has to load it
 * before `node_modules` exists; this re-export means runtime code never has to
 * reach across directories to find it.
 */
module.exports = require('../../scripts/lib/paths');
