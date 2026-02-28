import { f as ensure_array_like, a as attr_class, k as attr_style, d as attr, b as store_get, u as unsubscribe_stores } from "../../../../../chunks/index2.js";
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
    const getCategoryName = (categoryId) => {
      return data.categories.find((c) => c.id === categoryId)?.name || "Unknown";
    };
    $$renderer2.push(`<h1 class="m-4 text-center text-4xl font-bold">Feedback &amp; Analytics</h1> <div class="mx-auto my-8 max-w-6xl px-4"><div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-8"><div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Total Feedback</div> <div class="mt-2 text-3xl font-bold">${escape_html(data.stats.total)}</div></div> <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Average Rating</div> <div class="mt-2 text-3xl font-bold">${escape_html(data.stats.avgRating)} / 5</div> <div class="mt-1 flex gap-1"><!--[-->`);
    const each_array = ensure_array_like(Array(5));
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      each_array[i];
      $$renderer2.push(`<i${attr_class(`fa-solid fa-star text-sm ${i < Math.round(data.stats.avgRating) ? "text-yellow-500" : "text-gray-300"}`)}></i>`);
    }
    $$renderer2.push(`<!--]--></div></div> <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Excellent (5★)</div> <div class="mt-2 text-3xl font-bold text-green-600">${escape_html(data.stats.byRating[5])}</div></div> <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Poor (1★)</div> <div class="mt-2 text-3xl font-bold text-red-600">${escape_html(data.stats.byRating[1])}</div></div></div> <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700 mb-8"><h2 class="mb-6 text-2xl font-bold">Rating Distribution</h2> <div class="space-y-4"><!--[-->`);
    const each_array_1 = ensure_array_like([5, 4, 3, 2, 1]);
    for (let $$index_3 = 0, $$length = each_array_1.length; $$index_3 < $$length; $$index_3++) {
      let rating = each_array_1[$$index_3];
      $$renderer2.push(`<div class="flex items-center gap-4"><div class="w-20"><div class="flex items-center gap-1"><!--[-->`);
      const each_array_2 = ensure_array_like(Array(rating));
      for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
        each_array_2[$$index_1];
        $$renderer2.push(`<i class="fa-solid fa-star text-yellow-500"></i>`);
      }
      $$renderer2.push(`<!--]--> <!--[-->`);
      const each_array_3 = ensure_array_like(Array(5 - rating));
      for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
        each_array_3[$$index_2];
        $$renderer2.push(`<i class="fa-solid fa-star text-gray-300"></i>`);
      }
      $$renderer2.push(`<!--]--></div> <span class="text-sm font-medium">${escape_html(getRatingLabel(rating))}</span></div> <div class="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-8 overflow-hidden"><div class="bg-yellow-500 h-full flex items-center justify-center text-white text-sm font-medium"${attr_style(`width: ${data.stats.total > 0 ? data.stats.byRating[rating] / data.stats.total * 100 : 0}%`)}>`);
      if (data.stats.byRating[rating] / data.stats.total * 100 > 20) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`${escape_html(data.stats.byRating[rating])}`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div> <div class="w-12 text-right font-semibold">${escape_html(data.stats.byRating[rating])}</div></div>`);
    }
    $$renderer2.push(`<!--]--></div></div> `);
    if (Object.keys(data.feedbackByCategory).length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700 mb-8"><h2 class="mb-6 text-2xl font-bold">Feedback by Category</h2> <div class="space-y-4"><!--[-->`);
      const each_array_4 = ensure_array_like(Object.entries(data.feedbackByCategory));
      for (let $$index_6 = 0, $$length = each_array_4.length; $$index_6 < $$length; $$index_6++) {
        let [categoryId, categoryFeedback] = each_array_4[$$index_6];
        const categoryName = getCategoryName(categoryId);
        const avgRating = (categoryFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / categoryFeedback.length).toFixed(2);
        $$renderer2.push(`<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-600"><div class="flex items-center justify-between mb-3"><div class="font-semibold text-lg">${escape_html(categoryName)}</div> <div class="flex items-center gap-2"><span class="text-sm text-gray-600 dark:text-slate-400">${escape_html(avgRating)} / 5</span> <div class="flex gap-1"><!--[-->`);
        const each_array_5 = ensure_array_like(Array(5));
        for (let i = 0, $$length2 = each_array_5.length; i < $$length2; i++) {
          each_array_5[i];
          $$renderer2.push(`<i${attr_class(`fa-solid fa-star text-sm ${i < Math.round(avgRating) ? "text-yellow-500" : "text-gray-300"}`)}></i>`);
        }
        $$renderer2.push(`<!--]--></div> <span class="ml-4 text-sm font-medium text-gray-600 dark:text-slate-400">${escape_html(categoryFeedback.length)} feedback</span></div></div> <div class="flex gap-4"><!--[-->`);
        const each_array_6 = ensure_array_like([5, 4, 3, 2, 1]);
        for (let $$index_5 = 0, $$length2 = each_array_6.length; $$index_5 < $$length2; $$index_5++) {
          let rating = each_array_6[$$index_5];
          const count = categoryFeedback.filter((f) => f.rating === rating).length;
          $$renderer2.push(`<div class="text-center"><div class="text-sm font-medium">${escape_html(rating)}★</div> <div class="text-lg font-bold text-yellow-600">${escape_html(count)}</div> <div class="text-xs text-gray-500">${escape_html((count / categoryFeedback.length * 100).toFixed(0))}%</div></div>`);
        }
        $$renderer2.push(`<!--]--></div></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (data.feedback.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><h2 class="mb-6 text-2xl font-bold">Recent Feedback</h2> <div class="space-y-4 max-h-96 overflow-y-auto"><!--[-->`);
      const each_array_7 = ensure_array_like(data.feedback.slice(0, 20));
      for (let $$index_8 = 0, $$length = each_array_7.length; $$index_8 < $$length; $$index_8++) {
        let feedback = each_array_7[$$index_8];
        $$renderer2.push(`<div${attr_class(`rounded-lg p-4 ${getRatingColor(feedback.rating)}`)}><div class="flex items-start justify-between mb-2"><div><div class="font-semibold">${escape_html(getCategoryName(feedback.categoryId))}</div> <div class="text-sm text-gray-600 dark:text-slate-400">Ticket #
									${escape_html(feedback.ticketId || "N/A")}</div></div> <div class="flex gap-1"><!--[-->`);
        const each_array_8 = ensure_array_like(Array(5));
        for (let i = 0, $$length2 = each_array_8.length; i < $$length2; i++) {
          each_array_8[i];
          $$renderer2.push(`<i${attr_class(`fa-solid fa-star text-sm ${i < feedback.rating ? "text-yellow-500" : "text-gray-400"}`)}></i>`);
        }
        $$renderer2.push(`<!--]--></div></div> `);
        if (feedback.comment) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="text-sm italic">"${escape_html(feedback.comment)}"</p>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (feedback.createdAt) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="mt-2 text-xs text-gray-500">${escape_html(new Date(feedback.createdAt).toLocaleDateString())} at 
								${escape_html(new Date(feedback.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="rounded-lg bg-white p-12 shadow-sm dark:bg-slate-700 text-center"><i class="fa-solid fa-inbox text-6xl text-gray-400 dark:text-gray-600 mb-4"></i> <p class="text-lg text-gray-600 dark:text-slate-400">No feedback yet</p></div>`);
    }
    $$renderer2.push(`<!--]--> <div class="mt-8 text-center"><a${attr("href", `${base}/${store_get($$store_subs ??= {}, "$page", page).params.guild}/feedback`)} class="inline-block rounded-lg bg-blurple px-6 py-2 text-white transition duration-300 hover:bg-blurple/80">View Full Feedback Portal <i class="fa-solid fa-arrow-right-long ml-2"></i></a></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
