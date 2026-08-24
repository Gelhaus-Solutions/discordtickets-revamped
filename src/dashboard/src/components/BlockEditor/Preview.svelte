<script>
	import { renderMarkdown } from '$lib/markdown.js';
	import { displayEmoji } from '$lib/emoji.js';
	import { placeholders, preview } from '$lib/placeholders.js';
	import { countComponents, countText, LIMITS } from './blocks.js';

	/**
	 * An approximation of how the layout will look in Discord.
	 *
	 * Hand-rolled rather than using @skyra/discord-components-core, which has no
	 * elements for containers, sections or media galleries.
	 *
	 * @typedef {Object} Props
	 * @property {any} layout
	 * @property {any[]} categories
	 * @property {string} [context]
	 * @property {string} [primaryColour]
	 * @property {string} [footer]
	 * @property {any[]} [roles] resolves `<@&id>` mentions to a name
	 * @property {any[]} [channels] resolves `<#id>` mentions to a name
	 */

	/** @type {Props} */
	let {
		layout,
		categories,
		context = 'panel',
		primaryColour = '#009999',
		footer = '',
		roles = [],
		channels = []
	} = $props();

	const components = $derived(countComponents(layout));
	const characters = $derived(countText(layout));
	const overBudget = $derived(components > LIMITS.components || characters > LIMITS.text);

	// The sample values come from the bot's own catalogue, so the preview shows
	// what the message will look like rather than a second opinion about it. The
	// six hand-written replacements this replaces did not agree with the bot
	// about which placeholders existed, let alone what they meant here.
	const catalogue = placeholders();
	const substitute = (str) => preview(catalogue, context, str);

	// Substitute, then render: the same order the bot uses, so a placeholder whose
	// sample value contains markdown previews the way the sent message will read.
	const md = (str) =>
		renderMarkdown(substitute(str ?? ''), {
			breaks: true,
			mentions: {
				channels,
				roles
			}
		});

	const previewUrl = (url) => {
		const resolved = substitute(url ?? '');
		return /^https?:\/\//i.test(resolved) ? resolved : null;
	};

	const categoryName = (id) => categories.find((c) => c.id === id)?.name ?? 'Unknown category';
	const categoryEmoji = (id) => displayEmoji(categories.find((c) => c.id === id)?.emoji);

	// Substituted but never rendered as markdown: Discord does not format button
	// labels, so a preview that did would be flattering rather than accurate.
	const buttonLabel = (button) => {
		if (button.kind === 'link') return substitute(button.label || 'Link');
		if (button.kind === 'automation') return substitute(button.label || 'Automation');
		return substitute(button.label || categoryName(button.categoryId));
	};

	// Mirrors `buildButton`: the button's own emoji wins, then the category's.
	// Resolved rather than shown raw, or a shortcode would preview as its own text.
	const buttonEmoji = (button) =>
		displayEmoji(button.emoji) || (button.kind === 'ticket' ? categoryEmoji(button.categoryId) : '');

	const buttonClass = (button) => {
		const style = button.style ?? (button.kind === 'link' ? 'secondary' : 'primary');
		return (
			{
				primary: 'bg-blurple text-white',
				secondary: 'bg-gray-500 text-white',
				success: 'bg-green-600 text-white',
				danger: 'bg-red-600 text-white'
			}[style] ?? 'bg-gray-500 text-white'
		);
	};
</script>

{#snippet blockPreview(block)}
	{#if block.type === 'text'}
		<!-- Escaped by renderMarkdown before parsing; see $lib/markdown.js. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<div class="prose prose-sm max-w-none dark:prose-invert">{@html md(block.content)}</div>
	{:else if block.type === 'separator'}
		{#if block.divider === false}
			<div class="h-3"></div>
		{:else}
			<hr class="my-2 border-gray-300 dark:border-slate-600" />
		{/if}
	{:else if block.type === 'section'}
		<div class="flex items-start gap-3">
			<div class="prose prose-sm min-w-0 flex-1 max-w-none dark:prose-invert">
				<!-- Escaped by renderMarkdown before parsing; see $lib/markdown.js. -->
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html md((block.text ?? []).join('\n'))}
			</div>
			{#if block.accessory?.kind === 'thumbnail'}
				{#if previewUrl(block.accessory.url)}
					<img
						src={previewUrl(block.accessory.url)}
						alt=""
						class="h-20 w-20 flex-none rounded object-cover"
					/>
				{:else if block.accessory.url}
					<div
						class="flex h-20 w-20 flex-none items-center justify-center rounded bg-gray-200 text-xs text-gray-500 dark:bg-slate-700"
					>
						{block.accessory.url.includes('{') ? 'avatar' : 'image'}
					</div>
				{/if}
			{:else if block.accessory?.kind === 'button'}
				<span class="flex-none rounded px-3 py-1 text-sm font-medium {buttonClass(block.accessory.button)}">
					{buttonEmoji(block.accessory.button)}
					{buttonLabel(block.accessory.button)}
				</span>
			{/if}
		</div>
	{:else if block.type === 'gallery'}
		<div class="flex flex-wrap gap-1">
			{#each block.items ?? [] as item}
				{#if previewUrl(item.url)}
					<img src={previewUrl(item.url)} alt="" class="max-h-40 rounded" />
				{:else}
					<div
						class="flex h-24 w-32 items-center justify-center rounded bg-gray-200 text-xs text-gray-500 dark:bg-slate-700"
					>
						image
					</div>
				{/if}
			{/each}
		</div>
	{:else if block.type === 'buttons'}
		<div class="flex flex-wrap gap-2">
			{#each block.buttons ?? [] as button}
				<span class="rounded px-3 py-1 text-sm font-medium {buttonClass(button)}">
					{buttonEmoji(button)}
					{buttonLabel(button)}
				</span>
			{/each}
		</div>
	{:else if block.type === 'select'}
		<div
			class="rounded bg-gray-200 px-3 py-2 text-sm text-gray-600 dark:bg-slate-700 dark:text-slate-300"
		>
			{substitute(block.placeholder || 'Select a category')}
			<i class="fa-solid fa-angle-down float-right"></i>
		</div>
	{:else if block.type === 'footer'}
		<!--
			Nothing at all when there is no footer, because that is what the message
			will contain: the bot returns no component for an unset footer. The block
			stays in the editor column either way, so it is still configurable.
			It renders as `-# <footer>` there, which is markdown, so it gets `md()`.
		-->
		{#if footer}
			<!-- Escaped by renderMarkdown before parsing; see $lib/markdown.js. -->
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<p class="text-xs text-gray-500 dark:text-slate-400">{@html md(footer)}</p>
		{/if}
	{:else if block.type === 'mentions'}
		<p class="text-sm">
			<span class="rounded bg-blurple/20 px-1 text-blurple">@staff</span>
			<span class="rounded bg-blurple/20 px-1 text-blurple">@you</span> has created a new ticket
		</p>
	{:else if block.type === 'answers'}
		<div class="text-sm">
			<p class="font-semibold">Topic</p>
			<p class="text-gray-600 dark:text-slate-300">The member's answers appear here.</p>
		</div>
	{:else if block.type === 'controls'}
		<div class="flex flex-wrap gap-2">
			<span class="rounded bg-gray-500 px-3 py-1 text-sm font-medium text-white">✏️ Edit</span>
			<span class="rounded bg-gray-500 px-3 py-1 text-sm font-medium text-white">🙌 Claim</span>
			<span class="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white">✖️ Close</span>
		</div>
		{#if (block.buttons ?? []).length}
			<div class="mt-1 flex flex-wrap gap-2">
				{#each block.buttons as button}
					<span class="rounded px-3 py-1 text-sm font-medium {buttonClass(button)}">
						{buttonEmoji(button)}
						{buttonLabel(button)}
					</span>
				{/each}
			</div>
		{/if}
	{/if}
{/snippet}

<div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
	<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
		<h2 class="font-medium">Preview</h2>
		<span
			class="text-xs {overBudget
				? 'font-semibold text-red-500'
				: 'text-gray-500 dark:text-slate-400'}"
		>
			{components}/{LIMITS.components} components &middot; {characters}/{LIMITS.text} characters
		</span>
	</div>

	{#if overBudget}
		<p class="mb-3 rounded-lg border-2 border-red-500 bg-red-500/10 p-2 text-sm text-red-600">
			This layout is over Discord's limits and will be rejected when you save.
		</p>
	{/if}

	<div class="flex flex-col gap-2 rounded-lg bg-gray-50 p-3 dark:bg-slate-800">
		{#each layout?.blocks ?? [] as block (block.id)}
			{#if block.type === 'container'}
				<div
					class="rounded-r-lg bg-white p-3 dark:bg-slate-900"
					style="border-left: 4px solid {block.accentColour ?? primaryColour}"
				>
					<div class="flex flex-col gap-2">
						{#each block.blocks ?? [] as child (child.id)}
							{@render blockPreview(child)}
						{/each}
					</div>
				</div>
			{:else}
				{@render blockPreview(block)}
			{/if}
		{/each}

		{#if (layout?.blocks ?? []).length === 0}
			<p class="text-sm text-gray-500 dark:text-slate-400">Nothing to preview yet.</p>
		{/if}
	</div>

	<p class="mt-2 text-xs text-gray-500 dark:text-slate-400">
		An approximation — {context === 'opening'
			? 'mentions, answers and controls are filled in per ticket'
			: context === 'closeRequest'
				? 'the Accept and Reject buttons are added by the bot and are not shown here'
				: 'Discord renders spacing and colours slightly differently'}.
	</p>
</div>
