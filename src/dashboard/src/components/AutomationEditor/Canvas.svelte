<script>
	import {
		Background,
		BackgroundVariant,
		Controls,
		MiniMap,
		SvelteFlow
	} from '@xyflow/svelte';
	import { createsCycle } from './graph.js';
	import { editorState } from './editorState.svelte.js';
	import ActionNode from './nodes/ActionNode.svelte';
	import ConditionNode from './nodes/ConditionNode.svelte';
	import FlowNode from './nodes/FlowNode.svelte';
	import TriggerNode from './nodes/TriggerNode.svelte';
	import DeletableEdge from './edges/DeletableEdge.svelte';

	/**
	 * The only file that mounts Svelte Flow.
	 *
	 * Everything else works in our own graph shape, so replacing the canvas
	 * library later means rewriting this file, the node components and
	 * `graph.js` — and nothing that has been written to the database.
	 */
	let { nodes = $bindable(), edges = $bindable(), colorMode = 'light' } = $props();

	const editor = editorState();

	const nodeTypes = {
		action: ActionNode,
		condition: ConditionNode,
		flow: FlowNode,
		trigger: TriggerNode
	};
	const edgeTypes = { deletable: DeletableEdge };

	const typeOf = (id) => nodes.find((n) => n.id === id)?.data?.type;

	const isValidConnection = (connection) => {
		if (connection.source === connection.target) return false;
		// Nothing may lead into a trigger — it is the entry point.
		if (String(typeOf(connection.target)).startsWith('trigger.')) return false;
		if (
			edges.some(
				(e) =>
					e.source === connection.source &&
					e.sourceHandle === connection.sourceHandle &&
					e.target === connection.target
			)
		) return false;
		// Cycles are rejected by the server anyway; refusing them here means the
		// canvas can never produce a graph that fails to save.
		return !createsCycle(edges, connection);
	};

</script>

<SvelteFlow
	bind:nodes
	bind:edges
	{nodeTypes}
	{edgeTypes}
	{colorMode}
	{isValidConnection}
	defaultEdgeOptions={{ type: 'deletable' }}
	fitView
	minZoom={0.25}
	maxZoom={2}
	snapGrid={[20, 20]}
	deleteKey={['Delete']}
	onnodeclick={({ node }) => (editor.selected = node.id)}
	onpaneclick={() => (editor.selected = null)}
>
	<Background variant={BackgroundVariant.Dots} gap={20} />
	<Controls position="bottom-left" />
	{#if nodes.length > 8}
		<MiniMap pannable zoomable />
	{/if}
</SvelteFlow>
