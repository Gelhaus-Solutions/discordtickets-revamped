<script>
	let { field, value, onchange } = $props();

	// A plain id: there is no member-cache endpoint, and fetching every member of
	// a large guild to populate a dropdown would be worse than typing an id.
	const valid = $derived(!value || /^\d{15,20}$/.test(String(value)));
</script>

<input
	type="text"
	class="input form-input text-sm"
	placeholder="Discord user ID"
	value={value ?? ''}
	oninput={(e) => onchange(e.currentTarget.value || null)}
/>
{#if !valid}
	<p class="mt-1 text-xs text-red-500">That does not look like a Discord ID.</p>
{:else if !field.required}
	<p class="mt-1 text-xs text-gray-500 dark:text-slate-400">Enable Developer Mode to copy an ID.</p>
{/if}
