'use strict';

// Previously redirected /dashboard to /settings. The vendored dashboard
// handler now serves /dashboard; export an empty object so no route is
// registered here and Fastify won't see a duplicate.
module.exports = {};
