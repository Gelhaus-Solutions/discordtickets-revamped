const { placeholderCatalogue } = require('../../lib/placeholders');

/**
 * The `{placeholder}` catalogue the dashboard's picker is built from.
 *
 * An endpoint rather than a module mirrored into the dashboard — the pattern
 * `AutomationEditor/nodes.js` uses — because unlike that one, this table holds
 * nothing instance-specific. A copy would buy a drift surface and nothing else,
 * and drift is the exact problem the table was written to end.
 *
 * Unauthenticated, and beside `locales.js` for the same reason: it is a
 * description of the software, identical for every guild and every visitor, and
 * it names no server, no member and no ticket.
 */
module.exports.get = () => ({
	handler: async (req, res) => {
		// Immutable for a given build, so the browser should not ask twice.
		res.header('Cache-Control', 'public, max-age=3600');
		return placeholderCatalogue();
	},
});
