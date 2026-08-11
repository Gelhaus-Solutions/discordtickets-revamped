<script>
	import { newButton, LIMITS, NODE_TARGET_KINDS } from './blocks.js';
	import EmojiPicker from '$components/EmojiPicker.svelte';
	import PlaceholderPicker from '$components/PlaceholderPicker.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {any[]} buttons
	 * @property {any[]} categories
	 * @property {any[]} [automations] automations a button press can start
	 * @property {any[]} [nodeTargets] `{id, label}` button triggers in the
	 *   automation being edited, which a button here may continue
	 * @property {string} [context] which message kind this row belongs to
	 * @property {string[]} [kinds] which kinds may be added here
	 * @property {boolean} [fixed] one button, not a list — no add or remove
	 */

	/** @type {Props} */
	let {
		buttons = $bindable(),
		categories,
		automations = [],
		nodeTargets = [],
		context = 'panel',
		kinds = ['ticket', 'link', 'automation'],
		fixed = false
	} = $props();

	const KIND_LABELS = {
		ticket: 'Ticket button',
		link: 'Link button',
		automation: 'Automation button'
	};

	// Blocks saved before they could hold buttons have no list at all, so read
	// through a fallback and only write a real array back once one is added.
	const list = $derived(Array.isArray(buttons) ? buttons : []);

	// Only an automation message has a graph to continue, so only there does a
	// button get the "in this automation" option.
	const inGraph = $derived(NODE_TARGET_KINDS.includes(context) ? nodeTargets : []);

	const add = (kind) => {
		if (list.length >= LIMITS.rowButtons) return;
		buttons = [...list, newButton(kind)];
	};

	const remove = (i) => {
		buttons = list.filter((_, j) => j !== i);
	};

	/** `nodeId` and `automationKey` are mutually exclusive; the select encodes which. */
	const valueOf = (button) =>
		button.nodeId ? `node:${button.nodeId}` : button.automationKey ? `key:${button.automationKey}` : '';

	const pickTarget = (button, raw) => {
		if (raw.startsWith('node:')) {
			button.nodeId = raw.slice(5);
			button.automationKey = null;
		} else {
			button.automationKey = raw.slice(4);
			button.nodeId = null;
		}
	};

	const hasTargets = $derived(inGraph.length > 0 || automations.length > 0);

	// One element reference per field the picker can insert into.
	let labelEls = $state([]);
	let urlEls = $state([]);
</script>

<div class="flex flex-col gap-2">
	{#each list as button, i}
		<div class="rounded-lg bg-white p-2 dark:bg-slate-900/60">
			<div class="flex items-center justify-between">
				<span class="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">
					{KIND_LABELS[button.kind] ?? 'Button'}
				</span>
				{#if !fixed}
					<button
						type="button"
						class="text-red-400 transition duration-300 hover:text-red-600"
						title="Remove button"
						onclick={() => remove(i)}
					>
						<i class="fa-solid fa-xmark"></i>
					</button>
				{/if}
			</div>

			<div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
				{#if button.kind === 'ticket'}
					<label class="text-sm">
						<span class="font-medium">Category</span>
						<select class="input form-select text-sm" bind:value={button.categoryId}>
							<option value={null} disabled>Choose a category</option>
							{#each categories as category}
								<option value={category.id}>{category.name}</option>
							{/each}
						</select>
					</label>
				{:else if button.kind === 'automation'}
					<label class="text-sm">
						<span class="font-medium">Runs</span>
						<select
							class="input form-select text-sm"
							value={valueOf(button)}
							onchange={(e) => pickTarget(button, e.currentTarget.value)}
						>
							<option value="" disabled>Pick what it runs</option>
							{#if inGraph.length > 0}
								<optgroup label="In this automation">
									{#each inGraph as trigger (trigger.id)}
										<option value="node:{trigger.id}">{trigger.label}</option>
									{/each}
								</optgroup>
							{/if}
							{#if automations.length > 0}
								<optgroup label="Another automation">
									{#each automations as automation (automation.key)}
										<option value="key:{automation.key}">{automation.name}</option>
									{/each}
								</optgroup>
							{/if}
						</select>
					</label>
				{:else}
					<label class="text-sm">
						<span class="font-medium">URL</span>
						<input
							bind:this={urlEls[i]}
							type="url"
							class="input form-input text-sm"
							bind:value={button.url}
						/>
						<PlaceholderPicker target={urlEls[i]} {context} />
					</label>
				{/if}

				<label class="text-sm">
					<span class="font-medium">Label</span>
					<input
						bind:this={labelEls[i]}
						type="text"
						maxlength="80"
						class="input form-input text-sm"
						placeholder={button.kind === 'ticket' ? "The category's name" : ''}
						value={button.label ?? ''}
						oninput={(e) => (button.label = e.currentTarget.value || null)}
					/>
					<PlaceholderPicker target={labelEls[i]} {context} />
				</label>

				<div class="text-sm">
					<span class="font-medium">Emoji</span>
					<EmojiPicker
						bind:value={button.emoji}
						placeholder={button.kind === 'ticket' ? "The category's emoji" : 'None'}
					/>
				</div>

				{#if button.kind === 'ticket' || button.kind === 'automation'}
					<label class="text-sm">
						<span class="font-medium">Colour</span>
						<select class="input form-select text-sm" bind:value={button.style}>
							{#if button.kind === 'ticket'}
								<option value={null}>Automatic</option>
							{/if}
							<option value="primary">Blurple</option>
							<option value="secondary">Grey</option>
							<option value="success">Green</option>
							<option value="danger">Red</option>
						</select>
					</label>
				{/if}
			</div>

			{#if button.kind === 'automation' && !hasTargets}
				<p class="mt-2 text-xs text-amber-600 dark:text-amber-400">
					Nothing for this button to run yet. Add an <span class="font-semibold">A button is
					pressed</span> step to this automation, or to another one, or this button will be
					rejected when you save.
				</p>
			{/if}
		</div>
	{/each}

	{#if !fixed}
		{#if list.length >= LIMITS.rowButtons}
			<p class="text-xs text-gray-500 dark:text-slate-400">
				A row can hold at most {LIMITS.rowButtons} buttons.
			</p>
		{:else}
			<div class="flex flex-wrap gap-2">
				{#if kinds.includes('ticket')}
					<button
						type="button"
						class="rounded-lg bg-gray-200 px-3 py-1 text-sm font-medium transition duration-300 hover:bg-blurple hover:text-white dark:bg-slate-700"
						onclick={() => add('ticket')}
					>
						<i class="fa-solid fa-plus"></i> Ticket button
					</button>
				{/if}
				{#if kinds.includes('link')}
					<button
						type="button"
						class="rounded-lg bg-gray-200 px-3 py-1 text-sm font-medium transition duration-300 hover:bg-blurple hover:text-white dark:bg-slate-700"
						onclick={() => add('link')}
					>
						<i class="fa-solid fa-link"></i> Link button
					</button>
				{/if}
				{#if kinds.includes('automation')}
					<button
						type="button"
						class="rounded-lg bg-gray-200 px-3 py-1 text-sm font-medium transition duration-300 hover:bg-blurple hover:text-white dark:bg-slate-700"
						onclick={() => add('automation')}
					>
						<i class="fa-solid fa-diagram-project"></i> Automation button
					</button>
				{/if}
			</div>
			{#if context === 'dm'}
				<p class="text-xs text-gray-500 dark:text-slate-400">
					A DM is not in any server, so only link buttons work there.
				</p>
			{/if}
		{/if}
	{/if}
</div>
