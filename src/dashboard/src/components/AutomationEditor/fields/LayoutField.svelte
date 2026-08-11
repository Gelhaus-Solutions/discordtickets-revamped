<script>
	import { modals } from 'svelte-modals';
	import { editorState } from '../editorState.svelte.js';
	import LayoutModal from '../LayoutModal.svelte';
	import { defaultMessageLayout, summariseLayout } from '$components/BlockEditor/blocks.js';
	import { placeholders } from '$lib/placeholders.js';

	/**
	 * The `layout` parameter of an `action.message.*` node.
	 *
	 * Shown as a one-line summary with an Edit button, because the Inspector is a
	 * 20rem column and the block editor needs the page. `field.kind` comes from
	 * the server's own registry entry, so the editor offers exactly the blocks and
	 * button kinds the validator will accept.
	 */
	let { field, value, onchange } = $props();

	const editor = editorState();
	// Read here, inside the tree that provides it, and handed to the modal —
	// which renders outside it.
	const catalogue = placeholders();

	const layout = $derived(value ?? defaultMessageLayout());
	const summary = $derived(summariseLayout(layout));

	const open = () =>
		modals.open(LayoutModal, {
			automations: editor.buttonAutomations ?? [],
			catalogue,
			categories: editor.categories ?? [],
			channels: editor.channels ?? [],
			context: field.kind ?? 'message',
			// The preview renders the guild's footer and accent colour because the
			// bot does too (`actions.js` passes both into the message context). Left
			// out, the preview claimed there was no footer on guilds that have one.
			footer: editor.footer ?? '',
			layout,
			nodeTargets: editor.buttonTriggers ?? [],
			onsave: onchange,
			primaryColour: editor.primaryColour ?? '#009999',
			roles: editor.roles ?? [],
			title: field.label ?? 'Message'
		});
</script>

<div class="rounded-lg bg-gray-100/60 p-2 dark:bg-slate-800/50">
	<p class="truncate text-xs text-gray-500 dark:text-slate-400">{summary}</p>
	<button type="button" class="link mt-1 text-sm" onclick={open}>
		<i class="fa-solid fa-pen-to-square"></i> Edit message
	</button>
</div>
