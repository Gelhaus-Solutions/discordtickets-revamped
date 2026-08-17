<script>
	import { onMount } from 'svelte';
	import Sortable from 'sortablejs';
	import BlockFields from './BlockFields.svelte';
	import BlockEditor from './BlockEditor.svelte';
	import { BLOCK_META, BLOCK_TYPES, LIMITS, newBlock } from './blocks.js';

	/**
	 * A drag-and-drop editor for a list of Components v2 blocks. Recurses into
	 * containers, which is why it imports itself.
	 *
	 * @typedef {Object} Props
	 * @property {any[]} blocks
	 * @property {any[]} categories
	 * @property {any[]} [automations] automations a button press can start
	 * @property {string} [context] one of the five kinds in blocks.js#BLOCK_TYPES
	 * @property {any[]} [nodeTargets] `{id, label}` button triggers in the
	 *   automation being edited, which a button here may continue
	 * @property {boolean} [nested] true inside a container (no further nesting)
	 */

	/** @type {Props} */
	let {
		blocks = $bindable(),
		categories,
		automations = [],
		context = 'panel',
		nodeTargets = [],
		nested = false
	} = $props();

	let list = $state();
	let expanded = $state(null);
	let adding = $state(false);

	// Containers cannot nest. That is the *only* nesting rule — `validateBlock` in
	// src/lib/components-v2.js rejects `nested_container` and nothing else.
	//
	// The dynamic blocks (answers, mentions, controls) used to be filtered out in
	// here too, on the theory that they only make sense once, at the top level.
	// Both halves of that were wrong. Nothing enforces "once" anywhere, in here or
	// on the server, so two Answers blocks side by side have always been one click
	// away. And `defaultOpeningLayout` puts `answers` *inside* the container it
	// seeds, so the rule contradicted the layout this editor ships with: a category
	// built by the seeder showed an Answers block in its container that could not be
	// put back once removed, on that category or any other.
	const addable = $derived(
		BLOCK_TYPES[context].filter((type) => !(nested && type === 'container'))
	);

	const atLimit = $derived(!nested && blocks.length >= LIMITS.topBlocks);

	onMount(() => {
		// Same configuration as CategoryQuestions/Questions.svelte, so dragging
		// feels identical across the dashboard.
		Sortable.create(list, {
			animation: 300,
			handle: '.handle',
			dragClass: 'dragged',
			swapThreshold: 0.5,
			dataIdAttr: 'data-id',
			store: {
				get: () => blocks.map((b) => b.id),
				set: (sortable) => {
					const order = sortable.toArray();
					blocks = order.map((id) => blocks.find((b) => b.id === id)).filter(Boolean);
				}
			}
		});
	});

	const add = (type) => {
		// Keep hold of the block rather than reading it back out of `blocks`. Inside
		// a container `blocks` is a bindable prop two hops from the state it writes
		// to, and on an empty list a read-back that has not landed yet makes
		// `blocks[-1].id` a TypeError — thrown after `adding` is already false, so
		// the picker closes and nothing appears.
		const block = newBlock(type);
		blocks = [...blocks, block];
		adding = false;
		expanded = block.id;
	};

	const remove = (id) => {
		blocks = blocks.filter((b) => b.id !== id);
	};

	/** A one-line summary so a collapsed block is still identifiable. */
	const summarise = (block) => {
		switch (block.type) {
			case 'text':
				return block.content?.slice(0, 60) || 'Empty';
			case 'section':
				return block.text?.[0]?.slice(0, 60) || 'Empty';
			case 'buttons':
				return `${block.buttons?.length ?? 0} button${block.buttons?.length === 1 ? '' : 's'}`;
			case 'gallery':
				return `${block.items?.length ?? 0} image${block.items?.length === 1 ? '' : 's'}`;
			case 'container':
				return `${block.blocks?.length ?? 0} block${block.blocks?.length === 1 ? '' : 's'} inside`;
			case 'select':
				return block.categoryIds === null ? 'All categories' : `${block.categoryIds.length} categories`;
			default:
				return BLOCK_META[block.type]?.description ?? '';
		}
	};
</script>

<div bind:this={list} class="flex flex-col gap-2">
	{#each blocks as block, i (block.id)}
		<div
			data-id={block.id}
			class="rounded-xl bg-gray-100/50 p-3 dark:bg-slate-800/50"
		>
			<div class="flex items-center gap-2 md:gap-3">
				<i class="handle fa-solid fa-grip-vertical cursor-move text-gray-500 dark:text-slate-400"></i>
				<i class="fa-solid {BLOCK_META[block.type]?.icon ?? 'fa-cube'} text-gray-500 dark:text-slate-400"></i>

				<button
					type="button"
					class="flex min-w-0 flex-1 items-baseline gap-2 text-left"
					onclick={() => (expanded = expanded === block.id ? null : block.id)}
				>
					<span class="font-medium">{BLOCK_META[block.type]?.label ?? block.type}</span>
					<span class="truncate text-sm text-gray-500 dark:text-slate-400">{summarise(block)}</span>
				</button>

				<button
					type="button"
					class="text-red-300 transition duration-300 hover:text-red-500 dark:text-red-500/50 dark:hover:text-red-500"
					title="Remove block"
					onclick={() => remove(block.id)}
				>
					<i class="fa-solid fa-xmark"></i>
				</button>

				<button
					type="button"
					class="text-gray-500 transition duration-300 hover:text-blurple dark:text-slate-400"
					title={expanded === block.id ? 'Collapse' : 'Expand'}
					onclick={() => (expanded = expanded === block.id ? null : block.id)}
				>
					<i class="fa-solid {expanded === block.id ? 'fa-angle-up' : 'fa-angle-down'}"></i>
				</button>
			</div>

			{#if expanded === block.id}
				<div class="mt-3 flex flex-col gap-3 border-t border-gray-200 pt-3 dark:border-slate-700">
					{#if block.type === 'container'}
						<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<label class="text-sm">
								<span class="font-medium">Accent colour</span>
								<div class="flex items-center gap-2">
									<input
										type="color"
										class="h-9 w-12 rounded border-0 bg-transparent p-0"
										value={block.accentColour ?? '#009999'}
										oninput={(e) => (block.accentColour = e.currentTarget.value)}
									/>
									<button
										type="button"
										class="text-sm text-gray-500 underline dark:text-slate-400"
										onclick={() => (block.accentColour = null)}
									>
										Use server colour
									</button>
								</div>
							</label>
							<label class="flex items-end gap-2 text-sm">
								<input type="checkbox" class="form-checkbox rounded" bind:checked={block.spoiler} />
								<span class="font-medium">Hide behind a spoiler</span>
							</label>
						</div>

						<div class="rounded-lg border border-dashed border-gray-300 p-2 dark:border-slate-600">
							<BlockEditor
								bind:blocks={blocks[i].blocks}
								{categories}
								{automations}
								{context}
								{nodeTargets}
								nested={true}
							/>
						</div>
					{:else}
						<BlockFields
							bind:block={blocks[i]}
							{categories}
							{automations}
							{context}
							{nodeTargets}
						/>
					{/if}
				</div>
			{/if}
		</div>
	{/each}
</div>

{#if blocks.length === 0}
	{#if nested}
		<!-- The server refuses to save this ('A container needs at least one block'),
		     so say so here rather than letting Save be the one to mention it. -->
		<p class="py-2 text-sm text-red-500">
			<i class="fa-solid fa-triangle-exclamation"></i>
			A container needs at least one block — add one below, or remove the container.
		</p>
	{:else}
		<p class="py-2 text-sm text-gray-500 dark:text-slate-400">No blocks yet — add one below.</p>
	{/if}
{/if}

<div class="mt-2">
	{#if adding}
		<div class="grid grid-cols-1 gap-2 rounded-xl bg-gray-100/50 p-3 sm:grid-cols-2 dark:bg-slate-800/50">
			{#each addable as type}
				<button
					type="button"
					class="flex items-start gap-2 rounded-lg p-2 text-left transition duration-300 hover:bg-blurple hover:text-white"
					onclick={() => add(type)}
				>
					<i class="fa-solid {BLOCK_META[type].icon} mt-1"></i>
					<span>
						<span class="block font-medium">{BLOCK_META[type].label}</span>
						<span class="block text-xs opacity-80">{BLOCK_META[type].description}</span>
					</span>
				</button>
			{/each}
			<button
				type="button"
				class="col-span-full text-sm text-gray-500 underline dark:text-slate-400"
				onclick={() => (adding = false)}
			>
				Cancel
			</button>
		</div>
	{:else}
		<button
			type="button"
			disabled={atLimit}
			class="rounded-lg bg-gray-200 px-3 py-2 font-medium transition duration-300 hover:bg-blurple hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700"
			onclick={() => (adding = true)}
		>
			<i class="fa-solid fa-plus"></i> Add block
		</button>
		{#if atLimit}
			<span class="ml-2 text-xs text-gray-500 dark:text-slate-400">
				Maximum {LIMITS.topBlocks} top-level blocks.
			</span>
		{/if}
	{/if}
</div>
