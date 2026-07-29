<script>
	import { humanDuration, parseDuration } from '../nodes.js';

	let { field, value, onchange } = $props();

	// Stored as milliseconds (like `Category.cooldown`), typed as `10m` / `2h`.
	let text = $state(value == null ? '' : humanShorthand(value));
	const parsed = $derived(parseDuration(text));

	function humanShorthand(ms) {
		const units = [
			['w', 604_800_000],
			['d', 86_400_000],
			['h', 3_600_000],
			['m', 60_000],
			['s', 1000]
		];
		for (const [suffix, size] of units) if (ms % size === 0 && ms >= size) return `${ms / size}${suffix}`;
		return String(ms);
	}
</script>

<input
	type="text"
	class="input form-input text-sm"
	placeholder="10m"
	bind:value={text}
	oninput={() => onchange(parseDuration(text))}
/>
<p class="mt-1 text-xs {parsed === null && text ? 'text-red-500' : 'text-gray-500 dark:text-slate-400'}">
	{#if !text}
		Try <code>30s</code>, <code>10m</code>, <code>2h</code> or <code>1d</code>.
	{:else if parsed === null}
		Not a length of time.
	{:else}
		= {humanDuration(parsed)}{field.max && parsed > field.max ? ' — too long' : ''}
	{/if}
</p>
