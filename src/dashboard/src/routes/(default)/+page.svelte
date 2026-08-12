<script>
	import { getContext } from 'svelte';
	import { I18nLite } from '@eartharoid/i18n';
	import TopBar from '$components/TopBar.svelte';

	/** @type {{data: import('./$types').PageData}} */
	let { data } = $props();
	const client = $derived(data.client);
	const t = $derived(new I18nLite().loadParsed(...data.translations).createTranslator());

	// The same header the rest of the dashboard uses, which is also where log out
	// and the theme toggle live. This page used to carry a bare "Log out" text
	// link at the bottom and nothing else.
	const user = getContext('user');
	const theme = getContext('theme');

	/** Matches `getPrivilegeLevel` in src/lib/users.js. */
	const ROLES = {
		1: { key: 'role_staff', style: 'bg-blurple/20 text-blurple' },
		2: { key: 'role_admin', style: 'bg-green-500/20 text-green-600 dark:text-green-400' },
		3: { key: 'role_owner', style: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' },
		4: { key: 'role_owner', style: 'bg-amber-500/20 text-amber-600 dark:text-amber-400' }
	};
	const roleOf = (level) => ROLES[level] ?? { key: 'role_member', style: 'bg-gray-500/20' };

	let query = $state('');

	// Somewhere to act from, rather than only a name to click. Privileged servers
	// first — those are the ones anyone opening this page is usually heading for
	// — then alphabetical, so the order is stable between visits.
	const sorted = $derived(
		[...data.guilds].sort(
			(a, b) => b.privilegeLevel - a.privilegeLevel || a.name.localeCompare(b.name)
		)
	);

	const shown = $derived(
		sorted.filter((g) => g.name.toLowerCase().includes(query.trim().toLowerCase()))
	);

	/** The portal keys off a base36 slug; a raw id is rerouted into /settings. */
	const slugOf = (guild) => BigInt(guild.id).toString(36);
</script>

<svelte:head>
	<title>{t('select_server_title', { username: client.username })}</title>
	<link rel="icon" href={`${client.avatar}?size=32`} />
</svelte:head>

<div class="text-gray-800 dark:text-slate-300">
	<div class="m-2 sm:m-6 lg:m-12">
		<div class="mx-auto max-w-7xl">
			<TopBar {user} {theme} />

			<div class="mb-8 text-center">
				<h1 class="text-4xl font-bold">{t('select_server')}</h1>
				<p class="mt-2 text-gray-500 dark:text-slate-400">
					{t('select_server_desc', { client: client.username })}
				</p>
			</div>

			<!-- Only worth the space once the list is long enough to scan. -->
			{#if sorted.length > 8}
				<div class="mx-auto mb-6 max-w-md">
					<input
						type="text"
						class="input form-input"
						placeholder={t('filter_servers')}
						bind:value={query}
					/>
				</div>
			{/if}

			{#if sorted.length === 0}
				<div class="mx-auto max-w-md rounded-xl bg-white p-6 text-center shadow-sm dark:bg-slate-700">
					<i class="fa-solid fa-server mb-3 text-4xl text-gray-400 dark:text-slate-500"></i>
					<p class="font-medium">{t('no_servers')}</p>
					<p class="mt-1 text-sm text-gray-500 dark:text-slate-400">
						{t('no_servers_desc', { client: client.username })}
					</p>
				</div>
			{:else if shown.length === 0}
				<p class="my-12 text-center text-gray-500 dark:text-slate-400">
					{t('no_matches', { query: query.trim() })}
				</p>
			{:else}
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each shown as guild (guild.id)}
						{@const role = roleOf(guild.privilegeLevel)}
						<div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
							<a href={`/${slugOf(guild)}`} class="flex items-center gap-4">
								<img src={guild.logo} alt="" class="h-12 w-12 shrink-0 rounded-full" />
								<div class="min-w-0">
									<p class="truncate text-lg font-semibold">{guild.name}</p>
									<span class="rounded-md px-2 py-0.5 text-xs font-medium {role.style}">
										{t(role.key)}
									</span>
								</div>
							</a>

							<!--
								The places a privileged member actually wants to land, without
								going through the guild page first. Home duplicates the card
								header's link on purpose: once there are sibling buttons, the
								header alone reads as decoration rather than a destination.

								`basis-24` over a bare `flex-1` so the third button wraps onto
								its own line instead of squashing all three in a grid column.
							-->
							{#if guild.privilegeLevel > 0}
								<div class="mt-4 flex flex-wrap gap-2 text-sm">
									<a
										href={`/${slugOf(guild)}`}
										class="link flex-1 basis-24 rounded-lg bg-gray-100 px-3 py-1.5 text-center dark:bg-slate-800"
									>
										<i class="fa-solid fa-house mr-1"></i>
										{t('open_home')}
									</a>
									<a
										href={`/${slugOf(guild)}/staff`}
										class="link flex-1 basis-24 rounded-lg bg-gray-100 px-3 py-1.5 text-center dark:bg-slate-800"
									>
										<i class="fa-solid fa-user-group mr-1"></i>
										{t('open_staff')}
									</a>
									{#if guild.privilegeLevel >= 2}
										<!-- The real snowflake: this one belongs to /settings. -->
										<a
											href={`/settings/${guild.id}`}
											class="link flex-1 basis-24 rounded-lg bg-gray-100 px-3 py-1.5 text-center dark:bg-slate-800"
										>
											<i class="fa-solid fa-gear mr-1"></i>
											{t('open_settings')}
										</a>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{/if}

			<div class="my-12 text-center">
				<a
					href="/invite"
					class="cursor-pointer text-gray-500 transition duration-300 hover:text-blurple dark:text-slate-400 dark:hover:text-blurple"
				>
					<i class="fa-solid fa-circle-plus"></i>
					{t('add_to_server')}
				</a>
			</div>
		</div>
	</div>
</div>
