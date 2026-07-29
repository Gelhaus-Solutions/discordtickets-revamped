<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toasts, ToastContainer, BootstrapToast } from 'svelte-toasts';
	import ErrorBox from '$components/ErrorBox.svelte';
	import { iconFor, CATEGORY_META } from '$components/AutomationEditor/nodes.js';

	let { data } = $props();

	let automations = $state(data.automations);
	let error = $state(null);
	let busy = $state({});

	const url = `/api/admin/guilds/${$page.params.guild}/automations`;
	const labelFor = (type) => data.catalogue.types.find((t) => t.type === type)?.label ?? type;

	const STATUS = {
		CANCELLED: { class: 'bg-gray-500/20 text-gray-600 dark:text-slate-400', icon: 'fa-circle-minus', text: 'Cancelled' },
		FAILED: { class: 'bg-red-500/20 text-red-600 dark:text-red-400', icon: 'fa-circle-xmark', text: 'Failed' },
		RUNNING: { class: 'bg-blue-500/20 text-blue-600 dark:text-blue-400', icon: 'fa-spinner', text: 'Running' },
		SKIPPED: { class: 'bg-amber-500/20 text-amber-700 dark:text-amber-400', icon: 'fa-circle-half-stroke', text: 'Skipped' },
		SUCCESS: { class: 'bg-green-500/20 text-green-700 dark:text-green-400', icon: 'fa-circle-check', text: 'Ran OK' },
		SUSPENDED: { class: 'bg-violet-500/20 text-violet-700 dark:text-violet-400', icon: 'fa-stopwatch', text: 'Waiting' },
		never: { class: 'bg-gray-500/20 text-gray-600 dark:text-slate-400', icon: 'fa-circle-minus', text: 'Never run' }
	};

	// Formatted after mount so the server and the browser cannot disagree about
	// the locale, which would be a hydration mismatch.
	let mounted = $state(false);
	onMount(() => (mounted = true));

	const atLimit = $derived(automations.length >= (data.catalogue.limits?.perGuild ?? Infinity));

	const toggle = async (automation) => {
		const next = !automation.enabled;
		automation.enabled = next; // optimistic
		busy[automation.id] = true;
		try {
			const response = await fetch(`${url}/${automation.id}`, {
				body: JSON.stringify({ enabled: next }),
				credentials: 'include',
				headers: { 'Content-Type': 'application/json; charset=UTF-8' },
				method: 'PATCH'
			});
			if (!response.ok) throw await response.json();
			toasts.add({ description: next ? 'Automation enabled' : 'Automation disabled', type: 'success' });
		} catch (err) {
			automation.enabled = !next; // revert
			error = err;
			window.scroll({ behavior: 'smooth', top: 0 });
		} finally {
			busy[automation.id] = false;
		}
	};

	const duplicate = async (automation) => {
		busy[automation.id] = true;
		try {
			const full = await (await fetch(`${url}/${automation.id}`, { credentials: 'include' })).json();
			const response = await fetch(url, {
				body: JSON.stringify({
					enabled: false,
					graph: full.graph,
					name: `${automation.name} (copy)`.slice(0, 100)
				}),
				credentials: 'include',
				headers: { 'Content-Type': 'application/json; charset=UTF-8' },
				method: 'POST'
			});
			const body = await response.json();
			if (!response.ok) throw body;
			automations = [...automations, { ...body, lastRun: null, nodeCount: body.graph?.nodes?.length ?? 0 }];
			toasts.add({ description: 'Automation duplicated', type: 'success' });
		} catch (err) {
			error = err;
			window.scroll({ behavior: 'smooth', top: 0 });
		} finally {
			busy[automation.id] = false;
		}
	};

	const del = async (automation) => {
		if (!confirm(`Delete "${automation.name}"?\nIts run history goes with it.`)) return;
		busy[automation.id] = true;
		try {
			const response = await fetch(`${url}/${automation.id}`, { credentials: 'include', method: 'DELETE' });
			if (!response.ok) throw await response.json();
			automations = automations.filter((a) => a.id !== automation.id);
			toasts.add({ description: 'Automation deleted', type: 'success' });
		} catch (err) {
			error = err;
			window.scroll({ behavior: 'smooth', top: 0 });
		} finally {
			busy[automation.id] = false;
		}
	};
</script>

<svelte:head><title>Automations</title></svelte:head>

{#if error}
	<ErrorBox {error} />
{/if}

<h1 class="m-4 text-center text-4xl font-bold">Automations</h1>
<p class="mx-4 mb-6 text-center text-gray-500 dark:text-slate-400">
	When something happens, check some things, then do some things.
</p>

<div class="mb-4 flex justify-end">
	<button
		type="button"
		disabled={atLimit}
		title={atLimit ? 'This server has reached its automation limit' : ''}
		class="rounded-lg bg-green-300 px-4 py-2 font-medium transition duration-300 hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500/75 dark:hover:bg-green-500"
		onclick={() => goto('./automations/new')}
	>
		<i class="fa-solid fa-plus"></i> New automation
	</button>
</div>

{#if automations.length === 0}
	<div class="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-slate-700">
		<i class="fa-solid fa-diagram-project mb-3 text-4xl text-gray-300 dark:text-slate-500"></i>
		<p class="text-gray-500 dark:text-slate-400">
			No automations yet. Make one to react to tickets, messages, buttons or a schedule.
		</p>
	</div>
{:else}
	<div class="flex flex-col gap-2">
		{#each automations as automation (automation.id)}
			{@const status = STATUS[automation.lastRun?.status] ?? STATUS.never}
			<div
				class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700 {automation.enabled
					? ''
					: 'border-l-4 border-gray-300 opacity-60 dark:border-slate-500'}"
			>
				<div class="flex flex-wrap items-center gap-3">
					<button
						type="button"
						role="switch"
						aria-checked={automation.enabled}
						aria-label="Enable this automation"
						disabled={busy[automation.id]}
						class="relative h-6 w-11 shrink-0 rounded-full transition duration-300 disabled:opacity-50 {automation.enabled
							? 'bg-blurple'
							: 'bg-gray-300 dark:bg-slate-500'}"
						onclick={() => toggle(automation)}
					>
						<span
							class="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all duration-300 {automation.enabled
								? 'left-[1.375rem]'
								: 'left-0.5'}"
						></span>
					</button>

					<div class="min-w-0 flex-1">
						<p class="truncate font-semibold">{automation.name}</p>
						<div class="mt-1 flex flex-wrap items-center gap-2 text-xs">
							<span class="rounded-full px-2 py-0.5 font-medium {CATEGORY_META.trigger.chip}">
								<i class="fa-solid {iconFor(automation.triggerType)}"></i>
								{labelFor(automation.triggerType)}
							</span>
							<span class="text-gray-500 dark:text-slate-400">
								{automation.nodeCount} step{automation.nodeCount === 1 ? '' : 's'}
							</span>
							<span class="rounded-full px-2 py-0.5 font-medium {status.class}">
								<i class="fa-solid {status.icon}"></i>
								{status.text}
							</span>
							{#if mounted && automation.lastRun}
								<span class="text-gray-400 dark:text-slate-500">
									{new Date(automation.lastRun.createdAt).toLocaleString()}
								</span>
							{/if}
						</div>
					</div>

					<div class="flex flex-wrap gap-2">
						<a
							href="./automations/{automation.id}"
							class="rounded-lg bg-blue-300 px-3 py-1.5 text-sm font-medium transition duration-300 hover:bg-blue-400 dark:bg-blue-500/75 dark:hover:bg-blue-500"
						>
							<i class="fa-solid fa-pen"></i> Edit
						</a>
						<a
							href="./automations/{automation.id}/runs"
							class="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium transition duration-300 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500"
						>
							<i class="fa-solid fa-list"></i> Runs
						</a>
						<button
							type="button"
							disabled={busy[automation.id] || atLimit}
							class="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium transition duration-300 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"
							onclick={() => duplicate(automation)}
						>
							<i class="fa-solid fa-copy"></i>
						</button>
						<button
							type="button"
							disabled={busy[automation.id]}
							class="rounded-lg bg-red-300 px-3 py-1.5 text-sm font-medium transition duration-300 hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500/75 dark:hover:bg-red-500"
							onclick={() => del(automation)}
						>
							<i class="fa-solid fa-trash"></i>
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>
{/if}

<ToastContainer let:data placement="bottom-right" duration={4000}>
	<BootstrapToast {data} />
</ToastContainer>
