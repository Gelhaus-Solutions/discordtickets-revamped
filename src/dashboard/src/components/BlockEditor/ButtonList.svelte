<script>
	import { newButton, LIMITS } from './blocks.js';
	import EmojiPicker from '$components/EmojiPicker.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {any[]} buttons
	 * @property {any[]} categories
	 * @property {any[]} [automations] automations a button press can start
	 * @property {string[]} [kinds] which kinds may be added here
	 */

	/** @type {Props} */
	let {
		buttons = $bindable(),
		categories,
		automations = [],
		kinds = ['ticket', 'link', 'automation']
	} = $props();

	const KIND_LABELS = {
		ticket: 'Ticket button',
		link: 'Link button',
		automation: 'Automation button'
	};

	const add = (kind) => {
		if (buttons.length >= LIMITS.rowButtons) return;
		buttons = [...buttons, newButton(kind)];
	};

	const remove = (i) => {
		buttons = buttons.filter((_, j) => j !== i);
	};
</script>

<div class="flex flex-col gap-2">
	{#each buttons as button, i}
		<div class="rounded-lg bg-white p-2 dark:bg-slate-900/60">
			<div class="flex items-center justify-between">
				<span class="text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">
					{KIND_LABELS[button.kind] ?? 'Button'}
				</span>
				<button
					type="button"
					class="text-red-400 transition duration-300 hover:text-red-600"
					title="Remove button"
					onclick={() => remove(i)}
				>
					<i class="fa-solid fa-xmark"></i>
				</button>
			</div>

			<div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
				{#if button.kind === 'ticket'}
					<label class="text-sm">
						<span class="font-medium">Category</span>
						<select class="input form-multiselect text-sm" bind:value={button.categoryId}>
							<option value={null} disabled>Choose a category</option>
							{#each categories as category}
								<option value={category.id}>{category.name}</option>
							{/each}
						</select>
					</label>
				{:else if button.kind === 'automation'}
					<label class="text-sm">
						<span class="font-medium">Automation</span>
						<select class="input form-multiselect text-sm" bind:value={button.automationKey}>
							<option value={null} disabled>Choose an automation</option>
							{#each automations as automation}
								<option value={automation.key}>{automation.name}</option>
							{/each}
						</select>
					</label>
				{:else}
					<label class="text-sm">
						<span class="font-medium">URL</span>
						<input type="url" class="input form-input text-sm" bind:value={button.url} />
					</label>
				{/if}

				<label class="text-sm">
					<span class="font-medium">Label</span>
					<input
						type="text"
						maxlength="80"
						class="input form-input text-sm"
						placeholder={button.kind === 'ticket' ? "The category's name" : ''}
						value={button.label ?? ''}
						oninput={(e) => (button.label = e.currentTarget.value || null)}
					/>
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
						<select class="input form-multiselect text-sm" bind:value={button.style}>
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

			{#if button.kind === 'automation' && automations.length === 0}
				<p class="mt-2 text-xs text-amber-600 dark:text-amber-400">
					No automation starts with a button press yet. Add "A button is pressed" to an automation
					first, or this button will be rejected when you save.
				</p>
			{/if}
		</div>
	{/each}

	{#if buttons.length >= LIMITS.rowButtons}
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
	{/if}
</div>
