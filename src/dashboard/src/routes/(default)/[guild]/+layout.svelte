<script>
	import { page } from '$app/stores';
	import { getContext } from 'svelte';
	import { I18nLite } from '@eartharoid/i18n';
	import TopBar from '$components/TopBar.svelte';

	/** @type {{data: import('./$types').PageData, children?: import('svelte').Snippet}} */
	let { data, children } = $props();

	// Derived, not destructured. This layout survives navigation between the
	// pages under it, so a value captured once would still be the guild the
	// visitor first landed on.
	const guild = $derived(data.guild);
	const t = $derived(new I18nLite().loadParsed(...data.translations).createTranslator());

	// The same TopBar the settings panel renders, from the same context the root
	// layout provides — so the two sides of the dashboard share one header
	// rather than each inventing their own.
	const user = getContext('user');
	const theme = getContext('theme');

	// Portal links use the base36 slug the visitor arrived on, never `guild.id`.
	// `reroute()` in hooks.server.js rewrites any path whose first segment is all
	// digits to `/settings/<id>`, so a numeric id here would quietly teleport the
	// user into the admin panel. The settings link is the one exception — it
	// *wants* that tree, so it uses the real id.
	const slug = $derived($page.params.guild);

	/**
	 * The bar itself is never gated, only the individual links.
	 *
	 * Gating the whole thing on `privilegeLevel > 0` left an ordinary member on a
	 * page with no navigation at all: nothing identifying the server, and no way
	 * back to the guild home from anywhere they landed.
	 */
	const links = $derived(
		[
			{ href: `/${slug}`, icon: 'fa-house', label: t('common:home') },
			guild.privilegeLevel > 0 && {
				href: `/${slug}/staff`,
				icon: 'fa-user-group',
				label: t('common:staff_dashboard')
			},
			guild.privilegeLevel >= 2 && {
				href: `/settings/${guild.id}`,
				icon: 'fa-gear',
				label: t('common:settings_panel')
			}
		].filter(Boolean)
	);
</script>

<svelte:head>
	<link rel="icon" href={`${guild.logo}`} />
</svelte:head>

<div class="text-gray-800 dark:text-slate-300">
	<div class="m-2 sm:m-6 lg:m-12">
		<div class="mx-auto max-w-7xl">
			<TopBar {user} {theme} />

			<div class="mb-8 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
				<div class="flex flex-wrap items-center gap-4 sm:mx-8">
					<div class="flex items-center gap-3">
						{#if guild.logo}
							<img src={guild.logo} alt="" class="h-10 w-10 rounded-full" />
						{/if}
						<span class="text-lg font-bold">{guild.name}</span>
					</div>
					<nav class="ml-auto flex flex-wrap gap-2">
						{#each links as link (link.href)}
							<a
								href={link.href}
								aria-current={$page.url.pathname === link.href ? 'page' : undefined}
								class="rounded-lg px-3 py-1.5 text-sm transition duration-300 {$page.url
									.pathname === link.href
									? 'bg-blurple text-white'
									: 'bg-gray-100 hover:bg-blurple hover:text-white dark:bg-slate-800 dark:hover:bg-blurple'}"
							>
								<i class="fa-solid {link.icon} mr-1"></i>
								{link.label}
							</a>
						{/each}
					</nav>
				</div>
			</div>

			{@render children?.()}
		</div>
	</div>
</div>
