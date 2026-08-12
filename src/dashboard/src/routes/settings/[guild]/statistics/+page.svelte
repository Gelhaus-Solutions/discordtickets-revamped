<script>
	import Chart from '$components/Chart/Chart.svelte';
	import { PRIORITY, RATING, SERIES, chartTheme } from '$components/Chart/theme.js';
	import { goto } from '$app/navigation';
	import { navigating } from '$app/stores';
	import { getContext } from 'svelte';
	import ms from 'ms';

	/** @type {{data: import('./$types').PageData}} */
	let { data } = $props();

	// Read once, non-reactively: the theme only ever changes by full page load
	// (TopBar reassigns window.location), and the class lives on a <div> in the
	// root layout rather than <html>, so there is nothing to sniff from the DOM.
	const dark = getContext('theme') === 'dark';
	const theme = chartTheme(dark);

	const analytics = $derived(data.analytics);
	const summary = $derived(analytics.summary);
	const busy = $derived(Boolean($navigating));

	const DAY = 86400;
	const PRESETS = [
		{ days: 7, label: '7 days' },
		{ days: 30, label: '30 days' },
		{ days: 90, label: '90 days' },
		{ days: 365, label: '12 months' }
	];

	/** unix seconds to the 'YYYY-MM-DD' an <input type="date"> wants, in UTC. */
	const dayString = (seconds) => new Date(seconds * 1000).toISOString().slice(0, 10);

	// The URL is the source of truth; these mirror it. `data.filters` is a fresh
	// object per load, so the effect below leaves the picker showing the range
	// actually on screen after Back/Forward or a preset — which is also why
	// reading `data` for the initial value here is deliberate rather than a miss.
	// svelte-ignore state_referenced_locally
	let since = $state(dayString(data.filters.since));
	// svelte-ignore state_referenced_locally
	let until = $state(dayString(data.filters.until));
	// svelte-ignore state_referenced_locally
	let categoryId = $state(data.filters.categoryId);
	$effect(() => {
		since = dayString(data.filters.since);
		until = dayString(data.filters.until);
		categoryId = data.filters.categoryId;
	});

	function apply() {
		const params = new URLSearchParams({ since, until });
		if (categoryId) params.set('categoryId', categoryId);
		// Same route, different search: `load` re-runs because it read
		// `url.searchParams`, so there is no second fetch path to keep in step and
		// the range stays shareable and bookmarkable.
		goto(`?${params}`, { keepFocus: true, noScroll: true });
	}

	function preset(days) {
		const now = Math.floor(Date.now() / 1000);
		since = dayString(now - days * DAY);
		until = dayString(now);
		apply();
	}

	/** `ms(null)` throws and `ms(0)` is '0ms', so neither reaches it bare. */
	const duration = (value) => (value ? ms(value, { long: true }) : '—');

	// The server caps the window at 730 days and refuses a future `until`. When
	// it answers with something other than what was asked for, say so rather
	// than showing a range that disagrees with the inputs above it.
	const served = $derived({
		since: Math.floor(Date.parse(analytics.period.since) / 1000),
		until: Math.floor(Date.parse(analytics.period.until) / 1000)
	});
	const clamped = $derived(
		Math.abs(served.since - data.filters.since) > DAY ||
			Math.abs(served.until - data.filters.until) > DAY
	);

	const formatDay = (seconds) =>
		new Date(seconds * 1000).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			timeZone: 'UTC',
			year: 'numeric'
		});

	const perDay = $derived({
		datasets: [
			{
				backgroundColor: 'rgba(88, 101, 242, 0.15)',
				borderColor: SERIES[0],
				data: analytics.ticketsPerDay.map((point) => point.count),
				fill: true,
				label: 'Tickets',
				// Past a couple of months the markers merge into a band and stop
				// meaning anything.
				pointRadius: analytics.ticketsPerDay.length > 60 ? 0 : 2,
				tension: 0.3
			}
		],
		labels: analytics.ticketsPerDay.map((point) => point.date)
	});
	const perDayOptions = $derived({
		...theme.cartesian,
		plugins: { ...theme.cartesian.plugins, legend: { display: false } },
		scales: {
			...theme.cartesian.scales,
			x: { ...theme.cartesian.scales.x, ticks: { ...theme.cartesian.scales.x.ticks, maxTicksLimit: 12 } }
		}
	});

	const byHour = $derived({
		datasets: [
			{
				backgroundColor: SERIES[0],
				borderRadius: 4,
				data: analytics.ticketsByHour,
				label: 'Tickets'
			}
		],
		labels: analytics.ticketsByHour.map((_, hour) => String(hour).padStart(2, '0'))
	});
	const byHourOptions = $derived({
		...theme.cartesian,
		plugins: { ...theme.cartesian.plugins, legend: { display: false } }
	});

	const byCategory = $derived({
		datasets: [
			{
				backgroundColor: SERIES[1],
				data: analytics.categoryBreakdown.map((category) => category.open),
				label: 'Open',
				stack: 'tickets'
			},
			{
				backgroundColor: SERIES[5],
				data: analytics.categoryBreakdown.map((category) => category.closed),
				label: 'Closed',
				stack: 'tickets'
			}
		],
		labels: analytics.categoryBreakdown.map((category) => category.name)
	});
	const byCategoryOptions = $derived({
		...theme.cartesian,
		indexAxis: 'y',
		scales: {
			x: { ...theme.cartesian.scales.y, stacked: true },
			y: { ...theme.cartesian.scales.x, stacked: true }
		}
	});

	const PRIORITY_ORDER = ['HIGH', 'MEDIUM', 'LOW', 'NONE'];
	const byPriority = $derived({
		datasets: [
			{
				backgroundColor: PRIORITY_ORDER.map((key) => PRIORITY[key]),
				borderWidth: 0,
				data: PRIORITY_ORDER.map((key) => analytics.priorityBreakdown[key] ?? 0)
			}
		],
		labels: ['High', 'Medium', 'Low', 'None']
	});

	const byRating = $derived({
		datasets: [
			{
				backgroundColor: RATING,
				borderRadius: 4,
				data: [1, 2, 3, 4, 5].map((star) => analytics.ratingCounts[star] ?? 0),
				label: 'Responses'
			}
		],
		labels: ['1★', '2★', '3★', '4★', '5★']
	});
	const byRatingOptions = $derived({
		...theme.cartesian,
		plugins: { ...theme.cartesian.plugins, legend: { display: false } }
	});
</script>

<h1 class="m-4 text-center text-4xl font-bold">Statistics</h1>

<div class="mx-auto my-8 max-w-6xl px-4">
	<div class="mb-8 rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-2">
			<h2 class="text-xl font-bold">Filters</h2>
			<div class="flex flex-wrap gap-2 text-sm">
				{#each PRESETS as option}
					<button
						type="button"
						onclick={() => preset(option.days)}
						disabled={busy}
						class="link rounded-lg bg-gray-100 px-3 py-1.5 disabled:opacity-50 dark:bg-slate-800"
					>
						{option.label}
					</button>
				{/each}
			</div>
		</div>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
			<div>
				<label for="stats-since" class="mb-2 block text-sm font-medium">From date</label>
				<input
					id="stats-since"
					type="date"
					bind:value={since}
					disabled={busy}
					class="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-slate-500 dark:bg-slate-600"
				/>
			</div>
			<div>
				<label for="stats-until" class="mb-2 block text-sm font-medium">To date</label>
				<input
					id="stats-until"
					type="date"
					bind:value={until}
					disabled={busy}
					class="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-slate-500 dark:bg-slate-600"
				/>
			</div>
			<div>
				<label for="stats-category" class="mb-2 block text-sm font-medium">Category</label>
				<select
					id="stats-category"
					bind:value={categoryId}
					disabled={busy}
					class="w-full rounded-md border border-gray-300 px-3 py-2 dark:border-slate-500 dark:bg-slate-600"
				>
					<option value="">All categories</option>
					{#each data.categories as category}
						<option value={String(category.id)}>{category.name}</option>
					{/each}
				</select>
			</div>
			<div class="flex items-end">
				<button
					type="button"
					onclick={apply}
					disabled={busy}
					class="w-full rounded-md bg-blurple px-4 py-2 text-white hover:bg-blurple/90 disabled:opacity-50"
				>
					{busy ? 'Loading…' : 'Apply filters'}
				</button>
			</div>
		</div>
		<p class="mt-4 text-sm text-gray-500 dark:text-slate-400">
			Showing {formatDay(served.since)} – {formatDay(served.until)} (UTC)
		</p>
		{#if clamped}
			<p class="mt-2 text-sm text-amber-600 dark:text-amber-400">
				<i class="fa-solid fa-triangle-exclamation mr-1"></i>
				The requested range was shortened — reports cover at most 730 days and cannot end in the
				future.
			</p>
		{/if}
	</div>

	<div class:pointer-events-none={busy} class:opacity-50={busy}>
		<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
			<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
				<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Total tickets</div>
				<div class="mt-2 text-3xl font-bold">{summary.total}</div>
			</div>
			<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
				<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Open</div>
				<div class="mt-2 text-3xl font-bold">{summary.open}</div>
			</div>
			<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
				<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">
					Avg first response
				</div>
				<div class="mt-2 text-3xl font-bold">{duration(summary.avgResponseTimeMs)}</div>
			</div>
			<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
				<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Avg resolution</div>
				<div class="mt-2 text-3xl font-bold">{duration(summary.avgResolutionTimeMs)}</div>
			</div>
		</div>

		{#if summary.total === 0}
			<div class="rounded-lg bg-white p-12 text-center shadow-sm dark:bg-slate-700">
				<i class="fa-solid fa-inbox mb-4 text-4xl text-gray-400 dark:text-slate-500"></i>
				<p class="text-lg font-semibold">No tickets were created in this period</p>
				<p class="mt-1 text-sm text-gray-500 dark:text-slate-400">
					Widen the date range, or clear the category filter.
				</p>
			</div>
		{:else}
			<div class="mb-8 rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
				<h2 class="mb-6 text-2xl font-bold">Tickets per day</h2>
				<Chart type="line" data={perDay} options={perDayOptions} label="Tickets created per day" />
			</div>

			<div class="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
				<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
					<h2 class="mb-1 text-2xl font-bold">Busiest hours</h2>
					<p class="mb-6 text-sm text-gray-500 dark:text-slate-400">
						When tickets are opened, in UTC.
					</p>
					<Chart
						type="bar"
						data={byHour}
						options={byHourOptions}
						label="Tickets created by hour of day, UTC"
					/>
				</div>
				<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
					<h2 class="mb-6 text-2xl font-bold">Priority</h2>
					<Chart
						type="doughnut"
						data={byPriority}
						options={theme.base}
						label="Tickets by priority"
					/>
				</div>
			</div>

			{#if analytics.categoryBreakdown.length > 0}
				<div class="mb-8 rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
					<h2 class="mb-6 text-2xl font-bold">Categories</h2>
					<Chart
						type="bar"
						data={byCategory}
						options={byCategoryOptions}
						heightPx={Math.max(200, analytics.categoryBreakdown.length * 32 + 60)}
						label="Open and closed tickets by category"
					/>
					<div class="mt-6 overflow-x-auto">
						<table class="w-full text-left text-sm">
							<thead class="border-b border-gray-200 dark:border-slate-600">
								<tr>
									<th class="py-2 pr-4 font-semibold">Category</th>
									<th class="py-2 pr-4 font-semibold">Tickets</th>
									<th class="py-2 pr-4 font-semibold">Avg first response</th>
									<th class="py-2 font-semibold">Avg resolution</th>
								</tr>
							</thead>
							<tbody>
								{#each analytics.categoryBreakdown as category}
									<tr class="border-b border-gray-100 last:border-0 dark:border-slate-600/50">
										<td class="py-2 pr-4">{category.name}</td>
										<td class="py-2 pr-4">{category.total}</td>
										<td class="py-2 pr-4">{duration(category.avgResponseTime)}</td>
										<td class="py-2">{duration(category.avgResolutionTime)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			<div class="mb-8 rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
				<h2 class="mb-1 text-2xl font-bold">Feedback</h2>
				<p class="mb-6 text-sm text-gray-500 dark:text-slate-400">
					{summary.withFeedback} of {summary.total} tickets were rated{analytics.avgRating
						? `, averaging ${analytics.avgRating} / 5`
						: ''}.
				</p>
				{#if summary.withFeedback === 0}
					<p class="py-8 text-center text-gray-500 dark:text-slate-400">
						No feedback was left in this period.
					</p>
				{:else}
					<Chart
						type="bar"
						data={byRating}
						options={byRatingOptions}
						label="Feedback ratings, one to five stars"
					/>
				{/if}
			</div>

			<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
				<h2 class="mb-1 text-2xl font-bold">Tickets by user</h2>
				<!--
					"by user", not "by staff member": `closed` counts whoever closed the
					ticket, and members closing their own tickets land in here too.
				-->
				<p class="mb-6 text-sm text-gray-500 dark:text-slate-400">
					Anyone who claimed or closed a ticket in this period.
				</p>
				{#if analytics.assigneeStats.length === 0}
					<p class="py-8 text-center text-gray-500 dark:text-slate-400">
						No tickets were claimed or closed in this period.
					</p>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full text-left text-sm">
							<thead class="border-b border-gray-200 dark:border-slate-600">
								<tr>
									<th class="py-2 pr-4 font-semibold">User</th>
									<th class="py-2 pr-4 font-semibold">Claimed</th>
									<th class="py-2 pr-4 font-semibold">Closed</th>
									<th class="py-2 font-semibold">Avg resolution</th>
								</tr>
							</thead>
							<tbody>
								{#each analytics.assigneeStats.slice(0, 25) as stat}
									<tr class="border-b border-gray-100 last:border-0 dark:border-slate-600/50">
										<td class="flex items-center gap-2 py-2 pr-4">
											{#if stat.avatarURL}
												<img src={stat.avatarURL} alt="" class="h-6 w-6 rounded-full" />
											{/if}
											{stat.displayName ?? stat.userId}
										</td>
										<td class="py-2 pr-4">{stat.claimed}</td>
										<td class="py-2 pr-4">{stat.closed}</td>
										<td class="py-2">{duration(stat.avgResolutionTimeMs)}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					{#if analytics.assigneeStats.length > 25}
						<p class="mt-4 text-sm text-gray-500 dark:text-slate-400">
							Showing the 25 users with the most closures, of {analytics.assigneeStats.length}.
						</p>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
</div>
