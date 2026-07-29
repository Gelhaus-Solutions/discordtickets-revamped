<script>
	let { field, value, onchange } = $props();
</script>

<input
	type="number"
	class="input form-input text-sm"
	max={field.max}
	min={field.min}
	value={value ?? ''}
	oninput={(e) => onchange(e.currentTarget.value === '' ? null : Number(e.currentTarget.value))}
/>
