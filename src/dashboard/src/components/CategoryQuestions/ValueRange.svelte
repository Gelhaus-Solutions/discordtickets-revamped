<script>
	import { LIMITS } from './types.js';

	/**
	 * How many things a member may pick, and whether they must pick anything.
	 *
	 * Shared by every multi-select type. Discord rejects min > max, a max above
	 * the number of options, and a required component with a minimum of 0 — so
	 * those are corrected here rather than sent and bounced.
	 *
	 * @typedef {Object} Props
	 * @property {any} question
	 * @property {number} [ceiling] the most that can be picked (option count, or 25)
	 */

	/** @type {Props} */
	let { question = $bindable(), ceiling = LIMITS.selectValues } = $props();

	const clamp = (value, min, max) => Math.min(Math.max(Number(value) || 0, min), max);

	const onMax = (event) => {
		question.maxLength = clamp(event.currentTarget.value, 1, ceiling);
		if ((question.minLength ?? 0) > question.maxLength) question.minLength = question.maxLength;
	};

	const onMin = (event) => {
		question.minLength = clamp(event.currentTarget.value, question.required ? 1 : 0, question.maxLength ?? 1);
	};

	const onRequired = (event) => {
		question.required = event.currentTarget.checked;
		if (question.required && (question.minLength ?? 0) < 1) question.minLength = 1;
	};
</script>

<div>
	<label class="font-medium">
		Maximum choices
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="How many things can be picked?"
		></i>
		<input
			type="number"
			class="input form-input text-sm"
			required
			min="1"
			max={ceiling}
			value={question.maxLength ?? 1}
			oninput={onMax}
		/>
	</label>
</div>
<div>
	<label class="font-medium">
		Minimum choices
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="The fewest that must be picked"
		></i>
		<input
			type="number"
			class="input form-input text-sm"
			required
			min={question.required ? 1 : 0}
			max={question.maxLength ?? 1}
			value={question.minLength ?? 0}
			oninput={onMin}
		/>
	</label>
</div>
<div>
	<label for="required-{question.id}" class="font-medium">
		Required
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="Must the member answer this?"
		></i>
		<input
			type="checkbox"
			id="required-{question.id}"
			class="form-checkbox"
			checked={question.required}
			onchange={onRequired}
		/>
	</label>
</div>
