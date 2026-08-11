<script>
	import '../app.css';
	import '@fortawesome/fontawesome-free/css/all.css';
	import cookie from 'cookie';
	import ms from 'ms';
	import { onMount, setContext } from 'svelte';
	/** @type {{data: import('./$types').PageData, children?: import('svelte').Snippet}} */
	let { data, children } = $props();

	// Read once, deliberately: `setContext` can only be called while the
	// component initialises, so these are snapshots by construction and making
	// them reactive would not change what the consumers receive. Everything here
	// is per-session (the bot, the signed-in user, theme, locale) and a change to
	// any of it arrives as a full page load.
	// svelte-ignore state_referenced_locally
	const { client, user, theme, locale } = data;
	setContext('client', client);
	setContext('user', user);
	setContext('theme', theme);
	setContext('locale', locale);
	onMount(() => {
		if (theme === undefined) {
			document.cookie = cookie.serialize(
				'theme',
				window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
				{
					maxAge: ms('1y') / 1000,
					path: '/',
					sameSite: 'lax'
				}
			);
			document.location = document.location;
		}
	});
</script>

<div class={theme}>
	{@render children?.()}
</div>
