/* eslint-disable no-underscore-dangle */

const { version } = require('../../package.json');
const { md5 } = require('./misc');
const {
	pools,
	quickPool,
} = require('./threads');

const { stats } = pools;

const getAverageRating = closedTickets => stats.queue(async w => await w.getAvgRating(closedTickets));

const getAverageTimes = closedTickets => stats.queue(async w => ({
	avgResolutionTime: await w.getAvgResolutionTime(closedTickets),
	avgResponseTime: await w.getAvgResponseTime(closedTickets),
}));

/**
 * Report stats to a Houston-compatible endpoint.
 *
 * This is opt-in: upstream posted to https://stats.discordtickets.app, but this
 * fork has its own release line and would only pollute upstream's data, so
 * nothing is sent unless STATS_URL is set to an endpoint you control.
 * @param {import("../client")} client
 */
async function sendToHouston(client) {
	const endpoint = process.env.STATS_URL;
	if (!endpoint) {
		client.log.verbose('Stats reporting is disabled (STATS_URL is not set)');
		return;
	}

	client.log.info.cron('Preparing Houston report');
	const guilds = await client.prisma.guild.findMany({
		include: {
			categories: { include: { _count: { select: { questions: true } } } },
			tags: true,
			tickets: {
				select: {
					closedAt: true,
					createdAt: true,
					firstResponseAt: true,
				},
			},
		},
	});
	const users = await client.prisma.user.aggregate({
		_count: true,
		_sum: { messageCount: true },
	});
	const messages = users._sum.messageCount;
	const stats = {
		activated_users: users._count,
		arch: process.arch,
		database: process.env.DB_PROVIDER,
		// this gets a dedicated pool so it doesn't block other stats uses
		guilds: await quickPool(.25, 'stats', pool => Promise.all(
			guilds
				.filter(guild => client.guilds.cache.has(guild.id))
				.map(guild => {
					guild.members = client.guilds.cache.get(guild.id).memberCount;
					return pool.queue(w => w.aggregateGuildForHouston(guild, messages));
				}),
		)),
		id: md5(client.user.id),
		node: process.version,
		os: process.platform,
		version,
	};
	const delta = guilds.length - stats.guilds.length;

	if (delta !== 0) {
		client.log.warn('%d guilds are not cached and were excluded from the stats report', delta);
	}

	try {
		client.log.verbose('Reporting to Houston:', stats);
		const res = await fetch(endpoint, {
			body: JSON.stringify(stats),
			headers: { 'content-type': 'application/json' },
			method: 'POST',
		});
		if (!res.ok) throw res;
		client.log.success('Posted client stats');
		client.log.debug(res);
	} catch (res) {
		client.log.warn('The following error is not important and can be safely ignored');
		try {
			const json = await res.json();
			client.log.error('An error occurred whilst posting stats:', json);
		} catch (error) {
			client.log.error('An error occurred whilst posting stats and the response couldn\'t be parsed:', error.message);
		}
		client.log.debug(res);
	}
};

module.exports = {
	getAverageRating,
	getAverageTimes,
	sendToHouston,
};
