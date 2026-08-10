<script>
	import { page } from '$app/stores';
	import { I18nLite } from '@eartharoid/i18n';

	/** @type {{data: import('./$types').PageData, children?: import('svelte').Snippet}} */
	let { data, children } = $props();

	// Derived, not destructured. This layout survives navigation between the
	// pages under it, so a value captured once would still be the guild the
	// visitor first landed on.
	const guild = $derived(data.guild);
	const t = $derived(new I18nLite().loadParsed(...data.translations).createTranslator());

	// Portal links use the base36 slug the visitor arrived on, never `guild.id`.
	// `reroute()` in hooks.server.js rewrites any path whose first segment is all
	// digits to `/settings/<id>`, so a numeric id here would quietly teleport the
	// user into the admin panel. The settings link below is the one exception —
	// it *wants* that tree, so it uses the real id.
	const slug = $derived($page.params.guild);
	const isActive = (path) => $page.url.pathname === path;
</script>

<svelte:head>
	<link rel="icon" href={`${guild.logo}`} />
</svelte:head>

<div>
	{#if guild.privilegeLevel > 0}
		<div class="w-full bg-dgrey-400 p-1 text-xs dark:bg-dgrey-950">
			<div class="container mx-auto">
				<div class="flex justify-center gap-8">
					<a
						href={`/${slug}`}
						class="rounded-md px-2 py-1 text-dgrey-700 duration-300 dark:text-dgrey-400/75 hover:dark:text-dgrey-400/100 {isActive(
							`/${slug}`
						)
							? 'bg-dgrey-900/20 dark:bg-dgrey-400/20'
							: 'bg-dgrey-900/10 hover:bg-dgrey-900/20 dark:bg-dgrey-400/10 dark:hover:bg-dgrey-400/20'}"
					>
						<div class="flex items-center gap-2">
							<i class="fa-solid fa-house"></i>
							{t('common:home')}
						</div>
					</a>
					<a
						href={`/${slug}/staff`}
						class="rounded-md px-2 py-1 text-dgrey-700 duration-300 dark:text-dgrey-400/75 hover:dark:text-dgrey-400/100 {isActive(
							`/${slug}/staff`
						)
							? 'bg-dgrey-900/20 dark:bg-dgrey-400/20'
							: 'bg-dgrey-900/10 hover:bg-dgrey-900/20 dark:bg-dgrey-400/10 dark:hover:bg-dgrey-400/20'}"
					>
						<div class="flex items-center gap-2">
							<i class="fa-solid fa-user-group"></i>
							{t('common:staff_dashboard')}
						</div>
					</a>
					{#if guild.privilegeLevel >= 2}
						<!-- The real snowflake, deliberately: this one belongs to /settings. -->
						<a
							href={`/settings/${guild.id}`}
							class="rounded-md bg-dgrey-900/10 px-2 py-1 text-dgrey-700 duration-300 hover:bg-dgrey-900/20 dark:bg-dgrey-400/10 dark:text-dgrey-400/75 dark:hover:bg-dgrey-400/20 hover:dark:text-dgrey-400/100"
						>
							<div class="flex items-center gap-2">
								<i class="fa-solid fa-gear"></i>
								{t('common:settings_panel')}
							</div>
						</a>
					{/if}
				</div>
			</div>
		</div>
	{/if}
	{@render children?.()}
</div>
