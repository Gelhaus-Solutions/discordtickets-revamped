import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';

/**
 * Browser-side Sentry for the dashboard.
 *
 * The DSN is read from `$env/dynamic/public`, not `$env/static/public`, and
 * that is load-bearing: the Docker image is built once by CI and then run by
 * self-hosters with their own environment, so a build-time value would bake the
 * vendor's DSN into every install. Dynamic public env is resolved per request
 * from `process.env` and inlined into the SSR'd page, so each operator gets
 * their own.
 *
 * The server half is deliberately *not* `@sentry/sveltekit`. See hooks.server.js.
 */

/** Rates arrive as strings, and an unset panel variable is `''`, not undefined. */
const rate = (value, dflt = 0) => {
	const n = Number.parseFloat(value);
	return Number.isFinite(n) ? n : dflt;
};

const dsn = env.PUBLIC_SENTRY_DSN;

// Replay is opt-in and off by default. This dashboard renders ticket
// transcripts — the messages of the operator's own members — so recording a
// session by default would ship other people's support conversations to
// whichever Sentry org the operator happens to have configured.
const replaySessionRate = rate(env.PUBLIC_SENTRY_REPLAY_SESSION_RATE);
const replayErrorRate = rate(env.PUBLIC_SENTRY_REPLAY_ERROR_RATE);
const replayEnabled = replaySessionRate > 0 || replayErrorRate > 0;

if (dsn) {
	Sentry.init({
		dsn,
		environment: env.PUBLIC_SENTRY_ENVIRONMENT || 'production',
		integrations: replayEnabled
			? [
					Sentry.replayIntegration({
						// Even with replay switched on, nothing legible is sent:
						// every text node is masked and every image, canvas and
						// embed is blocked. That still captures layout, clicks and
						// navigation, which is what makes a replay useful for a
						// bug report, without capturing what a ticket said.
						blockAllMedia: true,
						maskAllInputs: true,
						maskAllText: true
					})
				]
			: [],
		release: env.PUBLIC_SENTRY_RELEASE || undefined,
		replaysOnErrorSampleRate: replayErrorRate,
		replaysSessionSampleRate: replaySessionRate,
		// Also off by default: browser tracing on every page load is a cost the
		// operator should choose, not inherit.
		tracesSampleRate: rate(env.PUBLIC_SENTRY_TRACES_RATE)
	});
}

export const handleError = Sentry.handleErrorWithSentry();
