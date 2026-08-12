<script>
	import TopBar from '$components/TopBar.svelte';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { page, navigating } from '$app/stores';
	import { Modals, modals } from 'svelte-modals';
	import cookie from 'cookie';
	import WelcomeModal from '$components/WelcomeModal.svelte';
	import Spinner from '$components/Spinner.svelte';
	/** @type {{data: import('./$types').PageData, children?: import('svelte').Snippet}} */
	let { data, children } = $props();

	const client = $derived(data.client);
	const user = $derived(data.user);
	const theme = $derived(data.theme);

	// The portal page for the guild being administered, when there is one.
	// `$page.params.guild` here is the real snowflake, and the portal keys off a
	// base36 slug, so it has to be converted rather than pasted.
	const portalHref = $derived(
		$page.params.guild ? `/${BigInt($page.params.guild).toString(36)}` : '/'
	);
	let mounted = $state(false);
	let cookies = $state({});
	onMount(() => {
		cookies = cookie.parse(document.cookie || '');
		if (!cookies.welcomed) modals.open(WelcomeModal, { client });
		mounted = true;
	});

	const dismissCookies = () => {
		document.cookie = cookie.serialize('dismissedCookies', 'true', {
			maxAge: 2592000,
			path: '/',
			sameSite: 'lax'
		});
		cookies.dismissedCookies = true;
	};

	const links = [
		{
			icon: 'fa-solid fa-book',
			name: 'Documentation',
			url: 'https://discordtickets.app'
		},
		{
			icon: 'fab fa-discord',
			name: 'Support',
			url: 'https://lnk.earth/discord'
		},
		{
			icon: 'fa-solid fa-comments',
			name: 'Feedback',
			url: 'https://github.com/Gelhaus-Solutions/discordtickets-revamped/issues'
		}
	];
</script>

<svelte:head>
	<title>Discord Tickets</title>
	<link rel="icon" href="/favicon.png" />
</svelte:head>

<div class="absolute h-max min-h-screen w-full bg-gray-200 dark:bg-slate-900">
	<Modals>
		{#snippet backdrop({ close })}
			<!--
				`presentation`, not `button`: the backdrop is a convenience for mouse
				users and is not a control in its own right. Every modal it sits
				behind has its own visible close affordance, which is what keyboard
				users reach — so announcing this as a second button would be noise.
			-->
			<div
				class="backdrop"
				role="presentation"
				transition:fade
				onclick={() => close()}
				onkeypress={() => close()}
			></div>
		{/snippet}
		{#snippet loading()}
			<div>
				<Spinner />
			</div>
		{/snippet}
	</Modals>
	{#if mounted && client.public && !cookies.dismissedCookies}
		<div
			class="m-0 flex w-full flex-row justify-center gap-8 bg-blurple p-1 font-medium text-white sm:px-8"
		>
			<p>Cookies are being used to store credentials and preferences.</p>
			<p>
				<button
					type="button"
					class="justify-self-end hover:cursor-pointer"
					title="Dismiss"
					aria-label="Dismiss the cookie notice"
					onclick={dismissCookies}
				>
					<i class="fa-sharp fa-solid fa-circle-xmark"></i>
				</button>
			</p>
		</div>
	{/if}
	<div class="text-gray-800 dark:text-slate-300">
		<!--
			Spin on a route change, not on any navigation. The statistics page
			re-runs its loader by navigating to itself with a different query
			string, and blanking the whole settings shell for that unmounts the
			filter form mid-interaction and throws away scroll position — for what
			is conceptually a refresh of one panel.
		-->
		{#if !mounted || ($navigating && $navigating.to?.route.id !== $navigating.from?.route.id)}
			<div class="flex h-dvh items-center justify-center">
				<Spinner />
			</div>
		{:else}
			<div class="m-2 sm:m-6 lg:m-12">
				<div class="mx-auto max-w-7xl">
					<TopBar {user} {theme} />
					{@render children?.()}
					<footer class="my-16 text-center">
						<div class="mb-6 p-2 text-sm">
							<!--
								Back to *this guild's* portal page, not the server picker. Going
								to `/` meant anyone administering one server was bounced to a
								list to pick it again, and there was no short way back to the
								staff dashboard from inside settings at all. The portal
								addresses guilds by base36 slug — a raw id here would be
								rewritten straight back into /settings by `reroute()`.
							-->
							<a
								href={portalHref}
								class="cursor-pointer text-gray-500 transition duration-300 hover:text-blurple dark:text-slate-400 dark:hover:text-blurple"
							>
								<i class="fa-solid fa-arrow-left"></i>
								Back to the portal
							</a>
						</div>
						{#if $page.route.id !== '/settings'}
							<div class="my-4 flex justify-center gap-3">
								{#each links as link}
									<a
										href={link.url}
										target="_blank"
										rel="noopener noreferrer"
										class="link rounded-3xl bg-gray-50/75 p-0.5 px-2 font-medium text-gray-500 shadow-sm dark:bg-slate-800/75 dark:text-slate-400"
									>
										<i class={link.icon}></i>
										{link.name}
									</a>
								{/each}
							</div>
						{/if}
						<p>
							<a
								href="https://discordtickets.app"
								target="_blank"
								rel="noopener noreferrer"
								class="cursor-pointer transition duration-300 hover:text-blurple dark:hover:text-blurple"
								>Discord Tickets</a
							>
							by
							<a
								href="https://eartharoid.me"
								target="_blank"
								rel="noopener noreferrer"
								class="cursor-pointer transition duration-300 hover:text-blurple dark:hover:text-blurple"
								>eartharoid&trade;</a
							>
							&amp;
							<a
								href="https://ennogelhaus.de"
								target="_blank"
								rel="noopener noreferrer"
								class="cursor-pointer transition duration-300 hover:text-blurple dark:hover:text-blurple"
								>egelhaus&trade;</a
							>
						</p>
						<p>
							&copy;
							2025
							<a
								href="https://eartharoid.me"
								target="_blank"
								class="cursor-pointer transition duration-300 hover:text-blurple dark:hover:text-blurple"
								>Isaac Saunders</a
							>
						</p>
						<p>
							&copy;
							2026
							<a
								href="https://ennogelhaus.de"
								target="_blank"
								rel="noopener noreferrer"
								class="cursor-pointer transition duration-300 hover:text-blurple dark:hover:text-blurple"
								>Enno Gelhaus</a
							>
						</p>
						<!-- <p class="my-4">
								<a
									href="https://lnk.earth/discord"
									target="_blank"
									class="hover:text-blurple text-lg transition duration-300"
								>
									<i class="fab fa-discord" />
								</a>
							</p> -->
						<p class="my-4 text-xs">
							Discord Tickets is not an official Discord product.
							<br />
							It is not affiliated with nor endorsed by Discord Inc.
						</p>
					</footer>
				</div>
			</div>
		{/if}
	</div>
</div>
