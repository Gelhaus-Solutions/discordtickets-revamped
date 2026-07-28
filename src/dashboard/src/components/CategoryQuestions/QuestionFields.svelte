<script>
	import Required from '../Required.svelte';
	import { LIMITS, configOf } from './types.js';

	/**
	 * The fields every question has: its label, and the description shown under it
	 * in the modal. Discord puts both on the Label component that wraps the input,
	 * so they apply identically to a text box, a dropdown and a file upload.
	 *
	 * @typedef {Object} Props
	 * @property {any} question
	 * @property {string} [labelHelp]
	 */

	/** @type {Props} */
	let { question = $bindable(), labelHelp = 'The title of the question' } = $props();

	const config = $derived(configOf(question));
</script>

<div>
	<label class="font-medium">
		Label
		<Required />
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title={labelHelp}
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
		Description
		<i
			class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
			title="Optional help text shown under the label"
		></i>
		<input
			type="text"
			class="input form-input text-sm"
			maxlength={LIMITS.description}
			value={config.description ?? ''}
			oninput={(e) => (question.config = { ...config, description: e.currentTarget.value || undefined })}
		/>
	</label>
</div>
