<script>
	import { editorState } from '../editorState.svelte.js';

	let { field, value, onchange, multiple = false } = $props();

	const editor = editorState();
	// Text (0), announcement (5) and forum (15) can hold a message; a Discord
	// category (4) is only ever a move target.
	const TYPES = { 'action.ticket.move': [4] };
	const allowed = $derived(field.channelTypes ?? TYPES[field.key] ?? [0, 5, 15]);
	const options = $derived(editor.channels.filter((c) => allowed.includes(c.type)));
	const selected = $derived(multiple ? (value ?? []) : value);
</script>

{#if multiple}
	<select
		multiple
		class="input form-multiselect h-40 text-sm"
		onchange={(e) => onchange([...e.currentTarget.selectedOptions].map((o) => o.value))}
	>
		{#each options as channel (channel.id)}
			<option value={channel.id} selected={selected.includes(channel.id)}>#{channel.name}</option>
		{/each}
	</select>
{:else}
	<select
		class="input form-select text-sm"
		value={selected ?? ''}
		onchange={(e) => onchange(e.currentTarget.value || null)}
	>
		<option value="">{field.required ? 'Pick a channel' : 'Any channel'}</option>
		{#each options as channel (channel.id)}
			<option value={channel.id}>#{channel.name}</option>
		{/each}
	</select>
{/if}
