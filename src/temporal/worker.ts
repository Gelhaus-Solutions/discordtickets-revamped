import { join } from 'node:path';
import {
	NativeConnection,
	Worker,
	type WorkerOptions,
} from '@temporalio/worker';
import { createWorkerConnection } from './connection';
import { getTemporalConfig } from './config';
import { type ActivityDeps, makeActivities } from './activities';

let _worker: Worker | null = null;
let _connection: NativeConnection | null = null;
let _runPromise: Promise<void> | null = null;

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
	};

	// Worker Deployments / versioning keyed on the 6-char git SHA. Kept off the
	// typed literal above so minor SDK enum/shape drift can't break the build.
	(options as unknown as { workerDeploymentOptions: unknown }).workerDeploymentOptions = {
		defaultVersioningBehavior: 'PINNED',
		useWorkerVersioning: true,
		version: {
			buildId: cfg.buildId,
			deploymentName: cfg.deploymentName,
		},
	};

	_worker = await Worker.create(options);
	_runPromise = _worker.run();
	_runPromise.catch((err: unknown) => deps.client.log?.error?.(err));
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
