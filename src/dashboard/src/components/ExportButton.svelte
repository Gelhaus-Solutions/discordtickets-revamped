<script>
	import { getExport, startExport, watchExport } from './export.svelte.js';

	/** `children` gets the export, so each caller words its own states. */
	let { guild, class: className = '', children } = $props();

	const exported = $derived(getExport(guild));
	$effect(() => {
		watchExport(guild);
	});
</script>

<button
	type="button"
	class={className}
	disabled={exported.state === 'running' && exported.waiting}
	aria-busy={exported.state === 'running'}
	onclick={() => startExport(guild)}
>
	{@render children(exported)}
</button>
