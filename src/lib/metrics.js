const Sentry = require('@sentry/node');

/**
 * Application metrics.
 *
 * Every helper is safe to call unconditionally: `Sentry.metrics.*` is a no-op
 * when no client is configured, so callers do not need to guard.
 *
 * ## Cardinality
 *
 * This is multi-tenant — one process serves every guild the bot is in — so
 * guild ids, user ids, ticket ids and channel ids must never become metric
 * attributes. A few thousand guilds times a few status values is a metric space
 * nobody can query and Sentry will start dropping. High-cardinality identifiers
 * belong on *spans*, which are sampled; metrics stay coarse and aggregate.
 */

/**
 * Bucket a status code rather than recording it verbatim: `2xx`/`4xx`/`5xx` is
 * what anyone actually asks of a dashboard, and it keeps the attribute to a
 * handful of values.
 * @param {number} statusCode
 * @returns {string}
 */
const statusClass = statusCode => `${Math.floor(statusCode / 100)}xx`;

/**
 * A low-cardinality name for a route.
 *
 * Fastify's `routeOptions.url` is already parameterised (`/api/guilds/:guild`),
 * which is exactly what is wanted — but it is `/*` for every dashboard page and
 * `undefined` for a request that matched no route at all. Both are folded into
 * single buckets so an unrouted scan cannot mint a new attribute value per URL.
 * @param {import('fastify').FastifyRequest} req
 * @returns {string}
 */
const routeName = req => {
	const url = req.routeOptions?.url;
	if (!url) return 'unrouted';
	if (url === '/*') return 'dashboard';
	return url;
};

/**
 * Record one HTTP response.
 * @param {import('fastify').FastifyRequest} req
 * @param {import('fastify').FastifyReply} res
 * @returns {void}
 */
const recordRequest = (req, res) => {
	try {
		const attributes = {
			method: req.method,
			route: routeName(req),
			status: statusClass(res.statusCode),
		};
		Sentry.metrics.distribution('http.server.duration', res.elapsedTime, {
			attributes,
			unit: 'millisecond',
		});
	} catch {
		// Telemetry must never break a response that already succeeded.
	}
};

/**
 * Record one interaction handler execution.
 * @param {string} type module name (commands, buttons, menus, modals)
 * @param {string} name component id or command name
 * @param {string} outcome `ok` or `error`
 * @param {number} ms duration
 * @returns {void}
 */
const recordInteraction = (type, name, outcome, ms) => {
	try {
		const attributes = {
			name,
			outcome,
			type,
		};
		Sentry.metrics.distribution('interaction.duration', ms, {
			attributes,
			unit: 'millisecond',
		});
	} catch { /* never break an interaction for telemetry */ }
};

/**
 * Count a ticket lifecycle event.
 * @param {'created'|'closed'} event
 * @returns {void}
 */
const recordTicket = event => {
	try {
		Sentry.metrics.count(`tickets.${event}`, 1);
	} catch { /* never break ticket handling for telemetry */ }
};

/**
 * Count an automation run outcome.
 * @param {string} status one of the RUN.* values
 * @returns {void}
 */
const recordAutomationRun = status => {
	try {
		Sentry.metrics.count('automation.run', 1, { attributes: { status } });
	} catch { /* never break an automation for telemetry */ }
};

/**
 * Sample gauges that describe the process rather than an event.
 * @param {import('../client')} client
 * @returns {Promise<void>}
 */
const sampleGauges = async client => {
	try {
		if (client.ws?.ping >= 0) Sentry.metrics.gauge('discord.gateway.ping', client.ws.ping, { unit: 'millisecond' });
		Sentry.metrics.gauge('discord.guilds', client.guilds?.cache?.size ?? 0);
		const open = await client.prisma.ticket.count({ where: { open: true } });
		Sentry.metrics.gauge('tickets.open', open);
	} catch { /* a gauge is not worth an unhandled rejection */ }
};

module.exports = {
	recordAutomationRun,
	recordInteraction,
	recordRequest,
	recordTicket,
	routeName,
	sampleGauges,
	statusClass,
};
