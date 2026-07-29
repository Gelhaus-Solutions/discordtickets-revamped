<script>
	import { useSvelteFlow } from '@xyflow/svelte';
	import { CATEGORY_META, categoryOf, iconFor } from './nodes.js';
	import { editorState } from './editorState.svelte.js';
	import ParamFields from './ParamFields.svelte';

	let { node } = $props();

	const state = editorState();
	const { deleteElements } = useSvelteFlow();

	const definition = $derived(state.catalogue?.types?.find((t) => t.type === node?.data?.type));
	const skin = $derived(node ? (CATEGORY_META[categoryOf(node.data.type)] ?? CATEGORY_META.action) : null);
	const isTrigger = $derived(node ? categoryOf(node.data.type) === 'trigger' : false);
</script>

<div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
	{#if !node}
		<p class="text-sm text-gray-500 dark:text-slate-400">
			Pick a step on the canvas to configure it, or add one from the list on the left.
		</p>
	{:else}
		<div class="mb-3 flex items-start gap-2">
			<i class="fa-solid {iconFor(node.data.type)} mt-1 {skin.icon}"></i>
			<div class="min-w-0 flex-1">
				<p class="truncate font-semibold">{definition?.label ?? node.data.type}</p>
				<p class="text-xs text-gray-500 dark:text-slate-400">{definition?.description ?? ''}</p>
			</div>
			{#if !isTrigger}
				<button
					type="button"
					class="text-red-300 transition duration-300 hover:text-red-500 dark:text-red-500/50 dark:hover:text-red-500"
					title="Remove this step"
					onclick={() => {
						deleteElements({ nodes: [{ id: node.id }] });
						state.selected = null;
					}}
				>
					<i class="fa-solid fa-trash"></i>
				</button>
			{/if}
		</div>

		{#if definition?.durable}
			<p class="mb-3 rounded-lg bg-violet-400/10 p-2 text-xs text-violet-700 dark:text-violet-300">
				Everything after this step is made durable — it survives a restart.
			</p>
		{/if}

		<ParamFields {node} />
	{/if}
</div>
