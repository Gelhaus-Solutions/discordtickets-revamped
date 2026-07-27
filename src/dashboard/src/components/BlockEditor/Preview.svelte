<script>
	import { marked } from 'marked';
	import emoji from 'emoji-name-map';
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
	 */

	/** @type {Props} */
	let { layout, categories, context = 'panel', primaryColour = '#009999', footer = '' } = $props();

	const components = $derived(countComponents(layout));
	const characters = $derived(countText(layout));
	const overBudget = $derived(components > LIMITS.components || characters > LIMITS.text);

	/** The same substitutions the bot applies, so the preview stays honest. */
	const substitute = (str) =>
		(str ?? '')
			.replace(/{+\s?(user)?name\s?}+/gi, '@you')
			.replace(/{+\s?(nick|display)name\s?}+/gi, 'You')
			.replace(/{+\s?num(ber)?\s?}+/gi, '1')
			.replace(/{+\s?avgResponseTime\s?}+/gi, '5 minutes')
			.replace(/{+\s?avgResolutionTime\s?}+/gi, '2 hours')
			.replace(/{+\s?avgRating\s?}+/gi, '4.8');

	const md = (str) => marked.parse(substitute(str ?? ''), { breaks: true });

	const previewUrl = (url) => {
		const resolved = substitute(url ?? '');
		return /^https?:\/\//i.test(resolved) ? resolved : null;
	};

	const categoryName = (id) => categories.find((c) => c.id === id)?.name ?? 'Unknown category';
	const categoryEmoji = (id) => {
		const raw = categories.find((c) => c.id === id)?.emoji;
		if (!raw) return '';
		return emoji.get(raw) ?? (/^\d{17,20}$/.test(raw) ? '' : raw);
	};

	const buttonLabel = (button) =>
		button.kind === 'link'
			? button.label || 'Link'
			: button.label || categoryName(button.categoryId);

	const buttonEmoji = (button) =>
		button.emoji || (button.kind === 'ticket' ? categoryEmoji(button.categoryId) : '');

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
			{block.placeholder || 'Select a category'}
			<i class="fa-solid fa-angle-down float-right"></i>
		</div>
	{:else if block.type === 'footer'}
		<p class="text-xs text-gray-500 dark:text-slate-400">{footer || 'No footer set'}</p>
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
			: 'Discord renders spacing and colours slightly differently'}.
	</p>
</div>
