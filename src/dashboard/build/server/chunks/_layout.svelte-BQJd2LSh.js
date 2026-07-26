import { k as store_get, l as unsubscribe_stores } from './index2-D-VkFrUc.js';
import { n as navigating } from './stores-DGY-hYbL.js';
import { S as Spinner } from './Spinner-CkIadzTm.js';
import './escaping-CqgfEcN3.js';
import './root-OrB--9Lj.js';
import './exports-7ECo9oy7.js';
import './state.svelte-DvtRQi3Q.js';

function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { children } = $$props;
    $$renderer2.push(`<div class="absolute h-max min-h-screen w-full bg-dgrey-100 text-dgrey-600 dark:bg-dgrey-800 dark:text-dgrey-300">`);
    if (store_get($$store_subs ??= {}, "$navigating", navigating) || true) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="h-dvh flex items-center justify-center">`);
      Spinner($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-BQJd2LSh.js.map
