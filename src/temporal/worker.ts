import { join } from 'node:path';
import {
	NativeConnection,
	Worker,
	type WorkerOptions,
} from '@temporalio/worker';
import { createWorkerConnection } from './connection';
import { getTemporalConfig, type TemporalConfig } from './config';
import { getTemporalClient } from './client';
import { type ActivityDeps, makeActivities } from './activities';
import { sentryActivityInterceptors } from './sentry';

let _worker: Worker | null = null;
let _connection: NativeConnection | null = null;
let _runPromise: Promise<void> | null = null;

/**
 * Promote this build to the deployment's Current Version. The server rejects
 * the request until this worker's pollers have registered, so we retry with a
 * short backoff. Non-fatal: a failure just means routing isn't updated.
 */
async function setCurrentDeploymentVersion(cfg: TemporalConfig, deps: ActivityDeps): Promise<void> {
	const client = getTemporalClient();
	const request = {
		buildId: cfg.buildId,
		deploymentName: cfg.deploymentName,
		identity: `discord-tickets-${cfg.buildId}`,
		namespace: cfg.namespace,
	};
	const maxAttempts = 15;
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			await client.workflowService.setWorkerDeploymentCurrentVersion(request);
			deps.client.log?.success?.(
				'Set current Temporal deployment version to %s.%s',
				cfg.deploymentName,
				cfg.buildId,
			);
			return;
		} catch (err) {
			// Worker Deployments need Temporal server >= 1.27. On anything older
			// the method simply doesn't exist, so the server answers UNIMPLEMENTED
			// and every retry gets the same answer — this used to burn the full 15
			// seconds of the loop on every single startup. Give up immediately.
			if (isUnimplemented(err)) {
				deps.client.log?.info?.(
					'Temporal server does not support Worker Deployments; skipping version promotion',
				);
				return;
			}
			if (attempt === maxAttempts) {
				deps.client.log?.warn?.(
					`Could not set current deployment version ${cfg.deploymentName}.${cfg.buildId}: ${(err as Error)?.message ?? err}`,
				);
				return;
			}
			await new Promise(resolve => setTimeout(resolve, 1000));
		}
	}
}

/** Whether a gRPC error means the server doesn't implement the method at all. */
function isUnimplemented(err: unknown): boolean {
	// grpc-js status code 12 === UNIMPLEMENTED
	const code = (err as { code?: unknown })?.code;
	if (code === 12) return true;
	return /unimplemented|unknown method|not implemented/i.test(String((err as Error)?.message ?? ''));
}

/**
 * Start the embedded Temporal Worker inside the bot process.
 * TODO: extract this into a standalone worker process/fleet once the bot needs
 * to scale activity execution independently of the gateway (see plan).
 */
export async function startWorker(deps: ActivityDeps): Promise<Worker> {
	if (_worker) return _worker;
	const cfg = getTemporalConfig();
	_connection = await createWorkerConnection();

	const options: WorkerOptions = {
		activities: makeActivities(deps),
		connection: _connection,
		// Activity-side half of the trace propagation set up in ./sentry.ts.
		// Only `activity` — workflow interceptors would have to live inside the
		// sandboxed bundle, where calling Sentry breaks determinism.
		interceptors: { activity: [sentryActivityInterceptors] },
		namespace: cfg.namespace,
		taskQueue: cfg.taskQueue,
		workflowBundle: { codePath: join(__dirname, 'workflow-bundle.js') },
		// Bound activity concurrency so a 60-min export/import can't monopolise the
		// slots that fast stale/close activities need (single shared task queue).
		maxConcurrentActivityTaskExecutions: cfg.worker.maxConcurrentActivityTaskExecutions,
		maxConcurrentWorkflowTaskExecutions: cfg.worker.maxConcurrentWorkflowTaskExecutions,
		maxCachedWorkflows: cfg.worker.maxCachedWorkflows,
		reuseV8Context: cfg.worker.reuseV8Context,
	};

	// Worker Deployments / versioning keyed on the 6-char git SHA. Kept off the
	// typed literal above so minor SDK enum/shape drift can't break the build.
	(options as unknown as { workerDeploymentOptions: unknown }).workerDeploymentOptions = {
		// Old workers are not kept around, so newly-deployed workflows should roll
		// straight onto the latest build rather than pinning to their start version.
		defaultVersioningBehavior: 'AUTO_UPGRADE',
		useWorkerVersioning: true,
		version: {
			buildId: cfg.buildId,
			deploymentName: cfg.deploymentName,
		},
	};

	_worker = await Worker.create(options);
	_runPromise = _worker.run();
	_runPromise.catch((err: unknown) => deps.client.log?.error?.(err));

	// Promote this build to Current once its pollers are up (fire-and-forget).
	// The catch is not decoration: `getTemporalClient()` throws when the client
	// has not been initialised, which rejects this promise before the loop's own
	// error handling is ever reached. Routing failures is not worth a crash.
	if (cfg.setCurrentOnStart) {
		void setCurrentDeploymentVersion(cfg, deps).catch((err: unknown) =>
			deps.client.log?.warn?.('Could not set the current Temporal deployment version: %s', (err as Error)?.message ?? err),
		);
	}

	return _worker;
}

/**
 * Whether the embedded worker is actually polling.
 *
 * This used to be `_worker !== null`, which is set once at creation and only
 * cleared by an explicit stopWorker() — so a worker that had since failed still
 * reported healthy. `getState()` reflects the real lifecycle
 * (INITIALIZED / RUNNING / STOPPING / STOPPED / FAILED).
 */
export function isWorkerRunning(): boolean {
	if (!_worker) return false;
	try {
		return _worker.getState() === 'RUNNING';
	} catch {
		// Older SDKs without getState(): fall back to "was created".
		return true;
	}
}

export async function stopWorker(): Promise<void> {
	if (_worker) _worker.shutdown();
	if (_runPromise) {
		try {
			await _runPromise;
		} catch {
			// shutdown races are expected
		}
	}
	if (_connection) await _connection.close();
	_worker = null;
	_connection = null;
	_runPromise = null;
}
