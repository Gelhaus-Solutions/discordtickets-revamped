<script>
	import { base } from '$app/paths';
	import { page } from '$app/stores';

	/** @type {import('./$types').PageData} */
	let { data } = $props();

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

	const getCategoryName = (categoryId) => {
		return data.categories.find(c => c.id === categoryId)?.name || 'Unknown';
	};
</script>

<h1 class="m-4 text-center text-4xl font-bold">Feedback & Analytics</h1>

<div class="mx-auto my-8 max-w-6xl px-4">
	<!-- Statistics Cards -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-8">
		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
			<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Total Feedback</div>
			<div class="mt-2 text-3xl font-bold">{data.stats.total}</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
			<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Average Rating</div>
			<div class="mt-2 text-3xl font-bold">{data.stats.avgRating} / 5</div>
			<div class="mt-1 flex gap-1">
				{#each Array(5) as _, i}
					<i
						class={`fa-solid fa-star text-sm ${
							i < Math.round(data.stats.avgRating) ? 'text-yellow-500' : 'text-gray-300'
						}`}
					></i>
				{/each}
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
			<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Excellent (5★)</div>
			<div class="mt-2 text-3xl font-bold text-green-600">{data.stats.byRating[5]}</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
			<div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Poor (1★)</div>
			<div class="mt-2 text-3xl font-bold text-red-600">{data.stats.byRating[1]}</div>
		</div>
	</div>

	<!-- Rating Distribution -->
	<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700 mb-8">
		<h2 class="mb-6 text-2xl font-bold">Rating Distribution</h2>
		<div class="space-y-4">
			{#each [5, 4, 3, 2, 1] as rating}
				<div class="flex items-center gap-4">
					<div class="w-20">
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
							class="bg-yellow-500 h-full flex items-center justify-center text-white text-sm font-medium"
							style={`width: ${data.stats.total > 0 ? (data.stats.byRating[rating] / data.stats.total) * 100 : 0}%`}
						>
							{#if (data.stats.byRating[rating] / data.stats.total) * 100 > 20}
								{data.stats.byRating[rating]}
							{/if}
						</div>
					</div>
					<div class="w-12 text-right font-semibold">{data.stats.byRating[rating]}</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Feedback by Category -->
	{#if Object.keys(data.feedbackByCategory).length > 0}
		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700 mb-8">
			<h2 class="mb-6 text-2xl font-bold">Feedback by Category</h2>
			<div class="space-y-4">
				{#each Object.entries(data.feedbackByCategory) as [categoryId, categoryFeedback]}
					{@const categoryName = getCategoryName(categoryId)}
					{@const avgRating = (categoryFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / categoryFeedback.length).toFixed(2)}
					<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-600">
						<div class="flex items-center justify-between mb-3">
							<div class="font-semibold text-lg">{categoryName}</div>
							<div class="flex items-center gap-2">
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
						<div class="flex gap-4">
							{#each [5, 4, 3, 2, 1] as rating}
								{@const count = categoryFeedback.filter(f => f.rating === rating).length}
								<div class="text-center">
									<div class="text-sm font-medium">{rating}★</div>
									<div class="text-lg font-bold text-yellow-600">{count}</div>
									<div class="text-xs text-gray-500">{((count / categoryFeedback.length) * 100).toFixed(0)}%</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Recent Feedback -->
	{#if data.feedback.length > 0}
		<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
			<h2 class="mb-6 text-2xl font-bold">Recent Feedback</h2>
			<div class="space-y-4 max-h-96 overflow-y-auto">
				{#each data.feedback.slice(0, 20) as feedback}
					<div class={`rounded-lg p-4 ${getRatingColor(feedback.rating)}`}>
						<div class="flex items-start justify-between mb-2">
							<div>
								<div class="font-semibold">{getCategoryName(feedback.categoryId)}</div>
								<div class="text-sm text-gray-600 dark:text-slate-400">
									Ticket #
									{feedback.ticketId || 'N/A'}
								</div>
							</div>
							<div class="flex gap-1">
								{#each Array(5) as _, i}
									<i
										class={`fa-solid fa-star text-sm ${
											i < feedback.rating ? 'text-yellow-500' : 'text-gray-400'
										}`}
									></i>
								{/each}
							</div>
						</div>
						{#if feedback.comment}
							<p class="text-sm italic">"{feedback.comment}"</p>
						{/if}
						{#if feedback.createdAt}
							<div class="mt-2 text-xs text-gray-500">
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
			<p class="text-lg text-gray-600 dark:text-slate-400">No feedback yet</p>
		</div>
	{/if}

	<!-- Portal Link -->
	<div class="mt-8 text-center">
		<a
			href={`${base}/${$page.params.guild}/feedback`}
			class="inline-block rounded-lg bg-blurple px-6 py-2 text-white transition duration-300 hover:bg-blurple/80"
		>
			View Full Feedback Portal
			<i class="fa-solid fa-arrow-right-long ml-2"></i>		</a>
	</div>
</div>
