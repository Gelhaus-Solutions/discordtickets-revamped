<script>
	import { page } from '$app/stores';
	import { replaceState } from '$app/navigation';
	import { I18nLite } from '@eartharoid/i18n';
	import { getContext } from 'svelte';
	// Category emoji are stored as the admin typed them, often a shortcode like
	// `:arrow_up_down:`; the raw column rendered that as literal text.
	import { displayEmoji } from '$lib/emoji.js';

	/** @type {{data: import('./$types').PageData}} */
	let { data } = $props();
	const guild = $derived(data.guild);
	const t = $derived(new I18nLite().loadParsed(...data.translations).createTranslator());

	const locale = getContext('locale');

	// One override on top of the loader's payload rather than a `$state` seed per
	// field. Seeding from `data` would strand this page on whichever guild it
	// first rendered — SvelteKit reuses the component across a client-side
	// navigation, so an initialiser never runs a second time.
	let fetched = $state(null);
	let statusOverride = $state(null);
	let categoryOverride = $state(null);

	const result = $derived(fetched ?? data.initial);
	const status = $derived(statusOverride ?? data.status);
	const categoryId = $derived(categoryOverride ?? data.categoryId);
	const tickets = $derived(result.tickets);
	const categories = $derived(result.categories);
	const currentPage = $derived(result.pagination.page);
	const totalPages = $derived(result.pagination.totalPages);
	const total = $derived(result.pagination.total);
	let isLoading = $state(false);
	let loadError = $state(false);
	let search = $state('');

	const TABS = [
		{ key: 'all', label: 'tickets.status_all' },
		{ key: 'open', label: 'tickets.status_open' },
		{ key: 'closed', label: 'tickets.status_closed' }
	];

	const rtf = new Intl.RelativeTimeFormat(locale ?? 'en-GB', { numeric: 'auto' });
	const UNITS = [
		['year', 31536000000],
		['month', 2592000000],
		['week', 604800000],
		['day', 86400000],
		['hour', 3600000],
		['minute', 60000]
	];
	const ago = (value) => {
		if (!value) return null;
		const diff = new Date(value).getTime() - Date.now();
		for (const [unit, size] of UNITS) {
			if (Math.abs(diff) >= size) return rtf.format(Math.round(diff / size), unit);
		}
		return rtf.format(Math.round(diff / 1000), 'second');
	};

	/** "🔼 Install Problem", or just the name when there is no emoji. */
	const categoryLabel = (item) =>
		[displayEmoji(item.categoryEmoji ?? item.emoji ?? ''), item.categoryName ?? item.name]
			.filter(Boolean)
			.join(' ');

	/** The ticket id *is* the channel id. Threads address the same way. */
	const discordUrl = (ticket) => `https://discord.com/channels/${guild.id}/${ticket.id}`;

	// Client-side, and only over the current page. `topic` is encrypted at rest so
	// the server cannot search it — see the hint rendered under the box. The
	// status and category filters are server-side for the opposite reason: they
	// decide what the pagination is counting.
	const visible = $derived(
		tickets.filter((ticket) => {
			const term = search.trim().toLowerCase();
			if (!term) return true;
			return (
				String(ticket.number).includes(term) ||
				(ticket.topic ?? '').toLowerCase().includes(term) ||
				(ticket.categoryName ?? '').toLowerCase().includes(term)
			);
		})
	);

	/**
	 * Fetch a page.
	 *
	 * Deliberately not `goto()`: the portal layout swaps the whole subtree for a
	 * spinner whenever `$navigating` is set, so every tab click would blank the
	 * page. `replaceState` keeps the URL shareable without re-running `load`.
	 */
	const loadPage = async (nextStatus, nextCategory, nextPage = 1) => {
		isLoading = true;
		loadError = false;
		try {
			const params = new URLSearchParams({
				limit: '25',
				page: String(nextPage),
				status: nextStatus
			});
			if (nextCategory) params.set('categoryId', String(nextCategory));
			const res = await fetch(`/api/guilds/${guild.id}/tickets/@me?${params}`, {
				credentials: 'include'
			});
			if (!res.ok) throw new Error(String(res.status));
			fetched = await res.json();
			statusOverride = nextStatus;
			categoryOverride = nextCategory;

			const url = new URL($page.url);
			if (nextStatus === 'all') url.searchParams.delete('status');
			else url.searchParams.set('status', nextStatus);
			if (nextCategory) url.searchParams.set('categoryId', String(nextCategory));
			else url.searchParams.delete('categoryId');
			if (nextPage > 1) url.searchParams.set('page', String(nextPage));
			else url.searchParams.delete('page');
			replaceState(url, {});
		} catch {
			loadError = true;
		} finally {
			isLoading = false;
		}
	};
</script>

<svelte:head>
	<title>{t('tickets.title', { guild: guild.name })}</title>
</svelte:head>

<div>
	<!-- The heading convention every settings page uses. -->
	<h1 class="m-4 text-center text-4xl font-bold">{t('tickets.heading')}</h1>
	<p class="mb-6 text-center text-base text-gray-500 dark:text-slate-400">
		{t('tickets.subheading', { guild: guild.name })}
	</p>

	<div class="mb-3 flex flex-wrap gap-2">
		{#each TABS as tab (tab.key)}
			<button
				type="button"
				disabled={isLoading}
				onclick={() => loadPage(tab.key, categoryId)}
				class="rounded-md px-3 py-1 text-sm duration-300 disabled:cursor-not-allowed {status ===
				tab.key
					? 'bg-blurple text-white'
					: 'bg-gray-100 hover:bg-blurple hover:text-white dark:bg-slate-800 dark:hover:bg-blurple'}"
			>
				{t(tab.label)}
			</button>
		{/each}
	</div>

	<div class="mb-3 flex flex-wrap items-end gap-3">
		{#if categories.length > 0}
			<label class="text-sm font-medium">
				{t('tickets.filter_category')}
				<select
					class="input form-select font-normal"
					value={categoryId}
					disabled={isLoading}
					onchange={(event) => loadPage(status, event.currentTarget.value)}
				>
					<option value="">{t('tickets.filter_all_categories')}</option>
					{#each categories as category (category.id)}
						<option value={String(category.id)}>{categoryLabel(category)}</option>
					{/each}
				</select>
			</label>
		{/if}
		<label class="grow text-sm font-medium">
			{t('tickets.search')}
			<input
				type="text"
				class="input form-input block w-full font-normal"
				placeholder={t('tickets.search_placeholder')}
				bind:value={search}
			/>
		</label>
	</div>
	<p class="mb-4 text-xs text-gray-500 dark:text-slate-400">{t('tickets.search_hint')}</p>

	{#if isLoading}
		<p class="text-base text-gray-500 dark:text-slate-400">{t('common:loading')}</p>
	{:else if loadError}
		<div class="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-700">
			<p>{t('tickets.load_failed')}</p>
			<button
				type="button"
				onclick={() => loadPage(status, categoryId, currentPage)}
				class="mt-2 rounded-md bg-gray-100 px-3 py-1 transition duration-300 hover:bg-blurple hover:text-white dark:bg-slate-800 dark:hover:bg-blurple"
			>
				{t('common:retry')}
			</button>
		</div>
	{:else if visible.length === 0}
		<div class="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-700">
			<p class="font-medium">
				{#if tickets.length > 0}
					{t('tickets.empty_filtered')}
				{:else if status === 'open'}
					{t('tickets.empty_open')}
				{:else if status === 'closed'}
					{t('tickets.empty_closed')}
				{:else}
					{t('tickets.empty_all')}
				{/if}
			</p>
			{#if tickets.length === 0 && status !== 'closed'}
				<p class="text-base text-gray-500 dark:text-slate-400">
					{t('tickets.open_from_discord')}
				</p>
			{/if}
		</div>
	{:else}
		<div class="overflow-x-auto rounded-xl bg-white p-2 shadow-sm dark:bg-slate-700">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-gray-300 dark:border-slate-600">
					<tr>
						<th class="p-2">{t('tickets.col_ticket')}</th>
						<th class="p-2">{t('tickets.col_topic')}</th>
						<th class="p-2">{t('tickets.col_category')}</th>
						<th class="p-2">{t('tickets.col_opened')}</th>
						<th class="p-2">{t('tickets.col_status')}</th>
					</tr>
				</thead>
				<tbody>
					{#each visible as ticket (ticket.id)}
						<tr class="border-b border-gray-200 dark:border-slate-700 {ticket.open ? '' : 'opacity-75'}">
							<td class="p-2 font-semibold">
								<!--
									A link even when closed. A closed CHANNEL-mode ticket has had
									its channel deleted so this may 404 in Discord, but a closed
									thread is still readable — and a row that looks identical to
									the others while silently not being clickable is worse than a
									link that sometimes cannot resolve.
								-->
								<a
									href={discordUrl(ticket)}
									target="_blank"
									rel="noopener noreferrer"
									class="underline decoration-dotted hover:decoration-solid"
									title={t('common:open_in_discord')}
								>
									#{ticket.number}
									<i class="fa-solid fa-arrow-up-right-from-square text-xs"></i>
								</a>
							</td>
							<td class="p-2">{ticket.topic || t('tickets.no_topic')}</td>
							<td class="p-2">{categoryLabel(ticket)}</td>
							<td class="p-2 whitespace-nowrap">{ago(ticket.createdAt)}</td>
							<td class="p-2 whitespace-nowrap">
								<span
									class="rounded-md px-2 py-0.5 text-xs {ticket.open
										? 'bg-emerald-500/20'
										: 'bg-gray-100 dark:bg-slate-800'}"
									title={ticket.open || !ticket.closedAt
										? ''
										: t('tickets.closed_when', { when: ago(ticket.closedAt) })}
								>
									{ticket.open ? t('tickets.chip_open') : t('tickets.chip_closed')}
								</span>
								{#if ticket.open}
									<span
										class="ml-1 rounded-md px-2 py-0.5 text-xs {ticket.claimedById
											? 'bg-gray-100 dark:bg-slate-800'
											: 'bg-amber-500/20'}"
									>
										{ticket.claimedById ? t('tickets.chip_claimed') : t('tickets.chip_unclaimed')}
									</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<div class="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm">
			<span class="text-gray-500 dark:text-slate-400">{t('tickets.total', { total })}</span>
			{#if totalPages > 1}
				<button
					type="button"
					disabled={currentPage <= 1}
					onclick={() => loadPage(status, categoryId, currentPage - 1)}
					class="rounded-md bg-gray-100 px-3 py-1 transition duration-300 hover:bg-blurple hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-blurple"
				>
					{t('tickets.prev')}
				</button>
				<span>{t('tickets.page_of', { page: currentPage, pages: totalPages })}</span>
				<button
					type="button"
					disabled={currentPage >= totalPages}
					onclick={() => loadPage(status, categoryId, currentPage + 1)}
					class="rounded-md bg-gray-100 px-3 py-1 transition duration-300 hover:bg-blurple hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:hover:bg-blurple"
				>
					{t('tickets.next')}
				</button>
			{/if}
		</div>

		{#if status !== 'open'}
			<p class="mt-6 text-xs text-gray-500 dark:text-slate-400">{t('tickets.closed_hint')}</p>
		{/if}
	{/if}
</div>
