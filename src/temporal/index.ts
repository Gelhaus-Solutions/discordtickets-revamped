/**
 * Runtime entrypoint consumed by the (JavaScript) bot process.
 * NOTE: never re-export ./workflows here — that module imports
 * `@temporalio/workflow`, which only runs inside the sandbox.
 */
export { getTemporalConfig, resolveBuildId } from './config';
export {
	closeTemporalClient,
	getTemporalClient,
	initTemporalClient,
} from './client';
export {
	isWorkerRunning,
	startWorker,
	stopWorker,
} from './worker';
export {
	deleteAutomationSchedule,
	ensureSchedules,
	reconcileAutomationSchedules,
	upsertAutomationSchedule,
} from './schedules';
export {
	ensureSearchAttributes,
	searchAttributesRegistered,
	stopSearchAttributeRetries,
} from './search-attributes';
export type { ActivityDeps } from './activities';
export * from './gateway';
export * from './types';
