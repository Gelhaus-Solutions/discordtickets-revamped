<script>
	import { page } from '$app/stores';
	import { I18nLite } from '@eartharoid/i18n';
	import { getContext } from 'svelte';
	// Category emoji are stored the way an admin typed them — often a shortcode
	// like `:arrow_up_down:`. Rendering the raw column printed `arrow_up_down`
	// as text. Every other preview in the dashboard goes through this, so what
	// is shown here matches what the bot sends.
	import { displayEmoji } from '$lib/emoji.js';

	/** @type {{data: import('./$types').PageData}} */
	let { data } = $props();
	const client = $derived(data.client);
	const guild = $derived(data.guild);
	const t = $derived(new I18nLite().loadParsed(...data.translations).createTranslator());

	const locale = getContext('locale');
	const slug = $derived($page.params.guild);

	// Seeding `$state` from `data` would freeze this page on whichever guild it
	// first rendered: SvelteKit reuses the component across a client-side
	// navigation, so the initialiser never runs again. The loader's value is
	// derived, and a retry only layers an override on top of it.
	let refetched = $state(null);
	const tickets = $derived(refetched ?? data.tickets);
	const counts = $derived(data.counts);

	let closed = $state(null);
	let showClosed = $state(false);
	let loadingClosed = $state(false);
	let retrying = $state(false);

	const rtf = new Intl.RelativeTimeFormat(locale ?? 'en-GB', { numeric: 'auto' });
	const UNITS = [
		['year', 31536000000],
		['month', 2592000000],
		['week', 604800000],
		['day', 86400000],
		['hour', 3600000],
		['minute', 60000]
	];

	/** "3 days ago", without pulling in a date library for one string. */
	const ago = (value) => {
		if (!value) return null;
		const diff = new Date(value).getTime() - Date.now();
		for (const [unit, size] of UNITS) {
			if (Math.abs(diff) >= size) return rtf.format(Math.round(diff / size), unit);
		}
		return rtf.format(Math.round(diff / 1000), 'second');
	};

	/** The ticket id *is* the channel id, so no lookup is needed. */
	const discordUrl = (ticket) => `https://discord.com/channels/${guild.id}/${ticket.id}`;

	/** "🔼 Install Problem", or just the name when there is no emoji. */
	const categoryLabel = (ticket) =>
		[displayEmoji(ticket.categoryEmoji ?? ''), ticket.categoryName].filter(Boolean).join(' ');

	const retry = async () => {
		retrying = true;
		try {
			const res = await fetch(`/api/guilds/${guild.id}/tickets/@me?status=open`, {
				credentials: 'include'
			});
			if (res.ok) refetched = await res.json();
		} finally {
			retrying = false;
		}
	};

	const toggleClosed = async () => {
		showClosed = !showClosed;
		if (!showClosed || closed) return;
		loadingClosed = true;
		try {
			const res = await fetch(`/api/guilds/${guild.id}/tickets/@me?status=closed&limit=20`, {
				credentials: 'include'
			});
			closed = res.ok ? await res.json() : [];
		} finally {
			loadingClosed = false;
		}
	};
</script>

<svelte:head>
	<title>{t('common:title', { guild: guild.name, client: client.username })}</title>
</svelte:head>

<div>

	{#if guild.privilegeLevel > 0 && counts}
		<!--
			A strip of totals, not a second table. The staff page owns the list; this
			is here so a staff member landing on the guild page can see at a glance
			whether anything needs them, and click through.
		-->
		<div class="mb-6 rounded-lg bg-white p-4 shadow-sm dark:bg-slate-700">
			<div class="flex flex-wrap items-center gap-2 text-sm">
				<span class="font-semibold">{t('home.staff.heading')}</span>
				<a
					href={`/${slug}/staff?filter=all`}
					class="rounded-md bg-gray-100 px-3 py-1 transition duration-300 hover:bg-blurple hover:text-white dark:bg-slate-800 dark:hover:bg-blurple"
				>
					{counts.open}
					{t('home.staff.open')}
				</a>
				<a
					href={`/${slug}/staff?filter=unclaimed`}
					class="rounded-md bg-gray-100 px-3 py-1 transition duration-300 hover:bg-blurple hover:text-white dark:bg-slate-800 dark:hover:bg-blurple"
				>
					{counts.unclaimed}
					{t('home.staff.unclaimed')}
				</a>
				<a
					href={`/${slug}/staff?filter=awaiting_staff`}
					class="rounded-md bg-gray-100 px-3 py-1 transition duration-300 hover:bg-blurple hover:text-white dark:bg-slate-800 dark:hover:bg-blurple"
				>
					{counts.awaitingStaff}
					{t('home.staff.awaiting')}
				</a>
				<a href={`/${slug}/staff`} class="ml-auto underline decoration-dotted hover:decoration-solid">
					{t('home.staff.view_all')}
				</a>
			</div>
		</div>
	{/if}

	<h2 class="text-xl font-bold">{t('home.your_tickets')}</h2>
	<p class="mb-3 text-base text-gray-500 dark:text-slate-400">{t('home.your_tickets_desc')}</p>

	{#if tickets === null}
		<div class="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-700">
			<p>{t('home.load_failed')}</p>
			<button
				type="button"
				disabled={retrying}
				onclick={retry}
				class="mt-2 rounded-md bg-gray-100 px-3 py-1 transition duration-300 hover:bg-blurple hover:text-white disabled:cursor-not-allowed dark:bg-slate-800 dark:hover:bg-blurple"
			>
				{retrying ? t('common:loading') : t('common:retry')}
			</button>
		</div>
	{:else if tickets.length === 0}
		<div class="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-700">
			<p class="font-medium">{t('home.no_open_tickets')}</p>
			<p class="text-base text-gray-500 dark:text-slate-400">{t('home.open_from_discord')}</p>
		</div>
	{:else}
		<ul class="grid gap-2">
			{#each tickets as ticket (ticket.id)}
				<li>
					<a
						href={discordUrl(ticket)}
						target="_blank"
						rel="noopener noreferrer"
						class="group block rounded-xl bg-white p-4 shadow-sm transition duration-300 hover:ring-2 hover:ring-blurple dark:bg-slate-700"
					>
						<div class="flex flex-wrap items-baseline gap-2">
							<span class="font-semibold">#{ticket.number}</span>
							<span class="text-base text-gray-500 dark:text-slate-400">
								{categoryLabel(ticket)}
							</span>
							<span
								class="ml-auto rounded-md bg-gray-100 px-2 py-0.5 text-xs dark:bg-slate-800"
							>
								{ticket.claimedById ? t('home.claimed') : t('home.unclaimed')}
							</span>
						</div>
						<p class="mt-1">{ticket.topic || t('home.no_topic')}</p>
						<p class="mt-1 text-sm text-gray-500 dark:text-slate-400">
							{t('home.opened', { when: ago(ticket.createdAt) })}
							<span class="ml-1 opacity-0 duration-300 group-hover:opacity-100">
								<i class="fa-solid fa-arrow-up-right-from-square"></i>
								{t('common:open_in_discord')}
							</span>
						</p>
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	<button
		type="button"
		aria-expanded={showClosed}
		onclick={toggleClosed}
		class="mt-4 rounded-md bg-gray-100 px-3 py-1.5 text-sm transition duration-300 hover:bg-blurple hover:text-white dark:bg-slate-800 dark:hover:bg-blurple"
	>
		<i class="fa-solid {showClosed ? 'fa-angle-up' : 'fa-angle-down'} mr-1"></i>
		{showClosed ? t('home.hide_closed') : t('home.show_closed')}
	</button>

	{#if showClosed}
		<h2 class="mt-4 text-xl font-bold">{t('home.closed_tickets')}</h2>
		{#if loadingClosed}
			<p class="text-base text-gray-500 dark:text-slate-400">{t('common:loading')}</p>
		{:else if !closed || closed.length === 0}
			<p class="text-base text-gray-500 dark:text-slate-400">{t('home.no_closed_tickets')}</p>
		{:else}
			<ul class="mt-2 grid gap-2">
				{#each closed as ticket (ticket.id)}
					<li>
						<!--
							A link like the open ones. A closed CHANNEL-mode ticket has had
							its channel deleted so this may 404 in Discord, but a closed
							thread is still readable — and a card that looks identical to
							the ones above while silently not being clickable is worse than
							a link that sometimes cannot resolve.
						-->
						<a
							href={discordUrl(ticket)}
							target="_blank"
							rel="noopener noreferrer"
							class="block rounded-xl bg-gray-100 p-4 opacity-75 shadow-sm transition duration-300 hover:opacity-100 hover:ring-2 hover:ring-blurple dark:bg-slate-800"
						>
							<div class="flex flex-wrap items-baseline gap-2">
								<span class="font-semibold">#{ticket.number}</span>
								<span class="text-base text-gray-500 dark:text-slate-400">
									{categoryLabel(ticket)}
								</span>
								{#if ticket.closedAt}
									<span class="ml-auto text-xs text-gray-500 dark:text-slate-400">
										{ago(ticket.closedAt)}
									</span>
								{/if}
							</div>
							<p class="mt-1">{ticket.topic || t('home.no_topic')}</p>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	{/if}
</div>
