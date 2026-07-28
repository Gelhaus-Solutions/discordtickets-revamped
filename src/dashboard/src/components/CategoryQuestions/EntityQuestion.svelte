<script>
	import QuestionFields from './QuestionFields.svelte';
	import ValueRange from './ValueRange.svelte';
	import { CHANNEL_TYPES, LIMITS, configOf } from './types.js';

	/**
	 * User, role, mentionable and channel pickers.
	 *
	 * Discord populates these itself, so there is no option list — only how many
	 * may be picked, and (for channels) which kinds are offered.
	 *
	 * @type {{question: any}}
	 */
	let { question = $bindable() } = $props();

	const config = $derived(configOf(question));
	const selected = $derived(new Set(config.channelTypes ?? []));

	const toggleChannelType = (value) => {
		const next = new Set(selected);
		if (next.has(value)) next.delete(value);
		else next.add(value);
		// An empty list means "no restriction", which is also what omitting the
		// field means — so it is dropped rather than stored as [].
		question.config = { ...config, channelTypes: next.size ? [...next] : undefined };
	};
</script>

<QuestionFields bind:question />
<div>
	<label class="font-medium">
		Placeholder
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="Shown before anything is picked"
		></i>
		<input
			type="text"
			class="input form-input text-sm"
			maxlength={LIMITS.placeholder}
			bind:value={question.placeholder}
		/>
	</label>
</div>

{#if question.type === 'CHANNEL_SELECT'}
	<div>
		<div class="font-medium">
			Channel types
			<i
				class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
				title="Which kinds of channel can be picked? None selected means all of them."
			></i>
		</div>
		<div class="mt-1 flex flex-wrap gap-2">
			{#each CHANNEL_TYPES as type (type.value)}
				<button
					type="button"
					class="rounded-lg px-3 py-1 text-sm font-medium transition duration-300 {selected.has(
						type.value
					)
						? 'bg-blurple text-white'
						: 'bg-gray-200 dark:bg-slate-700'}"
					onclick={() => toggleChannelType(type.value)}
				>
					{type.label}
				</button>
			{/each}
		</div>
	</div>
{/if}

<ValueRange bind:question />
