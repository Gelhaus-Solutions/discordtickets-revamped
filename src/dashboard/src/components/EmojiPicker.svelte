<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import emojiNames from 'emoji-name-map';

	/**
	 * A picker for every emoji field in the dashboard.
	 *
	 * These used to be bare text inputs whose help text said "a default emoji
	 * name, or custom emoji ID" — so admins typed shortcodes, which is the one
	 * format that could silently fail. The bot resolved them with node-emoji,
	 * whose dataset is missing 502 of the names this dashboard previewed with, and
	 * an unrecognised shortcode was sent to Discord as the emoji's *name*: the
	 * message sent, the button worked, and the icon rendered as a blank space.
	 *
	 * So this never emits a shortcode. A Unicode emoji is emitted as the literal
	 * character and a server emoji as a `<:name:id>` tag — both of which are
	 * unambiguous to Discord and to `src/lib/emoji.js`.
	 *
	 * @typedef {Object} Props
	 * @property {?string} value the stored emoji string
	 * @property {boolean} [required]
	 * @property {?string} [placeholder] shown when nothing is picked
	 */

	/** @type {Props} */
	let { value = $bindable(), required = false, placeholder = 'None' } = $props();

	let open = $state(false);
	let search = $state('');
	let guildEmojis = $state([]);
	let root = $state();

	// name -> character, from the same dataset the bot now falls back to.
	const unicode = Object.entries(emojiNames.emoji);

	const CUSTOM_TAG = /^<(a)?:(\w+):(\d{17,20})>$/;
	const SNOWFLAKE = /^\d{17,20}$/;

	/** What the current value looks like, so the trigger button can show it. */
	const current = $derived.by(() => {
		const raw = (value ?? '').trim();
		if (!raw) return null;
		const tag = raw.match(CUSTOM_TAG);
		if (tag) {
			return {
				kind: 'custom',
				name: tag[2],
				url: `https://cdn.discordapp.com/emojis/${tag[3]}.${tag[1] ? 'gif' : 'png'}?size=32`
			};
		}
		// A bare ID: what the old text inputs stored for a server emoji. Still
		// valid, so it is displayed rather than treated as broken.
		if (SNOWFLAKE.test(raw)) {
			return {
				kind: 'custom',
				name: guildEmojis.find((e) => e.id === raw)?.name ?? 'emoji',
				url: `https://cdn.discordapp.com/emojis/${raw}.png?size=32`
			};
		}
		// A legacy shortcode. Show what it resolves to so the admin can see whether
		// it is one of the names that silently rendered as nothing.
		const expanded = emojiNames.get(raw.replace(/^:|:$/g, ''));
		if (expanded) return { kind: 'unicode', char: expanded, stale: raw !== expanded };
		if (/^:?[a-z0-9_+-]+:?$/i.test(raw)) return { kind: 'broken', raw };
		return { kind: 'unicode', char: raw };
	});

	const matches = $derived.by(() => {
		const query = search.trim().toLowerCase();
		const custom = guildEmojis.filter((e) => !query || e.name.toLowerCase().includes(query));
		const standard = unicode.filter(([name]) => !query || name.includes(query));
		// The full set is 1570 entries; rendering all of them on every keystroke is
		// what makes an unfiltered picker feel broken.
		return { custom: custom.slice(0, 60), standard: standard.slice(0, 120) };
	});

	const pick = (emoji) => {
		value = emoji;
		open = false;
		search = '';
	};

	onMount(async () => {
		// No dedicated route needed: `data?query=…` reduces a dotted path over the
		// cached guild, the same way this page already loads channels and roles.
		try {
			const response = await fetch(
				`/api/admin/guilds/${$page.params.guild}/data?query=emojis.cache`,
				{ credentials: 'include' }
			);
			if (!response.ok) return;
			const body = await response.json();
			guildEmojis = (Array.isArray(body) ? body : Object.values(body ?? {}))
				.filter((e) => e?.id && e?.name)
				.map((e) => ({ animated: Boolean(e.animated), id: e.id, name: e.name }));
		} catch {
			// A guild with no emoji, or a bot that cannot see them, just gets the
			// Unicode half of the picker.
		}
	});

	const onWindowClick = (event) => {
		if (open && root && !root.contains(event.target)) open = false;
	};
</script>

<svelte:window onclick={onWindowClick} />

<div bind:this={root} class="relative inline-block w-full">
	<button
		type="button"
		class="input form-input flex w-full items-center gap-2 text-left"
		onclick={() => (open = !open)}
	>
		{#if current?.kind === 'unicode'}
			<span class="text-2xl leading-none">{current.char}</span>
		{:else if current?.kind === 'custom'}
			<img src={current.url} alt={current.name} class="h-6 w-6" />
			<span class="text-sm text-gray-500 dark:text-slate-400">:{current.name}:</span>
		{:else if current?.kind === 'broken'}
			<i class="fa-solid fa-triangle-exclamation text-yellow-500"></i>
			<span class="text-sm text-yellow-600 dark:text-yellow-400">
				“{current.raw}” is not an emoji Discord recognises — pick one below
			</span>
		{:else}
			<span class="text-sm text-gray-500 dark:text-slate-400">{placeholder}</span>
		{/if}
		<i class="fa-solid fa-angle-down ml-auto text-gray-500 dark:text-slate-400"></i>
	</button>

	<!-- Keeps the surrounding <form> honest: the picker itself is a button, so
	     browser-native `required` needs something with a value to attach to. -->
	<input type="text" class="sr-only" tabindex="-1" aria-hidden="true" {required} value={value ?? ''} readonly />

	{#if current && !required}
		<button
			type="button"
			class="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 transition duration-300 hover:text-red-500"
			title="Remove emoji"
			onclick={() => pick(null)}
		>
			<i class="fa-solid fa-xmark"></i>
		</button>
	{/if}

	{#if open}
		<div
			class="absolute z-30 mt-1 max-h-72 w-72 overflow-y-auto rounded-xl bg-white p-2 shadow-lg dark:bg-slate-700"
		>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				type="text"
				class="input form-input mb-2 text-sm"
				placeholder="Search…"
				autofocus
				bind:value={search}
			/>

			{#if matches.custom.length}
				<div class="mb-1 text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">
					Server
				</div>
				<div class="mb-2 flex flex-wrap gap-1">
					{#each matches.custom as e (e.id)}
						<button
							type="button"
							class="rounded p-1 transition duration-150 hover:bg-gray-200 dark:hover:bg-slate-600"
							title=":{e.name}:"
							onclick={() => pick(`<${e.animated ? 'a' : ''}:${e.name}:${e.id}>`)}
						>
							<img
								src="https://cdn.discordapp.com/emojis/{e.id}.{e.animated
									? 'gif'
									: 'png'}?size=32"
								alt={e.name}
								class="h-6 w-6"
							/>
						</button>
					{/each}
				</div>
			{/if}

			<div class="mb-1 text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">
				Standard
			</div>
			<div class="flex flex-wrap gap-1">
				{#each matches.standard as [name, char] (name)}
					<button
						type="button"
						class="rounded p-1 text-xl leading-none transition duration-150 hover:bg-gray-200 dark:hover:bg-slate-600"
						title=":{name}:"
						onclick={() => pick(char)}
					>
						{char}
					</button>
				{/each}
			</div>

			{#if !matches.custom.length && !matches.standard.length}
				<p class="p-2 text-sm text-gray-500 dark:text-slate-400">No emoji match “{search}”.</p>
			{/if}
		</div>
	{/if}
</div>
