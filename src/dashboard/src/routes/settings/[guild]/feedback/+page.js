import { error } from '@sveltejs/kit';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch, params }) {
	const fetchOptions = { credentials: 'include' };

	try {
		const [feedbackRes, analyticsRes, categoriesRes] = await Promise.all([
			fetch(`/api/admin/guilds/${params.guild}/feedback`, fetchOptions),
			fetch(`/api/admin/guilds/${params.guild}/analytics`, fetchOptions),
			fetch(`/api/admin/guilds/${params.guild}/categories`, fetchOptions)
		]);

		const feedback = feedbackRes.ok ? await feedbackRes.json() : [];
		const analytics = analyticsRes.ok ? await analyticsRes.json() : null;
		const categories = categoriesRes.ok ? await categoriesRes.json() : [];

		// Calculate feedback statistics
		const stats = {
			total: feedback.length,
			avgRating: feedback.length > 0 ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length).toFixed(2) : 0,
			byRating: {
				5: feedback.filter(f => f.rating === 5).length,
				4: feedback.filter(f => f.rating === 4).length,
				3: feedback.filter(f => f.rating === 3).length,
				2: feedback.filter(f => f.rating === 2).length,
				1: feedback.filter(f => f.rating === 1).length
			}
		};

		// Group feedback by category
		const feedbackByCategory = {};
		feedback.forEach(f => {
			if (!feedbackByCategory[f.categoryId]) {
				feedbackByCategory[f.categoryId] = [];
			}
			feedbackByCategory[f.categoryId].push(f);
		});

		return {
			feedback,
			stats,
			feedbackByCategory,
			analytics,
			categories
		};
	} catch (err) {
		console.error('Failed to load feedback data:', err);
		return {
			feedback: [],
			stats: { total: 0, avgRating: 0, byRating: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
			feedbackByCategory: {},
			analytics: null,
			categories: []
		};
	}
}
