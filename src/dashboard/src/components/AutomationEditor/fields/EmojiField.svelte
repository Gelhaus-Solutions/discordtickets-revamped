<script>
	import EmojiPicker from '$components/EmojiPicker.svelte';

	let { field, value, onchange } = $props();

	// Bound as a getter/setter pair rather than mirrored into local `$state`.
	//
	// The mirror this replaces looked harmless but had two failure modes. The
	// picker clears to `null` while the seeded mirror held `''`, and the guard
	// compared them raw (`null !== ''`), so it stayed true forever: pressing the
	// "x" fired `onchange(null)` -> the parent wrote `null` -> the effect re-ran
	// -> `onchange(null)` again, until Svelte gave up with
	// `effect_update_depth_exceeded` and the whole editor froze until a reload.
	//
	// The other mode was silent. The inspector reuses one field instance across
	// node selections (see the keyed `#each` in ParamFields.svelte), and the
	// mirror was seeded once with `untrack`, so selecting a second button-pressed
	// trigger pushed the previous node's emoji into it — or wiped it, if the
	// first node had none.
	//
	// With no local copy there is nothing to fall out of sync, and the write only
	// happens when the user actually picks something.
</script>

<EmojiPicker
	bind:value={() => value ?? '', (picked) => onchange(picked || null)}
	required={field?.required ?? false}
	placeholder={field?.placeholder ?? 'None'}
/>
