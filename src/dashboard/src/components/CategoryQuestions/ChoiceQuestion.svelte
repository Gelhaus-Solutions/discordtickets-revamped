<script>
	import OptionsEditor from './OptionsEditor.svelte';
	import QuestionFields from './QuestionFields.svelte';
	import ValueRange from './ValueRange.svelte';

	/**
	 * Radio groups and checkbox groups.
	 *
	 * A radio group takes exactly one answer, so it has no range of its own —
	 * only whether it is required.
	 *
	 * @type {{question: any}}
	 */
	let { question = $bindable() } = $props();
</script>

<QuestionFields bind:question />
<OptionsEditor bind:question />

{#if question.type === 'CHECKBOX_GROUP'}
	<ValueRange bind:question ceiling={Math.max(1, question.options?.length ?? 1)} />
{:else}
	<div>
		<label for="required-{question.id}" class="font-medium">
			Required
			<i
				class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
				title="Must the member pick one?"
			></i>
			<input
				type="checkbox"
				id="required-{question.id}"
				class="form-checkbox"
				bind:checked={question.required}
			/>
		</label>
	</div>
{/if}
