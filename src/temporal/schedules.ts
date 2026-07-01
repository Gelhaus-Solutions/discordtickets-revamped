import { ScheduleOverlapPolicy } from '@temporalio/client';
import { getTemporalClient } from './client';
import { getTemporalConfig } from './config';
import { WorkflowType } from './task-queues';

interface ScheduleDef {
	id: string;
	workflowType: string;
	/** Interval in milliseconds (a valid Temporal Duration). */
	every: number;
	enabled: boolean;
}

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

/** Schedule ids that used to exist but have been retired — deleted on startup. */
const RETIRED_SCHEDULE_IDS = ['db-maintenance'];

export interface ScheduleFlags {
	/** Post stats to Houston (client.config.stats). */
	stats?: boolean;
	/** Weekly update check (client.config.updates). */
	updates?: boolean;
}

const nameIs = (err: unknown, name: string): boolean =>
	!!err && typeof err === 'object' && (err as { name?: string }).name === name;

/** Idempotently create (or remove, when disabled) the recurring Temporal Schedules. */
export async function ensureSchedules(flags: ScheduleFlags = {}): Promise<void> {
	const client = getTemporalClient();
	const { taskQueue } = getTemporalConfig();

	const schedules: ScheduleDef[] = [
		{
			enabled: flags.stats !== false,
			every: 12 * HOUR,
			id: 'houston-stats',
			workflowType: WorkflowType.houstonStats,
		},
		{
			enabled: flags.updates !== false,
			every: 168 * HOUR, // weekly
			id: 'update-check',
			workflowType: WorkflowType.updateCheck,
		},
	];

	// Drop schedules that no longer exist in code (e.g. the old db-maintenance no-op).
	for (const id of RETIRED_SCHEDULE_IDS) {
		try {
			await client.schedule.getHandle(id).delete();
		} catch {
			// not found — fine
		}
	}

	for (const s of schedules) {
		if (!s.enabled) {
			try {
				await client.schedule.getHandle(s.id).delete();
			} catch {
				// not found — fine
			}
			continue;
		}
		try {
			await client.schedule.create({
				action: {
					taskQueue,
					type: 'startWorkflow',
					workflowId: `${s.id}-scheduled`,
					workflowType: s.workflowType,
				},
				// Never let a slow run overlap the next tick; spread load with jitter.
				policies: { overlap: ScheduleOverlapPolicy.SKIP },
				scheduleId: s.id,
				spec: {
					intervals: [{ every: s.every }],
					jitter: 5 * MINUTE,
				},
			});
		} catch (err) {
			if (!nameIs(err, 'ScheduleAlreadyRunning')) throw err;
		}
	}
}
