<script>
	import Required from '../Required.svelte';
	import { LIMITS, configOf } from './types.js';

	/**
	 * Static text in the modal. Not an input: it asks nothing and no answer is
	 * stored, so it has none of the usual fields. The label is kept only so the
	 * question list has something to show for it.
	 *
	 * @type {{question: any}}
	 */
	let { question = $bindable() } = $props();

	const config = $derived(configOf(question));
</script>

<div>
	<label class="font-medium">
		Name
		<Required />
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="Only shown here, to identify this block in the list"
		></i>
		<input
			type="text"
			class="input form-input text-sm"
			required
			maxlength={LIMITS.label}
			bind:value={question.label}
		/>
	</label>
</div>
<div>
	<label class="font-medium">
		Text
		<Required />
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="Markdown shown in the modal"
		></i>
		<textarea
			class="input form-input text-sm"
			required
			rows="4"
			maxlength="1000"
			value={config.content ?? ''}
			oninput={(e) => (question.config = { ...config, content: e.currentTarget.value })}
		></textarea>
	</label>
</div>
