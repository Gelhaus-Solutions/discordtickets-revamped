import { f as ensure_array_like, d as attr } from "../../../../chunks/index2.js";
import { e as escape_html } from "../../../../chunks/escaping.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/url.js";
import "../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/exports.js";
import "../../../../chunks/state.svelte.js";
import "jszip";
/* empty css                                                       */
function botPublic($$renderer) {
  $$renderer.push(`<span class="font-bold">WARNING:</span> This bot is public; anyone can add it to their servers. Is this a mistake? Learn more at <a class="underline transition duration-300 hover:text-black dark:hover:text-white" href="https://lnk.earth/dt-warn-pub" target="_blank">https://lnk.earth/dt-warn-pub</a>.`);
}
function logChannelMissingPermission($$renderer, p) {
  $$renderer.push(`<!---->Please give the bot <span class="font-mono">${escape_html(p.permission)}</span> permission in the log channel.`);
}
function _page_settings($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const { guild, problems } = data;
    let createdAt = "";
    const problemSnippets = { botPublic, logChannelMissingPermission };
    const formatter = new Intl.NumberFormat();
    $$renderer2.push(`<div class="grid grid-cols-1 gap-12 md:grid-cols-2"><div><!--[-->`);
    const each_array = ensure_array_like(problems);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let p = each_array[$$index];
      $$renderer2.push(`<div class="m-4"><div class="rounded-xl border-2 border-orange-600 bg-orange-400/20 p-2 font-medium text-orange-600 dark:border-orange-400 dark:bg-orange-500/20 dark:text-orange-400"><div class="flex items-center gap-2"><i class="fa-solid fa-triangle-exclamation mx-2 text-2xl"></i> <div>`);
      problemSnippets[p.id]?.($$renderer2, p);
      $$renderer2.push(`<!----></div></div></div></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (guild.stats.categories.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="m-4"><a${attr("href", guild.id + "/categories/new")}><div class="link rounded-xl border-2 border-blurple bg-blurple/20 p-2 font-medium"><div class="flex items-center gap-2"><i class="fa-solid fa-circle-info mx-2 text-2xl"></i> <div>Create a category to get started <i class="fa-solid fa-arrow-right-long"></i></div></div></div></a></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="grid grid-cols-2 gap-4 text-center sm:grid-cols-3"><a${attr("href", guild.id + "/general")} class="link rounded-xl bg-gray-100 p-4 shadow-sm dark:bg-slate-800"><i class="fas fa-gears mb-4 text-4xl"></i> <p class="text-center text-lg font-semibold">General</p></a> <a${attr("href", guild.id + "/categories")} class="link rounded-xl bg-gray-100 p-4 shadow-sm dark:bg-slate-800"><i class="fas fa-list mb-4 text-4xl"></i> <p class="text-center text-lg font-semibold">Categories</p></a> <a${attr("href", guild.id + "/panels")} class="link rounded-xl bg-gray-100 p-4 shadow-sm dark:bg-slate-800"><i class="fas fa-sliders mb-4 text-4xl"></i> <p class="text-center text-lg font-semibold">Panels</p></a> <a${attr("href", guild.id + "/feedback")} class="link rounded-xl bg-gray-100 p-4 shadow-sm dark:bg-slate-800"><i class="fas fa-comments mb-4 text-4xl"></i> <p class="text-center text-lg font-semibold">Feedback</p></a> <a${attr("href", guild.id + "/tags")} class="link rounded-xl bg-gray-100 p-4 shadow-sm dark:bg-slate-800"><i class="fas fa-tags mb-4 text-4xl"></i> <p class="text-center text-lg font-semibold">Tags</p></a> <button class="rounded-xl bg-red-300 p-4 shadow-sm transition duration-300 hover:bg-red-500 dark:bg-red-500/20 dark:hover:bg-red-500"><i class="fas fa-database mb-4 text-4xl"></i> <p class="text-center text-lg font-semibold">Data</p></button></div></div> <div><div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700"><div class="flex items-center justify-center gap-4 rounded-xl bg-gray-100 p-4 shadow-sm dark:bg-slate-800"><img${attr("src", guild.logo)} alt="" class="h-12 rounded-full"/> <p><span class="text-2xl font-bold">${escape_html(guild.name)}</span> <br/> <span class="text-gray-500 dark:text-slate-400"><i class="fa-solid fa-calendar-days"></i> Added on
						${escape_html(createdAt)}</span></p></div> <div class="m-4 grid grid-cols-2 gap-4 sm:grid-cols-3"><div><h6 class="font-semibold">Resolution time</h6> <p class="text-gray-500 dark:text-slate-400">${escape_html(guild.stats.avgResolutionTime)}</p></div> <div><h6 class="font-semibold">Response time</h6> <p class="text-gray-500 dark:text-slate-400">${escape_html(guild.stats.avgResponseTime)}</p></div> <div><h6 class="font-semibold">Categories</h6> <p class="text-gray-500 dark:text-slate-400">${escape_html(guild.stats.categories.length)}</p></div> <div><h6 class="font-semibold">Tags</h6> <p class="text-gray-500 dark:text-slate-400">${escape_html(guild.stats.tags)}</p></div> <div><h6 class="font-semibold">Tickets</h6> <p class="text-gray-500 dark:text-slate-400">${escape_html(formatter.format(guild.stats.tickets))}</p></div> <div><h6 class="font-semibold">Most used category</h6> <p class="text-gray-500 dark:text-slate-400">${escape_html(guild.stats.categories.sort((a, b) => b.tickets - a.tickets)[0]?.name ?? "None")}</p></div></div></div></div></div>`);
  });
}
export {
  _page_settings as default
};
