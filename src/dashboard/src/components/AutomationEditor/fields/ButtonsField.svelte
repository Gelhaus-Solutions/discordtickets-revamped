<script>
	import { editorState } from '../editorState.svelte.js';

	/**
	 * Buttons attached to a "Send a message" action.
	 *
	 * Each one starts another automation, which is how a graph hands the member
	 * something to press: "ticket opened → post a button", then a second
	 * automation "button pressed → add a role".
	 *
	 * Only automations triggered by a button press can be picked — pointing a
	 * button at, say, a ticket-closed automation would render fine and then do
	 * nothing, which the server also rejects.
	 */
	let { field, value, onchange } = $props();

	const editor = editorState();
	const buttons = $derived(Array.isArray(value) ? value : []);
	const max = $derived(field.maxItems ?? 5);

	const STYLES = [
		{ label: 'Blurple', value: 'primary' },
		{ label: 'Grey', value: 'secondary' },
		{ label: 'Green', value: 'success' },
		{ label: 'Red', value: 'danger' }
	];

	const targets = $derived(editor.buttonAutomations ?? []);

	const set = (i, patch) =>
		onchange(buttons.map((button, index) => (index === i ? { ...button, ...patch } : button)));

	const add = () =>
		onchange([...buttons, { automationKey: targets[0]?.key ?? '', label: 'Click me', style: 'primary' }]);
</script>

{#if targets.length === 0}
	<p class="rounded-lg bg-amber-400/10 p-2 text-xs text-amber-700 dark:text-amber-300">
		Make an automation whose trigger is <span class="font-semibold">A button is pressed</span> first —
		that is what a button here runs.
	</p>
{:else}
	<div class="flex flex-col gap-2">
		{#each buttons as button, i (i)}
			<div class="rounded-xl bg-gray-100/60 p-2 dark:bg-slate-800/50">
				<div class="flex items-start gap-2">
					<div class="min-w-0 flex-1 space-y-1">
						<input
							type="text"
							class="input form-input text-sm"
							maxlength="80"
							placeholder="Button label"
							value={button.label ?? ''}
							oninput={(e) => set(i, { label: e.currentTarget.value })}
						/>
						<select
							class="input form-multiselect text-sm"
							value={button.automationKey ?? ''}
							onchange={(e) => set(i, { automationKey: e.currentTarget.value })}
						>
							<option value="">Pick what it runs</option>
							{#each targets as target (target.key)}
								<option value={target.key}>{target.name}</option>
							{/each}
						</select>
						<select
							class="input form-multiselect text-sm"
							value={button.style ?? 'primary'}
							onchange={(e) => set(i, { style: e.currentTarget.value })}
						>
							{#each STYLES as style (style.value)}
								<option value={style.value}>{style.label}</option>
							{/each}
						</select>
					</div>
					<button
						type="button"
						class="text-red-300 transition duration-300 hover:text-red-500 dark:text-red-500/50 dark:hover:text-red-500"
						title="Remove this button"
						onclick={() => onchange(buttons.filter((_, index) => index !== i))}
					>
						<i class="fa-solid fa-xmark"></i>
					</button>
				</div>
			</div>
		{/each}
	</div>

	{#if buttons.length < max}
		<button type="button" class="link mt-2 text-sm" onclick={add}>
			<i class="fa-solid fa-plus"></i> Add a button
		</button>
	{/if}
{/if}
