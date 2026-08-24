<script>
	import QuestionFields from './QuestionFields.svelte';
	import Required from '../Required.svelte';
	import { DEFAULT_RATING_SCALE, LIMITS, configOf } from './types.js';

	/**
	 * A rating scale, rendered to the member as a row of radio buttons.
	 *
	 * Unlike the other choice types there is no option list to author: the points
	 * are generated from the scale, so an admin cannot end up with a scale whose
	 * options say something other than 1, 2, 3. Only the two ends can be named.
	 *
	 * The first rating question in a feedback form is the one whose answer becomes
	 * `Feedback.rating`, which is what every chart and average reads.
	 *
	 * @type {{question: any}}
	 */
	let { question = $bindable() } = $props();

	const config = $derived(configOf(question));
	const scale = $derived(Number(config.scale ?? DEFAULT_RATING_SCALE));

	const setConfig = (patch) => (question.config = { ...config, ...patch });

	// Empty string rather than undefined, so clearing the box does not leave the
	// previous label behind.
	const setEnd = (end, value) => setConfig({ [end]: value || undefined });
</script>

<QuestionFields bind:question labelHelp="The question shown above the scale" />

<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
	<div>
		<label class="font-medium">
			Points on the scale
			<Required />
			<i
				class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
				title="How many points the member picks from. 5 is what feedback has always used."
			></i>
			<input
				type="number"
				class="input form-input text-sm"
				min={LIMITS.ratingScaleMin}
				max={LIMITS.ratingScaleMax}
				value={scale}
				oninput={(e) => setConfig({ scale: Number(e.currentTarget.value) || undefined })}
			/>
		</label>
		<p class="mt-1 text-xs text-gray-500 dark:text-slate-400">
			Between {LIMITS.ratingScaleMin} and {LIMITS.ratingScaleMax}.
		</p>
	</div>

	<div>
		<label for="rating-required-{question.id}" class="font-medium">
			Required
			<i
				class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
				title="Must the member pick a rating before they can submit?"
			></i>
			<input
				type="checkbox"
				id="rating-required-{question.id}"
				class="form-checkbox"
				bind:checked={question.required}
			/>
		</label>
	</div>

	<div>
		<label class="font-medium">
			Label for 1
			<i
				class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
				title="Optional. Shown under the lowest point, e.g. 'Terrible'."
			></i>
			<input
				type="text"
				class="input form-input text-sm"
				maxlength={LIMITS.optionLabel}
				placeholder="Terrible"
				value={config.minLabel ?? ''}
				oninput={(e) => setEnd('minLabel', e.currentTarget.value)}
			/>
		</label>
	</div>

	<div>
		<label class="font-medium">
			Label for {scale}
			<i
				class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
				title="Optional. Shown under the highest point, e.g. 'Excellent'."
			></i>
			<input
				type="text"
				class="input form-input text-sm"
				maxlength={LIMITS.optionLabel}
				placeholder="Excellent"
				value={config.maxLabel ?? ''}
				oninput={(e) => setEnd('maxLabel', e.currentTarget.value)}
			/>
		</label>
	</div>
</div>
