import { ah as getContext } from './index2-BZw6XBxw.js';
import './root-C1YRfNi1.js';
import './exports-7ECo9oy7.js';
import './state.svelte-CUwS-0Sk.js';

const getStores = () => {
  const stores$1 = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores$1.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores$1.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores$1.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
const navigating = {
  subscribe(fn) {
    const store = getStores().navigating;
    return store.subscribe(fn);
  }
};

export { navigating as n, page as p };
//# sourceMappingURL=stores-BG2s9ZXP.js.map
