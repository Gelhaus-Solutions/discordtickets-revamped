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
	if (cfg.setCurrentOnStart) {
		void setCurrentDeploymentVersion(cfg, deps);
	}

	return _worker;
}

export function isWorkerRunning(): boolean {
	return _worker !== null;
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
