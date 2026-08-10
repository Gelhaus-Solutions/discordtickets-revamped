<script>
	import PlaceholderPicker from '$components/PlaceholderPicker.svelte';

	/**
	 * A textarea with the placeholder picker beside it.
	 *
	 * This used to carry its own hardcoded chip row of six placeholders, which was
	 * one of the seven places the list was written down. The picker reads the
	 * catalogue the bot serves, so it can never advertise a placeholder the bot
	 * does not have — or miss one it does.
	 */
	let { field, value, onchange } = $props();

	let element = $state();
</script>

<textarea
	bind:this={element}
	class="input form-input h-24 text-sm"
	maxlength={field.maxLength}
	value={value ?? ''}
	oninput={(e) => onchange(e.currentTarget.value)}
></textarea>
<div class="mt-1 flex flex-wrap items-center gap-1">
	{#if field.placeholders}
		<PlaceholderPicker target={element} context={field.placeholders} />
	{/if}
	{#if field.maxLength}
		<span class="ml-auto text-xs text-gray-400 dark:text-slate-500">
			{(value ?? '').length}/{field.maxLength}
		</span>
	{/if}
</div>
