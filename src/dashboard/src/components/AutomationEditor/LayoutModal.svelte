<script>
	import { untrack } from 'svelte';
	import { fly } from 'svelte/transition';
	import { onBeforeClose } from 'svelte-modals';
	import BlockEditor from '$components/BlockEditor/BlockEditor.svelte';
	import Preview from '$components/BlockEditor/Preview.svelte';
	import { defaultMessageLayout } from '$components/BlockEditor/blocks.js';
	import { setPlaceholders } from '$lib/placeholders.js';

	/**
	 * The block editor for one `action.message.*` node, in a modal.
	 *
	 * The Inspector column is 20rem wide; a BlockEditor with drag handles, nested
	 * containers and a preview is unusable at that width, so it gets the width of
	 * the page instead.
	 *
	 * **Everything arrives as a prop.** `modals.open` renders this outside the
	 * AutomationEditor's component tree, so `editorState()` and
	 * `useSvelteFlow()` are not reachable from in here — reaching for either is
	 * the mistake this comment exists to prevent.
	 *
	 * Edits go to a deep clone and are only handed back on Save. That is what
	 * makes Cancel mean something, and it also sidesteps Svelte Flow's
	 * `$state.raw`: a deep mutation of a node's params is never observed, so the
	 * commit has to replace the params object through the store's own updater,
	 * which is what `onsave` does.
	 *
	 * @typedef {Object} Props
	 * @property {boolean} isOpen
	 * @property {() => void} close
	 * @property {any} layout the layout as stored
	 * @property {string} context one of the five kinds in blocks.js#BLOCK_TYPES
	 * @property {string} title the node's label, for the heading
	 * @property {any[]} categories
	 * @property {any[]} automations automations a button press can start
	 * @property {any[]} nodeTargets button triggers in the automation being edited
	 * @property {any} catalogue the placeholder catalogue, re-provided below
	 * @property {string} [primaryColour]
	 * @property {string} [footer]
	 * @property {(layout: any) => void} onsave
	 */

	/** @type {Props} */
	let {
		isOpen,
		close,
		layout,
		context,
		title,
		categories = [],
		automations = [],
		nodeTargets = [],
		catalogue = null,
		primaryColour = '#009999',
		footer = '',
		onsave
	} = $props();

	// `svelte-modals` renders this from `settings/+layout.svelte`, which is a
	// *parent* of the guild layout that provides the catalogue — so the context
	// set there does not reach in here, and the picker and preview inside would
	// silently come up empty. Re-provide it for this subtree.
	setPlaceholders(untrack(() => catalogue));

	// A clone, so Cancel really discards and Save really commits. Snapshotting
	// the prop once is the entire point — the draft must not track the original.
	// svelte-ignore state_referenced_locally
	let draft = $state(
		structuredClone($state.snapshot(layout)) ?? defaultMessageLayout()
	);
	let dirty = $state(false);
	const snapshot = JSON.stringify(draft);

	$effect(() => {
		dirty = JSON.stringify(draft) !== snapshot;
	});

	onBeforeClose(() => !dirty || confirm('Discard your changes to this message?'));

	const save = () => {
		dirty = false;
		onsave(structuredClone($state.snapshot(draft)));
		close();
	};
</script>

{#if isOpen}
	<div
		role="dialog"
		class="modal mx-auto my-4 max-w-4xl sm:my-12"
		transition:fly|global={{ y: 50 }}
	>
		<div
			class="pointer-events-auto max-h-[85dvh] w-full overflow-y-auto rounded-xl bg-white p-4 text-slate-800 shadow-sm dark:bg-slate-700 dark:text-slate-300"
		>
			<div class="mb-3 flex items-center justify-between gap-3">
				<h2 class="text-xl font-bold">{title}</h2>
				<button
					type="button"
					class="text-gray-500 transition duration-300 hover:text-blurple dark:text-slate-400"
					title="Close"
					onclick={() => close()}
				>
					<i class="fa-solid fa-xmark text-xl"></i>
				</button>
			</div>

			<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<div>
					<BlockEditor
						bind:blocks={draft.blocks}
						{categories}
						{automations}
						{nodeTargets}
						context={context}
					/>
				</div>
				<div>
					<Preview
						layout={draft}
						{categories}
						{context}
						{primaryColour}
						{footer}
					/>
				</div>
			</div>

			<div class="mt-4 flex justify-end gap-3">
				<button
					type="button"
					class="rounded-lg p-2 px-5 font-semibold transition duration-300 hover:text-black dark:hover:text-white"
					onclick={() => close()}
				>
					Cancel
				</button>
				<button
					type="button"
					class="rounded-lg bg-green-300 px-4 py-2 font-medium transition duration-300 hover:bg-green-400 dark:bg-green-500/75 dark:hover:bg-green-500"
					onclick={save}
				>
					<i class="fa-solid fa-check"></i> Done
				</button>
			</div>
		</div>
	</div>
{/if}
