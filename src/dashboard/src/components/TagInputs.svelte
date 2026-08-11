<script>
	import { renderMarkdown } from '$lib/markdown.js';
	import Required from './Required.svelte';
	import PlaceholderPicker from './PlaceholderPicker.svelte';
	import { placeholders, preview } from '$lib/placeholders.js';

	/** @type {{tag: any}} */
	let { tag = $bindable() } = $props();

	const catalogue = placeholders();

	let contentEl = $state();
</script>

<div>
	<label>
		<span class="font-medium">Name</span>
		<Required />
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="The tag name - can contain UNICODE emoji (not emoji names)"
		></i>
		<input type="text" class="input form-input" required bind:value={tag.name} />
	</label>
</div>
<div>
	<label>
		<span class="font-medium">Auto tag regular expression</span>
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="Optional - regex to trigger this tag"
		></i>
		<input type="text" class="input form-input" bind:value={tag.regex} />
	</label>
</div>
<div>
	<label class="font-medium">
		<span class="font-medium">Content</span>
		<Required />
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="The tag content"
		></i>
		<textarea
			bind:this={contentEl}
			class="input form-input h-24"
			maxlength="4096"
			required
			bind:value={tag.content}
		></textarea>
	</label>
	<div class="mt-1">
		<PlaceholderPicker target={contentEl} context="tag" />
	</div>
	{#if tag.content}
		<p class="text-sm font-medium">Preview</p>
		<div
			class="block w-full break-words prose prose-slate dark:prose-invert prose-a:text-blurple rounded-md bg-slate-100 p-3 font-mono text-sm shadow-sm dark:bg-slate-900"
		>
			<!-- The preview used to substitute {name} while the bot posted the raw
			     braces. Both now go through the same table. -->
			<!-- Escaped by renderMarkdown before parsing; see $lib/markdown.js. -->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html renderMarkdown(preview(catalogue, 'tag', tag.content.replace(/\n/g, '\n\n')))}
		</div>
	{/if}
</div>
