import { ai as store_get, af as attr_class, aj as unsubscribe_stores } from './index2-B7lo9Ma0.js';
import { p as page } from './stores-BjlJSBuQ.js';
import { T as Tree_1, f as flatten } from './data-LIyun-gF.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';

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
//# sourceMappingURL=ErrorPage-BKg1TBbN.js.map
