import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_DEPLOYMENT_NAME, DEFAULT_TASK_QUEUE } from './task-queues';

export interface TemporalTlsConfig {
	clientCertPath: string;
	clientKeyPath: string;
	serverRootCaPath?: string;
	serverName?: string;
}

export interface TemporalConfig {
	/** `host:port` derived from TEMPORAL_ADDRESS + TEMPORAL_PORT. */
	address: string;
	namespace: string;
	taskQueue: string;
	tls: TemporalTlsConfig | false;
	deploymentName: string;
	/** 6-char git SHA (or `dev`) identifying this worker build. */
	buildId: string;
	/** Set this build as the deployment's Current Version on startup. */
	setCurrentOnStart: boolean;
}

const bool = (v: string | undefined, dflt: boolean): boolean => {
	if (v === undefined || v === '') return dflt;
	return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
};

/**
 * Resolve the worker build id used for Temporal Worker Deployments/versioning.
 * Priority: explicit env → build-id.txt written at Docker build time → `dev`.
 */
export function resolveBuildId(): string {
	if (process.env.TEMPORAL_WORKER_BUILD_ID) return process.env.TEMPORAL_WORKER_BUILD_ID.slice(0, 6);
	const buildIdFile = join(__dirname, 'build-id.txt');
	if (existsSync(buildIdFile)) {
		const sha = readFileSync(buildIdFile, 'utf8').trim();
		if (sha) return sha.slice(0, 6);
	}
	return 'dev';
}

let _config: TemporalConfig | null = null;

export function getTemporalConfig(): TemporalConfig {
	if (_config) return _config;

	const host = process.env.TEMPORAL_ADDRESS || '127.0.0.1';
	const port = process.env.TEMPORAL_PORT || '7233';

	const tlsEnabled = bool(process.env.TEMPORAL_TLS_ENABLED, true);
	let tls: TemporalTlsConfig | false = false;
	if (tlsEnabled) {
		const clientCertPath = process.env.TEMPORAL_TLS_CERT_PATH;
		const clientKeyPath = process.env.TEMPORAL_TLS_KEY_PATH;
		if (!clientCertPath || !clientKeyPath) {
			throw new Error(
				'Temporal mTLS is enabled but TEMPORAL_TLS_CERT_PATH and/or TEMPORAL_TLS_KEY_PATH are not set. ' +
				'Set TEMPORAL_TLS_ENABLED=false for an insecure local connection.',
			);
		}
		tls = {
			clientCertPath,
			clientKeyPath,
			serverRootCaPath: process.env.TEMPORAL_TLS_CA_PATH || undefined,
			serverName: process.env.TEMPORAL_TLS_SERVER_NAME || undefined,
		};
	}

	_config = {
		address: `${host}:${port}`,
		namespace: process.env.TEMPORAL_NAMESPACE || 'default',
		taskQueue: process.env.TEMPORAL_TASK_QUEUE || DEFAULT_TASK_QUEUE,
		tls,
		deploymentName: process.env.TEMPORAL_DEPLOYMENT_NAME || DEFAULT_DEPLOYMENT_NAME,
		buildId: resolveBuildId(),
		setCurrentOnStart: bool(process.env.TEMPORAL_SET_CURRENT_ON_START, true),
	};
	return _config;
}
