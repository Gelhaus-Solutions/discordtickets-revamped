// An allow-list, not a path walk: `query` used to be split on `.` and reduced
// over the guild object, so an admin could read any property reachable from it
// — the client, its token, every other guild's cache — by asking for it. These
// three are all the dashboard has ever needed.
const QUERIES = {
	'channels.cache': guild => guild.channels.cache,
	'emojis.cache': guild => guild.emojis.cache,
	'roles.cache': guild => guild.roles.cache,
};

module.exports.get = fastify => ({
	handler: async (req, res) => {
		/** @type {import('client')} */
		const client = req.routeOptions.config.client;
		const id = req.params.guild;
		const { query } = req.query;
		const select = Object.prototype.hasOwnProperty.call(QUERIES, query) && QUERIES[query];
		if (!select) {
			return res.code(400).send({
				error: 'Bad Request',
				message: 'Invalid query parameter.',
				statusCode: 400,
			});
		}
		// `isAdmin` has already 404'd if the guild is not cached.
		return select(client.guilds.cache.get(id));
	},
	onRequest: [fastify.authenticate, fastify.isAdmin],
});
