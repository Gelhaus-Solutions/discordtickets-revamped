import { d as attr, f as ensure_array_like } from "../../../../../chunks/index2.js";
import { e as escape_html } from "../../../../../chunks/escaping.js";
import "@sveltejs/kit/internal";
import "../../../../../chunks/url.js";
import "../../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../../chunks/root.js";
import "../../../../../chunks/exports.js";
import "../../../../../chunks/state.svelte.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let searchQuery = "";
    let sortBy = "date";
    let isLoading = false;
    let searchResults = [];
    let currentPage = 1;
    let totalPages = 1;
    let totalResults = 0;
    const formatDuration = (start, end) => {
      if (!start || !end) return "N/A";
      const ms = new Date(end) - new Date(start);
      const hours = Math.floor(ms / 36e5);
      const minutes = Math.floor(ms % 36e5 / 6e4);
      return `${hours}h ${minutes}m`;
    };
    $$renderer2.push(`<h1 class="m-4 text-center text-4xl font-bold">Ticket Transcripts &amp; Archives</h1> <div class="mx-auto my-8 max-w-6xl px-4"><div class="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8"><div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Total Results</div> <div class="mt-2 text-3xl font-bold">${escape_html(totalResults)}</div></div> <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Current Page</div> <div class="mt-2 text-3xl font-bold">${escape_html(currentPage)} / ${escape_html(totalPages)}</div></div> <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Status <i class="fa-solid fa-circle-question cursor-help text-gray-400 text-sm" title="Search status"></i></div> <div class="mt-2 text-3xl font-bold">`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`Waiting for search`);
    }
    $$renderer2.push(`<!--]--></div></div></div> <div class="mb-8 rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><div class="grid grid-cols-1 gap-4 md:grid-cols-3"><div class="md:col-span-2"><label class="block text-sm font-semibold mb-2">Search Transcripts</label> <input type="text" placeholder="Search by topic, user ID, or ticket ID..." class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2 dark:border-gray-600 dark:bg-slate-800"${attr("value", searchQuery)}/> <p class="text-xs text-gray-500 dark:text-slate-400 mt-2">Press Enter or click Search to find transcripts</p></div> <div><label class="block text-sm font-semibold mb-2">Sort By</label> `);
    $$renderer2.select(
      {
        class: "w-full rounded-lg border border-gray-200 bg-white px-4 py-2 dark:border-gray-600 dark:bg-slate-800",
        value: sortBy
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "date" }, ($$renderer4) => {
          $$renderer4.push(`Date (Newest First)`);
        });
        $$renderer3.option({ value: "duration" }, ($$renderer4) => {
          $$renderer4.push(`Duration (Longest First)`);
        });
      }
    );
    $$renderer2.push(`</div></div> <button${attr("disabled", isLoading, true)} class="mt-4 rounded-lg bg-blurple px-6 py-2 font-medium text-white transition duration-300 hover:bg-blurple/80 disabled:opacity-50 disabled:cursor-not-allowed">`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<i class="fa-solid fa-search mr-2"></i> Search`);
    }
    $$renderer2.push(`<!--]--></button></div> `);
    if (searchResults.length > 0) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<div class="space-y-4"><div class="text-sm text-gray-600 dark:text-slate-400 mb-4">Showing page ${escape_html(currentPage)} of ${escape_html(totalPages)} (${escape_html(searchResults.length)} results on this page)</div> <!--[-->`);
      const each_array = ensure_array_like(searchResults);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let transcript = each_array[$$index];
        $$renderer2.push(`<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"><div class="flex flex-col md:flex-row md:items-center md:justify-between mb-3"><div class="flex-1"><div class="font-semibold text-lg"><i class="fa-solid fa-hashtag text-gray-500 dark:text-slate-400"></i> ${escape_html(transcript.topic || `Ticket ${transcript.id}`)}</div> <div class="text-sm text-gray-600 dark:text-slate-400">ID: ${escape_html(transcript.id)} `);
        if (transcript.userId) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="ml-4"><i class="fa-solid fa-user"></i> ${escape_html(transcript.userId)}</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div></div> <div class="mt-2 md:mt-0 text-right"><div class="text-sm font-medium text-gray-600 dark:text-slate-400">`);
        if (transcript.createdAt) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`${escape_html(new Date(transcript.createdAt).toLocaleDateString())}
									${escape_html(new Date(transcript.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div></div></div> <div class="flex flex-wrap gap-2 mb-4"><div class="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800"><i class="fa-solid fa-clock"></i> Duration: ${escape_html(formatDuration(transcript.createdAt, transcript.closedAt))}</div> <div class="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800"><i class="fa-solid fa-database"></i> Size: ${escape_html(((transcript.htmlTranscript?.length || 0) / 1024).toFixed(2))} KB</div> `);
        if (!transcript.open) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300"><i class="fa-solid fa-check-circle"></i> Closed</div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div> <div class="flex gap-2"><button class="inline-flex items-center gap-2 rounded-lg bg-blue-300 px-4 py-2 font-medium transition duration-300 hover:bg-blue-500 hover:text-white dark:bg-blue-500/50 dark:hover:bg-blue-500"><i class="fa-solid fa-download"></i> Download HTML</button> <a${attr("href", `/transcript/${transcript.id}`)} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 rounded-lg bg-gray-300 px-4 py-2 font-medium transition duration-300 hover:bg-gray-500 hover:text-white dark:bg-gray-700 dark:hover:bg-gray-600"><i class="fa-solid fa-external-link"></i> View Online</a></div></div>`);
      }
      $$renderer2.push(`<!--]--> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="rounded-lg bg-white p-12 shadow-sm dark:bg-slate-700 text-center"><i class="fa-solid fa-inbox text-6xl text-gray-400 dark:text-gray-600 mb-4"></i> <p class="text-lg text-gray-600 dark:text-slate-400">Enter a search query to find transcripts</p> <p class="text-sm text-gray-500 dark:text-slate-500 mt-2">Search by ticket ID, topic, or user ID to view closed ticket transcripts</p></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
