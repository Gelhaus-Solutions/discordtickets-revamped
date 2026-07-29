<script>
	import { useSvelteFlow } from '@xyflow/svelte';
	import { CATEGORY_META, categoryOf, iconFor } from './nodes.js';
	import { editorState } from './editorState.svelte.js';
	import { defaultParams } from './graph.js';
	import ParamFields from './ParamFields.svelte';

	let { node } = $props();

	const editor = editorState();
	const {
		deleteElements,
		updateNodeData
	} = useSvelteFlow();

	const definition = $derived(editor.catalogue?.types?.find((t) => t.type === node?.data?.type));
	const skin = $derived(node ? (CATEGORY_META[categoryOf(node.data.type)] ?? CATEGORY_META.action) : null);
	const isTrigger = $derived(node ? categoryOf(node.data.type) === 'trigger' : false);

	const triggers = $derived(
		(editor.catalogue?.types ?? [])
			.filter((t) => t.category === 'trigger')
			.sort((a, b) => a.label.localeCompare(b.label))
	);

	/**
	 * Swap the trigger's type in place.
	 *
	 * Changing it here rather than making the user delete and re-add keeps the
	 * node id, and therefore every edge leading out of it — deleting the trigger
	 * takes the whole graph's wiring with it.
	 *
	 * Params are reset because they mean different things per trigger (a category
	 * filter, a role, a cron). Downstream nodes may now be missing context the new
	 * trigger does not provide; validation says so on the offending node.
	 */
	const changeTrigger = (type) => {
		if (!type || type === node.data.type) return;
		updateNodeData(node.id, { params: defaultParams(type, editor.catalogue), type });
	};
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
						editor.selected = null;
					}}
				>
					<i class="fa-solid fa-trash"></i>
				</button>
			{/if}
		</div>

		{#if isTrigger}
			<div class="mb-3">
				<div class="text-sm font-medium">When this happens</div>
				<select
					class="input form-multiselect text-sm"
					value={node.data.type}
					onchange={(e) => changeTrigger(e.currentTarget.value)}
				>
					{#each triggers as trigger (trigger.type)}
						<option value={trigger.type}>{trigger.label}</option>
					{/each}
				</select>
				<p class="mt-1 text-xs text-gray-500 dark:text-slate-400">
					Changing this keeps everything you have wired up; its own settings reset.
				</p>
			</div>
		{/if}

		{#if definition?.durable}
			<p class="mb-3 rounded-lg bg-violet-400/10 p-2 text-xs text-violet-700 dark:text-violet-300">
				Everything after this step is made durable — it survives a restart.
			</p>
		{/if}

		<ParamFields {node} />
	{/if}
</div>
