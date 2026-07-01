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
		res
			.code(shardsReady && temporalHealthy ? 200 : 503)
			.send({
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
