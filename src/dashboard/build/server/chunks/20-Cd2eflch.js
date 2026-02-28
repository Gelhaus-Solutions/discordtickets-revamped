import './utils-FiC4zhrQ.js';

async function load({ fetch, params }) {
  const fetchOptions = { credentials: "include" };
  try {
    const [feedbackRes, analyticsRes, categoriesRes] = await Promise.all([
      fetch(`/api/admin/guilds/${params.guild}/feedback?limit=100`, fetchOptions),
      fetch(`/api/admin/guilds/${params.guild}/analytics`, fetchOptions),
      fetch(`/api/admin/guilds/${params.guild}/categories`, fetchOptions)
    ]);
    const feedbackData = feedbackRes.ok ? await feedbackRes.json() : { feedback: [] };
    const analytics = analyticsRes.ok ? await analyticsRes.json() : null;
    const categories = categoriesRes.ok ? await categoriesRes.json() : [];
    const feedback = feedbackData.feedback || [];
    const stats = {
      total: feedbackData.totalCount || feedback.length,
      avgRating: feedbackData.avgRating || (feedback.length > 0 ? (feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length).toFixed(2) : 0),
      byRating: feedbackData.ratingCounts || {
        5: feedback.filter((f) => f.rating === 5).length,
        4: feedback.filter((f) => f.rating === 4).length,
        3: feedback.filter((f) => f.rating === 3).length,
        2: feedback.filter((f) => f.rating === 2).length,
        1: feedback.filter((f) => f.rating === 1).length
      }
    };
    const feedbackByCategory = {};
    feedback.forEach((f) => {
      const categoryName = f.categoryName || "Unknown";
      if (!feedbackByCategory[categoryName]) {
        feedbackByCategory[categoryName] = [];
      }
      feedbackByCategory[categoryName].push(f);
    });
    return {
      feedback,
      stats,
      feedbackByCategory,
      analytics,
      categories
    };
  } catch (err) {
    console.error("Failed to load feedback data:", err);
    return {
      feedback: [],
      stats: { total: 0, avgRating: 0, byRating: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } },
      feedbackByCategory: {},
      analytics: null,
      categories: []
    };
  }
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 20;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-DlAp4Mr7.js')).default;
const universal_id = "src/routes/settings/[guild]/feedback/+page.js";
const imports = ["_app/immutable/nodes/20.Drm-X3Z4.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/_fu6EM7d.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DbFbsu9R.js","_app/immutable/chunks/BkvMZOlF.js","_app/immutable/chunks/Caq5s-y_.js","_app/immutable/chunks/CdfWQzPM.js","_app/immutable/chunks/BZKIRd09.js","_app/immutable/chunks/B_DfNNzh.js","_app/immutable/chunks/CG3JaKlL.js","_app/immutable/chunks/CzA9-LZ0.js","_app/immutable/chunks/B4e910Rm.js","_app/immutable/chunks/BMZ6xVa9.js","_app/immutable/chunks/nwo5WiIq.js","_app/immutable/chunks/ChD_GQq7.js","_app/immutable/chunks/hFXt_2hJ.js","_app/immutable/chunks/CYgJF_JY.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=20-Cd2eflch.js.map
