const { Listener } = require('@eartharoid/dbf');
const ms = require('ms');
const sync = require('../../lib/sync');
const { schedulesFor } = require('../../lib/automations/schedules');
const checkForUpdates = require('../../lib/updates');
const {
	getAverageTimes,
	getAverageRating,
	sendToHouston,
} = require('../../lib/stats');
const { saveHtmlTranscript } = require('../../lib/tickets/transcript-html');
const { reconcileCustomization } = require('../../lib/customization');
const { sampleGauges } = require('../../lib/metrics');
const { substituteIn } = require('../../lib/placeholders');
const temporal = require('../../lib/temporal');

/**
 * Bring Temporal's automation schedules in line with the database.
 *
 * Bounded and non-fatal: a failure here costs a cron automation firing late,
 * which is not worth failing a boot over.
 */
async function reconcileAutomationSchedules(client) {
	try {
		const automations = await client.prisma.automation.findMany({
			select: {
				enabled: true,
				graph: true,
				guildId: true,
				id: true,
				key: true,
			},
			where: { enabled: true },
		});
		// One automation can hold several cron triggers, so this flattens to a
		// schedule per node rather than per automation.
		const wanted = automations.flatMap(automation => schedulesFor(automation));

		const {
			deleted, upserted,
		} = await Promise.race([
			temporal.reconcileAutomationSchedules(wanted),
			new Promise((_, reject) => setTimeout(() => reject(new Error('timed out')), ms('2m')).unref()),
		]);
		client.log.info('Automation schedules reconciled (%d active, %d removed)', upserted, deleted);
	} catch (error) {
		client.log.warn('Could not reconcile automation schedules: %s', error?.message ?? error);
	}
}

module.exports = class extends Listener {
	constructor(client, options) {
		super(client, {
			...options,
			emitter: client,
			event: 'ready',
			once: true,
		});
	}

	async run() {
		/** @type {import("client")} */
		const client = this.client;

		// process.title = `"[Discord Tickets] ${client.user.tag}"`; // too long and gets cut off
		process.title = 'tickets';
		client.log.success('Connected to Discord as "%s" over %d shards', client.user.tag, client.ws.shards.size);

		await client.initAfterLogin();

		// Connect to Temporal, start the embedded worker, and ensure schedules.
		// All durable/async/scheduled work runs through Temporal from here on.
		//
		// This is deliberately non-fatal. It used to run unguarded, so an
		// unreachable Temporal aborted the whole handler *before* sync() — leaving
		// the bot logged in and answering interactions with empty ticket-number,
		// open-count and cooldown caches, with no commands published.
		let temporalReady = false;
		try {
			await temporal.initTemporalClient();
			await temporal.startWorker({
				checkForUpdates,
				client,
				saveHtmlTranscript,
				sendToHouston,
			});
			await temporal.ensureSchedules({
				stats: !!client.config.stats,
				updates: !!client.config.updates,
			});
			// Register custom Search Attributes (TicketId/GuildId/UserId/WorkflowKind)
			// before sync() starts workflows, so those starts are tagged. Non-fatal:
			// when registration fails, starts simply omit the attributes.
			// The logger is passed in so the *reason* is reported: this used to
			// swallow the error and warn with no cause attached, which made the
			// failure impossible to diagnose from the logs.
			const saOk = await temporal.ensureSearchAttributes(client.log);
			if (!saOk) client.log.warn('Temporal search attributes could not be registered; workflows will not be tagged (retrying in the background)');
			client.log.success('Temporal worker started (build %s)', temporal.getTemporalConfig().buildId);
			temporalReady = true;

			// Make Temporal's schedules match the database: the routes keep them
			// in step as automations are edited, but best-effort, so this is what
			// guarantees convergence and cleans up after guilds removed while the
			// bot was down.
			//
			// Deliberately *not* awaited. It walks every schedule in the namespace,
			// which is unbounded work against Temporal's visibility store — putting
			// that in front of `sync()` means a slow or half-up Temporal delays
			// re-arming every open ticket's stale workflow. Nothing else waits on
			// the result, so it runs alongside startup and reports when it lands.
			reconcileAutomationSchedules(client);
		} catch (error) {
			client.log.error('Temporal is unavailable — durable work (stale tickets, scheduled closes, exports) is disabled until it recovers');
			client.log.error(error);
		}

		// fill cache (also re-establishes stale workflows for open tickets)
		await sync(client);

		// Push stored per-guild bot profiles back to Discord. Without this they
		// only ever applied at the instant an admin clicked Save, so a kick and
		// re-add, a moderator resetting the nickname, or a database restore
		// silently dropped them.
		await reconcileCustomization(client);

		if (process.env.PUBLISH_COMMANDS === 'true') {
			client.log.info('Automatically publishing commands...');
			client.commands.publish()
				.then(commands => client.log.success('Published %d commands', commands?.size))
				.catch(client.log.error);
		}

		await client.application.fetch();
		if (process.env.PUBLIC_BOT === 'true' && !client.application.botPublic) {
			client.log.warn('The `PUBLIC_BOT` environment variable is set to `true`, but the bot is not public.');
		} else if (process.env.PUBLIC_BOT !== 'true' && client.application.botPublic) {
			client.log.warn('Your bot is public, but public features are disabled. Set the `PUBLIC_BOT` environment variable to `true`, or make your bot private.');
		}

		// commands are not cached automatically
		await client.application.commands.fetch();

		// presence/activity
		if (client.config.presence.activities?.length > 0) {
			let next = 0;
			const setPresence = async () => {
				client.log.verbose.cron('Updating presence');
				const cacheKey = 'cache/presence';
				let cached = await client.keyv.get(cacheKey);
				if (!cached) {
					const tickets = await client.prisma.ticket.findMany({
						select: {
							closedAt: true,
							createdAt: true,
							feedback: { select: { rating: true } },
							firstResponseAt: true,
						},
					});
					const closedTickets = tickets.filter(t => t.closedAt);
					const closedTicketsWithResponse = closedTickets.filter(t => t.firstResponseAt);
					const {
						avgResolutionTime,
						avgResponseTime,
					} = await getAverageTimes(closedTicketsWithResponse);
					const avgRating = await getAverageRating(closedTickets);

					cached = {
						avgRating: avgRating.toFixed(1),
						avgResolutionTime: ms(avgResolutionTime),
						avgResponseTime: ms(avgResponseTime),
						guilds: client.guilds.cache.size,
						openTickets: tickets.length - closedTickets.length,
						totalTickets: tickets.length,
					};
					await client.keyv.set(cacheKey, cached, ms('15m'));
				}
				const activity = { ...client.config.presence.activities[next] };
				// Scoped to the presence context on purpose: `{openTickets}` and
				// `{guilds}` are counts across every server the bot is in, and must
				// never be reachable from anything a server admin can type.
				activity.name = substituteIn('presence', activity.name, cached);
				client.user.setPresence({
					activities: [activity],
					status: client.config.presence.status,
				});
				next++;
				if (next === client.config.presence.activities.length) next = 0;
			};
			// `setPresence` is async and queries the database for the ticket
			// counts it interpolates, so a transient database problem rejected
			// here — unhandled, on a timer, forever. Nothing about the presence
			// text is worth more than a warning.
			const updatePresence = () => setPresence().catch(error => client.log.warn('Could not update presence: %s', error?.message ?? error));
			updatePresence();
			if (client.config.presence.activities.length > 1) setInterval(updatePresence, client.config.presence.interval * 1000);
		} else {
			client.log.info('Presence activities are disabled');
		}

		// Stats posting (Houston) and update checks are now Temporal Schedules
		// (see temporal.ensureSchedules above), replacing the old setInterval loops.

		// Gauges describe a level rather than an event, so they have to be
		// sampled on a timer — nothing else would ever report "how many tickets
		// are open right now". Only started when Sentry is configured, and
		// unref'd so it can never hold the process open during shutdown.
		if (process.env.SENTRY_DSN) {
			sampleGauges(client);
			setInterval(() => sampleGauges(client), ms('1m')).unref();
		}

		if (process.env.PUBLIC_BOT === 'true') {
			client.log.notice('Inactivity warnings and auto-close features are disabled');
			client.log.warn('Unset PUBLIC_BOT to re-enable stale ticket handling');
		} else if (temporalReady) {
			client.log.info('Stale ticket handling runs via per-ticket Temporal workflows');
		} else {
			client.log.warn('Stale ticket handling is unavailable until Temporal is reachable; restart the bot once it is back');
		}
	}
};
