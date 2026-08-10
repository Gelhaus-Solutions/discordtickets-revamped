<script>
	import { useSvelteFlow } from '@xyflow/svelte';
	import { editorState } from './editorState.svelte.js';
	import ConditionRows from './ConditionRows.svelte';
	import BooleanField from './fields/BooleanField.svelte';
	import ChannelField from './fields/ChannelField.svelte';
	import DurationField from './fields/DurationField.svelte';
	import ButtonsField from './fields/ButtonsField.svelte';
	import EmojiField from './fields/EmojiField.svelte';
	import LayoutField from './fields/LayoutField.svelte';
	import NumberField from './fields/NumberField.svelte';
	import RoleField from './fields/RoleField.svelte';
	import SelectField from './fields/SelectField.svelte';
	import TextAreaField from './fields/TextAreaField.svelte';
	import TextField from './fields/TextField.svelte';
	import TicketCategoryField from './fields/TicketCategoryField.svelte';
	import UserField from './fields/UserField.svelte';

	/**
	 * The parameter form for one node, dispatched on `field.type` — the same
	 * `EDITORS = {kind: Component}` idiom as `CategoryQuestions/Questions.svelte`.
	 *
	 * One deviation from house style: fields take `value` + `onchange` rather than
	 * `bind:`. Svelte Flow keeps nodes in `$state.raw`, so a deep mutation would
	 * never be observed — every edit has to replace the params object through the
	 * store's own updater.
	 */
	let { node } = $props();

	const editor = editorState();
	const { updateNodeData } = useSvelteFlow();

	const FIELDS = {
		boolean: BooleanField,
		buttons: ButtonsField,
		categories: TicketCategoryField,
		category: TicketCategoryField,
		channel: ChannelField,
		channels: ChannelField,
		cron: TextField,
		duration: DurationField,
		emoji: EmojiField,
		layout: LayoutField,
		number: NumberField,
		priority: SelectField,
		regex: TextField,
		role: RoleField,
		roles: RoleField,
		select: SelectField,
		subject: SelectField,
		text: TextField,
		textarea: TextAreaField,
		timezone: TextField,
		url: TextField,
		user: UserField
	};

	const MULTI = new Set(['categories', 'channels', 'roles']);

	const definition = $derived(editor.catalogue?.types?.find((t) => t.type === node?.data?.type));
	const params = $derived(node?.data?.params ?? {});
	const problems = $derived(editor.problems.filter((p) => p.nodeId === node?.id));

	const set = (key, value) => updateNodeData(node.id, { params: { ...params, [key]: value } });

	/** `subject` is a select whose options come from the catalogue, not the field. */
	const optionsFor = (field) =>
		field.type === 'subject' ? (editor.catalogue?.subjects ?? []) : (field.options ?? []);

	/**
	 * Whether a field applies right now, from the server's own `showWhen`.
	 *
	 * Declared in the registry rather than hardcoded here, so the rule that hides
	 * a field is the same one that stops the server validating it — a field the
	 * editor never showed must never be a reason a save is refused.
	 *
	 * `null` in the list means "absent", which is how a stored node from before a
	 * switch existed still matches the branch it has always been on.
	 */
	const visible = (field) => {
		const rule = field.showWhen;
		if (!rule) return true;
		const value = params[rule.key];
		return rule.in.some((allowed) =>
			allowed === null ? value === undefined || value === null || value === '' : allowed === value
		);
	};
</script>

{#if definition}
	<div class="flex flex-col gap-3">
		<!-- Keyed by node as well as field: keying on `field.key` alone made
		     Svelte reuse one field instance across node selections, so any field
		     holding local state (DurationField's parsed text, EmojiField before
		     it was rewritten) carried the previous node's value over. -->
		{#each definition.params as field (node.id + ':' + field.key)}
			{#if visible(field)}
				{@const Field = FIELDS[field.type] ?? TextField}
				{@const problem = problems.find((p) => p.key === field.key)}
				<div>
					{#if field.type !== 'boolean'}
						<div class="text-sm font-medium">
							{field.label}
							{#if field.required}<span class="text-red-500">*</span>{/if}
						</div>
					{/if}

					{#if field.type === 'clauses'}
						<ConditionRows
							clauses={params.clauses ?? []}
							match={params.match ?? 'all'}
							onchange={(clauses, match) =>
								updateNodeData(node.id, { params: { ...params, clauses, match } })}
						/>
					{:else}
						<div class={problem ? 'rounded ring-2 ring-red-500/60' : ''}>
							<Field
								field={{ ...field, options: optionsFor(field) }}
								multiple={MULTI.has(field.type)}
								value={params[field.key]}
								onchange={(value) => set(field.key, value)}
							/>
						</div>
					{/if}

					{#if problem}
						<p class="mt-1 text-xs text-red-500">{problem.message}</p>
					{:else if field.help}
						<p class="mt-1 text-xs text-gray-500 dark:text-slate-400">{field.help}</p>
					{/if}
				</div>
			{/if}
		{/each}

		{#if definition.params.length === 0}
			<p class="text-sm text-gray-500 dark:text-slate-400">
				This step has nothing to configure.
			</p>
		{/if}
	</div>
{/if}
