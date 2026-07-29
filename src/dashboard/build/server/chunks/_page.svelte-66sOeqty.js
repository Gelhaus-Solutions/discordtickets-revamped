import { an as head, ao as attr, am as stringify, ai as store_get, af as attr_class, aj as unsubscribe_stores, ak as ensure_array_like, ag as clsx } from './index2-B7lo9Ma0.js';
import { p as page } from './stores-BjlJSBuQ.js';
import { i as iconFor } from './nodes-BUCpBvSB.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';
import './root-tBuNxqOs.js';
import './exports-7ECo9oy7.js';
import './state.svelte-D5lsa5ep.js';

function RunLog($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { runs = [], catalogue = null } = $$props;
    let expanded = null;
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
      }
    };
    const labelFor = (type) => catalogue?.types?.find((t) => t.type === type)?.label ?? type;
    if (runs.length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="p-4 text-center text-gray-500 dark:text-slate-400">This automation has not run yet.</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="flex flex-col gap-2"><!--[-->`);
      const each_array = ensure_array_like(runs);
      for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
        let run = each_array[$$index_1];
        const status = STATUS[run.status] ?? STATUS.FAILED;
        $$renderer2.push(`<div class="rounded-xl bg-gray-100/50 p-3 dark:bg-slate-800/50"><button type="button" class="flex w-full items-center gap-3 text-left"><span${attr_class(`rounded-full px-2 py-0.5 text-xs font-medium ${stringify(status.class)}`)}><i${attr_class(`fa-solid ${stringify(status.icon)}`)}></i> ${escape_html(status.text)}</span> <span class="min-w-0 flex-1 truncate text-sm">${escape_html(labelFor(run.triggerType))}</span> `);
        if (run.durationMs != null) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<span class="text-xs text-gray-500 dark:text-slate-400">${escape_html(run.durationMs)}ms</span>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> <span class="text-xs text-gray-400 dark:text-slate-500">${escape_html(new Date(run.createdAt).toLocaleString())}</span> <i${attr_class(`fa-solid ${stringify(expanded === run.id ? "fa-angle-up" : "fa-angle-down")}`)}></i></button> `);
        if (run.error) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="mt-2 rounded bg-red-500/10 p-2 font-mono text-xs text-red-600 dark:text-red-400">${escape_html(run.error)}</p>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--> `);
        if (expanded === run.id) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<div class="mt-2 flex flex-col gap-1"><!--[-->`);
          const each_array_1 = ensure_array_like(run.steps ?? []);
          for (let i = 0, $$length2 = each_array_1.length; i < $$length2; i++) {
            let step = each_array_1[i];
            $$renderer2.push(`<div class="flex items-center gap-2 text-xs"><i${attr_class(`fa-solid ${stringify(iconFor(step.t))} text-gray-400 dark:text-slate-500`)}></i> <span class="min-w-0 flex-1 truncate">${escape_html(labelFor(step.t))}</span> `);
            if (step.r) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<span class="text-gray-500 dark:text-slate-400">${escape_html(step.r)}</span>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--> <span${attr_class(clsx(step.s === "error" ? "text-red-500" : step.s === "skip" ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"))}>${escape_html(step.s)}</span> `);
            if (step.m != null) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<span class="text-gray-400 dark:text-slate-500">${escape_html(step.m)}ms</span>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></div> `);
            if (step.e) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<p class="ml-6 font-mono text-xs text-red-500">${escape_html(step.e)}</p>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]--></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { data } = $$props;
    let runs = data.runs;
    let loading = false;
    head("1rf56uy", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(data.automation.name)} runs</title>`);
      });
    });
    $$renderer2.push(`<div class="mb-4 flex flex-wrap items-center gap-3"><a href="../../automations" class="link"><i class="fa-solid fa-angle-left"></i> Automations</a> <h1 class="flex-1 text-2xl font-bold">${escape_html(data.automation.name)}</h1> <a${attr("href", `../${stringify(store_get($$store_subs ??= {}, "$page", page).params.automation)}`)} class="link">Edit</a> <button type="button"${attr("disabled", loading, true)} class="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-medium transition duration-300 hover:bg-gray-300 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"><i${attr_class(`fa-solid ${stringify("fa-rotate")}`)}></i> Refresh</button></div> `);
    RunLog($$renderer2, { runs, catalogue: data.catalogue });
    $$renderer2.push(`<!---->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-66sOeqty.js.map
