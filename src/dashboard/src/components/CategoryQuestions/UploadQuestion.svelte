<script>
	import QuestionFields from './QuestionFields.svelte';
	import { LIMITS, configOf } from './types.js';

	/** @type {{question: any}} */
	let { question = $bindable() } = $props();

	const config = $derived(configOf(question));

	const clamp = (value, min, max) => Math.min(Math.max(Number(value) || 0, min), max);

	const setMax = (event) => {
		const maxFiles = clamp(event.currentTarget.value, 1, LIMITS.uploadFiles);
		question.config = {
			...config,
			maxFiles,
			minFiles: Math.min(config.minFiles ?? 0, maxFiles)
		};
	};

	const setMin = (event) => {
		question.config = {
			...config,
			minFiles: clamp(event.currentTarget.value, question.required ? 1 : 0, config.maxFiles ?? 1)
		};
	};
</script>

<QuestionFields bind:question />
<div>
	<label class="font-medium">
		Maximum files
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="How many files can be attached?"
		></i>
		<input
			type="number"
			class="input form-input text-sm"
			required
			min="1"
			max={LIMITS.uploadFiles}
			value={config.maxFiles ?? 1}
			oninput={setMax}
		/>
	</label>
</div>
<div>
	<label class="font-medium">
		Minimum files
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="The fewest files that must be attached"
		></i>
		<input
			type="number"
			class="input form-input text-sm"
			required
			min={question.required ? 1 : 0}
			max={config.maxFiles ?? 1}
			value={config.minFiles ?? 0}
			oninput={setMin}
		/>
	</label>
</div>
<div>
	<label for="required-{question.id}" class="font-medium">
		Required
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="Must the member attach something?"
		></i>
		<input
			type="checkbox"
			id="required-{question.id}"
			class="form-checkbox"
			checked={question.required}
			onchange={(e) => {
				question.required = e.currentTarget.checked;
				if (question.required && (config.minFiles ?? 0) < 1) {
					question.config = { ...config, minFiles: 1 };
				}
			}}
		/>
	</label>
</div>
<p class="text-sm text-gray-500 dark:text-slate-400">
	Uploaded files are re-posted into the ticket channel when it opens. Discord's own upload links
	expire within a day, so without that the transcript would be left with dead links.
</p>
