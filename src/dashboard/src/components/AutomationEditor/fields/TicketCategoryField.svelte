<script>
	import { editorState } from '../editorState.svelte.js';

	let { field, value, onchange, multiple = false } = $props();

	const editor = editorState();
	const selected = $derived(multiple ? (value ?? []) : value);
</script>

{#if multiple}
	<select
		multiple
		class="input form-multiselect h-32 text-sm"
		onchange={(e) => onchange([...e.currentTarget.selectedOptions].map((o) => Number(o.value)))}
	>
		{#each editor.categories as category (category.id)}
			<option value={category.id} selected={selected.includes(category.id)}>{category.name}</option>
		{/each}
	</select>
	<p class="mt-1 text-xs text-gray-500 dark:text-slate-400">
		{selected.length === 0 ? 'Every category.' : `${selected.length} selected.`}
	</p>
{:else}
	<select
		class="input form-select text-sm"
		value={selected ?? ''}
		onchange={(e) => onchange(e.currentTarget.value === '' ? null : Number(e.currentTarget.value))}
	>
		<option value="">{field.required ? 'Pick a category' : 'Any category'}</option>
		{#each editor.categories as category (category.id)}
			<option value={category.id}>{category.name}</option>
		{/each}
	</select>
{/if}
