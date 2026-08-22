import { readFileSync } from 'node:fs';
import { NativeConnection } from '@temporalio/worker';
import { Connection } from '@temporalio/client';
import { getTemporalConfig } from './config';

/** Bound on a gateway dial, in milliseconds. */
const CLIENT_CONNECT_TIMEOUT_MS = 5_000;

/** Build the shared mTLS options, or `false` for an insecure (dev) connection. */
function tlsOptions() {
	const { tls } = getTemporalConfig();
	if (!tls) return false;
	return {
		clientCertPair: {
			crt: readFileSync(tls.clientCertPath),
			key: readFileSync(tls.clientKeyPath),
		},
		serverRootCACertificate: tls.serverRootCaPath ? readFileSync(tls.serverRootCaPath) : undefined,
		serverNameOverride: tls.serverName,
	};
}

/** Connection used by the embedded Worker (native/core). */
export async function createWorkerConnection(): Promise<NativeConnection> {
	const { address } = getTemporalConfig();
	return NativeConnection.connect({
		address,
		tls: tlsOptions(),
	});
}

/**
 * Connection used by the gateway's WorkflowClient/ScheduleClient.
 *
 * `connectTimeout` is deliberately short: this is dialled on demand from
 * interaction handlers, so an unreachable Temporal has to be reported back
 * inside Discord's own 15-minute-token, 3-second-ack world rather than hanging
 * on the SDK's default.
 */
export async function createClientConnection(): Promise<Connection> {
	const { address } = getTemporalConfig();
	return Connection.connect({
		address,
		connectTimeout: CLIENT_CONNECT_TIMEOUT_MS,
		tls: tlsOptions(),
	});
}
