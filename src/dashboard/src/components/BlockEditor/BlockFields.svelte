<script>
	import ButtonList from './ButtonList.svelte';
	import { BLOCK_META, BUTTON_KINDS, LIMITS } from './blocks.js';

	/**
	 * The editable fields for a single block. Container children are rendered by
	 * BlockEditor itself (which recurses), so this deliberately handles
	 * everything *except* a container's child list.
	 *
	 * @typedef {Object} Props
	 * @property {any} block
	 * @property {any[]} categories
	 * @property {string} context
	 * @property {any[]} [automations] automations a button press can start
	 * @property {any[]} [nodeTargets] button triggers in the automation being edited
	 */

	/** @type {Props} */
	let {
		block = $bindable(),
		categories,
		context,
		automations = [],
		nodeTargets = []
	} = $props();

	const kinds = $derived(BUTTON_KINDS[context] ?? BUTTON_KINDS.panel);

	// Blocks saved before automation buttons existed have no `buttons` list at
	// all; ButtonList reads through a fallback and writes one back when needed.

	const addGalleryItem = () => {
		if (block.items.length >= LIMITS.galleryItems) return;
		block.items = [...block.items, { url: '', description: '' }];
	};

	const addSectionLine = () => {
		if (block.text.length >= LIMITS.sectionText) return;
		block.text = [...block.text, ''];
	};

	const setAccessoryKind = (kind) => {
		block.accessory =
			kind === 'thumbnail'
				? { kind: 'thumbnail', url: '', description: '' }
				: { kind: 'button', button: { kind: 'ticket', categoryId: null, label: null, emoji: null, style: null } };
	};
</script>

{#if block.type === 'controls'}
	<p class="text-sm text-gray-500 dark:text-slate-400">
		The Claim, Close and Edit buttons are filled in per ticket, from your category and server
		settings. You can add your own buttons here — each one starts an automation, and they appear
		in a row underneath.
	</p>
	<div class="mt-2">
		<ButtonList
			bind:buttons={block.buttons}
			{categories}
			{automations}
			{nodeTargets}
			{context}
			kinds={['automation']}
		/>
	</div>
{:else if BLOCK_META[block.type]?.dynamic}
	<p class="text-sm text-gray-500 dark:text-slate-400">
		{BLOCK_META[block.type].description} Filled in automatically for each ticket — nothing to configure.
	</p>
{:else if block.type === 'text'}
	<label class="text-sm">
		<span class="font-medium">Text</span>
		<textarea
			class="input form-input h-24 text-sm"
			maxlength={LIMITS.text}
			placeholder="Markdown is supported."
			bind:value={block.content}
		></textarea>
	</label>
{:else if block.type === 'separator'}
	<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
		<label class="text-sm">
			<span class="font-medium">Style</span>
			<select
				class="input form-multiselect text-sm"
				value={block.divider === false ? 'space' : 'line'}
				onchange={(e) => (block.divider = e.currentTarget.value === 'line')}
			>
				<option value="line">Divider line</option>
				<option value="space">Blank space</option>
			</select>
		</label>
		<label class="text-sm">
			<span class="font-medium">Size</span>
			<select class="input form-multiselect text-sm" bind:value={block.spacing}>
				<option value="small">Small</option>
				<option value="large">Large</option>
			</select>
		</label>
	</div>
{:else if block.type === 'buttons'}
	<ButtonList
		bind:buttons={block.buttons}
		{categories}
		{automations}
		{nodeTargets}
		{context}
		{kinds}
	/>
{:else if block.type === 'select'}
	<div class="flex flex-col gap-2">
		<label class="text-sm">
			<span class="font-medium">Placeholder</span>
			<input
				type="text"
				class="input form-input text-sm"
				placeholder="Select a category"
				value={block.placeholder ?? ''}
				oninput={(e) => (block.placeholder = e.currentTarget.value || null)}
			/>
		</label>
		<label class="text-sm">
			<span class="font-medium">Categories</span>
			<select
				class="input form-multiselect text-sm"
				value={block.categoryIds === null ? 'all' : 'some'}
				onchange={(e) =>
					(block.categoryIds = e.currentTarget.value === 'all' ? null : categories.map((c) => c.id))}
			>
				<option value="all">All categories</option>
				<option value="some">Choose specific categories</option>
			</select>
		</label>
		{#if block.categoryIds !== null}
			<div class="flex flex-wrap gap-2">
				{#each categories as category}
					<label class="flex items-center gap-1 text-sm">
						<input
							type="checkbox"
							class="form-checkbox rounded"
							checked={block.categoryIds.includes(category.id)}
							onchange={(e) =>
								(block.categoryIds = e.currentTarget.checked
									? [...block.categoryIds, category.id]
									: block.categoryIds.filter((id) => id !== category.id))}
						/>
						{category.name}
					</label>
				{/each}
			</div>
		{/if}
	</div>
{:else if block.type === 'gallery'}
	<div class="flex flex-col gap-2">
		{#each block.items as item, i}
			<div class="flex items-center gap-2">
				<input
					type="url"
					class="input form-input text-sm"
					placeholder="https://example.com/image.png"
					bind:value={item.url}
				/>
				<button
					type="button"
					class="text-red-400 transition duration-300 hover:text-red-600"
					title="Remove image"
					onclick={() => (block.items = block.items.filter((_, j) => j !== i))}
				>
					<i class="fa-solid fa-xmark"></i>
				</button>
			</div>
		{/each}
		{#if block.items.length < LIMITS.galleryItems}
			<button
				type="button"
				class="self-start rounded-lg bg-gray-200 px-3 py-1 text-sm font-medium transition duration-300 hover:bg-blurple hover:text-white dark:bg-slate-700"
				onclick={addGalleryItem}
			>
				<i class="fa-solid fa-plus"></i> Add image
			</button>
		{/if}
	</div>
{:else if block.type === 'section'}
	<div class="flex flex-col gap-2">
		{#each block.text as _, i}
			<textarea class="input form-input h-16 text-sm" bind:value={block.text[i]}></textarea>
		{/each}
		{#if block.text.length < LIMITS.sectionText}
			<button
				type="button"
				class="self-start rounded-lg bg-gray-200 px-3 py-1 text-sm font-medium transition duration-300 hover:bg-blurple hover:text-white dark:bg-slate-700"
				onclick={addSectionLine}
			>
				<i class="fa-solid fa-plus"></i> Add line
			</button>
		{/if}

		<label class="text-sm">
			<span class="font-medium">Accessory</span>
			<select
				class="input form-multiselect text-sm"
				value={block.accessory?.kind ?? 'thumbnail'}
				onchange={(e) => setAccessoryKind(e.currentTarget.value)}
			>
				<option value="thumbnail">Image</option>
				<option value="button">Button</option>
			</select>
		</label>

		{#if block.accessory?.kind === 'thumbnail'}
			<input
				type="url"
				class="input form-input text-sm"
				placeholder="https://example.com/image.png"
				bind:value={block.accessory.url}
			/>
			{#if context === 'opening'}
				<p class="text-xs text-gray-500 dark:text-slate-400">
					Tip: use <code>{'{avatar}'}</code> to show the ticket creator's avatar.
				</p>
			{/if}
		{:else if block.accessory?.kind === 'button'}
			<ButtonList
				buttons={[block.accessory.button]}
				{categories}
				{automations}
				{nodeTargets}
				{context}
				{kinds}
				fixed={true}
			/>
		{/if}
	</div>
{:else if block.type === 'footer'}
	<p class="text-sm text-gray-500 dark:text-slate-400">
		Shows your server's footer text (set in General settings) in small print.
	</p>
{/if}
