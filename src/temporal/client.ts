import { Client } from '@temporalio/client';
import { createClientConnection } from './connection';
import { getTemporalConfig } from './config';
import { sentryWorkflowClientInterceptor } from './sentry';

let _client: Client | null = null;
/** In-flight connection attempt, so concurrent callers share one dial. */
let _connecting: Promise<Client> | null = null;
let _lastFailureAt = 0;

/**
 * How long to fail fast for after a failed attempt.
 *
 * Without this, every interaction that touches Temporal while it is down would
 * dial it again and wait out the connect timeout before answering.
 */
const RETRY_COOLDOWN_MS = 15_000;

async function connect(): Promise<Client> {
	const connection = await createClientConnection();
	const { namespace } = getTemporalConfig();
	return new Client({
		connection,
		// Writes the caller's trace into workflow headers, so the activities
		// that run later attach to it instead of starting traces of their own.
		// Harmless when Sentry is not configured: `getTraceData()` simply has
		// nothing to contribute.
		interceptors: { workflow: [sentryWorkflowClientInterceptor()] },
		namespace,
	});
}

/** Initialise (once) and return the shared Temporal Client. */
export async function initTemporalClient(): Promise<Client> {
	if (_client) return _client;
	if (!_connecting) {
		_connecting = connect()
			.then(client => {
				_client = client;
				_lastFailureAt = 0;
				return client;
			})
			.catch((err: unknown) => {
				_lastFailureAt = Date.now();
				throw err;
			})
			.finally(() => {
				_connecting = null;
			});
	}
	return _connecting;
}

/**
 * Return the shared client, connecting on demand.
 *
 * The bot used to connect exactly once, during `ready`. A Temporal that was
 * slow to come up (or briefly unreachable) at that moment left `_client` null
 * for the lifetime of the process, and every later call (closing a ticket
 * included) threw "has not been initialised" until someone restarted the bot.
 * Callers on an interaction path go through here so the first attempt after
 * Temporal recovers simply works.
 */
export async function ensureTemporalClient(): Promise<Client> {
	if (_client) return _client;
	if (!_connecting && Date.now() - _lastFailureAt < RETRY_COOLDOWN_MS) {
		throw new Error('Temporal is unreachable: the last connection attempt failed, and the next is not due yet.');
	}
	return initTemporalClient();
}

/** Synchronous accessor for callers that cannot await a connection. */
export function getTemporalClient(): Client {
	if (!_client) throw new Error('Temporal client has not been initialised. Call initTemporalClient() first.');
	return _client;
}

/** Whether a usable client is currently connected. */
export function temporalClientReady(): boolean {
	return _client !== null;
}

export async function closeTemporalClient(): Promise<void> {
	if (_client) {
		await _client.connection.close();
		_client = null;
	}
}
