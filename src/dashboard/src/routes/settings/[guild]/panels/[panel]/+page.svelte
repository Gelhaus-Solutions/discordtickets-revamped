<script>
	import { preventDefault } from 'svelte/legacy';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import Required from '$components/Required.svelte';
	import ErrorBox from '$components/ErrorBox.svelte';
	import BlockEditor from '$components/BlockEditor/BlockEditor.svelte';
	import Preview from '$components/BlockEditor/Preview.svelte';
	import { newBlock, newLayout, hasEntryPoint } from '$components/BlockEditor/blocks.js';

	/**
	 * @typedef {Object} Props
	 * @property {import('./$types').PageData} data
	 */

	/** @type {Props} */
	let { data } = $props();

	const isNew = $derived($page.params.panel === 'new');
	// svelte-ignore state_referenced_locally
	const channels = data.channels.filter((c) => c.type === 0); // text channels

	/** A sensible starting point: a container with a heading and a button row. */
	const starterLayout = () => {
		const container = newBlock('container');
		const text = container.blocks[0];
		text.content = '## Need help?\nPick a category below to open a ticket.';
		const buttons = newBlock('buttons');
		buttons.buttons = data.categories.slice(0, 5).map((c) => ({
			categoryId: c.id,
			emoji: null,
			kind: 'ticket',
			label: null,
			style: null
		}));
		container.blocks = [text, newBlock('separator'), buttons, newBlock('footer')];
		return { ...newLayout(), blocks: [container] };
	};

	// The editor's working copy of the panel. Seeded once and then owned by the
	// form — deriving these would overwrite an in-progress edit.
	// svelte-ignore state_referenced_locally
	let name = $state(data.panel?.name ?? 'Ticket panel');
	// svelte-ignore state_referenced_locally
	let channel = $state(data.panel?.channelId ?? 'new');
	// svelte-ignore state_referenced_locally
	let layout = $state(data.panel?.layout ?? starterLayout());
	let error = $state(null);
	let loading = $state(false);

	const missingEntryPoint = $derived(!hasEntryPoint(layout));

	const submit = async () => {
		try {
			error = null;
			loading = true;
			const url = isNew
				? `/api/admin/guilds/${$page.params.guild}/panels`
				: `/api/admin/guilds/${$page.params.guild}/panels/${$page.params.panel}`;
			const response = await fetch(url, {
				body: JSON.stringify({
					channel: channel === 'new' ? null : channel,
					layout,
					name
				}),
				credentials: 'include',
				headers: { 'Content-Type': 'application/json; charset=UTF-8' },
				method: isNew ? 'POST' : 'PATCH'
			});
			const body = await response.json();
			if (!response.ok) throw body;
			await goto(`/settings/${$page.params.guild}/panels`);
		} catch (err) {
			loading = false;
			error = err;
			window.scroll({ behavior: 'smooth', top: 0 });
		}
	};
</script>

<h1 class="m-4 text-center text-4xl font-bold">
	{isNew ? 'Create a panel' : 'Edit panel'}
</h1>

<div class="m-2 mx-auto max-w-3xl sm:p-4">
	{#if error}
		<ErrorBox {error} />
	{/if}

	<form onsubmit={preventDefault(() => submit())} class="flex flex-col gap-4">
		<div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<label>
					<span class="font-medium">Name</span>
					<Required />
					<i
						class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
						title="Only shown in the dashboard, to tell your panels apart"
					></i>
					<input type="text" maxlength="100" class="input form-input" required bind:value={name} />
				</label>

				<label>
					<span class="font-medium">Channel</span>
					<i
						class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
						title="The channel the panel message is posted in"
					></i>
					<select required class="input form-multiselect font-normal" bind:value={channel}>
						{#if isNew}
							<option value="new">Create a new channel</option>
						{/if}
						{#each channels as c}
							<option value={c.id}>{c.name}</option>
						{/each}
					</select>
				</label>
			</div>

			{#if channel !== 'new'}
				<p class="mt-2 text-center text-cyan-500">
					<i class="fa-solid fa-circle-info"></i>
					Make sure members can read, but not send messages, in that channel.
				</p>
			{/if}
		</div>

		<div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
			<h2 class="mb-1 font-medium">Layout</h2>
			<p class="mb-3 text-sm text-gray-500 dark:text-slate-400">
				Drag blocks to reorder them. Members need at least one ticket button or select menu to open
				a ticket.
			</p>

			{#if missingEntryPoint}
				<p class="mb-3 rounded-lg border-2 border-amber-500 bg-amber-500/10 p-2 text-sm">
					<i class="fa-solid fa-triangle-exclamation text-amber-500"></i>
					This panel has no ticket button or select menu, so nobody can open a ticket from it.
				</p>
			{/if}

			<BlockEditor
				bind:blocks={layout.blocks}
				categories={data.categories}
				automations={data.automations}
				context="panel"
			/>
		</div>

		<Preview
			{layout}
			categories={data.categories}
			context="panel"
			primaryColour={data.settings?.primaryColour ?? '#009999'}
			footer={data.settings?.footer ?? ''}
		/>

		<div class="flex justify-center gap-2">
			<a
				href={`/settings/${$page.params.guild}/panels`}
				class="rounded-lg bg-gray-200 p-2 px-5 font-medium transition duration-300 hover:bg-gray-400 dark:bg-slate-600 dark:hover:bg-slate-500"
			>
				Cancel
			</a>
			<button
				type="submit"
				disabled={loading}
				class="rounded-lg bg-green-300 p-2 px-5 font-medium transition duration-300 hover:bg-green-500 hover:text-white disabled:cursor-not-allowed dark:bg-green-500/50 dark:hover:bg-green-500"
			>
				{#if loading}
					<i class="fa-solid fa-spinner animate-spin"></i>
				{/if}
				{isNew ? 'Create' : 'Save'}
			</button>
		</div>
	</form>
</div>
