<script>
	import { page } from '$app/stores';
	import ErrorBox from '$components/ErrorBox.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {import('./$types').PageData} data
	 */

	/** @type {Props} */
	let { data } = $props();

	let panels = $state(data.panels);
	let error = $state(null);
	let busy = $state({});

	const STATUS = {
		channel_missing: {
			class: 'bg-red-500/20 text-red-600 dark:text-red-400',
			icon: 'fa-triangle-exclamation',
			text: 'Channel deleted'
		},
		ok: {
			class: 'bg-green-500/20 text-green-700 dark:text-green-400',
			icon: 'fa-circle-check',
			text: 'Posted'
		},
		unposted: {
			class: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
			icon: 'fa-circle-exclamation',
			text: 'Not posted'
		}
	};

	const refresh = async () => {
		const response = await fetch(`/api/admin/guilds/${$page.params.guild}/panels`, {
			credentials: 'include'
		});
		if (response.ok) panels = await response.json();
	};

	const resend = async (panel) => {
		try {
			error = null;
			busy[panel.id] = true;
			const response = await fetch(
				`/api/admin/guilds/${$page.params.guild}/panels/${panel.id}/sync`,
				{ credentials: 'include', method: 'POST' }
			);
			const body = await response.json();
			if (!response.ok) throw body;
			await refresh();
		} catch (err) {
			error = err;
			window.scroll({ behavior: 'smooth', top: 0 });
		} finally {
			busy[panel.id] = false;
		}
	};

	const del = async (panel) => {
		if (!confirm(`Delete "${panel.name}"? This removes the message from Discord too.`)) return;
		try {
			error = null;
			busy[panel.id] = true;
			const response = await fetch(`/api/admin/guilds/${$page.params.guild}/panels/${panel.id}`, {
				credentials: 'include',
				method: 'DELETE'
			});
			if (!response.ok) throw await response.json();
			panels = panels.filter((p) => p.id !== panel.id);
		} catch (err) {
			error = err;
			window.scroll({ behavior: 'smooth', top: 0 });
		} finally {
			busy[panel.id] = false;
		}
	};
</script>

<h1 class="m-4 text-center text-4xl font-bold">Panels</h1>

<div class="m-2 mx-auto max-w-3xl sm:p-4">
	{#if error}
		<ErrorBox {error} />
	{/if}

	<div class="mb-4 flex justify-end">
		<a
			href="./panels/new"
			class="rounded-lg bg-green-300 p-2 px-5 font-medium transition duration-300 hover:bg-green-500 hover:text-white dark:bg-green-500/50 dark:hover:bg-green-500"
		>
			<i class="fa-solid fa-plus"></i> New panel
		</a>
	</div>

	{#if panels.length === 0}
		<div class="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-slate-700">
			<i class="fa-solid fa-ticket text-4xl text-gray-400 dark:text-slate-500"></i>
			<p class="mt-4 text-lg font-medium">No panels yet</p>
			<p class="mt-1 text-gray-500 dark:text-slate-400">
				A panel is the message members click to open a ticket.
			</p>
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each panels as panel (panel.id)}
				<div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
					<div class="flex flex-wrap items-start justify-between gap-2">
						<div class="min-w-0">
							<h2 class="text-lg font-bold">{panel.name}</h2>
							<p class="text-sm text-gray-500 dark:text-slate-400">
								{#if panel.channelName}
									<span class="font-mono">#{panel.channelName}</span>
								{:else}
									<span class="italic">unknown channel</span>
								{/if}
								&middot;
								{panel.categories.length} categor{panel.categories.length === 1 ? 'y' : 'ies'}
							</p>
						</div>

						<span
							class="flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium {STATUS[
								panel.status
							]?.class ?? ''}"
						>
							<i class="fa-solid {STATUS[panel.status]?.icon ?? 'fa-circle'}"></i>
							{STATUS[panel.status]?.text ?? panel.status}
						</span>
					</div>

					{#if panel.status === 'unposted'}
						<p class="mt-2 text-sm text-amber-600 dark:text-amber-400">
							The message is no longer in Discord. Re-send it to put it back.
						</p>
					{:else if panel.status === 'channel_missing'}
						<p class="mt-2 text-sm text-red-600 dark:text-red-400">
							The channel this panel was in has been deleted. Edit the panel to choose a new one.
						</p>
					{/if}

					<div class="mt-3 flex flex-wrap gap-2">
						<a
							href={`./panels/${panel.id}`}
							class="rounded-lg bg-blue-300 px-4 py-2 font-medium transition duration-300 hover:bg-blue-500 hover:text-white dark:bg-blue-500/50 dark:hover:bg-blue-500"
						>
							<i class="fa-solid fa-pen"></i> Edit
						</a>
						<button
							type="button"
							disabled={busy[panel.id] || panel.status === 'channel_missing'}
							class="rounded-lg bg-gray-200 px-4 py-2 font-medium transition duration-300 hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"
							onclick={() => resend(panel)}
						>
							{#if busy[panel.id]}
								<i class="fa-solid fa-spinner animate-spin"></i>
							{:else}
								<i class="fa-solid fa-paper-plane"></i>
							{/if}
							{panel.status === 'ok' ? 'Re-send' : 'Post'}
						</button>
						<button
							type="button"
							disabled={busy[panel.id]}
							class="rounded-lg bg-red-300 px-4 py-2 font-medium transition duration-300 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500/50 dark:hover:bg-red-500"
							onclick={() => del(panel)}
						>
							<i class="fa-solid fa-trash"></i> Delete
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
