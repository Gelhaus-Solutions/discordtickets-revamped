<script>
	import { page } from '$app/stores';

	/** @type {import('./$types').PageData} */
	let { data } = $props();

	let searchQuery = $state('');
	let sortBy = $state('date');

	const filteredTranscripts = $derived(
		data.transcripts
			.filter(t =>
				t.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.userId?.includes(searchQuery) ||
				t.id?.includes(searchQuery)
			)
			.sort((a, b) => {
				if (sortBy === 'date') {
					return new Date(b.createdAt) - new Date(a.createdAt);
				} else if (sortBy === 'duration') {
					const aDuration = new Date(a.closedAt) - new Date(a.createdAt);
					const bDuration = new Date(b.closedAt) - new Date(b.createdAt);
					return bDuration - aDuration;
				}
				return 0;
			})
	);

	const formatDuration = (start, end) => {
		if (!start || !end) return 'N/A';
		const ms = new Date(end) - new Date(start);
		const hours = Math.floor(ms / 3600000);
		const minutes = Math.floor((ms % 3600000) / 60000);
		return `${hours}h ${minutes}m`;
	};

	const downloadTranscript = async (ticketId) => {
		try {
			const response = await fetch(
				`/api/admin/guilds/${$page.params.guild}/tickets/${ticketId}/transcript`,
				{ credentials: 'include' }
			);
			if (!response.ok) throw new Error('Failed to download transcript');

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `transcript-${ticketId}.html`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			alert('Failed to download transcript: ' + error.message);
		}
	};
</script>

<h1 class="m-4 text-center text-4xl font-bold">Ticket Transcripts & Archives</h1>

<div class="mx-auto my-8 max-w-6xl px-4">
	<!-- Stats -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 mb-8">
		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
			<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Total Transcripts</div>
			<div class="mt-2 text-3xl font-bold">{data.totalTranscripts}</div>
		</div>
		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
			<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">
				Total Size
				<i
					class="fa-solid fa-circle-question cursor-help text-gray-400 text-sm"
					title="Estimated total storage used by transcripts"
				></i>
			</div>
			<div class="mt-2 text-3xl font-bold">
				{#if data.transcripts.length > 0}
					{(data.transcripts.reduce((sum, t) => sum + (t.transcript?.length || 0), 0) / 1024).toFixed(2)} KB
				{:else}
					0 KB
				{/if}
			</div>
		</div>
	</div>

	<!-- Search & Sort -->
	<div class="mb-8 rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<label class="block text-sm font-semibold mb-2">Search</label>
				<input
					type="text"
					placeholder="Search by topic, user ID, or ticket ID..."
					class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 dark:border-gray-600 dark:bg-slate-800"
					bind:value={searchQuery}
				/>
			</div>
			<div>
				<label class="block text-sm font-semibold mb-2">Sort By</label>
				<select
					class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 dark:border-gray-600 dark:bg-slate-800"
					bind:value={sortBy}
				>
					<option value="date">Date (Newest First)</option>
					<option value="duration">Duration (Longest First)</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Transcripts List -->
	{#if filteredTranscripts.length > 0}
		<div class="space-y-4">
			{#each filteredTranscripts as transcript}
				<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
					<div class="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
						<div class="flex-1">
							<div class="font-semibold text-lg">
								<i class="fa-solid fa-hashtag text-gray-500 dark:text-slate-400"></i>
								{transcript.topic || `Ticket ${transcript.id}`}
							</div>
							<div class="text-sm text-gray-600 dark:text-slate-400">
								ID: {transcript.id}
								{#if transcript.userId}
									<span class="ml-4">
										<i class="fa-solid fa-user"></i>
										{transcript.userId}
									</span>
								{/if}
							</div>
						</div>
						<div class="mt-2 md:mt-0 text-right">
							<div class="text-sm font-medium text-gray-600 dark:text-slate-400">
								{#if transcript.createdAt}
									{new Date(transcript.createdAt).toLocaleDateString()}
									{new Date(transcript.createdAt).toLocaleTimeString([], {
										hour: '2-digit',
										minute: '2-digit'
									})}
								{/if}
							</div>
						</div>
					</div>

					<div class="flex flex-wrap gap-2 mb-4">
						<div class="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
							<i class="fa-solid fa-clock"></i>
							Duration: {formatDuration(transcript.createdAt, transcript.closedAt)}
						</div>
						<div class="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
							<i class="fa-solid fa-database"></i>
							Size: {(transcript.transcript?.length || 0 / 1024).toFixed(2)} KB
						</div>
						{#if transcript.status === 'CLOSED'}
							<div class="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
								<i class="fa-solid fa-check-circle"></i>
								Closed
							</div>
						{/if}
					</div>

					<div class="flex gap-2">
						<button
							onclick={() => downloadTranscript(transcript.id)}
							class="inline-flex items-center gap-2 rounded-lg bg-blue-300 px-4 py-2 font-medium transition duration-300 hover:bg-blue-500 hover:text-white dark:bg-blue-500/50 dark:hover:bg-blue-500"
						>
							<i class="fa-solid fa-download"></i>
							Download HTML
						</button>
						<a
							href={`/transcript/${transcript.id}`}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-2 rounded-lg bg-gray-300 px-4 py-2 font-medium transition duration-300 hover:bg-gray-500 hover:text-white dark:bg-gray-700 dark:hover:bg-gray-600"
						>
							<i class="fa-solid fa-external-link"></i>
							View Online
						</a>
					</div>
				</div>
			{/each}
		</div>
	{:else if searchQuery}
		<div class="rounded-lg bg-white p-12 shadow-sm dark:bg-slate-700 text-center">
			<i class="fa-solid fa-search text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
			<p class="text-lg text-gray-600 dark:text-slate-400">No transcripts found matching your search</p>
		</div>
	{:else}
		<div class="rounded-lg bg-white p-12 shadow-sm dark:bg-slate-700 text-center">
			<i class="fa-solid fa-inbox text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
			<p class="text-lg text-gray-600 dark:text-slate-400">No transcripts yet</p>
			<p class="text-sm text-gray-500 dark:text-slate-500 mt-2">
				Transcripts will appear here as tickets are closed
			</p>
		</div>
	{/if}
</div>
