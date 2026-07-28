<script>
	import { v4 as uuidv4 } from 'uuid';
	import EmojiPicker from '$components/EmojiPicker.svelte';
	import Required from '../Required.svelte';
	import { LIMITS, OPTION_RANGE } from './types.js';

	/**
	 * The option list for a dropdown, radio group or checkbox group.
	 *
	 * Inline rather than the modal this replaces: `OptionsModal.svelte` was
	 * commented out in its entirety while `MenuQuestion.svelte` still called
	 * `modals.open(OptionsModal, …)`, so opening it threw a ReferenceError. The
	 * editor already lives inside an expandable panel, so a second layer of
	 * overlay bought nothing.
	 *
	 * @typedef {Object} Props
	 * @property {any} question
	 * @property {boolean} [emoji] whether options may carry an emoji (dropdowns only)
	 */

	/** @type {Props} */
	let { question = $bindable(), emoji = false } = $props();

	const range = $derived(OPTION_RANGE[question.type] ?? [1, LIMITS.choiceOptions]);
	const options = $derived(Array.isArray(question.options) ? question.options : []);

	// The value is what gets stored as the answer, so a duplicate makes the answer
	// ambiguous — and Discord rejects duplicates in radio and checkbox groups.
	const duplicates = $derived.by(() => {
		const seen = new Set();
		const dupes = new Set();
		for (const option of options) {
			const value = (option.value ?? '').trim() || (option.label ?? '').trim();
			if (!value) continue;
			if (seen.has(value)) dupes.add(value);
			seen.add(value);
		}
		return dupes;
	});

	const valueOf = (option) => (option.value ?? '').trim() || (option.label ?? '').trim();

	const add = () => {
		question.options = [
			...options,
			{
				description: '',
				emoji: null,
				id: uuidv4(),
				label: `Option ${options.length + 1}`,
				value: ''
			}
		];
	};

	const remove = (i) => {
		question.options = options.filter((_, j) => j !== i);
	};

	const move = (i, by) => {
		const to = i + by;
		if (to < 0 || to >= options.length) return;
		const next = [...options];
		[next[i], next[to]] = [next[to], next[i]];
		question.options = next;
	};
</script>

<div class="flex flex-col gap-2">
	<div class="font-medium">
		Options ({options.length}/{range[1]})
		<Required />
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="The choices members can pick from"
		></i>
	</div>

	{#if options.length < range[0]}
		<p class="text-sm text-yellow-600 dark:text-yellow-400">
			This question needs at least {range[0]} option{range[0] === 1 ? '' : 's'}.
		</p>
	{/if}

	{#each options as option, i (option.id ?? i)}
		<div class="rounded-lg bg-white p-2 dark:bg-slate-900/60">
			<div class="flex items-center gap-2">
				<span class="text-xs font-semibold text-gray-500 dark:text-slate-400">{i + 1}</span>
				<input
					type="text"
					class="input form-input flex-1 text-sm"
					required
					maxlength={LIMITS.optionLabel}
					placeholder="Label"
					bind:value={option.label}
				/>
				<button
					type="button"
					class="px-1 text-gray-500 transition duration-300 hover:text-blurple disabled:opacity-30"
					title="Move up"
					disabled={i === 0}
					onclick={() => move(i, -1)}
				>
					<i class="fa-solid fa-angle-up"></i>
				</button>
				<button
					type="button"
					class="px-1 text-gray-500 transition duration-300 hover:text-blurple disabled:opacity-30"
					title="Move down"
					disabled={i === options.length - 1}
					onclick={() => move(i, 1)}
				>
					<i class="fa-solid fa-angle-down"></i>
				</button>
				<button
					type="button"
					class="px-1 text-red-300 transition duration-300 hover:text-red-500 dark:text-red-500/50 dark:hover:text-red-500"
					title="Remove"
					onclick={() => remove(i)}
				>
					<i class="fa-solid fa-xmark"></i>
				</button>
			</div>

			<div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
				<label class="text-sm">
					<span class="font-medium">Description</span>
					<input
						type="text"
						class="input form-input text-sm"
						maxlength={LIMITS.optionLabel}
						bind:value={option.description}
					/>
				</label>
				<label class="text-sm">
					<span class="font-medium">
						Value
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="What gets stored as the answer. Defaults to the label."
						></i>
					</span>
					<input
						type="text"
						class="input form-input text-sm"
						maxlength={LIMITS.optionValue}
						placeholder={option.label ?? ''}
						bind:value={option.value}
					/>
					{#if duplicates.has(valueOf(option))}
						<span class="text-xs text-red-500">
							Another option already stores “{valueOf(option)}”.
						</span>
					{/if}
				</label>
				{#if emoji}
					<div class="text-sm sm:col-span-2">
						<span class="font-medium">Emoji</span>
						<EmojiPicker bind:value={option.emoji} />
					</div>
				{/if}
			</div>
		</div>
	{/each}

	{#if options.length < range[1]}
		<div class="text-center">
			<button
				type="button"
				class="rounded-lg p-2 px-5 font-medium text-green-500 transition duration-300 hover:text-green-300 dark:text-green-500 dark:hover:text-green-500/50"
				onclick={add}
			>
				<i class="fa-solid fa-circle-plus"></i>
				Add option
			</button>
		</div>
	{/if}
</div>
