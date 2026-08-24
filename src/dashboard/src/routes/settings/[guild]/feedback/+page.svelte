<script>
	import { base } from '$app/paths';
	import { page } from '$app/stores';
	import { toasts, ToastContainer, BootstrapToast } from 'svelte-toasts';

	/** @type {import('./$types').PageData} */
	let { data } = $props();

	/** Which submissions are mid-delete, keyed by ticket id. */
	let deleting = $state({});

	/**
	 * Remove one submission.
	 *
	 * The DM and the staff log embed were sent when the ticket closed and are not
	 * edited — there is no message to go back and change. Everything else derives
	 * from the table, so the charts and averages correct themselves on the next
	 * read. The confirm says so, because it is not obvious and it is not undoable.
	 */
	const del = async (feedback) => {
		const which = feedback.ticketNumber ? `ticket #${feedback.ticketNumber}` : 'this ticket';
		const confirmed = confirm(
			`Delete the feedback for ${which}?\n\n` +
				'It is removed from this page and from every average and chart. ' +
				'The closing message the member and your staff already received is not changed. ' +
				'This cannot be undone.'
		);
		if (!confirmed) return;

		deleting[feedback.ticketId] = true;
		try {
			const response = await fetch(
				`/api/admin/guilds/${$page.params.guild}/feedback/${feedback.ticketId}`,
				{
					credentials: 'include',
					method: 'DELETE'
				}
			);
			const body = await response.json();
			if (!response.ok) throw body;

			// Spliced out locally rather than re-fetching: the stat cards and the
			// charts are recomputed by `refreshData`, and re-running the whole load
			// for one removed row would reset the filters the admin had set.
			const i = data.feedback.findIndex((f) => f.ticketId === feedback.ticketId);
			if (i !== -1) data.feedback.splice(i, 1);
			await refreshData();
			toasts.add({ description: 'Feedback deleted', type: 'success' });
		} catch (error) {
			toasts.add({
				description: error?.message ?? 'Could not delete that feedback',
				type: 'error'
			});
		} finally {
			deleting[feedback.ticketId] = false;
		}
	};

	let sinceDate = $state(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
	let untilDate = $state(new Date());
	let selectedCategory = $state('');
	let isLoading = $state(false);

	const getRatingLabel = (rating) => {
		const labels = { 5: 'Excellent', 4: 'Good', 3: 'Okay', 2: 'Poor', 1: 'Terrible' };
		return labels[rating] || 'Unknown';
	};

	const getRatingColor = (rating) => {
		const colors = {
			5: 'bg-green-100 dark:bg-green-900/30',
			4: 'bg-blue-100 dark:bg-blue-900/30',
			3: 'bg-yellow-100 dark:bg-yellow-900/30',
			2: 'bg-orange-100 dark:bg-orange-900/30',
			1: 'bg-red-100 dark:bg-red-900/30'
		};
		return colors[rating] || 'bg-gray-100 dark:bg-gray-900/30';
	};

	async function refreshData() {
		isLoading = true;
		try {
			const since = Math.floor(sinceDate.getTime() / 1000);
			const until = Math.floor(untilDate.getTime() / 1000);
			const params = new URLSearchParams({
				since: since.toString(),
				until: until.toString(),
				...(selectedCategory && { categoryId: selectedCategory })
			});

			const res = await fetch(`/api/admin/guilds/${$page.params.guild}/feedback?${params}`, {
				credentials: 'include'
			});

			// A failed refresh used to be swallowed here, leaving the page showing
			// the previous period's numbers under the new filter dates — which reads
			// as data rather than as an error.
			if (!res.ok) throw await res.json().catch(() => new Error('Could not load feedback'));

			{
				const newData = await res.json();
				data.feedback = newData.feedback;
				data.stats = {
					total: newData.totalCount,
					// How many of those carried a rating, so the average card can say
					// what it actually covers.
					rated: newData.ratedCount ?? newData.totalCount,
					avgRating: newData.avgRating,
					byRating: newData.ratingCounts
				};
				data.trend = newData.trend;

				// Recalculate feedback by category
				const feedbackByCategory = {};
				newData.feedback.forEach(f => {
					const categoryName = f.categoryName || 'Unknown';
					if (!feedbackByCategory[categoryName]) {
						feedbackByCategory[categoryName] = [];
					}
					feedbackByCategory[categoryName].push(f);
				});
				data.feedbackByCategory = feedbackByCategory;
			}
		} catch (error) {
			toasts.add({
				description: error?.message ?? 'Could not load feedback',
				type: 'error'
			});
		} finally {
			isLoading = false;
		}
	}

	function formatDateForInput(date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function getMaxTrendValue() {
		if (!data.trend || data.trend.length === 0) return 1;
		return Math.max(...data.trend.map(d => d.count || 0)) || 1;
	}
</script>

<h1 class="m-4 text-center text-4xl font-bold">Feedback & Analytics</h1>

<div class="mx-auto my-8 max-w-6xl px-4">
	<!-- Date Range and Category Filters -->
	<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700 mb-8">
		<h2 class="mb-4 text-xl font-bold">Filters</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
			<div>
				<label for="feedback-since" class="block text-sm font-medium mb-2">From Date</label>
				<input
					id="feedback-since"
					type="date"
					value={formatDateForInput(sinceDate)}
					onchange={(e) => (sinceDate = new Date(e.target.value))}
					class="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-slate-600 dark:border-slate-500"
					disabled={isLoading}
				/>
			</div>
			<div>
				<label for="feedback-until" class="block text-sm font-medium mb-2">To Date</label>
				<input
					id="feedback-until"
					type="date"
					value={formatDateForInput(untilDate)}
					onchange={(e) => (untilDate = new Date(e.target.value))}
					class="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-slate-600 dark:border-slate-500"
					disabled={isLoading}
				/>
			</div>
			<div>
				<label for="feedback-category" class="block text-sm font-medium mb-2">Category</label>
				<select
					id="feedback-category"
					bind:value={selectedCategory}
					class="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-slate-600 dark:border-slate-500"
					disabled={isLoading}
				>
					<option value="">All Categories</option>
					{#each data.categories || [] as category}
						<option value={category.id}>{category.name}</option>
					{/each}
				</select>
			</div>
			<div class="flex items-end">
				<button
					onclick={refreshData}
					disabled={isLoading}
					class="w-full px-4 py-2 bg-blurple text-white rounded-md hover:bg-blurple/90 disabled:opacity-50"
				>
					{isLoading ? 'Loading...' : 'Apply Filters'}
				</button>
			</div>
		</div>
	</div>

	<!-- Statistics Cards -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-8">
		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
			<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Total Feedback</div>
			<div class="mt-2 text-3xl font-bold">{data.stats.total || 0}</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
			<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Average Rating</div>
			<div class="mt-2 text-3xl font-bold">{data.stats.avgRating || 0} / 5</div>
			<div class="mt-1 flex gap-1">
				{#each Array(5) as _, i}
					<i
						class={`fa-solid fa-star text-sm ${
							i < Math.round(data.stats.avgRating || 0) ? 'text-yellow-500' : 'text-gray-300'
						}`}
					></i>
				{/each}
			</div>
			{#if data.stats.rated < data.stats.total}
				<!-- A form without a rating question still collects responses, and an
				     average over "all of them" would be wrong. -->
				<div class="mt-2 text-xs text-gray-500 dark:text-slate-400">
					From {data.stats.rated} of {data.stats.total} responses
				</div>
			{/if}
		</div>

		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
			<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">5★ Excellent</div>
			<div class="mt-2 text-3xl font-bold text-green-600">{data.stats.byRating?.[5] || 0}</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
			<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">1★ Terrible</div>
			<div class="mt-2 text-3xl font-bold text-red-600">{data.stats.byRating?.[1] || 0}</div>
		</div>
	</div>

	<!-- Trend Chart -->
	{#if data.trend && data.trend.length > 0}
		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700 mb-8">
			<h2 class="mb-6 text-2xl font-bold">Feedback Trends</h2>
			<div class="flex items-end gap-2 h-64 overflow-x-auto pb-4">
				{#each data.trend as point}
					<div class="flex flex-col items-center gap-2 min-w-fit">
						<div class="relative h-40 flex items-end">
							<div
								class="w-8 bg-gradient-to-t from-blurple to-blue-400 rounded-t transition-all hover:from-blurple hover:to-blue-300"
								style={`height: ${(point.count / getMaxTrendValue()) * 160}px`}
								title={`${point.count} feedback (avg rating: ${point.avgRating}/5)`}
							></div>
						</div>
						<div class="text-xs text-gray-600 dark:text-slate-400 text-center whitespace-nowrap">
							{new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Rating Distribution -->
	<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700 mb-8">
		<h2 class="mb-6 text-2xl font-bold">Rating Distribution</h2>
		<div class="space-y-4">
			{#each [5, 4, 3, 2, 1] as rating}
				{@const count = data.stats.byRating?.[rating] || 0}
				{@const percentage = data.stats.total > 0 ? ((count / data.stats.total) * 100) : 0}
				<div class="flex items-center gap-4">
					<div class="w-24">
						<div class="flex items-center gap-1">
							{#each Array(rating) as _}
								<i class="fa-solid fa-star text-yellow-500"></i>
							{/each}
							{#each Array(5 - rating) as _}
								<i class="fa-solid fa-star text-gray-300"></i>
							{/each}
						</div>
						<span class="text-sm font-medium">{getRatingLabel(rating)}</span>
					</div>
					<div class="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-8 overflow-hidden">
						<div
							class="bg-yellow-500 h-full flex items-center justify-center text-white text-sm font-medium transition-all"
							style={`width: ${percentage}%`}
						>
							{#if percentage > 15}
								<span>{count}</span>
							{/if}
						</div>
					</div>
					<div class="w-16 text-right">
						<div class="font-semibold">{count}</div>
						<div class="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Feedback by Category -->
	{#if Object.keys(data.feedbackByCategory || {}).length > 0}
		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700 mb-8">
			<h2 class="mb-6 text-2xl font-bold">Feedback by Category</h2>
			<div class="space-y-4">
				{#each Object.entries(data.feedbackByCategory || {}) as [categoryName, categoryFeedback]}
					{@const avgRating = categoryFeedback.length > 0 ? (categoryFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / categoryFeedback.length).toFixed(2) : 0}
					<div class="rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition">
						<div class="flex items-center justify-between mb-4">
							<div class="font-semibold text-lg">{categoryName}</div>
							<div class="flex items-center gap-3">
								<span class="text-sm text-gray-600 dark:text-slate-400">{avgRating} / 5</span>
								<div class="flex gap-1">
									{#each Array(5) as _, i}
										<i
											class={`fa-solid fa-star text-sm ${
												i < Math.round(avgRating) ? 'text-yellow-500' : 'text-gray-300'
											}`}
										></i>
									{/each}
								</div>
								<span class="ml-4 text-sm font-medium text-gray-600 dark:text-slate-400">
									{categoryFeedback.length} feedback
								</span>
							</div>
						</div>
						<div class="grid grid-cols-5 gap-2">
							{#each [5, 4, 3, 2, 1] as rating}
								{@const count = categoryFeedback.filter(f => f.rating === rating).length}
								{@const percentage = categoryFeedback.length > 0 ? ((count / categoryFeedback.length) * 100) : 0}
								<div class="text-center">
									<div class="text-sm font-medium mb-1">{rating}★</div>
									<div class="text-lg font-bold mb-1">{count}</div>
									<div class="text-xs bg-gray-100 dark:bg-slate-600 rounded px-2 py-1">{percentage.toFixed(0)}%</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Recent Feedback -->
	{#if (data.feedback || []).length > 0}
		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
			<h2 class="mb-6 text-2xl font-bold">Recent Feedback</h2>
			<div class="space-y-3 max-h-96 overflow-y-auto">
				{#each data.feedback.slice(0, 20) as feedback}
					<div class={`rounded-lg p-4 ${getRatingColor(feedback.rating)}`}>
						<div class="flex items-start justify-between mb-2">
							<div>
								<div class="font-semibold">{feedback.categoryName || 'Unknown'}</div>
								<div class="text-sm text-gray-600 dark:text-slate-400">
									Ticket #{feedback.ticketNumber || 'N/A'}
								</div>
							</div>
							<div class="flex items-center gap-2">
								<div class="flex gap-1">
									{#each Array(5) as _, i}
										<i
											class={`fa-solid fa-star text-sm ${
												i < feedback.rating ? 'text-yellow-500' : 'text-gray-400'
											}`}
										></i>
									{/each}
								</div>
								<span class="font-semibold">{feedback.rating}/5</span>
								<button
									type="button"
									disabled={deleting[feedback.ticketId]}
									class="text-red-300 transition duration-300 hover:text-red-500 disabled:cursor-not-allowed dark:text-red-500/50 dark:hover:text-red-500"
									title="Delete this feedback"
									onclick={() => del(feedback)}
								>
									{#if deleting[feedback.ticketId]}
										<i class="fa-solid fa-spinner animate-spin"></i>
									{:else}
										<i class="fa-solid fa-xmark"></i>
									{/if}
								</button>
							</div>
						</div>
						{#if feedback.comment}
							<p class="text-sm italic mb-2">"{feedback.comment}"</p>
						{/if}
						{#if feedback.createdAt}
							<div class="text-xs text-gray-500">
								{new Date(feedback.createdAt).toLocaleDateString()} at{' '}
								{new Date(feedback.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="rounded-lg bg-white p-12 shadow-sm dark:bg-slate-700 text-center">
			<i class="fa-solid fa-inbox text-6xl text-gray-400 dark:text-gray-600 mb-4"></i>
			<p class="text-lg text-gray-600 dark:text-slate-400">No feedback for the selected period</p>
		</div>
	{/if}

	<!-- Portal Link -->
	<div class="mt-8 text-center">
		<a
			href={`${base}/${$page.params.guild}/feedback`}
			class="inline-block rounded-lg bg-blurple px-6 py-2 text-white transition duration-300 hover:bg-blurple/80"
		>
			View Full Feedback Portal
			<i class="fa-solid fa-arrow-right-long ml-2"></i>
		</a>
	</div>
</div>

<ToastContainer duration={3000} theme={data.theme}>
	{#snippet children({ data: toasted })}
		<BootstrapToast data={toasted} />
	{/snippet}
</ToastContainer>
