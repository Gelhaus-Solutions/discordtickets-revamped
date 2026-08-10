<script>
	/**
	 * A category field that can fall back to the server-wide default.
	 *
	 * Every setting wrapped by this used to be NOT NULL with a default baked into
	 * the schema, so "use whatever the server says" was not something a category
	 * could express. It can now, and `null` is how it says it — which is the one
	 * thing this component exists to make visible, because an empty box and an
	 * empty box that quietly means "inherit `@Support`" look identical.
	 *
	 * Two shapes, because a `<select multiple>` has no placeholder to grey out:
	 *
	 *   - `placeholder` (text, number, emoji) renders the control empty with the
	 *     inherited value as its placeholder.
	 *   - `preview` (role pickers) renders the inherited value as a greyed,
	 *     non-interactive list plus an Override button that copies it into an
	 *     editable control.
	 *
	 * The control itself is supplied as a snippet, so this owns the label, the
	 * empty/overridden switch and the reset link exactly once and knows nothing
	 * about what it is wrapping.
	 *
	 * @typedef {Object} Props
	 * @property {string} label
	 * @property {?string} [title] help-icon tooltip
	 * @property {any} value bindable; `null` means inheriting
	 * @property {any} inherited what this field resolves to while inheriting
	 * @property {'placeholder'|'preview'} [mode]
	 * @property {(v: any) => string} [format] how to render `inherited` as text
	 * @property {boolean} [disabled]
	 * @property {import('svelte').Snippet} [help] extra copy under the control
	 * @property {import('svelte').Snippet<[{ value: any, setValue: (v: any) => void, placeholder: string, inheriting: boolean }]>} control
	 */

	/** @type {Props} */
	let {
		label,
		title = null,
		value = $bindable(),
		inherited,
		mode = 'placeholder',
		format = (v) => String(v ?? ''),
		disabled = false,
		help,
		control
	} = $props();

	// `null` *and* `undefined`: a field the API has never sent arrives undefined,
	// and it inherits for the same reason a cleared one does. An empty array or a
	// zero is a deliberate override and must not read as inheriting.
	const inheriting = $derived(value === null || value === undefined);

	const formatted = $derived(format(inherited));
	const placeholder = $derived(
		formatted === '' ? 'Inherited: nothing' : `Inherited: ${formatted}`
	);

	const setValue = (v) => (value = v);

	/**
	 * Start overriding, seeded with a *copy* of the inherited value.
	 *
	 * The copy matters: the inherited array is shared with the placeholder
	 * rendering, and editing it in place would silently rewrite what the field
	 * claims it would fall back to.
	 */
	const override = () =>
		setValue(Array.isArray(inherited) ? [...inherited] : structuredClone(inherited ?? null));
</script>

<div class:opacity-50={disabled}>
	<label class="font-medium">
		{label}
		{#if title}
			<i
				class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
				{title}
			></i>
		{/if}

		{#if mode === 'preview' && inheriting}
			<div
				class="input form-input flex min-h-[2.5rem] flex-wrap items-center gap-1 text-gray-500 dark:text-slate-400"
			>
				{#if Array.isArray(inherited) && inherited.length}
					{#each inherited as item (item)}
						<span class="rounded bg-gray-200 px-2 py-0.5 text-sm dark:bg-slate-700">
							{format([item])}
						</span>
					{/each}
				{:else}
					<span class="text-sm italic">Nothing set for this server</span>
				{/if}
			</div>
		{:else}
			{@render control({ value, setValue, placeholder, inheriting })}
		{/if}
	</label>

	<p class="mt-1 text-sm text-gray-500 dark:text-slate-400">
		{#if inheriting}
			Using the server default.
			{#if mode === 'preview' && !disabled}
				<button type="button" class="underline" onclick={override}>Override</button>
			{/if}
		{:else}
			Overridden for this category.
			{#if !disabled}
				<button type="button" class="underline" onclick={() => setValue(null)}>
					Reset to server default
				</button>
			{/if}
		{/if}
		{#if help}
			{@render help()}
		{/if}
	</p>
</div>
