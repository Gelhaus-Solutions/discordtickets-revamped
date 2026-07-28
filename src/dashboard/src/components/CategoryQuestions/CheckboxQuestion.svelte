<script>
	import QuestionFields from './QuestionFields.svelte';
	import { configOf } from './types.js';

	/**
	 * A single tick box. Discord's checkbox component has no `required` flag —
	 * unticked is a valid answer — so the only setting is whether it starts ticked.
	 *
	 * @type {{question: any}}
	 */
	let { question = $bindable() } = $props();

	const config = $derived(configOf(question));
</script>

<QuestionFields bind:question labelHelp="The text shown beside the tick box" />
<div>
	<label for="default-checked-{question.id}" class="font-medium">
		Ticked by default
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="Should the box start ticked?"
		></i>
		<input
			type="checkbox"
			id="default-checked-{question.id}"
			class="form-checkbox"
			checked={Boolean(config.defaultChecked)}
			onchange={(e) =>
				(question.config = { ...config, defaultChecked: e.currentTarget.checked || undefined })}
		/>
	</label>
</div>
