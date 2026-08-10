<script>
	import '@xyflow/svelte/dist/style.css';
	import { SvelteFlowProvider } from '@xyflow/svelte';
	import { getContext, onMount, untrack } from 'svelte';
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
	let name = $state(untrack(() => data.automation?.name ?? 'New automation'));
	let enabled = $state(untrack(() => data.automation?.enabled ?? true));

	let error = $state(null);
	let loading = $state(false);
	let testing = $state(false);
	let testResult = $state(null);

	// Seeded once from the loader; the canvas owns it from here.
	const editor = createEditorState(
		untrack(() => ({
			buttonAutomations: data.buttonAutomations,
			catalogue: data.catalogue,
			categories: data.categories,
			channels: data.channels,
			questions: data.categories.flatMap((c) => c.questions ?? []),
			roles: data.roles
		}))
	);

	const graph = $derived(fromFlow(nodes, edges));
	const selectedNode = $derived(nodes.find((n) => n.id === editor.selected) ?? null);

	$effect(() => {
		editor.problems = validate(graph, data.catalogue);
	});

	// What an in-graph button may point at. Kept on the shared editor state so
	// LayoutField does not need the whole graph threaded into it — and so the
	// layout modal, which renders outside this tree, can be handed a plain list.
	$effect(() => {
		editor.buttonTriggers = nodes
			.filter((n) => n.data.type === 'trigger.button.pressed')
			.map((n) => ({ id: n.id, label: n.data.params?.label || 'Button' }));
	});

	// `fromFlow` rounds positions, so a drag that ends where it started is not a
	// change and does not arm the unsaved-changes guard.
	let saved = $state(untrack(() => JSON.stringify({ enabled, graph: starting, name })));
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
		<NodePalette onadd={addNode} />

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
	/*
	 * Svelte Flow's defaults are tuned for a white canvas: a 1px #b1b1b7 edge and
	 * a 6px handle. Against this dashboard's dark slate both are close to
	 * invisible, and a 6px target is a genuinely hard thing to hit with a mouse.
	 */
	.automations-canvas :global(.svelte-flow) {
		--xy-background-color: transparent;
		--xy-connectionline-stroke: #5865f2;
		--xy-connectionline-stroke-width: 2.5;
		--xy-edge-stroke: #64748b;
		--xy-edge-stroke-selected: #5865f2;
		--xy-edge-stroke-width: 2.5;
	}

	/* Slate-400 rather than slate-500: the dark canvas needs the extra contrast. */
	:global(.dark) .automations-canvas :global(.svelte-flow) {
		--xy-edge-stroke: #94a3b8;
	}

	.automations-canvas :global(.svelte-flow__edge-path) {
		stroke-linecap: round;
	}

	/* Hovering an edge highlights it, which makes the little delete cross findable. */
	.automations-canvas :global(.svelte-flow__edge:hover .svelte-flow__edge-path) {
		stroke: #5865f2;
	}

	.automations-canvas :global(.svelte-flow__handle) {
		border-width: 2px;
		height: 14px;
		width: 14px;
	}

	/*
	 * The grab zone, not the dot. This gives the handle a ~34px target while it
	 * still *looks* like a 14px dot — pointer-events are inherited from the
	 * handle, so this only becomes interactive when the handle itself is.
	 */
	.automations-canvas :global(.svelte-flow__handle)::after {
		border-radius: 9999px;
		content: '';
		/* 30px target around a 14px dot. Not larger: on a two-output node the
		   true/false zones would start to overlap and the lower one would become
		   unreliable to grab. */
		inset: -8px;
		position: absolute;
	}

	.automations-canvas :global(.svelte-flow__handle:hover) {
		box-shadow: 0 0 0 4px rgb(88 101 242 / 0.25);
	}

	.automations-canvas :global(.svelte-flow__controls-button) {
		border-radius: 0.25rem;
	}
</style>
