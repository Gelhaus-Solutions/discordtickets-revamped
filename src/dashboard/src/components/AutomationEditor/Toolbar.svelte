<script>
	import { useSvelteFlow } from '@xyflow/svelte';
	import { editorState } from './editorState.svelte.js';

	let { problems = [], onTidy } = $props();

	const state = editorState();
	const { fitView } = useSvelteFlow();

	let open = $state(false);
	const errors = $derived(problems.filter((p) => p.severity === 'error'));
	const warnings = $derived(problems.filter((p) => p.severity === 'warning'));

	/** Select the offending node and fly to it. */
	const focus = (problem) => {
		open = false;
		if (!problem.nodeId) return;
		state.selected = problem.nodeId;
		fitView({ duration: 300, nodes: [{ id: problem.nodeId }], padding: 0.4 });
	};
</script>

<div class="flex flex-wrap items-center gap-2">
	<button type="button" class="link text-sm" onclick={onTidy}>
		<i class="fa-solid fa-wand-magic-sparkles"></i> Tidy up
	</button>
	<button type="button" class="link text-sm" onclick={() => fitView({ duration: 300, padding: 0.2 })}>
		<i class="fa-solid fa-expand"></i> Fit
	</button>

	{#if problems.length > 0}
		<div class="relative">
			<button
				type="button"
				class="rounded-full px-3 py-1 text-xs font-medium transition duration-200 {errors.length
					? 'bg-red-500/20 text-red-600 dark:text-red-400'
					: 'bg-amber-500/20 text-amber-700 dark:text-amber-400'}"
				onclick={() => (open = !open)}
			>
				<i class="fa-solid fa-triangle-exclamation"></i>
				{problems.length}
				{problems.length === 1 ? 'problem' : 'problems'}
			</button>

			{#if open}
				<div
					class="absolute z-20 mt-1 max-h-64 w-80 overflow-y-auto rounded-xl bg-white p-2 shadow-lg dark:bg-slate-800"
				>
					{#each [...errors, ...warnings] as problem (problem.message + problem.nodeId)}
						<button
							type="button"
							class="block w-full rounded-lg p-2 text-left text-xs transition duration-200 hover:bg-gray-100 dark:hover:bg-slate-700"
							onclick={() => focus(problem)}
						>
							<i
								class="fa-solid {problem.severity === 'error'
									? 'fa-circle-xmark text-red-500'
									: 'fa-circle-exclamation text-amber-500'}"
							></i>
							{problem.message}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
