<script>
	let { field, value, onchange } = $props();
</script>

<select
	class="input form-multiselect text-sm"
	value={value ?? ''}
	onchange={(e) => onchange(e.currentTarget.value)}
>
	{#if !field.required}<option value="">Any</option>{/if}
	{#each field.options ?? [] as option (option.value)}
		<option value={option.value}>{option.label}</option>
	{/each}
</select>
