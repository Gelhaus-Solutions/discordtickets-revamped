<script>
	import '@xyflow/svelte/dist/style.css';
	import { SvelteFlowProvider } from '@xyflow/svelte';
	import { getContext, onMount } from 'svelte';
	import { beforeNavigate, goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { toasts, ToastContainer, BootstrapToast } from 'svelte-toasts';
	import ErrorBox from '$components/ErrorBox.svelte';
	import Canvas from '$components/AutomationEditor/Canvas.svelte';
	import Inspector from '$components/AutomationEditor/Inspector.svelte';
	import NodePalette from '$components/AutomationEditor/NodePalette.svelte';
	import Toolbar from '$components/AutomationEditor/Toolbar.svelte';
	import { createEditorState } from '$components/AutomationEditor/editorState.svelte.js';
	import { fromFlow, newGraph, newNode, toFlow } from '$components/AutomationEditor/graph.js';
	import { autoLayout, needsLayout } from '$components/AutomationEditor/layout.js';
	import { validate } from '$components/AutomationEditor/validate.js';

	let { data } = $props();

	const theme = getContext('theme');

	const starting = (() => {
		const graph = data.automation?.graph ?? newGraph('trigger.ticket.created', data.catalogue);
		// Imported and templated graphs arrive without positions.
		if (needsLayout(graph)) autoLayout(graph);
		return graph;
	})();

	const initial = toFlow(starting);
	// $state.raw is what Svelte Flow expects — it replaces the arrays wholesale
	// rather than mutating them.
	let nodes = $state.raw(initial.nodes);
	let edges = $state.raw(initial.edges);
	let name = $state(data.automation?.name ?? 'New automation');
	let enabled = $state(data.automation?.enabled ?? true);

	let error = $state(null);
	let loading = $state(false);
	let testing = $state(false);
	let testResult = $state(null);

	const editor = createEditorState({
		catalogue: data.catalogue,
		categories: data.categories,
		channels: data.channels,
		questions: data.categories.flatMap((c) => c.questions ?? []),
		roles: data.roles
	});

	const graph = $derived(fromFlow(nodes, edges));
	const selectedNode = $derived(nodes.find((n) => n.id === editor.selected) ?? null);
	const hasTrigger = $derived(nodes.some((n) => n.data.type.startsWith('trigger.')));

	$effect(() => {
		editor.problems = validate(graph, data.catalogue);
	});

	// `fromFlow` rounds positions, so a drag that ends where it started is not a
	// change and does not arm the unsaved-changes guard.
	let saved = $state(JSON.stringify({ enabled, graph: starting, name }));
	const modified = $derived(JSON.stringify({ enabled, graph, name }) !== saved);
	const blocking = $derived(editor.problems.filter((p) => p.severity === 'error'));

	beforeNavigate((navigation) => {
		if (modified && !confirm('You have unsaved changes; are you sure you want to leave?')) {
			navigation.cancel();
		}
	});

	onMount(() => {
		const handler = (event) => {
			if (!modified) return;
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	});

	const addNode = (type) => {
		// An automation has exactly one trigger. The palette greys the group out,
		// but that is presentation — this is the rule, so a second one cannot get
		// in by any route.
		if (type.startsWith('trigger.') && hasTrigger) return;

		// Dropped to the right of everything already there, so a new step lands
		// where the eye is rather than on top of the trigger.
		const right = nodes.reduce((max, n) => Math.max(max, n.position.x), 0);
		const node = newNode(type, data.catalogue, { x: right + 380, y: 60 });
		nodes = [...nodes, toFlow({ edges: [], nodes: [node] }).nodes[0]];
		editor.selected = node.id;
	};

	const tidy = () => {
		const laid = autoLayout(fromFlow(nodes, edges));
		nodes = toFlow(laid).nodes;
	};

	const submit = async () => {
		try {
			error = null;
			if (blocking.length) throw new Error(blocking[0].message);
			loading = true;

			const base = `/api/admin/guilds/${$page.params.guild}/automations`;
			const response = await fetch(data.isNew ? base : `${base}/${$page.params.automation}`, {
				body: JSON.stringify({ enabled, graph, name }),
				credentials: 'include',
				headers: { 'Content-Type': 'application/json; charset=UTF-8' },
				method: data.isNew ? 'POST' : 'PATCH'
			});
			const body = await response.json();
			if (!response.ok) throw body;

			saved = JSON.stringify({ enabled, graph, name });
			toasts.add({ description: 'Automation saved', type: 'success' });
			if (data.isNew) await goto(`./${body.id}`, { replaceState: true });
		} catch (err) {
			error = err;
			window.scroll({ behavior: 'smooth', top: 0 });
		} finally {
			loading = false;
		}
	};

	const test = async () => {
		testing = true;
		testResult = null;
		try {
			const response = await fetch(
				`/api/admin/guilds/${$page.params.guild}/automations/${$page.params.automation}/test`,
				{
					body: JSON.stringify({}),
					credentials: 'include',
					headers: { 'Content-Type': 'application/json; charset=UTF-8' },
					method: 'POST'
				}
			);
			const body = await response.json();
			if (!response.ok) throw body;
			testResult = body;
		} catch (err) {
			error = err;
		} finally {
			testing = false;
		}
	};
</script>

<svelte:head><title>{name}</title></svelte:head>

{#if error}
	<ErrorBox {error} />
{/if}

<SvelteFlowProvider>
	<div class="mb-4 flex flex-wrap items-center gap-3">
		<a href="../automations" class="link"><i class="fa-solid fa-angle-left"></i> Automations</a>
		<input
			type="text"
			class="input form-input w-auto flex-1 text-lg font-semibold"
			maxlength="100"
			bind:value={name}
		/>
		<label class="flex items-center gap-2 text-sm font-medium">
			<input type="checkbox" class="form-checkbox" bind:checked={enabled} />
			Enabled
		</label>
		{#if !data.isNew}
			<button
				type="button"
				disabled={testing}
				title="Run the graph without touching Discord, to see which branch it takes"
				class="rounded-lg bg-gray-200 px-4 py-2 font-medium transition duration-300 hover:bg-gray-300 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"
				onclick={test}
			>
				<i class="fa-solid {testing ? 'fa-spinner animate-spin' : 'fa-flask'}"></i> Test
			</button>
		{/if}
		<button
			type="button"
			disabled={loading || blocking.length > 0}
			class="rounded-lg bg-green-300 px-4 py-2 font-medium transition duration-300 hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500/75 dark:hover:bg-green-500"
			onclick={submit}
		>
			<i class="fa-solid {loading ? 'fa-spinner animate-spin' : 'fa-floppy-disk'}"></i> Save
		</button>
	</div>

	<div class="mb-2">
		<Toolbar problems={editor.problems} onTidy={tidy} />
	</div>

	{#if testResult}
		<div class="mb-2 rounded-xl bg-white p-3 text-sm shadow-sm dark:bg-slate-700">
			<p class="font-medium">
				Dry run: {testResult.status}
				<span class="text-gray-500 dark:text-slate-400">({testResult.durationMs}ms)</span>
			</p>
			<p class="text-xs text-gray-500 dark:text-slate-400">
				Conditions were evaluated for real; actions did nothing.
			</p>
			{#if testResult.error}<p class="mt-1 font-mono text-xs text-red-500">{testResult.error}</p>{/if}
			<div class="mt-2 flex flex-wrap gap-1">
				{#each testResult.steps as step, i (i)}
					<span class="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs dark:bg-slate-800">
						{step.t}<span class="text-gray-400">:{step.s}</span>
					</span>
				{/each}
			</div>
		</div>
	{/if}

	<div class="grid grid-cols-1 gap-4 lg:grid-cols-[16rem_1fr_20rem]">
		<NodePalette onadd={addNode} {hasTrigger} />

		<div
			class="automations-canvas h-[calc(100dvh-24rem)] min-h-[30rem] overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-700"
		>
			<Canvas bind:nodes bind:edges colorMode={theme === 'dark' ? 'dark' : 'light'} />
		</div>

		<Inspector node={selectedNode} />
	</div>
</SvelteFlowProvider>

<ToastContainer let:data placement="bottom-right" duration={4000}>
	<BootstrapToast {data} />
</ToastContainer>

<style>
	/* Keep the canvas chrome in step with the dashboard's own palette. */
	.automations-canvas :global(.svelte-flow) {
		--xy-background-color: transparent;
	}
	.automations-canvas :global(.svelte-flow__controls-button) {
		border-radius: 0.25rem;
	}
</style>
