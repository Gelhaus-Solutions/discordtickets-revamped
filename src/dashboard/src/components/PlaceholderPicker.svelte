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
	 * ## Two things worth keeping
	 *
	 * **Nothing is rendered until it is opened.** The first version left the panel
	 * in the markup, hidden by the native `popover` attribute and keyed by a
	 * `Math.random()` id — a value that differs between the server render and
	 * hydration. Emitting nothing until a click costs less and cannot diverge.
	 *
	 * **The panel is `fixed`, not `absolute`.** It has to escape the nested cards
	 * on the category page, the block editor's rows and the 20rem Svelte Flow
	 * inspector column, any of which would clip an absolutely positioned panel.
	 *
	 * @typedef {Object} Props
	 * @property {HTMLElement} target the input or textarea to insert into
	 * @property {string} context one of the ids in the catalogue
	 */

	/** @type {Props} */
	let { target, context = 'opening' } = $props();

	const catalogue = placeholders();

	const WIDTH = 320;
	const MAX_HEIGHT = 360;

	let search = $state('');
	let open = $state(false);
	let trigger = $state();
	let panel = $state();
	let position = $state({ left: 0, top: 0 });

	const groups = $derived(groupsFor(catalogue, context));

	/** Put the panel under the button, kept inside the viewport on both axes. */
	const toggle = () => {
		if (open) {
			open = false;
			return;
		}
		const rect = trigger.getBoundingClientRect();
		position = {
			left: Math.max(8, Math.min(rect.left, window.innerWidth - WIDTH - 8)),
			top: Math.max(8, Math.min(rect.bottom + 4, window.innerHeight - MAX_HEIGHT - 8))
		};
		search = '';
		open = true;
	};

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
		open = false;
	};

	const onWindowClick = (event) => {
		if (!open) return;
		if (trigger?.contains(event.target) || panel?.contains(event.target)) return;
		open = false;
	};
</script>

<svelte:window onclick={onWindowClick} onkeydown={(e) => e.key === 'Escape' && (open = false)} />

<button
	bind:this={trigger}
	type="button"
	class="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-600 transition duration-200 hover:bg-blurple hover:text-white dark:bg-slate-800 dark:text-slate-400"
	title="Insert a placeholder"
	onclick={toggle}
>
	&lbrace;&rbrace;
</button>

{#if open}
	<div
		bind:this={panel}
		class="fixed z-50 w-80 rounded-xl bg-white p-2 text-slate-800 shadow-lg dark:bg-slate-700 dark:text-slate-300"
		style="left: {position.left}px; top: {position.top}px"
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
				<p class="p-2 text-sm text-gray-500 dark:text-slate-400">Nothing matches “{search}”.</p>
			{/if}

			{#if filter(groups.unavailable).length}
				<p
					class="mt-2 border-t border-gray-200 pt-2 text-xs font-semibold uppercase text-gray-500 dark:border-slate-600 dark:text-slate-400"
				>
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
{/if}
