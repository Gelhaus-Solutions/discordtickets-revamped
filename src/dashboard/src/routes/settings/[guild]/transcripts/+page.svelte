<script>
	import { page } from '$app/stores';

	// No `data` destructure: the loader returns empty scaffolding and this page
	// searches on demand, so there is nothing from it to read.
	let searchQuery = $state('');
	let sortBy = $state('date');
	let searched = $state(false);
	let isLoading = $state(false);
	let searchResults = $state([]);
	let currentPage = $state(1);
	let totalPages = $state(1);
	let totalResults = $state(0);
	let pageSize = $state(20);

	const formatDuration = (start, end) => {
		if (!start || !end) return 'N/A';
		const ms = new Date(end) - new Date(start);
		const hours = Math.floor(ms / 3600000);
		const minutes = Math.floor((ms % 3600000) / 60000);
		return `${hours}h ${minutes}m`;
	};

	const performSearch = async (pg = 1) => {
		if (!searchQuery.trim()) {
			searchResults = [];
			searched = false;
			totalResults = 0;
			return;
		}

		isLoading = true;
		searched = true;
		currentPage = pg;

		try {
			const params = new URLSearchParams({
				status: 'closed',
				hasTranscript: 'true',
				limit: pageSize.toString(),
				page: pg.toString()
			});

			const response = await fetch(
				`/api/admin/guilds/${$page.params.guild}/tickets?${params.toString()}`,
				{ credentials: 'include' }
			);

			if (response.ok) {
				const result = await response.json();
				const allTickets = result.tickets || [];

				// Client-side filtering by search term (for quick local searches)
				const searchLower = searchQuery.toLowerCase();
				const filtered = allTickets
					.filter(t =>
						// Search by ID, topic, or user ID
						t.id?.toString().includes(searchQuery) ||
						t.topic?.toLowerCase().includes(searchLower) ||
						t.createdById?.toString().includes(searchQuery)
					)
					.sort((a, b) => {
						if (sortBy === 'duration') {
							const durationA = new Date(a.closedAt) - new Date(a.createdAt);
							const durationB = new Date(b.closedAt) - new Date(b.createdAt);
							return durationB - durationA;
						}
						return new Date(b.createdAt) - new Date(a.createdAt);
					});

				searchResults = filtered;
				totalResults = result.pagination?.total || filtered.length;
				totalPages = result.pagination?.totalPages || 1;
			} else {
				searchResults = [];
				totalResults = 0;
				totalPages = 1;
			}
		} catch (error) {
			console.error('Search failed:', error);
			searchResults = [];
			totalResults = 0;
			totalPages = 1;
		} finally {
			isLoading = false;
		}
	};

	const handleKeydown = (e) => {
		if (e.key === 'Enter') {
			performSearch(1);
		}
	};

	const goToPage = (pg) => {
		if (pg >= 1 && pg <= totalPages) {
			performSearch(pg);
		}
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
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
			<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Total Results</div>
			<div class="mt-2 text-3xl font-bold">{totalResults}</div>
		</div>
		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
			<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Current Page</div>
			<div class="mt-2 text-3xl font-bold">{currentPage} / {totalPages}</div>
		</div>
		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
			<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">
				Status
				<i
					class="fa-solid fa-circle-question cursor-help text-gray-400 text-sm"
					title="Search status"
				></i>
			</div>
			<div class="mt-2 text-3xl font-bold">
				{#if isLoading}
					<span class="text-base">Searching...</span>
				{:else if searched}
					Ready
				{:else}
					Waiting for search
				{/if}
			</div>
		</div>
	</div>

	<!-- Search & Sort -->
	<div class="mb-8 rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="md:col-span-2">
				<label for="transcript-search" class="block text-sm font-semibold mb-2"
					>Search Transcripts</label
				>
				<input
					id="transcript-search"
					type="text"
					placeholder="Search by topic, user ID, or ticket ID..."
					class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 dark:border-gray-600 dark:bg-slate-800"
					bind:value={searchQuery}
					onkeydown={handleKeydown}
				/>
				<p class="text-xs text-gray-500 dark:text-slate-400 mt-2">Press Enter or click Search to find transcripts</p>
			</div>
			<div>
				<label for="transcript-sort" class="block text-sm font-semibold mb-2">Sort By</label>
				<select
					id="transcript-sort"
					class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 dark:border-gray-600 dark:bg-slate-800"
					bind:value={sortBy}
				>
					<option value="date">Date (Newest First)</option>
					<option value="duration">Duration (Longest First)</option>
				</select>
			</div>
		</div>
		<button
			onclick={() => performSearch(1)}
			disabled={isLoading}
			class="mt-4 rounded-lg bg-blurple px-6 py-2 font-medium text-white transition duration-300 hover:bg-blurple/80 disabled:opacity-50 disabled:cursor-not-allowed"
		>
			{#if isLoading}
				<i class="fa-solid fa-spinner animate-spin mr-2"></i>
				Searching...
			{:else}
				<i class="fa-solid fa-search mr-2"></i>
				Search
			{/if}
		</button>
	</div>

	<!-- Transcripts List -->
	{#if isLoading}
		<div class="rounded-lg bg-white p-12 shadow-sm dark:bg-slate-700 text-center">
			<i class="fa-solid fa-spinner animate-spin text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
			<p class="text-lg text-gray-600 dark:text-slate-400">Searching transcripts...</p>
		</div>
	{:else if searchResults.length > 0}
		<div class="space-y-4">
			<div class="text-sm text-gray-600 dark:text-slate-400 mb-4">
				Showing page {currentPage} of {totalPages} ({searchResults.length} results on this page)
			</div>
			{#each searchResults as transcript}
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
							Size: {((transcript.htmlTranscript?.length || 0) / 1024).toFixed(2)} KB
						</div>
						{#if !transcript.open}
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

			<!-- Pagination Controls -->
			{#if totalPages > 1}
				<div class="flex items-center justify-center gap-2 mt-8">
					<button
						onclick={() => goToPage(1)}
						disabled={currentPage === 1 || isLoading}
						class="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
						title="First page"
					>
						<i class="fa-solid fa-chevron-left"></i>
						<i class="fa-solid fa-chevron-left"></i>
					</button>
					<button
						onclick={() => goToPage(currentPage - 1)}
						disabled={currentPage === 1 || isLoading}
						class="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
						title="Previous page"
					>
						<i class="fa-solid fa-chevron-left"></i>
					</button>
					<span class="px-4 py-2 font-medium">Page {currentPage} of {totalPages}</span>
					<button
						onclick={() => goToPage(currentPage + 1)}
						disabled={currentPage === totalPages || isLoading}
						class="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
						title="Next page"
					>
						<i class="fa-solid fa-chevron-right"></i>
					</button>
					<button
						onclick={() => goToPage(totalPages)}
						disabled={currentPage === totalPages || isLoading}
						class="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
						title="Last page"
					>
						<i class="fa-solid fa-chevron-right"></i>
						<i class="fa-solid fa-chevron-right"></i>
					</button>
				</div>
			{/if}
		</div>
	{:else if searched}
		<div class="rounded-lg bg-white p-12 shadow-sm dark:bg-slate-700 text-center">
			<i class="fa-solid fa-search text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
			<p class="text-lg text-gray-600 dark:text-slate-400">No transcripts found matching your search</p>
		</div>
	{:else}
		<div class="rounded-lg bg-white p-12 shadow-sm dark:bg-slate-700 text-center">
			<i class="fa-solid fa-inbox text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
			<p class="text-lg text-gray-600 dark:text-slate-400">Enter a search query to find transcripts</p>
			<p class="text-sm text-gray-500 dark:text-slate-500 mt-2">
				Search by ticket ID, topic, or user ID to view closed ticket transcripts
			</p>
		</div>
	{/if}
</div>
