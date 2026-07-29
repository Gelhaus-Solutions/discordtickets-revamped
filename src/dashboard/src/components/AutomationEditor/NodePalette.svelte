<script>
	import { CATEGORY_META, CATEGORY_ORDER, iconFor } from './nodes.js';
	import { editorState } from './editorState.svelte.js';

	/** Entirely catalogue-driven, so a new node type needs no change here. */
	let { onadd } = $props();

	const editor = editorState();
	let search = $state('');

	const grouped = $derived.by(() => {
		const types = editor.catalogue?.types ?? [];
		const needle = search.trim().toLowerCase();
		return CATEGORY_ORDER.map((category) => ({
			category,
			items: types
				.filter((t) => t.category === category)
				.filter(
					(t) =>
						!needle ||
						t.label.toLowerCase().includes(needle) ||
						t.description.toLowerCase().includes(needle)
				)
				.sort((a, b) => a.label.localeCompare(b.label))
		})).filter((group) => group.items.length > 0);
	});
</script>

<div class="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-700">
	<input
		type="search"
		class="input form-input text-sm"
		placeholder="Search steps…"
		bind:value={search}
	/>

	<div class="mt-3 flex max-h-[60vh] flex-col gap-4 overflow-y-auto">
		{#each grouped as group (group.category)}
			{@const skin = CATEGORY_META[group.category]}
			<div>
				<p class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">
					{skin.label}
				</p>
				<div class="flex flex-col gap-1">
					{#each group.items as item (item.type)}
						<button
							type="button"
							title={item.description}
							class="flex items-start gap-2 rounded-lg p-2 text-left transition duration-200 hover:bg-gray-100 dark:hover:bg-slate-800"
							onclick={() => onadd(item.type)}
						>
							<i class="fa-solid {iconFor(item.type)} mt-0.5 {skin.icon}"></i>
							<span class="min-w-0">
								<span class="block truncate text-sm font-medium">{item.label}</span>
								<span class="block truncate text-xs text-gray-500 dark:text-slate-400">
									{item.description}
								</span>
							</span>
						</button>
					{/each}
				</div>
			</div>
		{/each}

		{#if grouped.length === 0}
			<p class="text-sm text-gray-500 dark:text-slate-400">Nothing matches that.</p>
		{/if}
	</div>
</div>
