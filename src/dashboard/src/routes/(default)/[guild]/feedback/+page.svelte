<script>
	import { page } from '$app/stores';
	import { replaceState } from '$app/navigation';
	import { I18nLite } from '@eartharoid/i18n';
	import { getContext } from 'svelte';
	import Chart from '$components/Chart/Chart.svelte';
	import { RATING, SERIES, chartTheme } from '$components/Chart/theme.js';

	/** @type {{data: import('./$types').PageData}} */
	let { data } = $props();
	const guild = $derived(data.guild);
	const t = $derived(new I18nLite().loadParsed(...data.translations).createTranslator());

	// Read once, non-reactively: the theme only ever changes by full page load
	// (TopBar reassigns window.location), and the class lives on a <div> in the
	// root layout rather than <html>, so there is nothing to sniff from the DOM.
	const dark = getContext('theme') === 'dark';
	const theme = chartTheme(dark);
	const locale = getContext('locale');

	// One override on top of the loader's payload. Seeding `$state` from `data`
	// would strand this page on whichever guild it first rendered — SvelteKit
	// reuses the component across a client-side navigation, so an initialiser
	// never runs a second time.
	let fetched = $state(null);
	let daysOverride = $state(null);
	let isLoading = $state(false);
	let loadError = $state(false);

	const result = $derived(fetched ?? data.initial);
	const days = $derived(daysOverride ?? data.days);
	const avgRating = $derived(result.avgRating);
	const totalCount = $derived(result.totalCount);
	const ratingCounts = $derived(result.ratingCounts);
	const trend = $derived(result.trend);

	const DAY = 86400;
	const RANGES = [
		{ days: 30, label: 'feedback.range_30' },
		{ days: 90, label: 'feedback.range_90' },
		{ days: 365, label: 'feedback.range_365' }
	];

	const STARS = [1, 2, 3, 4, 5];

	/** The tallest bar, so the distribution scales to what is actually there. */
	const maxCount = $derived(Math.max(1, ...STARS.map((star) => ratingCounts[star] ?? 0)));

	const formatDay = (date) =>
		new Date(date).toLocaleDateString(locale ?? 'en-GB', {
			day: 'numeric',
			month: 'short',
			timeZone: 'UTC'
		});

	const trendData = $derived({
		datasets: [
			{
				backgroundColor: 'rgba(88, 101, 242, 0.15)',
				borderColor: SERIES[0],
				data: trend.map((point) => point.avgRating),
				fill: true,
				label: t('feedback.trend_series'),
				// Past a couple of months the markers merge into a band and stop
				// meaning anything.
				pointRadius: trend.length > 60 ? 0 : 2,
				tension: 0.3
			}
		],
		labels: trend.map((point) => formatDay(point.date))
	});
	const trendOptions = $derived({
		...theme.cartesian,
		plugins: { ...theme.cartesian.plugins, legend: { display: false } },
		scales: {
			...theme.cartesian.scales,
			// A rating axis is 1 to 5 and nothing else. Letting Chart.js pick from
			// the data would rescale the line every time the range changed, so a
			// flat 4.8 and a flat 2.1 would draw as the same picture.
			x: {
				...theme.cartesian.scales.x,
				ticks: { ...theme.cartesian.scales.x.ticks, maxTicksLimit: 12 }
			},
			y: { ...theme.cartesian.scales.y, max: 5, min: 0 }
		}
	});

	/**
	 * Fetch a range.
	 *
	 * Deliberately not `goto()`: the portal layout swaps the whole subtree for a
	 * spinner whenever `$navigating` is set, so every click would blank the page.
	 * `replaceState` keeps the URL shareable without re-running `load`.
	 */
	const loadRange = async (nextDays) => {
		isLoading = true;
		loadError = false;
		try {
			const params = new URLSearchParams({
				since: String(Math.floor(Date.now() / 1000) - nextDays * DAY)
			});
			const res = await fetch(`/api/guilds/${guild.id}/feedback?${params}`, {
				credentials: 'include'
			});
			if (!res.ok) throw new Error(String(res.status));
			fetched = await res.json();
			daysOverride = nextDays;

			const url = new URL($page.url);
			if (nextDays === 30) url.searchParams.delete('days');
			else url.searchParams.set('days', String(nextDays));
			replaceState(url, {});
		} catch {
			loadError = true;
		} finally {
			isLoading = false;
		}
	};
</script>

<svelte:head>
	<title>{t('feedback.title', { guild: guild.name })}</title>
</svelte:head>

<div>
	<!-- The heading convention every settings page uses. -->
	<h1 class="m-4 text-center text-4xl font-bold">{t('feedback.heading')}</h1>
	<p class="mb-6 text-center text-base text-gray-500 dark:text-slate-400">
		{t('feedback.subheading', { guild: guild.name })}
	</p>

	<div class="mb-4 flex flex-wrap gap-2">
		{#each RANGES as range (range.days)}
			<button
				type="button"
				disabled={isLoading}
				onclick={() => loadRange(range.days)}
				class="rounded-md px-3 py-1 text-sm duration-300 disabled:cursor-not-allowed {days ===
				range.days
					? 'bg-blurple text-white'
					: 'bg-gray-100 hover:bg-blurple hover:text-white dark:bg-slate-800 dark:hover:bg-blurple'}"
			>
				{t(range.label)}
			</button>
		{/each}
	</div>

	{#if isLoading}
		<p class="text-base text-gray-500 dark:text-slate-400">{t('common:loading')}</p>
	{:else if loadError}
		<div class="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-700">
			<p>{t('feedback.load_failed')}</p>
			<button
				type="button"
				onclick={() => loadRange(days)}
				class="mt-2 rounded-md bg-gray-100 px-3 py-1 transition duration-300 hover:bg-blurple hover:text-white dark:bg-slate-800 dark:hover:bg-blurple"
			>
				{t('common:retry')}
			</button>
		</div>
	{:else if !result.collecting}
		<!--
			An empty chart because nobody rated anything and an empty chart because
			the server never asks look identical, and they are not the same thing.
		-->
		<div class="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-700">
			<p class="font-medium">{t('feedback.not_collecting')}</p>
			<p class="text-base text-gray-500 dark:text-slate-400">
				{t('feedback.not_collecting_hint')}
			</p>
		</div>
	{:else if totalCount === 0}
		<div class="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-700">
			<p class="font-medium">{t('feedback.no_responses')}</p>
			<p class="text-base text-gray-500 dark:text-slate-400">{t('feedback.no_responses_hint')}</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
				<div class="text-sm font-semibold text-gray-500 dark:text-slate-400">
					{t('feedback.average')}
				</div>
				<div class="mt-2 text-3xl font-bold">
					{avgRating === null
						? t('feedback.no_average')
						: t('feedback.out_of_five', { rating: avgRating })}
				</div>
				<div class="mt-1 flex gap-1" aria-hidden="true">
					{#each STARS as star (star)}
						<i
							class="fa-solid fa-star text-sm {star <= Math.round(avgRating ?? 0)
								? 'text-yellow-500'
								: 'text-gray-300 dark:text-slate-600'}"
						></i>
					{/each}
				</div>
			</div>

			<div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
				<div class="text-sm font-semibold text-gray-500 dark:text-slate-400">
					{t('feedback.responses')}
				</div>
				<div class="mt-2 text-3xl font-bold">{totalCount}</div>
			</div>
		</div>

		<div class="mt-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
			<h2 class="mb-3 text-xl font-bold">{t('feedback.distribution')}</h2>
			<!--
				Bars rather than a chart: five rows with their own numbers beside them
				need no axis, and this stays readable without loading Chart.js.
			-->
			<ul class="grid gap-2">
				{#each [...STARS].reverse() as star (star)}
					{@const count = ratingCounts[star] ?? 0}
					<li class="flex items-center gap-3 text-sm">
						<span class="w-16 shrink-0 whitespace-nowrap">
							{star === 1 ? t('feedback.star') : t('feedback.stars', { count: star })}
						</span>
						<span class="h-3 grow overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
							<span
								class="block h-full rounded-full"
								style={`background-color: ${RATING[star - 1]}; width: ${(count / maxCount) * 100}%`}
							></span>
						</span>
						<span class="w-12 shrink-0 text-right tabular-nums">{count}</span>
					</li>
				{/each}
			</ul>
		</div>

		{#if trend.length > 1}
			<div class="mt-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
				<h2 class="mb-3 text-xl font-bold">{t('feedback.trend')}</h2>
				<Chart
					type="line"
					data={trendData}
					options={trendOptions}
					label={t('feedback.trend_label')}
				/>
			</div>
		{/if}
	{/if}

	<p class="mt-6 text-xs text-gray-500 dark:text-slate-400">{t('feedback.anonymous_note')}</p>
</div>
