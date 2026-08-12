import { ScheduleOverlapPolicy } from '@temporalio/client';
import { getTemporalClient } from './client';
import { getTemporalConfig } from './config';
import {
	WorkflowType,
	automationScheduleId,
} from './task-queues';

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
			// Not optional, and not a tidy-up job: this is what closes an inactive
			// ticket whose own workflow died, so it is the difference between the
			// auto-close being reliable and being usually.
			enabled: true,
			every: 15 * MINUTE,
			id: 'stale-sweep',
			workflowType: WorkflowType.staleSweep,
		},
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
			every: 24 * HOUR,
			id: 'automation-run-retention',
			workflowType: WorkflowType.automationRetention,
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

/** One `trigger.schedule.cron` automation, as the reconciler sees it. */
export interface AutomationSchedule {
	guildId: string;
	automationId: number;
	key: string;
	/** The `trigger.schedule.cron` node this schedule runs. */
	nodeId: string;
	cron: string;
	timezone: string;
}

/**
 * Create or update the Temporal Schedule behind a cron automation.
 *
 * `create` throws if the schedule already exists, so an existing one is updated
 * in place — the spec is the only thing that can have changed.
 */
export async function upsertAutomationSchedule(input: AutomationSchedule): Promise<void> {
	const client = getTemporalClient();
	const { taskQueue } = getTemporalConfig();
	const scheduleId = automationScheduleId(input.guildId, input.key, input.nodeId);

	const action = {
		args: [{
			automationId: input.automationId,
			guildId: input.guildId,
			nodeId: input.nodeId,
		}],
		taskQueue,
		type: 'startWorkflow' as const,
		// Temporal appends its own timestamp, so a static base id is fine and
		// makes the runs easy to find in the UI.
		workflowId: `${scheduleId}-scheduled`,
		workflowType: WorkflowType.automationCron,
	};
	const spec = {
		cronExpressions: [input.cron],
		timeZone: input.timezone,
	};

	try {
		await client.schedule.create({
			action,
			// A slow run must never overlap the next tick.
			policies: { overlap: ScheduleOverlapPolicy.SKIP },
			scheduleId,
			spec,
		});
	} catch (err) {
		if (!nameIs(err, 'ScheduleAlreadyRunning')) throw err;
		await client.schedule.getHandle(scheduleId).update(previous => ({
			...previous,
			action,
			spec,
		}));
	}
}

export async function deleteAutomationSchedule(guildId: string, key: string, nodeId: string): Promise<void> {
	try {
		await getTemporalClient().schedule.getHandle(automationScheduleId(guildId, key, nodeId)).delete();
	} catch {
		// not found — fine
	}
}

/**
 * Make Temporal's schedules match the database.
 *
 * Called once at startup. The route handlers keep schedules in step as
 * automations are edited, but they are best-effort by design — a Temporal
 * hiccup must not fail an HTTP write — so this is what actually guarantees
 * convergence. It is also the only thing that cleans up after a guild being
 * removed, a row being deleted straight from the database, or anything that
 * happened while the bot was down.
 *
 * The sweep is the dynamic-id equivalent of `RETIRED_SCHEDULE_IDS` above:
 * anything named `automation-*` that the database does not know about is gone.
 */
export async function reconcileAutomationSchedules(
	rows: AutomationSchedule[],
): Promise<{ deleted: number; upserted: number }> {
	const client = getTemporalClient();
	const expected = new Set<string>();
	let upserted = 0;

	for (const row of rows) {
		expected.add(automationScheduleId(row.guildId, row.key, row.nodeId));
		await upsertAutomationSchedule(row);
		upserted++;
	}

	let deleted = 0;
	for await (const schedule of client.schedule.list()) {
		const id = schedule.scheduleId;
		// `automation-run-retention` is a static schedule declared above, not a
		// user's automation — the prefix overlaps, so it is excluded by name.
		if (!id.startsWith('automation-') || id === 'automation-run-retention') continue;
		if (expected.has(id)) continue;
		try {
			await client.schedule.getHandle(id).delete();
			deleted++;
		} catch {
			// already gone — fine
		}
	}

	return {
		deleted,
		upserted,
	};
}
