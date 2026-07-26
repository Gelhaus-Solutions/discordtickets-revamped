const temporal = require('../lib/temporal');

module.exports.get = () => ({
	handler: async (req, res) => {
		const { client } = req.routeOptions.config;

		// Report Temporal worker/connectivity alongside shard health.
		let temporalHealthy = false;
		try {
			temporalHealthy = temporal.isWorkerRunning();
		} catch {
			temporalHealthy = false;
		}

		const shardsReady = client.ws.status === 0;

		// The status code reflects *this process* only. Dockerfile's HEALTHCHECK
		// hits this endpoint, so gating it on Temporal turned a Temporal outage
		// into a bot restart loop — restarting the bot cannot fix Temporal, and
		// the bot still serves tickets without it. Temporal state is reported in
		// the body via `degraded` instead.
		res
			.code(shardsReady ? 200 : 503)
			.send({
				degraded: !temporalHealthy,
				ping: client.ws.ping,
				shards: client.ws.shards.map(shard => ({
					id: shard.id,
					ping: shard.ping,
					status: shard.status,
				})),
				status: client.ws.status,
				temporal: {
					buildId: (() => {
						try {
							return temporal.getTemporalConfig().buildId;
						} catch {
							return null;
						}
					})(),
					workerRunning: temporalHealthy,
				},
			});
	},
});
