/**
 * A leekslazylogger transport that forwards log lines to Sentry Logs.
 *
 * The bot writes ~750 log lines through `client.log.<level>.<namespace>(...)`
 * and essentially none through `console`, so Sentry's `consoleLoggingIntegration`
 * saw almost nothing. This bridges the real logging surface instead — and is
 * why that integration is *not* enabled in src/sentry-init.js: leekslazylogger's
 * own ConsoleTransport ends in `console[level.type](...)`, so running both would
 * report every line twice.
 *
 * Transports are duck-typed by leekslazylogger — `Logger.log()` only reads
 * `.level` and calls `.write(log)`, with no `instanceof` check.
 */

/**
 * leekslazylogger levels -> Sentry Logs severities. `log.level.type` is only
 * ever debug/info/warn/error, so mapping by name preserves the distinction
 * between `critical` and `error`, and between `verbose` and `debug`.
 */
const LEVELS = {
	critical: 'fatal',
	debug: 'debug',
	error: 'error',
	info: 'info',
	notice: 'info',
	success: 'info',
	verbose: 'trace',
	warn: 'warn',
};

module.exports = class SentryTransport {
	/**
	 * @param {Object} options
	 * @param {string} options.level minimum level to forward
	 */
	constructor(options) {
		this.level = options.level;
	}

	/**
	 * @param {Object} log a leekslazylogger Log
	 * @returns {void}
	 */
	write(log) {
		// `Logger.log()` calls this inside a bare for-loop with no try/catch, so
		// anything thrown here would propagate into the caller of `log.error(...)`
		// — including the interaction error handler and the shutdown path. This
		// transport must be incapable of breaking logging.
		try {
			// Resolved per call rather than in the constructor: the first Logger
			// is built in src/index.js before the client exists, and a second
			// one is built later in src/client.js. Deciding once at construction
			// would permanently mute the first, losing every boot and shutdown
			// line.
			const Sentry = require('@sentry/node');
			if (!Sentry.getClient()) return;

			const severity = LEVELS[log.level.name] ?? log.level.type ?? 'info';
			const emit = Sentry.logger[severity];
			if (typeof emit !== 'function') return;

			// `log.content` has already been through `util.format`, so it is a
			// string by the time any transport sees it. Real Error objects never
			// reach here — those are captured explicitly at the throw sites (see
			// `report()` in src/lib/error.js).
			emit(String(log.content), {
				'log.file': log.file ?? undefined,
				'log.level': log.level.name,
				'log.line': log.line ?? undefined,
				'log.namespace': log.namespace ?? 'global',
			});
		} catch {
			// Intentionally silent: reporting this would need the logger.
		}
	}
};
