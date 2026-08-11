<script>
	import { editorState } from '../editorState.svelte.js';
	import PlaceholderPicker from '$components/PlaceholderPicker.svelte';

	/**
	 * Buttons attached to a "Send a message" action.
	 *
	 * Each one starts another automation, which is how a graph hands the member
	 * something to press: "ticket opened → post a button", then a second
	 * automation "button pressed → add a role".
	 *
	 * A button points either at a "button is pressed" trigger in *this* graph —
	 * the usual case, and why one automation can own two buttons — or at another
	 * automation entirely. Nothing else may be picked: pointing a button at, say,
	 * a ticket-closed trigger would render fine and then do nothing, which the
	 * server also rejects.
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

	const inGraph = $derived(editor.buttonTriggers ?? []);
	const others = $derived(editor.buttonAutomations ?? []);
	const hasTargets = $derived(inGraph.length > 0 || others.length > 0);

	/** `nodeId` and `automationKey` are mutually exclusive; the select encodes which. */
	const valueOf = (button) =>
		button.nodeId ? `node:${button.nodeId}` : button.automationKey ? `key:${button.automationKey}` : '';

	const pickTarget = (i, raw) =>
		set(i, raw.startsWith('node:')
			? { automationKey: undefined, nodeId: raw.slice(5) }
			: { automationKey: raw.slice(4), nodeId: undefined });

	const set = (i, patch) =>
		onchange(buttons.map((button, index) => (index === i ? { ...button, ...patch } : button)));

	// One element reference per label, so the picker inserts at the caret rather
	// than appending.
	let labelEls = $state([]);

	const add = () =>
		onchange([
			...buttons,
			inGraph.length > 0
				? { label: 'Click me', nodeId: inGraph[0].id, style: 'primary' }
				: { automationKey: others[0]?.key ?? '', label: 'Click me', style: 'primary' }
		]);
</script>

{#if !hasTargets}
	<p class="rounded-lg bg-amber-400/10 p-2 text-xs text-amber-700 dark:text-amber-300">
		Add an <span class="font-semibold">A button is pressed</span> trigger to this automation first —
		that is what a button here runs.
	</p>
{:else}
	<div class="flex flex-col gap-2">
		{#each buttons as button, i (i)}
			<div class="rounded-xl bg-gray-100/60 p-2 dark:bg-slate-800/50">
				<div class="flex items-start gap-2">
					<div class="min-w-0 flex-1 space-y-1">
						<input
							bind:this={labelEls[i]}
							type="text"
							class="input form-input text-sm"
							maxlength="80"
							placeholder="Button label"
							value={button.label ?? ''}
							oninput={(e) => set(i, { label: e.currentTarget.value })}
						/>
						{#if field.placeholders}
							<PlaceholderPicker target={labelEls[i]} context={field.placeholders} />
						{/if}
						<select
							class="input form-select text-sm"
							value={valueOf(button)}
							onchange={(e) => pickTarget(i, e.currentTarget.value)}
						>
							<option value="">Pick what it runs</option>
							{#if inGraph.length > 0}
								<optgroup label="In this automation">
									{#each inGraph as trigger (trigger.id)}
										<option value="node:{trigger.id}">{trigger.label}</option>
									{/each}
								</optgroup>
							{/if}
							{#if others.length > 0}
								<optgroup label="Another automation">
									{#each others as target (target.key)}
										<option value="key:{target.key}">{target.name}</option>
									{/each}
								</optgroup>
							{/if}
						</select>
						<select
							class="input form-select text-sm"
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
