<script>
	import PlaceholderPicker from '$components/PlaceholderPicker.svelte';

	/**
	 * A single-line param.
	 *
	 * The placeholder picker appears only when the field's registry entry says it
	 * takes placeholders: this same component also renders cron expressions,
	 * timezones and regular expressions, where a `{name}` button would be an
	 * invitation to break the field.
	 */
	let { field, value, onchange } = $props();

	let element = $state();
</script>

<input
	bind:this={element}
	type="text"
	class="input form-input text-sm"
	maxlength={field.maxLength}
	placeholder={field.placeholder ?? ''}
	value={value ?? ''}
	oninput={(e) => onchange(e.currentTarget.value)}
/>
{#if field.placeholders}
	<div class="mt-1">
		<PlaceholderPicker target={element} context={field.placeholders} />
	</div>
{/if}
