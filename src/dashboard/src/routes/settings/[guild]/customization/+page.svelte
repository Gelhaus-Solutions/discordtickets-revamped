<script>
	import { preventDefault } from 'svelte/legacy';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import ErrorBox from '$components/ErrorBox.svelte';

	/** @type {{data: any}} */
	let { data } = $props();

	let modified = $state(false);
	let loading = $state(false);
	let error = $state(null);
	let successMessage = $state('');

	// Discord's limits for the Modify Current Member endpoint. Keep these in step
	// with src/routes/api/admin/guilds/[guild]/customization.js.
	const NICK_MAX_LENGTH = 32;
	const BIO_MAX_LENGTH = 190;
	// Each image is sent as a base64 data URI (~4/3 the source size), and the
	// avatar and banner share one request against an 8 MiB body limit.
	const IMAGE_MAX_BYTES = 2 * 1024 * 1024;
	const ACCEPTED_IMAGE_TYPES = 'image/png,image/jpeg,image/gif,image/webp';

	const FIELDS = ['botAvatar', 'botBanner', 'botBio', 'botUsername'];

	const fromData = () => ({
		botAvatar: data?.botAvatar || '',
		botBanner: data?.botBanner || '',
		botBio: data?.botBio || '',
		botUsername: data?.botUsername || ''
	});

	// Snapshot of what the server last confirmed, so only genuinely changed
	// fields are submitted. Sending the whole object blanked the avatar whenever
	// someone edited only the bio.
	let saved = fromData();
	let customization = $state(fromData());

	beforeNavigate((navigation) => {
		if (modified && !confirm('You have unsaved changes; are you sure you want to leave?')) {
			navigation.cancel();
		}
	});

	// Removed on destroy — see the note on the general settings page: a handler
	// left on `window` after a client-side navigation keeps answering for a
	// component the user has already left.
	onMount(() => {
		const handler = (event) => {
			if (!modified) return;
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	});

	const handleImageUpload = (event, field) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (file.size > IMAGE_MAX_BYTES) {
			error = new Error(
				`Image must be smaller than ${IMAGE_MAX_BYTES / 1024 / 1024}MB. The selected file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`
			);
			event.target.value = '';
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			error = null;
			customization[field] = e.target?.result;
			modified = true;
		};
		reader.onerror = () => {
			error = new Error('Failed to read file');
		};
		reader.readAsDataURL(file);
	};

	const clearImage = (field) => {
		customization[field] = '';
		modified = true;
	};

	const submit = async () => {
		try {
			error = null;
			successMessage = '';
			loading = true;

			const payload = {};
			for (const field of FIELDS) {
				if (customization[field] !== saved[field]) payload[field] = customization[field];
			}

			if (Object.keys(payload).length === 0) {
				modified = false;
				return;
			}

			const response = await fetch(`/api/admin/guilds/${$page.params.guild}/customization`, {
				method: 'PATCH',
				body: JSON.stringify(payload),
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json; charset=UTF-8'
				}
			});

			// A rejected upload (413) or a proxy error may not return JSON.
			const body = await response.json().catch(() => ({
				message: `${response.status} ${response.statusText}`
			}));

			if (!response.ok) throw body;

			// The response is the stored profile; re-seed from it so the next save
			// only sends what changed after this one.
			saved = {
				botAvatar: body?.botAvatar || '',
				botBanner: body?.botBanner || '',
				botBio: body?.botBio || '',
				botUsername: body?.botUsername || ''
			};
			customization = { ...saved };
			modified = false;
			successMessage = 'Bot customization saved successfully!';
			setTimeout(() => {
				successMessage = '';
			}, 3000);
		} catch (err) {
			error = err;
			window.scroll({
				top: 0,
				behavior: 'smooth'
			});
		} finally {
			loading = false;
		}
	};
</script>

<h1 class="m-4 text-center text-4xl font-bold">Bot Customization</h1>
<div class="m-2 mx-auto max-w-lg p-4 text-lg">
	{#if error}
		<ErrorBox {error} />
	{/if}

	{#if successMessage}
		<div class="mb-4 rounded-lg bg-green-100 p-4 text-green-800 dark:bg-green-500/20 dark:text-green-300">
			<i class="fa-solid fa-check-circle"></i>
			{successMessage}
		</div>
	{/if}

	<div class="mb-8 text-center text-blue-600 dark:text-blue-400">
		<p class="font-semibold"><i class="fa-solid fa-info-circle"></i> Per-Server Settings</p>
		<p>
			Customize the bot's appearance for this server. These settings will override the bot's default
			appearance when it interacts in this server.
		</p>
	</div>

	<form onsubmit={preventDefault(() => submit())} onchange={(e) => {
		if (e.target.type !== 'file') {
			modified = true;
		}
	}}>
		<div class="my-4 grid grid-cols-1 gap-8">
			<!-- Bot Avatar -->
			<div>
				<label for="botAvatarInput" class="font-medium">
					Bot Avatar
					<i
						class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
						title="Upload a custom avatar for the bot in this server (PNG, JPG, GIF or WebP, max 2MB)"
					></i>
				</label>
				<div class="mt-2 flex flex-col items-center gap-4">
					{#if customization.botAvatar}
						<img
							src={customization.botAvatar}
							alt="Bot Avatar"
							class="h-32 w-32 rounded-full border-2 border-blurple"
						/>
						<button
							type="button"
							onclick={() => clearImage('botAvatar')}
							class="rounded-lg bg-red-300 p-2 px-4 font-medium transition duration-300 hover:bg-red-500 hover:text-white dark:bg-red-500/50 dark:hover:bg-red-500 dark:hover:text-white"
						>
							<i class="fa-solid fa-trash"></i> Remove Avatar
						</button>
					{:else}
						<div class="flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 dark:border-slate-600 dark:bg-slate-800">
							<i class="fa-solid fa-image text-4xl text-gray-300 dark:text-slate-600"></i>
						</div>
					{/if}
					<input
						id="botAvatarInput"
						type="file"
						accept={ACCEPTED_IMAGE_TYPES}
						onchange={(e) => handleImageUpload(e, 'botAvatar')}
						class="max-w-xs"
					/>
				</div>
			</div>

			<!-- Bot Banner -->
			<div>
				<label for="botBannerInput" class="font-medium">
					Bot Banner
					<i
						class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
						title="Upload a custom banner for the bot in this server (PNG, JPG, GIF or WebP, max 2MB)"
					></i>
				</label>
				<div class="mt-2 flex flex-col items-center gap-4">
					{#if customization.botBanner}
						<img
							src={customization.botBanner}
							alt="Bot Banner"
							class="h-32 w-full rounded-lg border-2 border-blurple object-cover"
						/>
						<button
							type="button"
							onclick={() => clearImage('botBanner')}
							class="rounded-lg bg-red-300 p-2 px-4 font-medium transition duration-300 hover:bg-red-500 hover:text-white dark:bg-red-500/50 dark:hover:bg-red-500 dark:hover:text-white"
						>
							<i class="fa-solid fa-trash"></i> Remove Banner
						</button>
					{:else}
						<div class="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-slate-600 dark:bg-slate-800">
							<i class="fa-solid fa-panorama text-4xl text-gray-300 dark:text-slate-600"></i>
						</div>
					{/if}
					<input
						id="botBannerInput"
						type="file"
						accept={ACCEPTED_IMAGE_TYPES}
						onchange={(e) => handleImageUpload(e, 'botBanner')}
						class="max-w-xs"
					/>
				</div>
			</div>

			<!-- Bot Username -->
			<div>
				<label for="botUsernameInput" class="font-medium">
					Bot Nickname
					<i
						class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
						title="Custom nickname for the bot in this server (max {NICK_MAX_LENGTH} characters)"
					></i>
				</label>
				<input
					id="botUsernameInput"
					type="text"
					class="input form-input mt-2"
					placeholder="Leave blank to use default"
					maxlength={NICK_MAX_LENGTH}
					bind:value={customization.botUsername}
				/>
				<p class="mt-1 text-sm text-gray-500 dark:text-slate-400">
					{customization.botUsername?.length || 0}/{NICK_MAX_LENGTH}
				</p>
			</div>

			<!-- Bot Bio/Description -->
			<div>
				<label for="botBioInput" class="font-medium">
					Bot Description
					<i
						class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
						title="Custom description or bio for the bot in this server (max {BIO_MAX_LENGTH} characters)"
					></i>
				</label>
				<textarea
					id="botBioInput"
					class="input form-textarea mt-2"
					placeholder="Leave blank to use default description"
					rows="4"
					maxlength={BIO_MAX_LENGTH}
					bind:value={customization.botBio}
				></textarea>
				<p class="mt-1 text-sm text-gray-500 dark:text-slate-400">
					{customization.botBio?.length || 0}/{BIO_MAX_LENGTH}
				</p>
			</div>

		</div>

		<div class="mt-8 flex gap-4">
			<button
				type="submit"
				disabled={!modified || loading}
				class="flex-1 rounded-lg bg-green-300 p-2 px-5 font-medium transition duration-300 hover:bg-green-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500/50 dark:hover:bg-green-500 dark:hover:text-white"
			>
				{#if loading}
					<i class="fa-solid fa-spinner animate-spin"></i>
				{:else}
					<i class="fa-solid fa-save"></i>
				{/if}
				Save Changes
			</button>
			<a
				href="./general"
				class="flex items-center justify-center rounded-lg bg-gray-300 p-2 px-5 font-medium transition duration-300 hover:bg-gray-500 hover:text-white dark:bg-slate-600 dark:hover:bg-slate-500"
			>
				<i class="fa-solid fa-arrow-left"></i>
				Back
			</a>
		</div>
	</form>
</div>

<style>
	:global(.form-textarea) {
		resize: vertical;
	}
</style>
