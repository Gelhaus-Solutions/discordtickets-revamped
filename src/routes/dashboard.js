'use strict';

// Previously redirected /dashboard to /settings. `src/routes/dashboard/index.js`
// now serves the standalone custom dashboard at that path (the vendored
// SvelteKit app has no /dashboard route of its own), so export an empty object
// to avoid registering a duplicate.
module.exports = {};
