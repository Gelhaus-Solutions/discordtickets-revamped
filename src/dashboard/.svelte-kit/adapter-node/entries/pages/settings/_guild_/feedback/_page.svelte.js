import { d as attr, f as ensure_array_like, a as attr_class, k as attr_style, b as store_get, u as unsubscribe_stores } from "../../../../../chunks/index2.js";
import { b as base } from "../../../../../chunks/server.js";
import "../../../../../chunks/url.js";
import "@sveltejs/kit/internal/server";
import "../../../../../chunks/root.js";
import { p as page } from "../../../../../chunks/stores.js";
import { e as escape_html } from "../../../../../chunks/escaping.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { data } = $$props;
    let sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3);
    let untilDate = /* @__PURE__ */ new Date();
    let selectedCategory = "";
    let isLoading = false;
    const getRatingLabel = (rating) => {
      const labels = {
        5: "Excellent",
        4: "Good",
        3: "Okay",
        2: "Poor",
        1: "Terrible"
      };
      return labels[rating] || "Unknown";
    };
    const getRatingColor = (rating) => {
      const colors = {
        5: "bg-green-100 dark:bg-green-900/30",
        4: "bg-blue-100 dark:bg-blue-900/30",
        3: "bg-yellow-100 dark:bg-yellow-900/30",
        2: "bg-orange-100 dark:bg-orange-900/30",
        1: "bg-red-100 dark:bg-red-900/30"
      };
      return colors[rating] || "bg-gray-100 dark:bg-gray-900/30";
    };
    function formatDateForInput(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    function getMaxTrendValue() {
      if (!data.trend || data.trend.length === 0) return 1;
      return Math.max(...data.trend.map((d) => d.count || 0)) || 1;
    }
    $$renderer2.push(`<h1 class="m-4 text-center text-4xl font-bold">Feedback &amp; Analytics</h1> <div class="mx-auto my-8 max-w-6xl px-4"><div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700 mb-8"><h2 class="mb-4 text-xl font-bold">Filters</h2> <div class="grid grid-cols-1 gap-4 md:grid-cols-4"><div><label class="block text-sm font-medium mb-2">From Date</label> <input type="date"${attr("value", formatDateForInput(sinceDate))} class="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-slate-600 dark:border-slate-500"${attr("disabled", isLoading, true)}/></div> <div><label class="block text-sm font-medium mb-2">To Date</label> <input type="date"${attr("value", formatDateForInput(untilDate))} class="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-slate-600 dark:border-slate-500"${attr("disabled", isLoading, true)}/></div> <div><label class="block text-sm font-medium mb-2">Category</label> `);
    $$renderer2.select(
      {
        value: selectedCategory,
        class: "w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-slate-600 dark:border-slate-500",
        disabled: isLoading
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "" }, ($$renderer4) => {
          $$renderer4.push(`All Categories`);
        });
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(data.categories || []);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let category = each_array[$$index];
          $$renderer3.option({ value: category.id }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(category.name)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      }
    );
    $$renderer2.push(`</div> <div class="flex items-end"><button${attr("disabled", isLoading, true)} class="w-full px-4 py-2 bg-blurple text-white rounded-md hover:bg-blurple/90 disabled:opacity-50">${escape_html("Apply Filters")}</button></div></div></div> <div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-8"><div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Total Feedback</div> <div class="mt-2 text-3xl font-bold">${escape_html(data.stats.total || 0)}</div></div> <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Average Rating</div> <div class="mt-2 text-3xl font-bold">${escape_html(data.stats.avgRating || 0)} / 5</div> <div class="mt-1 flex gap-1"><!--[-->`);
    const each_array_1 = ensure_array_like(Array(5));
    for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
      each_array_1[i];
      $$renderer2.push(`<i${attr_class(`fa-solid fa-star text-sm ${i < Math.round(data.stats.avgRating || 0) ? "text-yellow-500" : "text-gray-300"}`)}></i>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><div class="text-sm font-semibold text-gray-600 dark:text-slate-400">5★ Excellent</div> <div class="mt-2 text-3xl font-bold text-green-600">${escape_html(data.stats.byRating?.[5] || 0)}</div></div> <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><div class="text-sm font-semibold text-gray-600 dark:text-slate-400">1★ Terrible</div> <div class="mt-2 text-3xl font-bold text-red-600">${escape_html(data.stats.byRating?.[1] || 0)}</div></div></div> `);
    if (data.trend && data.trend.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700 mb-8"><h2 class="mb-6 text-2xl font-bold">Feedback Trends</h2> <div class="flex items-end gap-2 h-64 overflow-x-auto pb-4"><!--[-->`);
      const each_array_2 = ensure_array_like(data.trend);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let point = each_array_2[$$index_2];
        $$renderer2.push(`<div class="flex flex-col items-center gap-2 min-w-fit"><div class="relative h-40 flex items-end"><div class="w-8 bg-gradient-to-t from-blurple to-blue-400 rounded-t transition-all hover:from-blurple hover:to-blue-300"${attr_style(`height: ${point.count / getMaxTrendValue() * 160}px`)}${attr("title", `${point.count} feedback (avg rating: ${point.avgRating}/5)`)}></div></div> <div class="text-xs text-gray-600 dark:text-slate-400 text-center whitespace-nowrap">${escape_html(new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }))}</div></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700 mb-8"><h2 class="mb-6 text-2xl font-bold">Rating Distribution</h2> <div class="space-y-4"><!--[-->`);
    const each_array_3 = ensure_array_like([5, 4, 3, 2, 1]);
    for (let $$index_5 = 0, $$length = each_array_3.length; $$index_5 < $$length; $$index_5++) {
      let rating = each_array_3[$$index_5];
      const count = data.stats.byRating?.[rating] || 0;
      const percentage = data.stats.total > 0 ? count / data.stats.total * 100 : 0;
      $$renderer2.push(`<div class="flex items-center gap-4"><div class="w-24"><div class="flex items-center gap-1"><!--[-->`);
      const each_array_4 = ensure_array_like(Array(rating));
      for (let $$index_3 = 0, $$length2 = each_array_4.length; $$index_3 < $$length2; $$index_3++) {
        each_array_4[$$index_3];
        $$renderer2.push(`<i class="fa-solid fa-star text-yellow-500"></i>`);
      }
      $$renderer2.push(`<!--]--> <!--[-->`);
      const each_array_5 = ensure_array_like(Array(5 - rating));
      for (let $$index_4 = 0, $$length2 = each_array_5.length; $$index_4 < $$length2; $$index_4++) {
        each_array_5[$$index_4];
        $$renderer2.push(`<i class="fa-solid fa-star text-gray-300"></i>`);
      }
      $$renderer2.push(`<!--]--></div> <span class="text-sm font-medium">${escape_html(getRatingLabel(rating))}</span></div> <div class="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-8 overflow-hidden"><div class="bg-yellow-500 h-full flex items-center justify-center text-white text-sm font-medium transition-all"${attr_style(`width: ${percentage}%`)}>`);
      if (percentage > 15) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span>${escape_html(count)}</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div> <div class="w-16 text-right"><div class="font-semibold">${escape_html(count)}</div> <div class="text-xs text-gray-500">${escape_html(percentage.toFixed(1))}%</div></div></div>`);
    }
    $$renderer2.push(`<!--]--></div></div> `);
    if (Object.keys(data.feedbackByCategory || {}).length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700 mb-8"><h2 class="mb-6 text-2xl font-bold">Feedback by Category</h2> <div class="space-y-4"><!--[-->`);
      const each_array_6 = ensure_array_like(Object.entries(data.feedbackByCategory || {}));
      for (let $$index_8 = 0, $$length = each_array_6.length; $$index_8 < $$length; $$index_8++) {
        let [categoryName, categoryFeedback] = each_array_6[$$index_8];
        const avgRating = categoryFeedback.length > 0 ? (categoryFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / categoryFeedback.length).toFixed(2) : 0;
        $$renderer2.push(`<div class="rounded-lg border border-gray-200 dark:border-gray-600 p-4 hover:shadow-md transition"><div class="flex items-center justify-between mb-4"><div class="font-semibold text-lg">${escape_html(categoryName)}</div> <div class="flex items-center gap-3"><span class="text-sm text-gray-600 dark:text-slate-400">${escape_html(avgRating)} / 5</span> <div class="flex gap-1"><!--[-->`);
        const each_array_7 = ensure_array_like(Array(5));
        for (let i = 0, $$length2 = each_array_7.length; i < $$length2; i++) {
          each_array_7[i];
          $$renderer2.push(`<i${attr_class(`fa-solid fa-star text-sm ${i < Math.round(avgRating) ? "text-yellow-500" : "text-gray-300"}`)}></i>`);
        }
        $$renderer2.push(`<!--]--></div> <span class="ml-4 text-sm font-medium text-gray-600 dark:text-slate-400">${escape_html(categoryFeedback.length)} feedback</span></div></div> <div class="grid grid-cols-5 gap-2"><!--[-->`);
        const each_array_8 = ensure_array_like([5, 4, 3, 2, 1]);
        for (let $$index_7 = 0, $$length2 = each_array_8.length; $$index_7 < $$length2; $$index_7++) {
          let rating = each_array_8[$$index_7];
          const count = categoryFeedback.filter((f) => f.rating === rating).length;
          const percentage = categoryFeedback.length > 0 ? count / categoryFeedback.length * 100 : 0;
          $$renderer2.push(`<div class="text-center"><div class="text-sm font-medium mb-1">${escape_html(rating)}★</div> <div class="text-lg font-bold mb-1">${escape_html(count)}</div> <div class="text-xs bg-gray-100 dark:bg-slate-600 rounded px-2 py-1">${escape_html(percentage.toFixed(0))}%</div></div>`);
        }
        $$renderer2.push(`<!--]--></div></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if ((data.feedback || []).length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><h2 class="mb-6 text-2xl font-bold">Recent Feedback</h2> <div class="space-y-3 max-h-96 overflow-y-auto"><!--[-->`);
      const each_array_9 = ensure_array_like(data.feedback.slice(0, 20));
      for (let $$index_10 = 0, $$length = each_array_9.length; $$index_10 < $$length; $$index_10++) {
        let feedback = each_array_9[$$index_10];
        $$renderer2.push(`<div${attr_class(`rounded-lg p-4 ${getRatingColor(feedback.rating)}`)}><div class="flex items-start justify-between mb-2"><div><div class="font-semibold">${escape_html(feedback.categoryName || "Unknown")}</div> <div class="text-sm text-gray-600 dark:text-slate-400">Ticket #${escape_html(feedback.ticketNumber || "N/A")}</div></div> <div class="flex items-center gap-2"><div class="flex gap-1"><!--[-->`);
        const each_array_10 = ensure_array_like(Array(5));
        for (let i = 0, $$length2 = each_array_10.length; i < $$length2; i++) {
          each_array_10[i];
          $$renderer2.push(`<i${attr_class(`fa-solid fa-star text-sm ${i < feedback.rating ? "text-yellow-500" : "text-gray-400"}`)}></i>`);
        }
        $$renderer2.push(`<!--]--></div> <span class="font-semibold">${escape_html(feedback.rating)}/5</span></div></div> `);
        if (feedback.comment) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="text-sm italic mb-2">"${escape_html(feedback.comment)}"</p>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (feedback.createdAt) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="text-xs text-gray-500">${escape_html(new Date(feedback.createdAt).toLocaleDateString())} at 
								${escape_html(new Date(feedback.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="rounded-lg bg-white p-12 shadow-sm dark:bg-slate-700 text-center"><i class="fa-solid fa-inbox text-6xl text-gray-400 dark:text-gray-600 mb-4"></i> <p class="text-lg text-gray-600 dark:text-slate-400">No feedback for the selected period</p></div>`);
    }
    $$renderer2.push(`<!--]--> <div class="mt-8 text-center"><a${attr("href", `${base}/${store_get($$store_subs ??= {}, "$page", page).params.guild}/feedback`)} class="inline-block rounded-lg bg-blurple px-6 py-2 text-white transition duration-300 hover:bg-blurple/80">View Full Feedback Portal <i class="fa-solid fa-arrow-right-long ml-2"></i></a></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
