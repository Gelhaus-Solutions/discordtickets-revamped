<script>
	import { onMount } from 'svelte';
	import { navigating } from '$app/stores';
	// import { Modals } from 'svelte-modals';
	import Spinner from '$components/Spinner.svelte';
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();

	let mounted = $state(false);
	onMount(() => {
		mounted = true;
		return () => (mounted = false);
	});
</script>

<!--
	The same shell the settings panel uses. The portal used to be on the `dgrey`
	Discord palette while everything else was gray/slate with blurple accents, so
	crossing between them looked like two different products.
-->
<div class="absolute h-max min-h-screen w-full bg-gray-200 dark:bg-slate-900">
	<!-- <Modals>
		{#snippet backdrop({ close })}
			<div class="backdrop" transition:fade onclick={close} onkeypress={close}></div>
		{/snippet}
		{#snippet loading()}
			<div><Spinner /></div>
		{/snippet}
	</Modals> -->
	{#if $navigating || !mounted}
		<div class="h-dvh flex items-center justify-center">
			<Spinner />
		</div>
	{:else}
		{@render children?.()}
	{/if}
</div>
