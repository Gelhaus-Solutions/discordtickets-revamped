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
	 * **The panel is in the top layer, via `showPopover()`.** `position: fixed`
	 * alone was not enough. It escapes ordinary clipping, but not an ancestor with
	 * a `transform` (which makes a fixed element position against *it* instead of
	 * the viewport — `transition:fly` on the layout modal is one), and not a
	 * stacking context above `z-50`, which the Svelte Flow canvas hands out
	 * freely. Both left the panel drawn in the wrong place or half behind
	 * something. The top layer has neither problem, and no id is needed if the
	 * popover is shown imperatively — which is what kept the hydration mismatch
	 * away last time.
	 *
	 * **It follows its field.** The position was worked out once, on open, so
	 * scrolling the modal or the settings page slid the field out from under a
	 * panel that stayed exactly where it was. Scroll is listened for in the
	 * capture phase because the thing that scrolls is usually the modal card, and
	 * its scroll event never reaches the window.
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
	/** Below this there is no point opening on that side; two entries and a search box. */
	const MIN_HEIGHT = 180;
	const GAP = 8;

	let search = $state('');
	let open = $state(false);
	let trigger = $state();
	let panel = $state();
	let position = $state({
		height: MAX_HEIGHT,
		left: 0,
		top: 0
	});

	const groups = $derived(groupsFor(catalogue, context));

	/**
	 * Put the panel beside its button, in whichever direction it fits.
	 *
	 * The height is what the space allows rather than a constant: a field near the
	 * bottom of a modal used to get the full-height panel shoved upwards over the
	 * content above it, or hung off the bottom of the window with its last
	 * entries unreachable — a fixed panel does not scroll with anything.
	 */
	const place = () => {
		if (!trigger) return;
		const rect = trigger.getBoundingClientRect();
		const below = window.innerHeight - rect.bottom - GAP * 2;
		const above = rect.top - GAP * 2;
		// Upwards only when it genuinely helps: a cramped space below *and* more
		// room above. Downwards is where a menu is expected to go.
		const upwards = below < MIN_HEIGHT && above > below;
		const height = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, upwards ? above : below));

		// Both sides cramped — a window barely taller than the panel — so it is
		// pulled back inside rather than hung off an edge with entries nobody can
		// reach. It is only ever `MIN_HEIGHT` tall by then, so it covers little.
		const top = upwards
			? rect.top - GAP / 2 - height
			: Math.min(rect.bottom + GAP / 2, window.innerHeight - height - GAP);

		position = {
			height,
			left: Math.max(GAP, Math.min(rect.left, window.innerWidth - WIDTH - GAP)),
			top: Math.max(GAP, top)
		};
	};

	const toggle = () => {
		if (open) {
			open = false;
			return;
		}
		place();
		search = '';
		open = true;
	};

	$effect(() => {
		if (!open || !panel) return;

		// Not `popover="auto"`: its light dismiss would close the panel on the same
		// click that opens it, and outside clicks are handled below anyway.
		// Showing one that is already shown throws, and a browser without the API
		// leaves it as the plain fixed panel it used to be.
		try {
			if (!panel.matches(':popover-open')) panel.showPopover?.();
		} catch {
			// Not supported here; the `fixed` positioning below still stands.
		}
		// Again now that it has been laid out, since a popover leaves the flow and
		// the trigger may have shifted a pixel or two in doing so.
		place();

		const reposition = () => place();
		document.addEventListener('scroll', reposition, true);
		window.addEventListener('resize', reposition);
		return () => {
			document.removeEventListener('scroll', reposition, true);
			window.removeEventListener('resize', reposition);
		};
	});

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
	<!--
		`inset: auto` and `margin: 0` undo the user-agent rules for `[popover]`,
		which centres it in the viewport; everything after them is this component's
		own placement. The height is a `max-height` so a short list still draws a
		short panel.
	-->
	<div
		bind:this={panel}
		popover="manual"
		class="fixed z-50 flex w-80 flex-col overflow-hidden rounded-xl border-0 bg-white p-2 text-slate-800 shadow-lg dark:bg-slate-700 dark:text-slate-300"
		style="inset: auto; margin: 0; left: {position.left}px; top: {position.top}px; max-height: {position.height}px"
	>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			type="text"
			class="input form-input mb-2 shrink-0 text-sm"
			placeholder="Search placeholders…"
			autofocus
			bind:value={search}
		/>

		<div class="min-h-0 flex-1 overflow-y-auto">
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
