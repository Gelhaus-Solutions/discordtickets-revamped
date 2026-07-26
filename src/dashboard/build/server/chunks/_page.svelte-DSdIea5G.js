import { ak as ensure_array_like, ao as attr } from './index2-D-VkFrUc.js';
import { b as base } from './server-Bf8x1V_n.js';
import './root-OrB--9Lj.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const { client, guilds } = data;
    const good = [];
    const bad = [];
    guilds.forEach((g) => {
      if (g.added) {
        good.push(g);
      } else {
        bad.push(g);
      }
    });
    const formatter = new Intl.NumberFormat();
    $$renderer2.push(`<div class="grid grid-cols-1 gap-12 md:grid-cols-2"><div class="text-center"><div class="grid grid-cols-1 gap-8"><div class="grid grid-cols-1 gap-4">`);
    if (good.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="my-4"><h3 class="text-xl font-semibold">Add your bot to a guild to get started</h3></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="my-4"><h3 class="text-xl font-semibold">Manage your guilds</h3></div> <!--[-->`);
      const each_array = ensure_array_like(good);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let guild = each_array[$$index];
        $$renderer2.push(`<a${attr("href", `${base}/settings/${guild.id}`)}><div class="link flex items-center gap-4 rounded-xl bg-gray-100 p-4 text-lg font-semibold shadow-sm dark:bg-slate-800"><img${attr("src", guild.logo)} alt="" class="h-12 rounded-full"/> <span>${escape_html(guild.name)}</span></div></a>`);
      }
      $$renderer2.push(`<!--]--> `);
      if (bad.length > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<hr class="mt-4 border-white dark:border-slate-700"/>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (good.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="my-4"><h4 class="font-semibold">Add your bot to more guilds</h4></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="grid grid-cols-1 gap-4 md:grid-cols-2"><!--[-->`);
    const each_array_1 = ensure_array_like(bad);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let guild = each_array_1[$$index_1];
      $$renderer2.push(`<a${attr("href", `/invite?guild=${guild.id}`)}><div class="link flex h-full items-center gap-4 rounded-xl bg-gray-100 p-3 font-semibold shadow-sm dark:bg-slate-800"><img${attr("src", guild.logo)} alt="" class="h-10 rounded-full"/> <span>${escape_html(guild.name)}</span></div></a>`);
    }
    $$renderer2.push(`<!--]--> <a href="/invite"><div class="link flex h-full items-center gap-4 rounded-xl bg-gray-100 p-3 text-lg font-semibold shadow-sm dark:bg-slate-800"><div class="w-full text-center"><i class="fa-solid fa-circle-plus mr-2"></i><span>Add</span></div></div></a></div></div></div> <div><div class="mb-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700"><div class="flex items-center justify-center gap-4 rounded-xl bg-gray-100 p-4 font-semibold shadow-sm dark:bg-slate-800"><img${attr("src", client.avatar)} alt="" class="h-12 rounded-full"/> <span class="text-2xl font-bold">${escape_html(client.username)}<span class="text-gray-500 dark:text-slate-400">#${escape_html(client.discriminator)}</span></span></div> <div class="m-4 grid grid-cols-2 gap-4 sm:grid-cols-3"><div><h6 class="font-semibold">Activated users</h6> <p class="text-gray-500 dark:text-slate-400">${escape_html(formatter.format(client.stats.activatedUsers))}</p></div> <div><h6 class="font-semibold">Archived messages</h6> <p class="text-gray-500 dark:text-slate-400">${escape_html(formatter.format(client.stats.archivedMessages))}</p></div> <div><h6 class="font-semibold">Resolution time</h6> <p class="text-gray-500 dark:text-slate-400">${escape_html(client.stats.avgResolutionTime)}</p></div> <div><h6 class="font-semibold">Response time</h6> <p class="text-gray-500 dark:text-slate-400">${escape_html(client.stats.avgResponseTime)}</p></div> <div><h6 class="font-semibold">Categories</h6> <p class="text-gray-500 dark:text-slate-400">${escape_html(formatter.format(client.stats.categories))}</p></div> <div><h6 class="font-semibold">Guilds</h6> <p class="text-gray-500 dark:text-slate-400">${escape_html(formatter.format(client.stats.guilds))}</p></div> <div><h6 class="font-semibold">Members (avg)</h6> <p class="text-gray-500 dark:text-slate-400">${escape_html(formatter.format(client.stats.members))}
						(${escape_html(formatter.format(Math.floor(client.stats.members / client.stats.guilds)))})</p></div> <div><h6 class="font-semibold">Tags</h6> <p class="text-gray-500 dark:text-slate-400">${escape_html(formatter.format(client.stats.tags))}</p></div> <div><h6 class="font-semibold">Tickets</h6> <p class="text-gray-500 dark:text-slate-400">${escape_html(formatter.format(client.stats.tickets))}</p></div></div></div></div></div> <div class="mx-auto my-8 max-w-3xl"><hr class="mx-24 my-8 border-white dark:border-slate-700"/> <div class="grid grid-cols-1 gap-4 sm:grid-cols-2"><a href="https://discordtickets.app" target="_blank" rel="noopener noreferrer"><div class="link flex items-center gap-4 rounded-xl bg-gray-50/75 p-4 shadow-sm dark:bg-slate-800/75"><i class="fa-solid fa-book text-5xl"></i> <div><p class="text-lg font-semibold">Documentation</p> <p>Follow the guide and find answers</p></div></div></a> <a href="https://lnk.earth/discord" target="_blank" rel="noopener noreferrer"><div class="link flex items-center gap-4 rounded-xl bg-gray-50/75 p-4 shadow-sm dark:bg-slate-800/75"><i class="fa-solid fa-circle-question text-5xl"></i> <div><p class="text-lg font-semibold">Support</p> <p>Get help on Discord</p></div></div></a></div></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DSdIea5G.js.map
