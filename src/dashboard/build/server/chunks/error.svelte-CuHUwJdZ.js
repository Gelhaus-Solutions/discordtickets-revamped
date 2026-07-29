import { e as escape_html } from './escaping-CqgfEcN3.js';
import './state.svelte-D5lsa5ep.js';
import './root-tBuNxqOs.js';
import './exports-7ECo9oy7.js';
import { w as writable } from './index-vPI-6AVn.js';
import { ah as getContext } from './index2-B7lo9Ma0.js';

function create_updated_store() {
  const { set, subscribe } = writable(false);
  {
    return {
      subscribe,
      // eslint-disable-next-line @typescript-eslint/require-await
      check: async () => false
    };
  }
}
const stores = {
  updated: /* @__PURE__ */ create_updated_store()
};
({
  check: stores.updated.check
});
function context() {
  return getContext("__request__");
}
const page$1 = {
  get error() {
    return context().page.error;
  },
  get status() {
    return context().page.status;
  }
};
const page = page$1;
function Error$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    $$renderer2.push(`<h1>${escape_html(page.status)}</h1> <p>${escape_html(page.error?.message)}</p>`);
  });
}

export { Error$1 as default };
//# sourceMappingURL=error.svelte-CuHUwJdZ.js.map
