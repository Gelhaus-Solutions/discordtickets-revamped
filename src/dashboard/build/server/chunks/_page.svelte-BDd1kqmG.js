import { ai as store_get, an as head, ao as attr, ak as ensure_array_like, af as attr_class, am as stringify, aj as unsubscribe_stores, _ as derived, ar as invalid_default_snippet } from './index2-B7lo9Ma0.js';
import { p as page } from './stores-BjlJSBuQ.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';
import './root-tBuNxqOs.js';
import './exports-7ECo9oy7.js';
import './state.svelte-D5lsa5ep.js';
import { T as ToastContainer, B as BootstrapToast } from './FlatToast.svelte_svelte_type_style_lang-CsvlMSms.js';
import { E as ErrorBox } from './ErrorBox-Bl3pQC1d.js';
import { i as iconFor, C as CATEGORY_META } from './nodes-BUCpBvSB.js';
import './index-vPI-6AVn.js';
import './data-LIyun-gF.js';
import './marked.esm-DcwJ8j7Z.js';
import './html-FW6Ia4bL.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { data } = $$props;
    let automations = data.automations;
    let error = null;
    let busy = {};
    `/api/admin/guilds/${store_get($$store_subs ??= {}, "$page", page).params.guild}/automations`;
    const labelFor = (type) => data.catalogue.types.find((t) => t.type === type)?.label ?? type;
    const STATUS = {
      CANCELLED: {
        class: "bg-gray-500/20 text-gray-600 dark:text-slate-400",
        icon: "fa-circle-minus",
        text: "Cancelled"
      },
      FAILED: {
        class: "bg-red-500/20 text-red-600 dark:text-red-400",
        icon: "fa-circle-xmark",
        text: "Failed"
      },
      RUNNING: {
        class: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
        icon: "fa-spinner",
        text: "Running"
      },
      SKIPPED: {
        class: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
        icon: "fa-circle-half-stroke",
        text: "Skipped"
      },
      SUCCESS: {
        class: "bg-green-500/20 text-green-700 dark:text-green-400",
        icon: "fa-circle-check",
        text: "Ran OK"
      },
      SUSPENDED: {
        class: "bg-violet-500/20 text-violet-700 dark:text-violet-400",
        icon: "fa-stopwatch",
        text: "Waiting"
      },
      never: {
        class: "bg-gray-500/20 text-gray-600 dark:text-slate-400",
        icon: "fa-circle-minus",
        text: "Never run"
      }
    };
    const atLimit = derived(() => automations.length >= (data.catalogue.limits?.perGuild ?? Infinity));
    head("1k66qk7", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Automations</title>`);
      });
    });
    ErrorBox($$renderer2, { error });
    $$renderer2.push(`<!----> <h1 class="m-4 text-center text-4xl font-bold">Automations</h1> <p class="mx-4 mb-6 text-center text-gray-500 dark:text-slate-400">When something happens, check some things, then do some things.</p> <div class="mb-4 flex justify-end"><button type="button"${attr("disabled", atLimit(), true)}${attr("title", atLimit() ? "This server has reached its automation limit" : "")} class="rounded-lg bg-green-300 px-4 py-2 font-medium transition duration-300 hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500/75 dark:hover:bg-green-500"><i class="fa-solid fa-plus"></i> New automation</button></div> `);
    if (automations.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-slate-700"><i class="fa-solid fa-diagram-project mb-3 text-4xl text-gray-300 dark:text-slate-500"></i> <p class="text-gray-500 dark:text-slate-400">No automations yet. Make one to react to tickets, messages, buttons or a schedule.</p></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="flex flex-col gap-2"><!--[-->`);
      const each_array = ensure_array_like(automations);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let automation = each_array[$$index];
        const status = STATUS[automation.lastRun?.status] ?? STATUS.never;
        $$renderer2.push(`<div${attr_class(`rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700 ${stringify(automation.enabled ? "" : "border-l-4 border-gray-300 opacity-60 dark:border-slate-500")}`)}><div class="flex flex-wrap items-center gap-3"><button type="button" role="switch"${attr("aria-checked", automation.enabled)} aria-label="Enable this automation"${attr("disabled", busy[automation.id], true)}${attr_class(`relative h-6 w-11 shrink-0 rounded-full transition duration-300 disabled:opacity-50 ${stringify(automation.enabled ? "bg-blurple" : "bg-gray-300 dark:bg-slate-500")}`)}><span${attr_class(`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all duration-300 ${stringify(automation.enabled ? "left-[1.375rem]" : "left-0.5")}`)}></span></button> <div class="min-w-0 flex-1"><p class="truncate font-semibold">${escape_html(automation.name)}</p> <div class="mt-1 flex flex-wrap items-center gap-2 text-xs"><span${attr_class(`rounded-full px-2 py-0.5 font-medium ${stringify(CATEGORY_META.trigger.chip)}`)}><i${attr_class(`fa-solid ${stringify(iconFor(automation.triggerType))}`)}></i> ${escape_html(labelFor(automation.triggerType))}</span> <span class="text-gray-500 dark:text-slate-400">${escape_html(automation.nodeCount)} step${escape_html(automation.nodeCount === 1 ? "" : "s")}</span> <span${attr_class(`rounded-full px-2 py-0.5 font-medium ${stringify(status.class)}`)}><i${attr_class(`fa-solid ${stringify(status.icon)}`)}></i> ${escape_html(status.text)}</span> `);
        {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div></div> <div class="flex flex-wrap gap-2"><a${attr("href", `./automations/${stringify(automation.id)}`)} class="rounded-lg bg-blue-300 px-3 py-1.5 text-sm font-medium transition duration-300 hover:bg-blue-400 dark:bg-blue-500/75 dark:hover:bg-blue-500"><i class="fa-solid fa-pen"></i> Edit</a> <a${attr("href", `./automations/${stringify(automation.id)}/runs`)} class="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium transition duration-300 hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500"><i class="fa-solid fa-list"></i> Runs</a> <button type="button"${attr("disabled", busy[automation.id] || atLimit(), true)} class="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium transition duration-300 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"><i class="fa-solid fa-copy"></i></button> <button type="button"${attr("disabled", busy[automation.id], true)} class="rounded-lg bg-red-300 px-3 py-1.5 text-sm font-medium transition duration-300 hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500/75 dark:hover:bg-red-500"><i class="fa-solid fa-trash"></i></button></div></div></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    ToastContainer($$renderer2, {
      placement: "bottom-right",
      duration: 4e3,
      children: invalid_default_snippet,
      $$slots: {
        default: ($$renderer3, { data: data2 }) => {
          BootstrapToast($$renderer3, { data: data2 });
        }
      }
    });
    $$renderer2.push(`<!---->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BDd1kqmG.js.map
