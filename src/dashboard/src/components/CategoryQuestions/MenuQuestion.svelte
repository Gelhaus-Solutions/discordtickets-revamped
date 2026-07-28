<script>
	import OptionsEditor from './OptionsEditor.svelte';
	import QuestionFields from './QuestionFields.svelte';
	import ValueRange from './ValueRange.svelte';
	import { LIMITS } from './types.js';

	/**
	 * The dropdown (`MENU`) editor.
	 *
	 * The previous version assigned an object-with-getters to `question.maxLength`
	 * so it could clamp it, which meant the "maximum values" number input was bound
	 * to an object rather than a number. Clamping is `ValueRange`'s job now.
	 *
	 * @type {{question: any}}
	 */
	let { question = $bindable() } = $props();
</script>

<QuestionFields bind:question />
<OptionsEditor bind:question emoji />
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
<ValueRange bind:question ceiling={Math.max(1, question.options?.length ?? 1)} />
