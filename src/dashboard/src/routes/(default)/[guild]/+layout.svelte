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
	// user into the admin panel.
	const slug = $derived($page.params.guild);
	const atHome = $derived($page.url.pathname === `/${slug}`);
</script>

<svelte:head>
	<link rel="icon" href={`${guild.logo}`} />
</svelte:head>

<!--
	Structured like `settings/+layout.svelte`: the shared TopBar, the page, then
	a footer that leads back out. The portal used to carry its own guild header
	bar with a row of nav pills, which had no counterpart on the settings side
	and made crossing between them feel like two different applications. The
	guild's identity is a card on its home page now, exactly as it is there.
-->
<div class="text-gray-800 dark:text-slate-300">
	<div class="m-2 sm:m-6 lg:m-12">
		<div class="mx-auto max-w-7xl">
			<TopBar {user} {theme} />
			{@render children?.()}
			{#if !atHome}
				<footer class="my-16 text-center">
					<div class="mb-6 p-2 text-sm">
						<a
							href={`/${slug}`}
							class="cursor-pointer text-gray-500 transition duration-300 hover:text-blurple dark:text-slate-400 dark:hover:text-blurple"
						>
							<i class="fa-solid fa-arrow-left"></i>
							{t('common:back_to', { guild: guild.name })}
						</a>
					</div>
				</footer>
			{/if}
		</div>
	</div>
</div>
