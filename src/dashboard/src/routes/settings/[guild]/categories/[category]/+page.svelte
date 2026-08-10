<script>
	import { run, preventDefault } from 'svelte/legacy';

	import ms from 'ms';
	import { displayEmoji } from '$lib/emoji.js';
	import EmojiPicker from '$components/EmojiPicker.svelte';
	import { marked } from 'marked';
	import { v4 as uuidv4 } from 'uuid';
	import CategoryQuestions from '$components/CategoryQuestions/Questions.svelte';
	import { questionsState as qS } from '$components/state.svelte';
	import { validateQuestion } from '$components/CategoryQuestions/validate.js';
	import Required from '$components/Required.svelte';
	import Inheritable from '$components/Inheritable.svelte';
	import { onMount } from 'svelte';
	import { beforeNavigate } from '$app/navigation';
	import ErrorBox from '$components/ErrorBox.svelte';
	import BlockEditor from '$components/BlockEditor/BlockEditor.svelte';
	import Preview from '$components/BlockEditor/Preview.svelte';
	import { defaultOpeningLayout } from '$components/BlockEditor/blocks.js';
	import PlaceholderPicker from '$components/PlaceholderPicker.svelte';
	import { placeholders, preview } from '$lib/placeholders.js';
	/**
	 * @typedef {Object} Props
	 * @property {import('./$types').PageData} data
	 */

	/** @type {Props} */
	let { data } = $props();

	let modified = $state(false);

	// `messageLayout` is nullable: a category that has never been opened in the
	// block editor keeps using its plain `openingMessage` text, and the bot
	// derives the equivalent layout at send time. Only once someone opts in does
	// the column get a value.
	let useBlockEditor = $state(Boolean(data.category?.messageLayout));

	// Element references for the placeholder pickers, which insert at the caret.
	let channelNameEl = $state();
	let openingMessageEl = $state();

	const catalogue = placeholders();

	beforeNavigate((navigation) => {
		if (modified && !confirm('You have unsaved changes; are you sure you want to leave?')) {
			navigation.cancel();
		}
	});

	onMount(async () => {
		const { applyPolyfills, defineCustomElements } =
			await import('@skyra/discord-components-core/loader');
		applyPolyfills().then(() => {
			defineCustomElements();
		});
	});

	// Its own `onMount`, and deliberately not the async one above: Svelte only
	// honours a teardown returned from a *synchronous* mount callback, so an
	// async one would return a Promise and the listener would never come off.
	//
	// It has to come off. `beforeunload` lives on `window`, which outlives the
	// component, so a client-side navigation to another settings page left this
	// handler attached — still closing over *this* component's `modified`.
	// Submitting on the next page then raised the browser's "Leave site?" dialog
	// on behalf of a page the user had already left.
	onMount(() => {
		const handler = (event) => {
			if (!modified) return;
			event.preventDefault();
			event.returnValue = '';
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	});

	let { category, channels, roles, categories, url } = $state(data);

	const slowmodes = [
		'5s',
		'10s',
		'15s',
		'30s',
		'1m',
		'2m',
		'5m',
		'10m',
		'15m',
		'30m',
		'1h',
		'2h',
		'6h'
	];

	const channelModes = [
		{ value: 'CHANNEL', label: 'Channel (Default)' },
		{ value: 'THREAD', label: 'Thread (in category channel)' },
		{ value: 'FORUM', label: 'Forum Channel' }
	];

	qS.questions = category.questions;
	// Filter channels based on channel mode - will be updated reactively
	let filteredChannels = $derived.by(() => {
		if (category.channelMode === 'FORUM') {
			// For forum mode, show forum channels (type 15)
			return channels.filter((c) => c.type === 15);
		} else if (category.channelMode === 'THREAD') {
			// For thread mode, show text channels (type 0) where threads will be created
			return channels.filter((c) => c.type === 0);
		} else {
			// For CHANNEL mode, show categories (type 4)
			return channels.filter((c) => c.type === 4);
		}
	});
	roles = roles
		.filter((r) => r.name !== '@everyone')
		.sort((a, b) => b.rawPosition - a.rawPosition);
	roles.forEach((r) => {
		r._hexColor = r.color > 0 ? `#${r.color.toString(16).padStart(6, '0')}` : null;
		r._style = r._hexColor ? `color: ${r._hexColor}` : '';
	});

	/**
	 * What each inheritable field falls back to when this category leaves it
	 * unset. Served by the API rather than mirrored here, so the built-in
	 * defaults stay defined once, in `src/lib/settings/inheritance.js`.
	 *
	 * A category being created has no row to ask, so the guild's own sidecar
	 * stands in — it answers the same question.
	 */
	const inherited = $derived(data.category.inherited ?? data.settings.inherited ?? {});

	const PRIORITY_EMOJI_FIELDS = [
		{ key: 'HIGH', label: 'High' },
		{ key: 'MEDIUM', label: 'Medium' },
		{ key: 'LOW', label: 'Low' },
		{ key: 'NONE', label: 'None set' }
	];

	/** An emoji, or a word, for the "Inherited: …" placeholders. */
	const emojiLabel = (value) => (value === '' || value == null ? 'no emoji' : value);

	/**
	 * Set one priority's emoji without detaching the other three.
	 *
	 * The map merges per key on the server, so only the keys this category
	 * actually overrides are sent; clearing one deletes it rather than storing an
	 * empty string, which would mean "no emoji" instead of "inherit".
	 */
	const setPriorityEmoji = (key, value) => {
		const next = { ...(category.priorityEmojis ?? {}) };
		if (value === '' || value == null) delete next[key];
		else next[key] = value;
		category.priorityEmojis = Object.keys(next).length ? next : null;
	};

	/** Role IDs as names, for the greyed "this is what you'd inherit" lists. */
	const roleNames = (ids) =>
		(ids ?? []).map((id) => roles.find((r) => r.id === id)?.name ?? id).join(', ');

	// Three states, not two. `null` inherits, `0` is a deliberate "no cooldown",
	// and anything else is a duration — and the old `? :` round-trip collapsed
	// the first two into the same empty string, so "off" was indistinguishable
	// from "ask the server".
	category.cooldown =
		category.cooldown === null || category.cooldown === undefined
			? ''
			: category.cooldown === 0
				? '0'
				: ms(category.cooldown);

	let error = $state(null);
	let loadingSubmit = $state(false);
	let loadingDelete = $state(false);

	const submit = async () => {
		try {
			// error = null;
			loadingSubmit = true;
			const json = { ...category };

			if (category.discordCategory === 'new') json.discordCategory = null;
			// Empty means inherit, so it goes back as null rather than 0.
			const cooldown = String(category.cooldown ?? '').trim();
			json.cooldown = cooldown === '' ? null : ms(cooldown) || 0;

			// Derived, read-only sidecars from the GET. The API strips them too,
			// but sending them back is noise at best and confusing in a diff.
			delete json.inherited;
			delete json.inheritable;

			// For THREAD and FORUM modes, don't send totalLimit
			if (json.channelMode === 'THREAD' || json.channelMode === 'FORUM') {
				json.totalLimit = null;
			}

			if (json.name.length > 30)
				throw new Error(`The name is too long (${json.name.length}>30).`);

			if (json.description.length > 100)
				throw new Error(`The description is too long (${json.description.length}>100).`);

			json.questions = qS.questions.map((q) => {
				const problem = validateQuestion(q);
				if (problem) throw new Error(`The "${q.label}" question ${problem}`);
				delete q._real;
				return q;
			});

			// Only a text question can supply the topic — every other type stores
			// JSON, and a channel topic of `["urgent"]` helps nobody.
			const topicQuestion = json.questions.find((q) => q.id === json.customTopic);
			if (topicQuestion === undefined || topicQuestion.type !== 'TEXT')
				json.customTopic = null;

			const response = await fetch(url, {
				method: category.id ? 'PATCH' : 'POST',
				body: JSON.stringify(json),
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
				window.location = './';
			}
		} catch (err) {
			loadingSubmit = false;
			error = err;
			window.scroll({
				top: 0,
				behavior: 'smooth'
			});
		}
	};

	const del = async () => {
		try {
			const confirmed = confirm(
				'Are you sure?\nThis will delete all associated tickets (including messages, feedback, etc).'
			);
			if (!confirmed) return false;
			// error = null;
			loadingDelete = true;

			const response = await fetch(url, {
				method: 'DELETE',
				credentials: 'include'
			});
			const body = await response.json();

			if (!response.ok) throw body;
			else window.location = './';
		} catch (err) {
			loadingDelete = false;
			error = err;
			window.scroll({
				top: 0,
				behavior: 'smooth'
			});
		}
	};

	const getRole = (id) => roles.find((r) => r.id === id);

	run(() => {
		category.customTopic = qS.questions.find((q) => q.id === category.customTopic)
			? category.customTopic
			: null;
	});
	// TODO: migrate
	run(() => {
		category.requireTopic = qS.questions.length > 0 ? false : category.requireTopic;
	});
</script>

<div class="mb-8 text-center text-orange-600 dark:text-orange-400">
	<p>
		<i class="fa-solid fa-triangle-exclamation"></i>
		<a
			href="https://discordtickets.app/configuration/categories"
			class="font-semibold hover:underline">Read the documentation</a
		>
		to avoid problems.
	</p>
</div>
<h1 class="m-4 text-center text-4xl font-bold">Categories</h1>
<h2 class="m-4 text-center text-2xl font-semibold text-gray-500 dark:text-slate-400">
	{displayEmoji(category.emoji)}
	{category.name || 'New category'}
</h2>
<div class="m-2 mx-auto max-w-5xl p-4 text-lg">
	{#if error}
		<ErrorBox {error} />
	{/if}
	<form onsubmit={preventDefault(() => submit())} onchange={() => (modified = true)} class="my-4">
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-12">
			<div class="grid grid-cols-1 gap-8">
				<div>
					<label class="font-medium">
						Name
						<Required />
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="The name of the category"
						></i>
						<input
							type="text"
							class="input form-input"
							required
							bind:value={category.name}
						/>
					</label>
				</div>
				<div>
					<Inheritable
						label="Channel name"
						title="The name of ticket channels"
						bind:value={category.channelName}
						inherited={inherited.channelName}
					>
						{#snippet control({ value, setValue, placeholder })}
							<input
								bind:this={channelNameEl}
								type="text"
								class="input form-input"
								{placeholder}
								value={value ?? ''}
								oninput={(e) => setValue(e.target.value === '' ? null : e.target.value)}
							/>
						{/snippet}
					</Inheritable>
					<div class="mt-1">
						<PlaceholderPicker target={channelNameEl} context="channelName" />
					</div>
					{#if category.channelName ?? inherited.channelName}
						<p class="mb-1 mt-2 text-sm font-semibold">Preview</p>
						<div
							class="block w-full break-words rounded-md bg-blurple/20 p-3 font-mono text-sm shadow-sm dark:bg-blurple/20"
						>
							<i class="fa-solid fa-hashtag text-gray-500 dark:text-slate-400"></i>
							<span class="marked">
								{@html marked.parse(
									preview(
										catalogue,
										'channelName',
										(category.channelName ?? inherited.channelName ?? '').replace(/\n/g, '\n\n')
									)
								)}
							</span>
						</div>
					{/if}
				</div>
				<div>
					<label for="claiming" class="font-medium">
						Claiming
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="Allow staff to claim tickets?"
						></i>
						<input
							type="checkbox"
							id="claiming"
							name="claiming"
							class="form-checkbox"
							bind:checked={category.claiming}
						/>
					</label>
				</div>
				<div>
					<label for="autoAssign" class="font-medium">
						Auto-assign
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="Automatically assign the ticket to the first staff member who responds?"
						></i>
						<input
							type="checkbox"
							id="autoAssign"
							name="autoAssign"
							class="form-checkbox"
							bind:checked={category.autoAssign}
						/>
					</label>
				</div>
				<div>
					<Inheritable
						label="Cooldown"
						title="How long should members have to wait before creating another ticket?"
						bind:value={category.cooldown}
						inherited={inherited.cooldown === null || inherited.cooldown === undefined
							? 'no cooldown'
							: inherited.cooldown === 0
								? 'no cooldown'
								: ms(inherited.cooldown)}
					>
						{#snippet control({ value, setValue, placeholder })}
							<input
								type="text"
								class="input form-input"
								{placeholder}
								value={value ?? ''}
								oninput={(e) =>
									setValue(e.target.value.trim() === '' ? null : e.target.value)}
							/>
						{/snippet}
						{#snippet help()}
							Enter <code>0</code> for no cooldown at all.
						{/snippet}
					</Inheritable>
				</div>
				<div>
					<label class="font-medium">
						Description
						<Required />
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="What is this category for?"
						></i>
						<input
							type="text"
							class="input form-input"
							required
							bind:value={category.description}
						/>
					</label>
				</div>
				<div>
					<label class="font-medium">
						{#if category.channelMode === 'FORUM'}
							Discord forum channel
						{:else}
							Discord category
						{/if}
						<Required />
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title={category.channelMode === 'FORUM'
								? 'Which forum channel should tickets be created in?'
								: 'Which category channel should ticket channels be created under?'}
						></i>
						<select
							class="input form-multiselect"
							required
							bind:value={category.discordCategory}
						>
							{#if !category.discordCategory || category.discordCategory === 'new'}
								<option value="new"
									>Create a new {category.channelMode === 'FORUM'
										? 'forum'
										: 'category'}</option
								>
								<hr />
							{/if}
							{#each filteredChannels as channel}
								<option value={channel.id} class="p-1">
									<!-- <i class="fa-solid fa-hashtag text-gray-500 dark:text-slate-400" /> -->
									{channel.name}
								</option>
							{/each}
						</select>
					</label>
				</div>
				<div>
					<label class="font-medium">
						Channel Mode
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="How should ticket channels be created?"
						></i>
						<select class="input form-multiselect" bind:value={category.channelMode}>
							{#each channelModes as mode}
								<option value={mode.value} class="p-1">
									{mode.label}
								</option>
							{/each}
						</select>
					</label>
				</div>
				<div>
					{#if category.channelMode === 'CHANNEL'}
						<label class="font-medium">
							Backup Category
							<i
								class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
								title="Alternative category to use when primary is full"
							></i>
							<select
								class="input form-multiselect"
								bind:value={category.backupCategoryId}
							>
								<option value={null} class="p-1"> None </option>
								<hr />
								{#each categories as cat}
									{#if cat.id !== category.id}
										<option value={cat.id} class="p-1">
											{displayEmoji(cat.emoji)}
											{cat.name}
										</option>
									{/if}
								{/each}
							</select>
						</label>
					{:else}
						<label class="font-medium opacity-50 cursor-not-allowed">
							Backup Category
							<i
								class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
								title="Not available for Thread or Forum modes"
							></i>
							<select
								class="input form-multiselect opacity-50 cursor-not-allowed"
								disabled
							>
								<option>Not available for this mode</option>
							</select>
						</label>
					{/if}
				</div>
				<div>
					<label class="font-medium">
						Emoji
						<Required />
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="Emoji used for buttons & dropdowns"
						></i>
						<EmojiPicker
							bind:value={category.emoji}
							required
							placeholder="Choose an emoji"
						/>
					</label>
				</div>
				<!-- No `md:col-span-2` here. This sits inside the left `grid-cols-1`
				     column, not the outer two-column grid, so spanning two columns
				     forces the browser to invent a second, content-sized implicit
				     column. That column overflows the wrapper, `1fr` for the first
				     one collapses to 0px, and every field from here on alternates
				     between a zero-width column and an overflowing one — which is
				     what made the whole form draw on top of itself. -->
				<div>
					<h3 class="mt-2 text-xl font-bold">Channel name emojis</h3>
					<p class="mb-2 text-base text-gray-500 dark:text-slate-400">
						Shown at the start of the ticket channel's name. Leave a field empty to use
						the server default, or pick "None" to show no emoji at all.
					</p>
					<div class="grid gap-4 md:grid-cols-2">
						<Inheritable
							label="Open"
							title="Shown while the ticket is open and unclaimed."
							bind:value={category.unclaimedEmoji}
							inherited={inherited.unclaimedEmoji}
							format={emojiLabel}
						>
							{#snippet control({ value, setValue, placeholder })}
								<EmojiPicker
									value={value ?? ''}
									{placeholder}
									onchange={(v) => setValue(v ?? '')}
								/>
							{/snippet}
						</Inheritable>

						<Inheritable
							label="Claimed"
							title="Shown once a staff member has claimed the ticket."
							bind:value={category.claimedEmoji}
							inherited={inherited.claimedEmoji}
							format={emojiLabel}
						>
							{#snippet control({ value, setValue, placeholder })}
								<EmojiPicker
									value={value ?? ''}
									{placeholder}
									onchange={(v) => setValue(v ?? '')}
								/>
							{/snippet}
						</Inheritable>

						<Inheritable
							label="Waiting on staff"
							title="Shown while the last message is from the ticket author. Takes precedence over Open and Claimed. Leave empty to not use this at all — tickets then keep showing Open or Claimed as before."
							bind:value={category.awaitingStaffEmoji}
							inherited={inherited.awaitingStaffEmoji}
							format={emojiLabel}
						>
							{#snippet control({ value, setValue, placeholder })}
								<EmojiPicker
									value={value ?? ''}
									{placeholder}
									onchange={(v) => setValue(v ?? '')}
								/>
							{/snippet}
						</Inheritable>

						<Inheritable
							label="Closed"
							title="Shown on an archived thread once the ticket is closed."
							bind:value={category.closedEmoji}
							inherited={inherited.closedEmoji}
							format={emojiLabel}
							disabled={category.channelMode === 'CHANNEL'}
						>
							{#snippet control({ value, setValue, placeholder })}
								<EmojiPicker
									value={value ?? ''}
									{placeholder}
									onchange={(v) => setValue(v ?? '')}
								/>
							{/snippet}
							{#snippet help()}
								{#if category.channelMode === 'CHANNEL'}
									A channel-mode ticket's channel is deleted when it closes, so there is
									no name left to show this on. It applies to Thread and Forum categories.
								{/if}
							{/snippet}
						</Inheritable>
					</div>

					<p class="mb-1 mt-4 font-medium">Priority</p>
					<div class="grid gap-4 md:grid-cols-4">
						{#each PRIORITY_EMOJI_FIELDS as { key, label } (key)}
							<label class="font-medium">
								{label}
								<EmojiPicker
									value={category.priorityEmojis?.[key] ?? ''}
									placeholder={`Inherited: ${emojiLabel(inherited.priorityEmojis?.[key])}`}
									onchange={(v) => setPriorityEmoji(key, v)}
								/>
							</label>
						{/each}
					</div>
				</div>
				<div>
					<label for="enableFeedback" class="font-medium">
						Feedback
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="Gather feedback from members?"
						></i>
						<input
							type="checkbox"
							id="enableFeedback"
							name="enableFeedback"
							class="form-checkbox"
							bind:checked={category.enableFeedback}
						/>
					</label>
				</div>
				<div>
					<label class="font-medium">
						Image
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="A link to an image to be sent with the opening message."
						></i>
						<input type="url" class="input form-input" bind:value={category.image} />
					</label>
				</div>
				<div>
					<Inheritable
						label="Member limit"
						title="How many tickets in this category can each member have open?"
						bind:value={category.memberLimit}
						inherited={inherited.memberLimit}
					>
						{#snippet control({ value, setValue, placeholder })}
							<input
								type="number"
								min="1"
								max="10"
								class="input form-input"
								{placeholder}
								value={value ?? ''}
								oninput={(e) =>
									setValue(e.target.value === '' ? null : Number(e.target.value))}
							/>
						{/snippet}
					</Inheritable>
				</div>
				<div>
					<div class="font-medium">
						Opening message
						<Required />
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="The message sent when a ticket in this category is opened."
						></i>
					</div>

					{#if useBlockEditor}
						<p class="mb-2 mt-1 text-sm text-gray-500 dark:text-slate-400">
							Drag blocks to reorder them. Mentions, answers and the ticket controls
							are filled in for each ticket.
						</p>
						<BlockEditor
							bind:blocks={category.messageLayout.blocks}
							categories={[]}
							automations={data.automations}
							context="opening"
						/>
						<button
							type="button"
							class="mt-2 text-sm text-gray-500 underline dark:text-slate-400"
							onclick={() => {
								if (
									confirm(
										'Discard this layout and go back to the simple text editor? The blocks you have added will be lost.'
									)
								) {
									category.messageLayout = null;
									useBlockEditor = false;
								}
							}}
						>
							Switch back to the simple editor
						</button>
					{:else}
						<textarea
							bind:this={openingMessageEl}
							class="input form-input"
							required
							rows="4"
							maxlength="1000"
							bind:value={category.openingMessage}
						></textarea>
						<div class="mt-1">
							<PlaceholderPicker target={openingMessageEl} context="opening" />
						</div>
						<button
							type="button"
							class="mt-2 text-sm text-blurple underline"
							onclick={() => {
								category.messageLayout = defaultOpeningLayout(
									category.openingMessage,
									{
										image: category.image
									}
								);
								useBlockEditor = true;
							}}
						>
							<i class="fa-solid fa-table-cells-large"></i>
							Use the block editor for full control
						</button>
					{/if}
					{#if useBlockEditor}
						<div class="mt-3">
							<Preview
								layout={category.messageLayout}
								categories={[]}
								context="opening"
								primaryColour={data.settings.primaryColour}
								footer={data.settings.footer ?? ''}
							/>
						</div>
					{/if}

					{#key category.pingRoles}
						{#key category.requireTopic}
							{#if category.openingMessage && !useBlockEditor}
								<p class="mb-1 mt-2 text-sm font-semibold">Preview</p>
								<discord-messages
									no-background={true}
									light-theme={data.theme !== 'dark'}
									class="bloc w-full border-0"
								>
									<discord-message
										author={data.client.username}
										avatar={data.client.avatar}
										bot={true}
										timestamp={`Today at ${new Date().toLocaleTimeString(
											'default',
											{
												hour: 'numeric',
												minute: 'numeric'
											}
										)}`}
										class="py-2"
										highlight
									>
										{#if category.pingRoles?.length > 0}
											{#each category.pingRoles as id, index}
												{@const role = getRole(id)}
												{#if role}
													{#if index > 0}
														{' '}
													{/if}
													<discord-mention
														color={role?._hexColor}
														type="role"
													>
														{role?.name}
													</discord-mention>
												{/if}
											{/each}
											, <br />
										{/if}
										<discord-mention highlight
											>{data.user.username}</discord-mention
										>
										has created a new ticket
										<discord-embed
											slot="embeds"
											color={data.settings.primaryColour}
											author-image={`https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.webp`}
											author-name={data.user.username}
											image={category.image}
										>
											<discord-embed-description
												slot="description"
												class="break-words prose prose-slate prose-sm dark:prose-invert prose-a:text-blurple"
											>
												{@html marked.parse(
														preview(catalogue, 'opening', category.openingMessage)
													)}
											</discord-embed-description>
											{#if category.requireTopic}
												<discord-embed-fields slot="fields">
													<discord-embed-field field-title="Topic">
														This is a pretty good preview
													</discord-embed-field>
												</discord-embed-fields>
											{/if}
											{#if data.settings.footer}
												<discord-embed-footer
													slot="footer"
													footer-image={data.client.avatar}
												>
													{data.settings.footer}
												</discord-embed-footer>
											{/if}
										</discord-embed>
										<discord-attachments slot="components">
											<discord-action-row>
												{#if category.requireTopic || qS.questions.length > 0}
													<discord-button type="secondary"
														>✏️ Edit</discord-button
													>
												{/if}
												{#if category.claiming && data.settings.claimButton}
													<discord-button type="secondary"
														>🙌 Claim</discord-button
													>
												{/if}
												{#if data.settings.closeButton}
													<discord-button type="destructive"
														>✖️ Close</discord-button
													>
												{/if}
											</discord-action-row>
										</discord-attachments>
									</discord-message>
								</discord-messages>
							{/if}
						{/key}
					{/key}
				</div>
				<div>
					<Inheritable
						label="Ping roles"
						title="Roles that should be pinged upon ticket creation."
						mode="preview"
						bind:value={category.pingRoles}
						inherited={inherited.pingRoles}
						format={roleNames}
					>
						{#snippet control({ value, setValue })}
							<select
								multiple
								class="input form-multiselect h-44 font-normal"
								value={value ?? []}
								onchange={(e) => setValue([...e.target.selectedOptions].map((o) => o.value))}
							>
								{#each roles as role}
									<option value={role.id} class="m-1 rounded p-1" style={role._style}>
										<!-- <i class="fa-solid fa-at text-gray-500 dark:text-slate-400" style={role._style} /> -->
										{role.unicodeEmoji || ''}
										{role.name}
									</option>
								{/each}
							</select>
						{/snippet}
					</Inheritable>
				</div>
				<div>
					<Inheritable
						label="Slow mode"
						title="Should slow mode be enabled?"
						bind:value={category.ratelimit}
						inherited={inherited.ratelimit ? ms(inherited.ratelimit * 1000, { long: true }) : 'off'}
					>
						{#snippet control({ value, setValue })}
							<select
								class="input form-multiselect font-normal"
								value={value ?? ''}
								onchange={(e) =>
									setValue(e.target.value === '' ? null : Number(e.target.value))}
							>
								<option value="" class="p-1">Use the server default</option>
								<option value={0} class="p-1">Off</option>
								{#each slowmodes as slowmode}
									<option value={ms(slowmode) / 1000} class="p-1">
										{slowmode}
									</option>
								{/each}
							</select>
						{/snippet}
					</Inheritable>
				</div>
				<div>
					<Inheritable
						label="Required roles"
						title="Roles that a user needs to create a ticket."
						mode="preview"
						bind:value={category.requiredRoles}
						inherited={inherited.requiredRoles}
						format={roleNames}
					>
						{#snippet control({ value, setValue })}
							<select
								multiple
								class="input form-multiselect h-44 font-normal"
								value={value ?? []}
								onchange={(e) => setValue([...e.target.selectedOptions].map((o) => o.value))}
							>
								{#each roles as role}
									<option value={role.id} class="m-1 rounded p-1" style={role._style}>
										<!-- <i class="fa-solid fa-at text-gray-500 dark:text-slate-400" style={role._style} /> -->
										{role.unicodeEmoji || ''}
										{role.name}
									</option>
								{/each}
							</select>
						{/snippet}
					</Inheritable>
				</div>
				<div>
					<Inheritable
						label="Blocked roles"
						title="Roles that stop a user creating a ticket here. This wins over required roles and applies to staff too."
						mode="preview"
						bind:value={category.blockedRoles}
						inherited={inherited.blockedRoles}
						format={roleNames}
					>
						{#snippet control({ value, setValue })}
							<select
								multiple
								class="input form-multiselect h-44 font-normal"
								value={value ?? []}
								onchange={(e) => setValue([...e.target.selectedOptions].map((o) => o.value))}
							>
								{#each roles as role}
									<option value={role.id} class="m-1 rounded p-1" style={role._style}>
										{role.unicodeEmoji || ''}
										{role.name}
									</option>
								{/each}
							</select>
						{/snippet}
					</Inheritable>
					<p class="mt-1 text-xs text-gray-500 dark:text-slate-400">
						Anyone with one of these roles is turned away even if they also have every
						required role. Unlike the limits above, staff are not exempt.
					</p>
				</div>
				<div>
					<label for="requireTopic" class="font-medium">
						Require topic
						<i
							class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
							title="Require a topic before ticket creation?"
						></i>
						<input
							type="checkbox"
							id="requireTopic"
							name="requireTopic"
							class="form-checkbox"
							disabled={qS.questions.length > 0}
							bind:checked={category.requireTopic}
						/>
					</label>
				</div>
				<div>
					<Inheritable
						label="Staff roles"
						title="Roles that will be able to view tickets."
						mode="preview"
						bind:value={category.staffRoles}
						inherited={inherited.staffRoles}
						format={roleNames}
					>
						{#snippet control({ value, setValue })}
							<select
								multiple
								class="input form-multiselect h-44 font-normal"
								value={value ?? []}
								onchange={(e) => setValue([...e.target.selectedOptions].map((o) => o.value))}
							>
								{#each roles as role}
									<option value={role.id} class="m-1 rounded p-1" style={role._style}>
										{role.unicodeEmoji || ''}
										{role.name}
									</option>
								{/each}
							</select>
						{/snippet}
						{#snippet help()}
							A category needs staff from somewhere — leaving this empty with no
							server default is rejected.
						{/snippet}
					</Inheritable>
				</div>
				{#if category.channelMode === 'CHANNEL'}
					<div>
						<Inheritable
							label="Total limit"
							title="The total number of tickets that can be open at once."
							bind:value={category.totalLimit}
							inherited={inherited.totalLimit}
						>
							{#snippet control({ value, setValue, placeholder })}
								<input
									type="number"
									min="1"
									max="50"
									class="input form-input"
									{placeholder}
									value={value ?? ''}
									oninput={(e) => setValue(e.target.value === '' ? null : Number(e.target.value))}
							/>
							{/snippet}
						</Inheritable>
					</div>
				{:else}
					<div>
						<label class="font-medium opacity-50 cursor-not-allowed">
							Total limit
							<i
								class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
								title="Not available for Thread or Forum modes"
							></i>
							<input
								type="number"
								disabled
								class="input form-input opacity-50 cursor-not-allowed"
								placeholder="Not available for this mode"
							/>
						</label>
					</div>
				{/if}
			</div>
			<div>
				<div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">
					<div class="flex flex-col gap-4">
						<div class="text-center">
							<h3 class="text-xl font-bold">Questions</h3>
							<p class="text-gray-500 dark:text-slate-400">{qS.questions.length}/5</p>
						</div>
						{#if qS.questions.length > 0}
							<div>
								<label class="font-medium">
									Custom topic
									<i
										class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"
										title="Which question's value should be used as the ticket topic?"
									></i>
									<select
										class="input form-multiselect font-normal"
										bind:value={category.customTopic}
									>
										<option value={null} class="p-1">
											<!-- <i class="fa-solid fa-at text-gray-500 dark:text-slate-400" /> -->
											None
										</option>
										<hr />
										{#each qS.questions.filter((q) => q.type === 'TEXT') as q}
											<option value={q.id} class="p-1">
												{q.label}
											</option>
										{/each}
									</select>
								</label>
							</div>
						{/if}
						<div>
							<CategoryQuestions />
						</div>
						{#if qS.questions.length < 5}
							<div class="text-center">
								<button
									type="button"
									class="rounded-lg p-2 px-5 font-medium text-green-500 transition duration-300 hover:text-green-300 disabled:cursor-not-allowed dark:text-green-500 dark:hover:text-green-500/50"
									onclick={() => {
										qS.questions.push({
											config: {},
											id: uuidv4(),
											label: `Question ${qS.questions.length + 1}`,
											maxLength: 1000,
											minLength: 0,
											options: [],
											order: qS.questions.length,
											placeholder: '',
											required: true,
											style: 2,
											type: null,
											value: '',
											_real: false
										});
									}}
								>
									<i class="fa-solid fa-circle-plus"></i>
									Add
								</button>
							</div>
						{/if}
					</div>
				</div>
				<div class="flex justify-end gap-4">
					{#if category.id}
						<button
							type="button"
							disabled={loadingDelete}
							class="mt-4 rounded-lg bg-red-300 p-2 px-5 font-medium transition duration-300 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed dark:bg-red-500/50 dark:hover:bg-red-500 dark:hover:text-white"
							onclick={del}
						>
							{#if loadingDelete}
								<i class="fa-solid fa-spinner animate-spin"></i>
							{:else}
								<i class="fa-solid fa-trash"></i>
							{/if}
							Delete
						</button>
					{/if}
					<button
						type="submit"
						disabled={loadingSubmit}
						class="mt-4 rounded-lg bg-green-300 p-2 px-5 font-medium transition duration-300 hover:bg-green-500 hover:text-white disabled:cursor-not-allowed dark:bg-green-500/50 dark:hover:bg-green-500 dark:hover:text-white"
					>
						{#if loadingSubmit}
							<i class="fa-solid fa-spinner animate-spin"></i>
						{/if}
						Submit
					</button>
				</div>
			</div>
		</div>
	</form>
</div>
