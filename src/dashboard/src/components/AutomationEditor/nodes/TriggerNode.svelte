<script>
	import BaseNode from './BaseNode.svelte';

	// Every category renders through BaseNode; the differences (colour, handles,
	// the true/false labels) all fall out of the registry, so these exist only so
	// Svelte Flow has a component per node type prefix.
	let { id, data, selected } = $props();
</script>

<BaseNode {id} {data} {selected} />
