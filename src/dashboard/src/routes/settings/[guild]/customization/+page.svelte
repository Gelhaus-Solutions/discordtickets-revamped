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

	let customization = $state({
		botAvatar: data?.botAvatar || '',
		botBio: data?.botBio || '',
		botBanner: data?.botBanner || '',
		botUsername: data?.botUsername || ''
	});

	beforeNavigate((navigation) => {
		if (modified && !confirm('You have unsaved changes; are you sure you want to leave?')) {
			navigation.cancel();
		}
	});

	onMount(() => {
		window.addEventListener('beforeunload', (event) => {
			if (modified) {
				event.preventDefault();
				event.returnValue = '';
			}
		});
	});

	const handleImageUpload = (event, field) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Check file size (limit to 5MB)
		const maxSize = 5 * 1024 * 1024; // 5MB
		if (file.size > maxSize) {
			error = new Error(`File size must be less than 5MB. Selected file is ${(file.size / 1024 / 1024).toFixed(2)}MB`);
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
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

			const response = await fetch(`/api/admin/guilds/${$page.params.guild}/customization`, {
				method: 'PATCH',
				body: JSON.stringify(customization),
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json; charset=UTF-8'
				}
			});

			const body = await response.json();

			if (!response.ok) {
				throw body;
			} else {
				modified = false;
				successMessage = 'Bot customization saved successfully!';
				setTimeout(() => {
					successMessage = '';
				}, 3000);
			}
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
						title="Upload a custom avatar for the bot in this server (PNG, JPG, max 1MB)"
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
						accept="image/*"
						onchange={(e) => handleImageUpload(e, 'botAvatar')}
						class="max-w-xs"
					/>
				</div>
			</div>

			<!-- Bot Username -->
			<div>
				<label for="botUsernameInput" class="font-medium">
					Bot Username
					<i
						class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
						title="Custom username for the bot in this server (max 80 characters)"
					></i>
				</label>
				<input
					id="botUsernameInput"
					type="text"
					class="input form-input mt-2"
					placeholder="Leave blank to use default"
					maxlength="80"
					bind:value={customization.botUsername}
				/>
				<p class="mt-1 text-sm text-gray-500 dark:text-slate-400">
					{customization.botUsername?.length || 0}/80
				</p>
			</div>

			<!-- Bot Bio/Description -->
			<div>
				<label for="botBioInput" class="font-medium">
					Bot Description
					<i
						class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
						title="Custom description or bio for the bot in this server"
					></i>
				</label>
				<textarea
					id="botBioInput"
					class="input form-textarea mt-2"
					placeholder="Leave blank to use default description"
					rows="4"
					maxlength="500"
					bind:value={customization.botBio}
				></textarea>
				<p class="mt-1 text-sm text-gray-500 dark:text-slate-400">
					{customization.botBio?.length || 0}/500
				</p>
			</div>

			<!-- Bot Banner -->
			<div>
				<div class="font-medium">
					<label for="botBannerInput">
						Bot Banner
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="Upload a custom banner for the bot in this server (PNG, JPG, recommended 1200x600px)"
						></i>
					</label>
				</div>
				<div class="mt-2 flex flex-col items-center gap-4">
					{#if customization.botBanner}
						<img
							src={customization.botBanner}
							alt="Bot Banner"
							class="w-full rounded-lg border-2 border-blurple object-cover"
							style="max-height: 200px;"
						/>
						<button
							type="button"
							onclick={() => clearImage('botBanner')}
							class="rounded-lg bg-red-300 p-2 px-4 font-medium transition duration-300 hover:bg-red-500 hover:text-white dark:bg-red-500/50 dark:hover:bg-red-500 dark:hover:text-white"
						>
							<i class="fa-solid fa-trash"></i> Remove Banner
						</button>
					{:else}
						<div class="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-12 dark:border-slate-600 dark:bg-slate-800">
							<i class="fa-solid fa-image text-4xl text-gray-300 dark:text-slate-600"></i>
						</div>
					{/if}
					<input
						id="botBannerInput"
						type="file"
						accept="image/*"
						onchange={(e) => handleImageUpload(e, 'botBanner')}
						class="max-w-xs"
					/>
				</div>
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
				href="../general"
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
