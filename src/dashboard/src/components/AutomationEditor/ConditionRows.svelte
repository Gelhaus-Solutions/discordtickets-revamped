<script>
	import { editorState } from './editorState.svelte.js';
	import BooleanField from './fields/BooleanField.svelte';
	import DurationField from './fields/DurationField.svelte';
	import NumberField from './fields/NumberField.svelte';
	import RoleField from './fields/RoleField.svelte';
	import SelectField from './fields/SelectField.svelte';
	import TextField from './fields/TextField.svelte';
	import TicketCategoryField from './fields/TicketCategoryField.svelte';

	/**
	 * The clause editor, shared by `flow.if` and `condition.filter`.
	 *
	 * Shared on purpose: the bot evaluates both through the same
	 * `evaluateClause`, so giving them separate editors is how they would come to
	 * disagree about what a clause means.
	 */
	let { clauses = [], match = 'all', onchange } = $props();

	const state = editorState();
	const fields = $derived(state.catalogue?.clauseFields ?? []);
	const ops = $derived(state.catalogue?.clauseOps ?? {});
	const limit = $derived(state.catalogue?.limits?.clauses ?? 10);

	const definitionOf = (name) => fields.find((f) => f.field === name);

	// The right-hand widget is chosen by the left-hand field, so picking "Roles"
	// gives a role picker and "Open duration" gives a duration box.
	const WIDGETS = {
		boolean: BooleanField,
		category: TicketCategoryField,
		duration: DurationField,
		number: NumberField,
		priority: SelectField,
		regex: TextField,
		role: RoleField
	};

	const PRIORITY_OPTIONS = [
		{ label: 'Low', value: 'LOW' },
		{ label: 'Medium', value: 'MEDIUM' },
		{ label: 'High', value: 'HIGH' }
	];

	const update = (next, nextMatch = match) => onchange(next, nextMatch);

	const setClause = (i, patch) =>
		update(clauses.map((clause, index) => (index === i ? { ...clause, ...patch } : clause)));

	const pickField = (i, name) => {
		const definition = definitionOf(name);
		// The operator and value belong to the old field; keeping either would
		// leave a clause the server rejects.
		setClause(i, { field: name, op: definition?.ops?.[0] ?? 'is', value: null });
	};

	const add = () => {
		const first = fields[0];
		update([...clauses, { field: first?.field, op: first?.ops?.[0] ?? 'is', value: null }]);
	};
</script>

<div class="flex items-center gap-2">
	<span class="text-sm font-medium">Match</span>
	<select
		class="input form-multiselect w-auto text-sm"
		value={match}
		onchange={(e) => update(clauses, e.currentTarget.value)}
	>
		<option value="all">all of these</option>
		<option value="any">any of these</option>
	</select>
</div>

<div class="mt-2 flex flex-col gap-2">
	{#each clauses as clause, i (i)}
		{@const definition = definitionOf(clause.field)}
		{@const Widget = WIDGETS[definition?.operand]}
		<div class="rounded-xl bg-gray-100/60 p-2 dark:bg-slate-800/50">
			<div class="flex items-start gap-2">
				<div class="min-w-0 flex-1 space-y-1">
					<select
						class="input form-multiselect text-sm"
						value={clause.field ?? ''}
						onchange={(e) => pickField(i, e.currentTarget.value)}
					>
						{#each fields as option (option.field)}
							<option value={option.field}>{option.label}</option>
						{/each}
					</select>

					<select
						class="input form-multiselect text-sm"
						value={clause.op ?? ''}
						onchange={(e) => setClause(i, { op: e.currentTarget.value })}
					>
						{#each definition?.ops ?? [] as op (op)}
							<option value={op}>{ops[op] ?? op}</option>
						{/each}
					</select>

					{#if clause.field === 'ticket.answer'}
						<select
							class="input form-multiselect text-sm"
							value={clause.questionId ?? ''}
							onchange={(e) => setClause(i, { questionId: e.currentTarget.value })}
						>
							<option value="">Pick a question</option>
							{#each state.questions as question (question.id)}
								<option value={question.id}>{question.label}</option>
							{/each}
						</select>
					{/if}

					{#if Widget}
						<Widget
							field={{
								key: 'value',
								label: 'Value',
								options: definition?.operand === 'priority' ? PRIORITY_OPTIONS : undefined,
								required: true
							}}
							value={clause.value}
							onchange={(v) => setClause(i, { value: v })}
						/>
					{/if}
				</div>

				<button
					type="button"
					class="text-red-300 transition duration-300 hover:text-red-500 dark:text-red-500/50 dark:hover:text-red-500"
					title="Remove this condition"
					onclick={() => update(clauses.filter((_, index) => index !== i))}
				>
					<i class="fa-solid fa-xmark"></i>
				</button>
			</div>
		</div>
	{/each}
</div>

{#if clauses.length < limit}
	<button
		type="button"
		class="link mt-2 text-sm"
		onclick={add}
	>
		<i class="fa-solid fa-plus"></i> Add a condition
	</button>
{/if}
