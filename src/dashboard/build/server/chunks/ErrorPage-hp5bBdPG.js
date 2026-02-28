import { k as store_get, f as attr_class, l as unsubscribe_stores, am as ensure_array_like, an as attr_style, ao as stringify } from './index2-D6kyOzXX.js';
import { p as page } from './stores-B7IULIX2.js';
import { m as marked } from './marked.esm-DcwJ8j7Z.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';
import { h as html } from './html-FW6Ia4bL.js';

function Tree_1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { entry = [], indent = 0 } = $$props;
    $$renderer2.push(`<div>`);
    if (entry instanceof Array) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<!--[-->`);
      const each_array = ensure_array_like(entry);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let child = each_array[$$index];
        $$renderer2.push(`<div${attr_class("font-mono", void 0, { "my-4": indent > 0 })}${attr_style(`padding-left: ${stringify(indent)}px;`)}><div class="rounded-bl-xl border-l-2 border-dotted border-black/25 pl-2 dark:border-white/25"><p class="font-bold text-red-700 dark:text-red-500">${escape_html(child[0])}</p> `);
        Tree_1($$renderer2, { entry: child[1], indent: indent + 6 });
        $$renderer2.push(`<!----></div></div>`);
      }
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<p class="prose prose-sm prose-slate ml-2 text-black/75 dark:prose-invert dark:text-white/75">${html(marked.parse(entry))}</p>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function flatten(object) {
  object = object instanceof Error ? { message: object.message } : object;
  const entries = [];
  for (let [k, v] of Object.entries(object)) {
    if (typeof v === "string") {
      try {
        let j = JSON.parse(v);
        if (typeof j === "object") v = flatten(j);
        else v = String(j);
      } catch {
      }
    } else if (typeof v === "object") {
      v = flatten(v);
    } else {
      v = v.toString();
    }
    entries.push([k, v]);
  }
  return entries;
}
function ErrorPage($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { boxStyles = "" } = $$props;
    console.error(store_get($$store_subs ??= {}, "$page", page).error);
    $$renderer2.push(`<div class="container mx-auto"><div class="my-12 flex justify-center lg:my-24"><div class="flex flex-col gap-8"><h1 class="text-center text-4xl font-bold text-black dark:text-white">Sorry, something went wrong.</h1> <p class="text-center text-xl">Your request failed with HTTP status <span class="font-mono">${escape_html(store_get($$store_subs ??= {}, "$page", page).status)}</span>.</p> <div${attr_class(`${boxStyles} flex flex-col gap-4 rounded-lg px-6 py-4 text-sm`)}><div class="font-mono text-xs"><p class="my-2"><span class="font-bold text-black dark:text-white">URL:</span> ${escape_html(store_get($$store_subs ??= {}, "$page", page).url)}</p> <p class="my-2"><span class="font-bold text-black dark:text-white">Route:</span> ${escape_html(store_get($$store_subs ??= {}, "$page", page).route.id)}</p></div> <div><p class="font-mono text-sm"><span class="font-bold text-black dark:text-white">Error</span></p> `);
    Tree_1($$renderer2, {
      entry: flatten(store_get($$store_subs ??= {}, "$page", page).error)
    });
    $$renderer2.push(`<!----></div> `);
    if (store_get($$store_subs ??= {}, "$page", page).params && Object.keys(store_get($$store_subs ??= {}, "$page", page).params).length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div><p class="font-mono text-sm"><span class="font-bold text-black dark:text-white">Parameters</span></p> `);
      Tree_1($$renderer2, {
        entry: flatten(store_get($$store_subs ??= {}, "$page", page).params)
      });
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { ErrorPage as E };
//# sourceMappingURL=ErrorPage-hp5bBdPG.js.map
