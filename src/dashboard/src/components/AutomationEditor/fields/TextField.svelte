<script>
	let { field, value, onchange } = $props();
</script>

<input
	type="text"
	class="input form-input text-sm"
	maxlength={field.maxLength}
	placeholder={field.placeholder ?? ''}
	value={value ?? ''}
	oninput={(e) => onchange(e.currentTarget.value)}
/>
