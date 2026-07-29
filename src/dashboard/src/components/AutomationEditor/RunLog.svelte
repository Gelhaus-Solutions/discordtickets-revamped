<script>
	import { iconFor } from './nodes.js';

	/** Shared by the editor and the standalone runs page. */
	let { runs = [], catalogue = null } = $props();

	let expanded = $state(null);

	const STATUS = {
		CANCELLED: { class: 'bg-gray-500/20 text-gray-600 dark:text-slate-400', icon: 'fa-circle-minus', text: 'Cancelled' },
		FAILED: { class: 'bg-red-500/20 text-red-600 dark:text-red-400', icon: 'fa-circle-xmark', text: 'Failed' },
		RUNNING: { class: 'bg-blue-500/20 text-blue-600 dark:text-blue-400', icon: 'fa-spinner', text: 'Running' },
		SKIPPED: { class: 'bg-amber-500/20 text-amber-700 dark:text-amber-400', icon: 'fa-circle-half-stroke', text: 'Skipped' },
		SUCCESS: { class: 'bg-green-500/20 text-green-700 dark:text-green-400', icon: 'fa-circle-check', text: 'Ran OK' },
		SUSPENDED: { class: 'bg-violet-500/20 text-violet-700 dark:text-violet-400', icon: 'fa-stopwatch', text: 'Waiting' }
	};

	const labelFor = (type) => catalogue?.types?.find((t) => t.type === type)?.label ?? type;
</script>

{#if runs.length === 0}
	<p class="p-4 text-center text-gray-500 dark:text-slate-400">This automation has not run yet.</p>
{:else}
	<div class="flex flex-col gap-2">
		{#each runs as run (run.id)}
			{@const status = STATUS[run.status] ?? STATUS.FAILED}
			<div class="rounded-xl bg-gray-100/50 p-3 dark:bg-slate-800/50">
				<button
					type="button"
					class="flex w-full items-center gap-3 text-left"
					onclick={() => (expanded = expanded === run.id ? null : run.id)}
				>
					<span class="rounded-full px-2 py-0.5 text-xs font-medium {status.class}">
						<i class="fa-solid {status.icon}"></i>
						{status.text}
					</span>
					<span class="min-w-0 flex-1 truncate text-sm">{labelFor(run.triggerType)}</span>
					{#if run.durationMs != null}
						<span class="text-xs text-gray-500 dark:text-slate-400">{run.durationMs}ms</span>
					{/if}
					<span class="text-xs text-gray-400 dark:text-slate-500">
						{new Date(run.createdAt).toLocaleString()}
					</span>
					<i class="fa-solid {expanded === run.id ? 'fa-angle-up' : 'fa-angle-down'}"></i>
				</button>

				{#if run.error}
					<p class="mt-2 rounded bg-red-500/10 p-2 font-mono text-xs text-red-600 dark:text-red-400">
						{run.error}
					</p>
				{/if}

				{#if expanded === run.id}
					<div class="mt-2 flex flex-col gap-1">
						{#each run.steps ?? [] as step, i (i)}
							<div class="flex items-center gap-2 text-xs">
								<i class="fa-solid {iconFor(step.t)} text-gray-400 dark:text-slate-500"></i>
								<span class="min-w-0 flex-1 truncate">{labelFor(step.t)}</span>
								{#if step.r}
									<span class="text-gray-500 dark:text-slate-400">{step.r}</span>
								{/if}
								<span
									class={step.s === 'error'
										? 'text-red-500'
										: step.s === 'skip'
											? 'text-amber-600 dark:text-amber-400'
											: 'text-green-600 dark:text-green-400'}
								>
									{step.s}
								</span>
								{#if step.m != null}
									<span class="text-gray-400 dark:text-slate-500">{step.m}ms</span>
								{/if}
							</div>
							{#if step.e}
								<p class="ml-6 font-mono text-xs text-red-500">{step.e}</p>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
