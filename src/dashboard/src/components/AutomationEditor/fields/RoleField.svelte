<script>
	import { editorState } from '../editorState.svelte.js';

	let { field, value, onchange, multiple = false } = $props();

	const editor = editorState();
	const selected = $derived(multiple ? (value ?? []) : value);
</script>

{#if multiple}
	<select
		multiple
		class="input form-multiselect h-40 text-sm"
		onchange={(e) => onchange([...e.currentTarget.selectedOptions].map((o) => o.value))}
	>
		{#each editor.roles as role (role.id)}
			<option value={role.id} selected={selected.includes(role.id)} style={role._style}>
				{role.name}
			</option>
		{/each}
	</select>
{:else}
	<select
		class="input form-multiselect text-sm"
		value={selected ?? ''}
		onchange={(e) => onchange(e.currentTarget.value || null)}
	>
		<option value="">{field.required ? 'Pick a role' : 'Any role'}</option>
		{#each editor.roles as role (role.id)}
			<option value={role.id} style={role._style}>{role.name}</option>
		{/each}
	</select>
{/if}
