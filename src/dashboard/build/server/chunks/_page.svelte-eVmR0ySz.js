import { ak as ensure_array_like, af as attr_class, am as stringify, ao as attr } from './index2-B7lo9Ma0.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';
import './root-tBuNxqOs.js';
import './exports-7ECo9oy7.js';
import './state.svelte-D5lsa5ep.js';
import './marked.esm-DcwJ8j7Z.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let panels = data.panels;
    let busy = {};
    const STATUS = {
      channel_missing: {
        class: "bg-red-500/20 text-red-600 dark:text-red-400",
        icon: "fa-triangle-exclamation",
        text: "Channel deleted"
      },
      ok: {
        class: "bg-green-500/20 text-green-700 dark:text-green-400",
        icon: "fa-circle-check",
        text: "Posted"
      },
      unposted: {
        class: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
        icon: "fa-circle-exclamation",
        text: "Not posted"
      }
    };
    $$renderer2.push(`<h1 class="m-4 text-center text-4xl font-bold">Panels</h1> <div class="m-2 mx-auto max-w-3xl sm:p-4">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="mb-4 flex justify-end"><a href="./panels/new" class="rounded-lg bg-green-300 p-2 px-5 font-medium transition duration-300 hover:bg-green-500 hover:text-white dark:bg-green-500/50 dark:hover:bg-green-500"><i class="fa-solid fa-plus"></i> New panel</a></div> `);
    if (panels.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-slate-700"><i class="fa-solid fa-ticket text-4xl text-gray-400 dark:text-slate-500"></i> <p class="mt-4 text-lg font-medium">No panels yet</p> <p class="mt-1 text-gray-500 dark:text-slate-400">A panel is the message members click to open a ticket.</p></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="flex flex-col gap-3"><!--[-->`);
      const each_array = ensure_array_like(panels);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let panel = each_array[$$index];
        $$renderer2.push(`<div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700"><div class="flex flex-wrap items-start justify-between gap-2"><div class="min-w-0"><h2 class="text-lg font-bold">${escape_html(panel.name)}</h2> <p class="text-sm text-gray-500 dark:text-slate-400">`);
        if (panel.channelName) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="font-mono">#${escape_html(panel.channelName)}</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<span class="italic">unknown channel</span>`);
        }
        $$renderer2.push(`<!--]--> ·
								${escape_html(panel.categories.length)} categor${escape_html(panel.categories.length === 1 ? "y" : "ies")}</p></div> <span${attr_class(`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${stringify(STATUS[panel.status]?.class ?? "")}`)}><i${attr_class(`fa-solid ${stringify(STATUS[panel.status]?.icon ?? "fa-circle")}`)}></i> ${escape_html(STATUS[panel.status]?.text ?? panel.status)}</span></div> `);
        if (panel.status === "unposted") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="mt-2 text-sm text-amber-600 dark:text-amber-400">The message is no longer in Discord. Re-send it to put it back.</p>`);
        } else if (panel.status === "channel_missing") {
          $$renderer2.push("<!--[1-->");
          $$renderer2.push(`<p class="mt-2 text-sm text-red-600 dark:text-red-400">The channel this panel was in has been deleted. Edit the panel to choose a new one.</p>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> <div class="mt-3 flex flex-wrap gap-2"><a${attr("href", `./panels/${panel.id}`)} class="rounded-lg bg-blue-300 px-4 py-2 font-medium transition duration-300 hover:bg-blue-500 hover:text-white dark:bg-blue-500/50 dark:hover:bg-blue-500"><i class="fa-solid fa-pen"></i> Edit</a> <button type="button"${attr("disabled", busy[panel.id] || panel.status === "channel_missing", true)} class="rounded-lg bg-gray-200 px-4 py-2 font-medium transition duration-300 hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500">`);
        if (busy[panel.id]) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<i class="fa-solid fa-spinner animate-spin"></i>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<i class="fa-solid fa-paper-plane"></i>`);
        }
        $$renderer2.push(`<!--]--> ${escape_html(panel.status === "ok" ? "Re-send" : "Post")}</button> <button type="button"${attr("disabled", busy[panel.id], true)} class="rounded-lg bg-red-300 px-4 py-2 font-medium transition duration-300 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500/50 dark:hover:bg-red-500"><i class="fa-solid fa-trash"></i> Delete</button></div></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-eVmR0ySz.js.map
