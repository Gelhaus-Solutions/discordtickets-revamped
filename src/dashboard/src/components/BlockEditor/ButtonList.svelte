<script>
	import { newButton, LIMITS } from './blocks.js';

	/**
	 * @typedef {Object} Props
	 * @property {any[]} buttons
	 * @property {any[]} categories
	 */

	/** @type {Props} */
	let { buttons = $bindable(), categories } = $props();

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
					{button.kind === 'link' ? 'Link button' : 'Ticket button'}
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

				<label class="text-sm">
					<span class="font-medium">Emoji</span>
					<input
						type="text"
						class="input form-input text-sm"
						placeholder={button.kind === 'ticket' ? "The category's emoji" : ''}
						value={button.emoji ?? ''}
						oninput={(e) => (button.emoji = e.currentTarget.value || null)}
					/>
				</label>

				{#if button.kind === 'ticket'}
					<label class="text-sm">
						<span class="font-medium">Colour</span>
						<select class="input form-multiselect text-sm" bind:value={button.style}>
							<option value={null}>Automatic</option>
							<option value="primary">Blurple</option>
							<option value="secondary">Grey</option>
							<option value="success">Green</option>
							<option value="danger">Red</option>
						</select>
					</label>
				{/if}
			</div>
		</div>
	{/each}

	{#if buttons.length >= LIMITS.rowButtons}
		<p class="text-xs text-gray-500 dark:text-slate-400">
			A row can hold at most {LIMITS.rowButtons} buttons. Add another Buttons block for more.
		</p>
	{:else}
		<div class="flex gap-2">
			<button
				type="button"
				class="rounded-lg bg-gray-200 px-3 py-1 text-sm font-medium transition duration-300 hover:bg-blurple hover:text-white dark:bg-slate-700"
				onclick={() => add('ticket')}
			>
				<i class="fa-solid fa-plus"></i> Ticket button
			</button>
			<button
				type="button"
				class="rounded-lg bg-gray-200 px-3 py-1 text-sm font-medium transition duration-300 hover:bg-blurple hover:text-white dark:bg-slate-700"
				onclick={() => add('link')}
			>
				<i class="fa-solid fa-link"></i> Link button
			</button>
		</div>
	{/if}
</div>
