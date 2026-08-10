<script>
	import { placeholders, groupsFor, insertAtCaret, noteFor } from '$lib/placeholders.js';

	/**
	 * The `{}` button that sits beside every placeholder-accepting field.
	 *
	 * There is no reference page. A list of every placeholder in the product,
	 * somewhere else, is a list nobody reads while typing into a field — so this
	 * shows the ones that work *here*, greys out the ones that do not with the
	 * reason, and inserts at the caret.
	 *
	 * Uses the native `popover` attribute rather than absolute positioning like
	 * `EmojiPicker`. That puts the panel in the browser's top layer, so it is not
	 * clipped by the nested cards on the category page, the block editor's rows,
	 * or the 20rem Svelte Flow inspector column — three places an absolutely
	 * positioned panel would be cut in half.
	 *
	 * @typedef {Object} Props
	 * @property {HTMLElement} target the input or textarea to insert into
	 * @property {string} context one of the ids in the catalogue
	 */

	/** @type {Props} */
	let { target, context = 'opening' } = $props();

	const catalogue = placeholders();

	let search = $state('');
	let popover = $state();
	let trigger = $state();

	const id = `ph-${Math.random().toString(36).slice(2, 9)}`;

	/**
	 * Put the panel under the button that opened it.
	 *
	 * The top layer inherits no positioning, so a popover defaults to the middle
	 * of the viewport. CSS anchor positioning would say this declaratively but is
	 * not in every browser this dashboard supports, and a picker that lands in
	 * the centre of the screen reads as broken.
	 */
	const place = () => {
		if (!trigger || !popover) return;
		const rect = trigger.getBoundingClientRect();
		const width = 320;
		popover.style.top = `${Math.min(rect.bottom + 4, window.innerHeight - 320)}px`;
		popover.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
	};

	const groups = $derived(groupsFor(catalogue, context));

	const filter = (list) => {
		const query = search.trim().toLowerCase();
		if (!query) return list;
		return list.filter(
			(p) =>
				p.token.toLowerCase().includes(query) ||
				p.label.toLowerCase().includes(query) ||
				(p.aliases ?? []).some((a) => a.toLowerCase().includes(query))
		);
	};

	const insert = (token) => {
		insertAtCaret(target, `{${token}}`);
		popover?.hidePopover();
		search = '';
	};
</script>

<button
	bind:this={trigger}
	type="button"
	class="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-600 transition duration-200 hover:bg-blurple hover:text-white dark:bg-slate-800 dark:text-slate-400"
	title="Insert a placeholder"
	popovertarget={id}
	onclick={place}
>
	&lbrace;&rbrace;
</button>

<div
	bind:this={popover}
	{id}
	popover="auto"
	class="fixed m-0 w-80 rounded-xl bg-white p-2 text-slate-800 shadow-lg dark:bg-slate-700 dark:text-slate-300"
>
	<!-- svelte-ignore a11y_autofocus -->
	<input
		type="text"
		class="input form-input mb-2 text-sm"
		placeholder="Search placeholders…"
		autofocus
		bind:value={search}
	/>

	<div class="max-h-72 overflow-y-auto">
		{#each filter(groups.available) as placeholder (placeholder.token)}
			<button
				type="button"
				class="block w-full rounded p-1.5 text-left transition duration-150 hover:bg-gray-100 dark:hover:bg-slate-600"
				onclick={() => insert(placeholder.token)}
			>
				<span class="font-mono text-sm text-blurple">&lbrace;{placeholder.token}&rbrace;</span>
				<span class="ml-1 text-sm font-medium">{placeholder.label}</span>
				<span class="block text-xs text-gray-500 dark:text-slate-400">
					{noteFor(placeholder, context)}
				</span>
			</button>
		{/each}

		{#if filter(groups.available).length === 0}
			<p class="p-2 text-sm text-gray-500 dark:text-slate-400">
				Nothing matches “{search}”.
			</p>
		{/if}

		{#if filter(groups.unavailable).length}
			<p class="mt-2 border-t border-gray-200 pt-2 text-xs font-semibold uppercase text-gray-500 dark:border-slate-600 dark:text-slate-400">
				Not available here
			</p>
			{#each filter(groups.unavailable) as placeholder (placeholder.token)}
				<div class="p-1.5 opacity-50">
					<span class="font-mono text-sm">&lbrace;{placeholder.token}&rbrace;</span>
					<span class="ml-1 text-sm font-medium">{placeholder.label}</span>
					<span class="block text-xs">{placeholder.description}</span>
				</div>
			{/each}
		{/if}
	</div>
</div>
