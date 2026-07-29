<script>
	import { BaseEdge, EdgeLabel, getBezierPath, useSvelteFlow } from '@xyflow/svelte';

	let {
		id,
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
		markerEnd
	} = $props();

	const { deleteElements } = useSvelteFlow();

	// [path, labelX, labelY, offsetX, offsetY]. `EdgeLabel` positions itself from
	// x/y — this is Svelte Flow, not React Flow, so there is no
	// `EdgeLabelRenderer` and no transform to apply by hand.
	const bezier = $derived(
		getBezierPath({ sourcePosition, sourceX, sourceY, targetPosition, targetX, targetY })
	);
</script>

<BaseEdge {id} path={bezier[0]} {markerEnd} />

<!-- A hover target on the curve itself: clicking a thin bezier is fiddly, and
     the Delete key only works once an edge is already selected. -->
<EdgeLabel x={bezier[1]} y={bezier[2]} transparent class="group">
	<button
		type="button"
		aria-label="Remove this connection"
		class="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-gray-400 opacity-0 shadow transition duration-200 hover:text-red-500 group-hover:opacity-100 dark:bg-slate-700 dark:text-slate-400"
		onclick={() => deleteElements({ edges: [{ id }] })}
	>
		<i class="fa-solid fa-xmark"></i>
	</button>
</EdgeLabel>
