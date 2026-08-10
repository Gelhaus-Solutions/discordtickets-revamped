import * as Sentry from '@sentry/node';
import { defaultPayloadConverter } from '@temporalio/common';
import type { Headers } from '@temporalio/common';
import type {
	WorkflowClientInterceptor,
} from '@temporalio/client';
import type { ActivityInterceptorsFactory } from '@temporalio/worker';

/**
 * Trace propagation across the Temporal boundary.
 *
 * An activity runs in a different task, minutes or days after whatever started
 * its workflow, so Node's async context is long gone by then. Without carrying
 * the trace explicitly, every activity opens a root transaction of its own and
 * the interaction that caused it is nowhere near it in Sentry.
 *
 * The two halves have to agree: the client interceptor writes the current trace
 * into workflow headers at start time, and the worker interceptor reads them
 * back and continues that trace around the activity.
 *
 * Nothing here may ever be imported from workflow code — workflows run in a
 * sandboxed V8 isolate where I/O breaks determinism. These are wired into the
 * *client* and the *activity* side only.
 */

const TRACE_HEADER = 'sentry-trace';
const BAGGAGE_HEADER = 'sentry-baggage';

/** Copy the active trace into a set of Temporal headers. */
function withTraceHeaders(headers: Headers): Headers {
	try {
		const data = Sentry.getTraceData();
		const traceparent = data['sentry-trace'];
		const baggage = data.baggage;
		const out: Headers = { ...headers };
		if (traceparent) {
			const payload = defaultPayloadConverter.toPayload(traceparent);
			if (payload) out[TRACE_HEADER] = payload;
		}
		if (baggage) {
			const payload = defaultPayloadConverter.toPayload(baggage);
			if (payload) out[BAGGAGE_HEADER] = payload;
		}
		return out;
	} catch {
		// Tracing must never be the reason a workflow fails to start.
		return headers;
	}
}

/** Read one header back as a string, tolerating anything unexpected. */
function readHeader(headers: Headers, key: string): string | undefined {
	try {
		const payload = headers?.[key];
		if (!payload) return undefined;
		const value = defaultPayloadConverter.fromPayload(payload);
		return typeof value === 'string' ? value : undefined;
	} catch {
		return undefined;
	}
}

/**
 * Client-side half: stamp the current trace onto every workflow start.
 *
 * `signalWithStart` is implemented alongside `startWithDetails` because it is a
 * start too — the gateway uses it for the signal-or-start paths, and leaving it
 * out would silently drop the trace for exactly the flows that have one.
 */
export function sentryWorkflowClientInterceptor(): WorkflowClientInterceptor {
	return {
		async signalWithStart(input, next) {
			return next({
				...input,
				headers: withTraceHeaders(input.headers),
			});
		},
		async startWithDetails(input, next) {
			return next({
				...input,
				headers: withTraceHeaders(input.headers),
			});
		},
	};
}

/**
 * Worker-side half: continue the caller's trace around each activity execution.
 *
 * Wrapped in its own isolation scope so that attributes from one activity do not
 * bleed into others running concurrently on the same worker.
 */
export const sentryActivityInterceptors: ActivityInterceptorsFactory = ctx => ({
	inbound: {
		async execute(input, next) {
			const info = ctx.info;
			return Sentry.withIsolationScope(() =>
				Sentry.continueTrace(
					{
						baggage: readHeader(input.headers, BAGGAGE_HEADER),
						sentryTrace: readHeader(input.headers, TRACE_HEADER),
					},
					() =>
						Sentry.startSpan(
							{
								attributes: {
									'temporal.activity_id': info.activityId,
									'temporal.activity_type': info.activityType,
									// Retries are the thing you actually want to see
									// when an activity misbehaves.
									'temporal.attempt': info.attempt,
									'temporal.task_queue': info.taskQueue,
									'temporal.workflow_id': info.workflowExecution?.workflowId,
									'temporal.workflow_type': info.workflowType,
								},
								forceTransaction: true,
								name: `activity ${info.activityType}`,
								op: 'temporal.activity',
							},
							async () => {
								const startedAt = Date.now();
								let outcome = 'ok';
								try {
									return await next(input);
								} catch (error) {
									outcome = 'error';
									throw error;
								} finally {
									// `activityType` is a fixed set of ~17 names and
									// `outcome` is two values, so this stays small.
									// The workflow id would not — it is per ticket.
									Sentry.metrics.distribution('temporal.activity.duration', Date.now() - startedAt, {
										attributes: {
											activity: info.activityType,
											outcome,
										},
										unit: 'millisecond',
									});
								}
							},
						),
				),
			);
		},
	},
});
