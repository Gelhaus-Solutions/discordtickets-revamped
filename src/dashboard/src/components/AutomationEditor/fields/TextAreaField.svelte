<script>
	import { editorState } from '../editorState.svelte.js';

	let { field, value, onchange } = $props();

	const editor = editorState();

	// The same placeholders panels and opening messages already use, so an admin
	// does not have to learn a second syntax.
	//
	// `{name}` is whoever set the automation off — on a "button is pressed"
	// trigger that is the staff member who pressed it — so the `{opener}` family
	// is here for the far more common "who does this ticket belong to".
	const VARIABLES = ['{name}', '{displayname}', '{num}', '{opener}', '{openerdisplayname}', '{openermention}'];

	let element = $state();

	/** Insert at the caret rather than appending — appending is never what you want. */
	const insert = (token) => {
		const text = value ?? '';
		const at = element?.selectionStart ?? text.length;
		onchange(text.slice(0, at) + token + text.slice(element?.selectionEnd ?? at));
	};
</script>

<textarea
	bind:this={element}
	class="input form-input h-24 text-sm"
	maxlength={field.maxLength}
	value={value ?? ''}
	oninput={(e) => onchange(e.currentTarget.value)}
></textarea>
<div class="mt-1 flex flex-wrap gap-1">
	{#each VARIABLES as token (token)}
		<button
			type="button"
			class="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-600 transition duration-200 hover:bg-blurple hover:text-white dark:bg-slate-800 dark:text-slate-400"
			onclick={() => insert(token)}
		>
			{token}
		</button>
	{/each}
	{#if field.maxLength}
		<span class="ml-auto text-xs text-gray-400 dark:text-slate-500">
			{(value ?? '').length}/{field.maxLength}
		</span>
	{/if}
	{#if editor.catalogue === null}<span></span>{/if}
</div>
