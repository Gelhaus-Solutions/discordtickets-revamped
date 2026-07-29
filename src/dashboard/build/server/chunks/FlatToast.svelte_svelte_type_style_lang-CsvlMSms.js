import { as as fallback, ak as ensure_array_like, af as attr_class, am as stringify, al as attr_style, ai as store_get, at as slot, aj as unsubscribe_stores, au as bind_props } from './index2-B7lo9Ma0.js';
import { g as get, w as writable } from './index-vPI-6AVn.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';

function notificationsStore(initialValue = []) {
  const store = writable(initialValue);
  const { set, update, subscribe } = store;
  let defaultOptions = {
    duration: 3e3,
    placement: "bottom-right",
    type: "info",
    theme: "dark"
  };
  function add(options) {
    const {
      duration = 3e3,
      placement = "bottom-right",
      type = "info",
      theme = "dark",
      ...rest
    } = { ...defaultOptions, ...options };
    const uid = Date.now();
    const obj = {
      ...rest,
      uid,
      placement,
      type,
      theme,
      duration,
      remove: () => {
        update((v) => v.filter((i) => i.uid !== uid));
      },
      update: (data) => {
        delete data.uid;
        const index = get(store)?.findIndex((v) => v?.uid === uid);
        if (index > -1) {
          update((v) => [
            ...v.slice(0, index),
            { ...v[index], ...data },
            ...v.slice(index + 1)
          ]);
        }
      }
    };
    update((v) => [...v, obj]);
    if (duration > 0) {
      setTimeout(() => {
        obj.remove();
        if (typeof obj.onRemove === "function") obj.onRemove();
      }, duration);
    }
    return obj;
  }
  function getById(uid) {
    return get(store)?.find((v) => v?.uid === uid);
  }
  function clearAll() {
    set([]);
  }
  function clearLast() {
    update((v) => {
      return v.slice(0, v.length - 1);
    });
  }
  function setDefaults(options) {
    defaultOptions = { ...defaultOptions, ...options };
  }
  return {
    subscribe,
    add,
    success: getHelper("success", add),
    info: getHelper("info", add),
    error: getHelper("error", add),
    warning: getHelper("warning", add),
    clearAll,
    clearLast,
    getById,
    setDefaults
  };
}
const toasts = notificationsStore([]);
function getHelper(type, add) {
  return function() {
    if (typeof arguments[0] === "object") {
      const options = arguments[0];
      return add({ ...options, type });
    } else if (typeof arguments[0] === "string" && typeof arguments[1] === "string") {
      const options = arguments[2] || {};
      return add({
        ...options,
        type,
        title: arguments[0],
        description: arguments[1]
      });
    } else if (typeof arguments[0] === "string") {
      const options = arguments[1] || {};
      return add({
        ...options,
        type,
        description: arguments[0]
      });
    }
  };
}
function ToastContainer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let theme = fallback($$props["theme"], "dark");
    let placement = fallback($$props["placement"], "bottom-right");
    let type = fallback($$props["type"], "info");
    let showProgress = fallback($$props["showProgress"], false);
    let duration = fallback($$props["duration"], 3e3);
    let width = fallback($$props["width"], "320px");
    const placements = [
      "bottom-right",
      "bottom-left",
      "top-right",
      "top-left",
      "top-center",
      "bottom-center",
      "center-center"
    ];
    $$renderer2.push(`<!--[-->`);
    const each_array = ensure_array_like(placements);
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let placement2 = each_array[$$index_1];
      $$renderer2.push(`<div${attr_class(`toast-container ${stringify(placement2)}`, "svelte-1xiev8f")}${attr_style(`width: ${stringify(width)}`)}><ul class="svelte-1xiev8f"><!--[-->`);
      const each_array_1 = ensure_array_like(store_get($$store_subs ??= {}, "$toasts", toasts).filter((n) => n.placement === placement2).reverse());
      for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
        let toast = each_array_1[$$index];
        $$renderer2.push(`<li class="svelte-1xiev8f">`);
        if (toast.component) {
          $$renderer2.push("<!--[-->");
          if (toast.component) {
            $$renderer2.push("<!--[-->");
            toast.component($$renderer2, { data: toast });
            $$renderer2.push("<!--]-->");
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push("<!--]-->");
          }
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<!--[-->`);
          slot($$renderer2, $$props, "default", { data: toast }, null);
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]--></li>`);
      }
      $$renderer2.push(`<!--]--></ul></div>`);
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { theme, placement, type, showProgress, duration, width });
  });
}
function BootstrapToast($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let theme = fallback($$props["theme"], "light");
    let data = fallback($$props["data"], () => ({}), true);
    $$renderer2.push(`<div${attr_class(`st-toast bootstrap ${stringify(data.theme || theme)} ${stringify(data.type || "info")}`, "svelte-1r7tq1e")} role="alert" aria-live="assertive" aria-atomic="true">`);
    if (data.title) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="st-toast-header svelte-1r7tq1e"><!--[-->`);
      slot($$renderer2, $$props, "icon", {}, () => {
        if (data.type === "success") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<svg class="st-toast-icon svelte-1r7tq1e" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10,1c-4.9,0-9,4.1-9,9s4.1,9,9,9s9-4,9-9S15,1,10,1z M8.7,13.5l-3.2-3.2l1-1l2.2,2.2l4.8-4.8l1,1L8.7,13.5z"></path><path fill="none" d="M8.7,13.5l-3.2-3.2l1-1l2.2,2.2l4.8-4.8l1,1L8.7,13.5z" data-icon-path="inner-path" opacity="0"></path></svg>`);
        } else if (data.type === "info") {
          $$renderer2.push("<!--[1-->");
          $$renderer2.push(`<svg class="st-toast-icon svelte-1r7tq1e" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" aria-hidden="true"><path d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,5a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,16,7Zm4,17.12H12V21.88h2.88V15.12H13V12.88h4.13v9H20Z"></path></svg>`);
        } else if (data.type === "error") {
          $$renderer2.push("<!--[2-->");
          $$renderer2.push(`<svg class="st-toast-icon svelte-1r7tq1e" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10,1c-5,0-9,4-9,9s4,9,9,9s9-4,9-9S15,1,10,1z M13.5,14.5l-8-8l1-1l8,8L13.5,14.5z"></path><path d="M13.5,14.5l-8-8l1-1l8,8L13.5,14.5z" data-icon-path="inner-path" opacity="0"></path></svg>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<svg class="st-toast-icon svelte-1r7tq1e" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10,1c-5,0-9,4-9,9s4,9,9,9s9-4,9-9S15,1,10,1z M9.2,5h1.5v7H9.2V5z M10,16c-0.6,0-1-0.4-1-1s0.4-1,1-1	s1,0.4,1,1S10.6,16,10,16z"></path><path d="M9.2,5h1.5v7H9.2V5z M10,16c-0.6,0-1-0.4-1-1s0.4-1,1-1s1,0.4,1,1S10.6,16,10,16z" data-icon-path="inner-path" opacity="0"></path></svg>`);
        }
        $$renderer2.push(`<!--]-->`);
      });
      $$renderer2.push(`<!--]--> <strong class="st-toast-title svelte-1r7tq1e">${escape_html(data.title)}</strong> <button data-notification-btn="" class="st-toast-close-btn svelte-1r7tq1e" type="button" aria-label="close"><!--[-->`);
      slot($$renderer2, $$props, "close-icon", {}, () => {
        $$renderer2.push(`<svg xmlns="http://www.w3.org/2000/svg" class="bx--toast-notification__close-icon svelte-1r7tq1e" width="20" height="20" viewBox="0 0 32 32" aria-hidden="true"><path d="M24 9.4L22.6 8 16 14.6 9.4 8 8 9.4 14.6 16 8 22.6 9.4 24 16 17.4 22.6 24 24 22.6 17.4 16 24 9.4z"></path></svg>`);
      });
      $$renderer2.push(`<!--]--></button></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div${attr_class("st-toast-body svelte-1r7tq1e", void 0, { "st-toast-no-title": !data.title })}>`);
    if (!data.title) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<!--[-->`);
      slot($$renderer2, $$props, "icon", {}, () => {
        if (data.type === "success") {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<svg class="st-toast-icon svelte-1r7tq1e" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10,1c-4.9,0-9,4.1-9,9s4.1,9,9,9s9-4,9-9S15,1,10,1z M8.7,13.5l-3.2-3.2l1-1l2.2,2.2l4.8-4.8l1,1L8.7,13.5z"></path><path fill="none" d="M8.7,13.5l-3.2-3.2l1-1l2.2,2.2l4.8-4.8l1,1L8.7,13.5z" data-icon-path="inner-path" opacity="0"></path></svg>`);
        } else if (data.type === "info") {
          $$renderer2.push("<!--[1-->");
          $$renderer2.push(`<svg class="st-toast-icon svelte-1r7tq1e" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 32 32" aria-hidden="true"><path d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,5a1.5,1.5,0,1,1-1.5,1.5A1.5,1.5,0,0,1,16,7Zm4,17.12H12V21.88h2.88V15.12H13V12.88h4.13v9H20Z"></path></svg>`);
        } else if (data.type === "error") {
          $$renderer2.push("<!--[2-->");
          $$renderer2.push(`<svg class="st-toast-icon svelte-1r7tq1e" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10,1c-5,0-9,4-9,9s4,9,9,9s9-4,9-9S15,1,10,1z M13.5,14.5l-8-8l1-1l8,8L13.5,14.5z"></path><path d="M13.5,14.5l-8-8l1-1l8,8L13.5,14.5z" data-icon-path="inner-path" opacity="0"></path></svg>`);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`<svg class="st-toast-icon svelte-1r7tq1e" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10,1c-5,0-9,4-9,9s4,9,9,9s9-4,9-9S15,1,10,1z M9.2,5h1.5v7H9.2V5z M10,16c-0.6,0-1-0.4-1-1s0.4-1,1-1	s1,0.4,1,1S10.6,16,10,16z"></path><path d="M9.2,5h1.5v7H9.2V5z M10,16c-0.6,0-1-0.4-1-1s0.4-1,1-1s1,0.4,1,1S10.6,16,10,16z" data-icon-path="inner-path" opacity="0"></path></svg>`);
        }
        $$renderer2.push(`<!--]-->`);
      });
      $$renderer2.push(`<!--]-->`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <span class="st-toast-description svelte-1r7tq1e">${escape_html(data.description)}</span> `);
    if (!data.title) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button data-notification-btn="" class="st-toast-close-btn svelte-1r7tq1e" type="button" aria-label="close"><!--[-->`);
      slot($$renderer2, $$props, "close-icon", {}, () => {
        $$renderer2.push(`<svg xmlns="http://www.w3.org/2000/svg" class="bx--toast-notification__close-icon svelte-1r7tq1e" width="20" height="20" viewBox="0 0 32 32" aria-hidden="true"><path d="M24 9.4L22.6 8 16 14.6 9.4 8 8 9.4 14.6 16 8 22.6 9.4 24 16 17.4 22.6 24 24 22.6 17.4 16 24 9.4z"></path></svg>`);
      });
      $$renderer2.push(`<!--]--></button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="st-toast-extra"><!--[-->`);
    slot($$renderer2, $$props, "extra", {}, null);
    $$renderer2.push(`<!--]--></div></div></div>`);
    bind_props($$props, { theme, data });
  });
}

export { BootstrapToast as B, ToastContainer as T };
//# sourceMappingURL=FlatToast.svelte_svelte_type_style_lang-CsvlMSms.js.map
