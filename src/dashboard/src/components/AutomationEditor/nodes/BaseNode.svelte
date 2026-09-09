<script>
	import { Handle, Position } from '@xyflow/svelte';
	import { CATEGORY_META, categoryOf, iconFor, summarise } from '../nodes.js';
	import { editorState } from '../editorState.svelte.js';

	/** @type {{id: string, data: any, selected: boolean}} */
	let { id, data, selected } = $props();

	const editor = editorState();
	const category = $derived(categoryOf(data.type));
	const skin = $derived(CATEGORY_META[category] ?? CATEGORY_META.action);
	const definition = $derived(editor.catalogue?.types?.find((t) => t.type === data.type));

	// Read from context, never from `node.data`: Svelte Flow keeps nodes in
	// $state.raw, so baking problems into node data would rebuild the whole array
	// on every keystroke and re-render the canvas.
	const problems = $derived(editor.problems.filter((p) => p.nodeId === id));
	const broken = $derived(problems.some((p) => p.severity === 'error'));

	const outputs = $derived(definition?.outputs ?? ['out']);
	const hasInput = $derived(category !== 'trigger');

	// The first output is the node's positive branch and the rest are its
	// negative ones. That is exactly what `flow.if` (`['true', 'false']`) already
	// looked like when the names were hardcoded here, and it generalises to any
	// node that branches: `findThread` is `['found', 'notFound']`. Display text
	// comes from the registry's `outputLabels`, so a handle name never leaks a
	// camelCase identifier like "notFound" onto the canvas.
	const labelFor = handle => definition?.outputLabels?.[handle] ?? handle;
	const isPositive = i => i === 0;
</script>

{#if hasInput}
	<Handle
		type="target"
		position={Position.Left}
		class="!border-white !bg-gray-400 dark:!border-slate-800 dark:!bg-slate-400"
	/>
{/if}

<div
	class="w-[260px] rounded-xl border-2 bg-white p-3 shadow-sm dark:bg-slate-700 {broken
		? 'border-red-500'
		: selected
			? 'border-blurple ring-2 ring-blurple/40'
			: skin.border}"
>
	<div class="flex items-center gap-2">
		<!--
			`fa-fw` is load-bearing, not decoration. The node icons range from
			`fa-i-cursor` at 256 units to `fa-user-plus` and friends at 640, and
			this is a flex row, so without a fixed width every node's title starts
			at a different offset and a column of nodes reads as ragged.
		-->
		<i class="fa-solid fa-fw {iconFor(data.type)} {skin.icon}"></i>
		<span class="min-w-0 flex-1 truncate font-medium">{definition?.label ?? data.type}</span>
		{#if broken}
			<i class="fa-solid fa-triangle-exclamation text-red-500" title={problems[0].message}></i>
		{/if}
	</div>
	<p class="mt-1 truncate text-sm text-gray-500 dark:text-slate-400">
		{summarise({ params: data.params, type: data.type }, editor.catalogue)}
	</p>
	<span class="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium {skin.chip}">
		{skin.label.replace(/s$/, '')}
	</span>
</div>

{#each outputs as handle, i (handle)}
	<Handle
		type="source"
		id={handle}
		position={Position.Right}
		style={outputs.length > 1 ? `top: ${30 + i * 40}%` : ''}
		class="!border-white dark:!border-slate-800 {outputs.length === 1
			? skin.handle
			: isPositive(i)
				? '!bg-green-500'
				: '!bg-red-400'}"
	/>
	{#if outputs.length > 1}
		<span
			class="pointer-events-none absolute left-full ml-2 whitespace-nowrap text-[10px] font-semibold {isPositive(
				i
			)
				? 'text-green-600 dark:text-green-400'
				: 'text-red-500 dark:text-red-400'}"
			style="top: calc({30 + i * 40}% - 7px)"
		>
			{labelFor(handle)}
		</span>
	{/if}
{/each}
