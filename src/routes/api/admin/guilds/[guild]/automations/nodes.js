const { catalogue } = require('../../../../../../lib/automations/registry');

/**
 * The node catalogue the canvas is built from.
 *
 * Derived from `registry.js` on every request rather than duplicated, so adding
 * a node type is a backend-only change as far as *availability* goes — the
 * editor still needs its mirrored entry for labels and field widgets, and
 * `scripts/check-automations.js` fails if the two disagree.
 *
 * Note this returns the limits *this instance* enforces, which on a private bot
 * are not the public-bot defaults the editor ships as its fallback.
 */
module.exports.get = fastify => ({
	handler: async () => catalogue(),
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
