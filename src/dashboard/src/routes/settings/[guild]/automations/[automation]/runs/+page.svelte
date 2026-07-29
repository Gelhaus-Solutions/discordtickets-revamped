<script>
	import { page } from '$app/stores';
	import RunLog from '$components/AutomationEditor/RunLog.svelte';

	let { data } = $props();

	let runs = $state(data.runs);
	let loading = $state(false);

	// A button rather than a poller: nothing else in this dashboard polls, and a
	// timer here would be out of character.
	const refresh = async () => {
		loading = true;
		const response = await fetch(
			`/api/admin/guilds/${$page.params.guild}/automations/${$page.params.automation}/runs?limit=50`,
			{ credentials: 'include' }
		);
		if (response.ok) runs = (await response.json()).runs;
		loading = false;
	};
</script>

<svelte:head><title>{data.automation.name} runs</title></svelte:head>

<div class="mb-4 flex flex-wrap items-center gap-3">
	<a href="../../automations" class="link"><i class="fa-solid fa-angle-left"></i> Automations</a>
	<h1 class="flex-1 text-2xl font-bold">{data.automation.name}</h1>
	<a href="../{$page.params.automation}" class="link">Edit</a>
	<button
		type="button"
		disabled={loading}
		class="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium transition duration-300 hover:bg-gray-300 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"
		onclick={refresh}
	>
		<i class="fa-solid {loading ? 'fa-spinner animate-spin' : 'fa-rotate'}"></i> Refresh
	</button>
</div>

<RunLog {runs} catalogue={data.catalogue} />
