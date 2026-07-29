<script>
	import { untrack } from 'svelte';
	import EmojiPicker from '$components/EmojiPicker.svelte';

	let { value, onchange } = $props();

	// Reused verbatim: it already fetches ?query=emojis.cache and emits either a
	// literal unicode emoji or `<:name:id>`.
	let emoji = $state(untrack(() => value ?? ''));
	$effect(() => {
		if (emoji !== (value ?? '')) onchange(emoji || null);
	});
</script>

<EmojiPicker bind:value={emoji} />
