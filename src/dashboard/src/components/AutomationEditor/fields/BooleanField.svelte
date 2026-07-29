<script>
	let { field, value, onchange } = $props();
</script>

<label class="flex items-center gap-2 text-sm font-medium">
	<input
		type="checkbox"
		class="form-checkbox"
		checked={Boolean(value)}
		onchange={(e) => onchange(e.currentTarget.checked)}
	/>
	{field.label}
</label>
