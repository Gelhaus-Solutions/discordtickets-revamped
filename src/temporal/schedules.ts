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
		{
			enabled: true,
			every: 6 * HOUR,
			id: 'db-maintenance',
			workflowType: WorkflowType.dbMaintenance,
		},
	];

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
				scheduleId: s.id,
				spec: { intervals: [{ every: s.every }] },
			});
		} catch (err) {
			if (!nameIs(err, 'ScheduleAlreadyRunning')) throw err;
		}
	}
}
