<script>
	import { page } from '$app/stores';
	import { replaceState } from '$app/navigation';
	import { I18nLite } from '@eartharoid/i18n';
	import { getContext } from 'svelte';

	/** @type {{data: import('./$types').PageData}} */
	let { data } = $props();
	const guild = $derived(data.guild);
	const t = $derived(new I18nLite().loadParsed(...data.translations).createTranslator());

	const locale = getContext('locale');

	// One override on top of the loader's payload, rather than six `$state`
	// seeds. Seeding from `data` would strand this page on whichever guild it
	// first rendered — SvelteKit reuses the component across a client-side
	// navigation, so an initialiser never runs a second time.
	let fetched = $state(null);
	let filterOverride = $state(null);

	const result = $derived(fetched ?? data.initial);
	const filter = $derived(filterOverride ?? data.filter);
	const tickets = $derived(result.tickets);
	const counts = $derived(result.counts);
	const meta = $derived(result.meta);
	const currentPage = $derived(result.pagination.page);
	const totalPages = $derived(result.pagination.totalPages);
	let isLoading = $state(false);
	let loadError = $state(false);
	let sort = $state('oldest');
	let categoryId = $state('');
	let search = $state('');

	const BUCKETS = [
		{ key: 'attention', label: 'staff.bucket_attention' },
		{ key: 'unclaimed', label: 'staff.bucket_unclaimed' },
		{ key: 'all', label: 'staff.bucket_all' }
	];

	const bucketCount = (key) =>
		key === 'unclaimed' ? counts?.unclaimed : key === 'all' ? counts?.open : null;

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

	/** The ticket id *is* the channel id. Threads address the same way. */
	const discordUrl = (ticket) => `https://discord.com/channels/${guild.id}/${ticket.id}`;

	/**
	 * The waiting chip.
	 *
	 * `awaitingResponseFrom` is null on every ticket that predates the column and
	 * is never backfilled, so "no value" must not be rendered as "waiting on the
	 * member" — that would be a confident lie. Fall back to what
	 * `firstResponseAt` can prove, and say plainly when nothing is known.
	 */
	const waitingChip = (ticket) => {
		if (ticket.awaitingResponseFrom === 'STAFF') {
			return { key: 'staff.chip_awaiting_staff', tone: 'amber' };
		}
		if (ticket.awaitingResponseFrom === 'USER') {
			return { key: 'staff.chip_awaiting_user', tone: 'grey' };
		}
		if (ticket.firstResponseAt === null) {
			return { key: 'staff.chip_never_answered', tone: 'amber' };
		}
		return { key: 'staff.chip_unknown', tone: 'grey', hint: t('staff.chip_unknown_hint') };
	};

	/** Categories present on this page, for the filter. No extra endpoint. */
	const categories = $derived(
		[...new Map(tickets.filter((x) => x.categoryId).map((x) => [x.categoryId, x])).values()].map(
			(x) => ({ emoji: x.categoryEmoji, id: x.categoryId, name: x.categoryName })
		)
	);

	// Client-side, and only over the current page. `topic` is encrypted at rest
	// so the server cannot search it — see the hint rendered under the box.
	const visible = $derived(
		tickets.filter((ticket) => {
			if (categoryId && String(ticket.categoryId) !== String(categoryId)) return false;
			const term = search.trim().toLowerCase();
			if (!term) return true;
			return (
				String(ticket.number).includes(term) || (ticket.topic ?? '').toLowerCase().includes(term)
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
	const loadPage = async (nextFilter, nextPage = 1) => {
		isLoading = true;
		loadError = false;
		try {
			const params = new URLSearchParams({
				filter: nextFilter,
				limit: '25',
				page: String(nextPage),
				sort
			});
			const res = await fetch(`/api/guilds/${guild.id}/tickets?${params}`, {
				credentials: 'include'
			});
			if (!res.ok) throw new Error(String(res.status));
			fetched = await res.json();
			filterOverride = nextFilter;

			const url = new URL($page.url);
			url.searchParams.set('filter', nextFilter);
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
	<title>{t('staff.title', { guild: guild.name })}</title>
</svelte:head>

<div class="container mx-auto max-w-5xl p-4">
	<h1 class="text-3xl font-bold">{t('staff.heading')}</h1>
	<p class="mb-4 text-base text-dgrey-500 dark:text-dgrey-400">
		{t('staff.subheading', { guild: guild.name })}
	</p>

	<div class="mb-3 flex flex-wrap gap-2">
		{#each BUCKETS as bucket (bucket.key)}
			<button
				type="button"
				disabled={isLoading}
				onclick={() => loadPage(bucket.key)}
				class="rounded-md px-3 py-1 text-sm duration-300 disabled:cursor-not-allowed {filter ===
				bucket.key
					? 'bg-blurple text-white'
					: 'bg-dgrey-900/10 hover:bg-dgrey-900/20 dark:bg-dgrey-400/10 dark:hover:bg-dgrey-400/20'}"
			>
				{t(bucket.label)}
				{#if bucketCount(bucket.key) != null}
					<span class="opacity-75">({bucketCount(bucket.key)})</span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="mb-3 flex flex-wrap items-end gap-3">
		<label class="text-sm font-medium">
			{t('staff.filter_category')}
			<select class="input form-multiselect block font-normal" bind:value={categoryId}>
				<option value="">{t('staff.filter_all_categories')}</option>
				{#each categories as category (category.id)}
					<option value={category.id}>{category.emoji ?? ''} {category.name}</option>
				{/each}
			</select>
		</label>
		<label class="text-sm font-medium">
			{t('staff.sort')}
			<select
				class="input form-multiselect block font-normal"
				bind:value={sort}
				onchange={() => loadPage(filter, 1)}
			>
				<option value="oldest">{t('staff.sort_oldest')}</option>
				<option value="newest">{t('staff.sort_newest')}</option>
			</select>
		</label>
		<label class="grow text-sm font-medium">
			{t('staff.search')}
			<input
				type="text"
				class="input form-input block w-full font-normal"
				placeholder={t('staff.search_placeholder')}
				bind:value={search}
			/>
		</label>
	</div>
	<p class="mb-4 text-xs text-dgrey-500 dark:text-dgrey-400">{t('staff.search_hint')}</p>

	{#if filter === 'attention' && meta?.staleAfter == null}
		<p class="mb-3 rounded-lg bg-dgrey-200 p-3 text-sm dark:bg-dgrey-900">
			{t('staff.stale_disabled')}
		</p>
	{/if}

	{#if isLoading}
		<p class="text-base text-dgrey-500 dark:text-dgrey-400">{t('common:loading')}</p>
	{:else if loadError}
		<div class="rounded-lg bg-dgrey-200 p-4 dark:bg-dgrey-900">
			<p>{t('staff.load_failed')}</p>
			<button
				type="button"
				onclick={() => loadPage(filter, currentPage)}
				class="mt-2 rounded-md bg-dgrey-900/10 px-3 py-1 duration-300 hover:bg-dgrey-900/20 dark:bg-dgrey-400/10 dark:hover:bg-dgrey-400/20"
			>
				{t('common:retry')}
			</button>
		</div>
	{:else if visible.length === 0}
		<div class="rounded-lg bg-dgrey-200 p-4 dark:bg-dgrey-900">
			<p>
				{#if tickets.length > 0}
					{t('staff.empty_filtered')}
				{:else if filter === 'all'}
					{t('staff.empty_all')}
				{:else}
					{t('staff.empty_attention')}
				{/if}
			</p>
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="border-b border-dgrey-300 dark:border-dgrey-700">
					<tr>
						<th class="p-2">{t('staff.col_ticket')}</th>
						<th class="p-2">{t('staff.col_topic')}</th>
						<th class="p-2">{t('staff.col_category')}</th>
						<th class="p-2">{t('staff.col_activity')}</th>
						<th class="p-2">{t('staff.col_status')}</th>
					</tr>
				</thead>
				<tbody>
					{#each visible as ticket (ticket.id)}
						{@const chip = waitingChip(ticket)}
						<tr class="border-b border-dgrey-200 dark:border-dgrey-800">
							<td class="p-2 font-semibold">
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
							<td class="p-2">{ticket.topic || t('staff.no_topic')}</td>
							<td class="p-2">
								{ticket.categoryEmoji ?? ''}
								{ticket.categoryName ?? t('staff.uncategorised')}
							</td>
							<td class="p-2 whitespace-nowrap">
								{ago(ticket.lastMessageAt) ?? t('staff.never')}
							</td>
							<td class="p-2 whitespace-nowrap">
								<span
									class="rounded-md px-2 py-0.5 text-xs {ticket.claimedById
										? 'bg-dgrey-900/10 dark:bg-dgrey-400/10'
										: 'bg-amber-500/20'}"
								>
									{ticket.claimedById ? t('staff.chip_claimed') : t('staff.chip_unclaimed')}
								</span>
								<span
									class="ml-1 rounded-md px-2 py-0.5 text-xs {chip.tone === 'amber'
										? 'bg-amber-500/20'
										: 'bg-dgrey-900/10 dark:bg-dgrey-400/10'}"
									title={chip.hint ?? ''}
								>
									{t(chip.key)}
								</span>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if totalPages > 1}
			<div class="mt-3 flex items-center justify-center gap-3 text-sm">
				<button
					type="button"
					disabled={currentPage <= 1}
					onclick={() => loadPage(filter, currentPage - 1)}
					class="rounded-md bg-dgrey-900/10 px-3 py-1 duration-300 hover:bg-dgrey-900/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-dgrey-400/10 dark:hover:bg-dgrey-400/20"
				>
					{t('staff.prev')}
				</button>
				<span>{t('staff.page_of', { page: currentPage, pages: totalPages })}</span>
				<button
					type="button"
					disabled={currentPage >= totalPages}
					onclick={() => loadPage(filter, currentPage + 1)}
					class="rounded-md bg-dgrey-900/10 px-3 py-1 duration-300 hover:bg-dgrey-900/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-dgrey-400/10 dark:hover:bg-dgrey-400/20"
				>
					{t('staff.next')}
				</button>
			</div>
		{/if}
	{/if}

	{#if guild.privilegeLevel >= 2}
		<p class="mt-6 text-xs text-dgrey-500 dark:text-dgrey-400">
			{t('staff.closed_hint')}
			<a
				href={`/settings/${guild.id}/transcripts`}
				class="underline decoration-dotted hover:decoration-solid"
			>
				{t('common:settings_panel')}
			</a>
		</p>
	{/if}
</div>
