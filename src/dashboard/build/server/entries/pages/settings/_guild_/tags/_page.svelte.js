import { d as attr, g as getContext, m as bind_props, ai as fallback, f as ensure_array_like, a as attr_class, k as attr_style, b as store_get, aj as slot, u as unsubscribe_stores, l as stringify } from "../../../../../chunks/index2.js";
import { p as page } from "../../../../../chunks/stores.js";
import { marked } from "marked";
import { e as escape_html } from "../../../../../chunks/escaping.js";
import { R as Required } from "../../../../../chunks/Required.js";
import { h as html } from "../../../../../chunks/html.js";
import { g as get, w as writable } from "../../../../../chunks/index.js";
import { t as tagsState } from "../../../../../chunks/state.svelte2.js";
function TagInputs($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { tag = void 0 } = $$props;
    $$renderer2.push(`<div><label><span class="font-medium">Name</span> `);
    Required($$renderer2);
    $$renderer2.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The tag name - can contain UNICODE emoji (not emoji names)"></i> <input type="text" class="input form-input" required=""${attr("value", tag.name)}/></label></div> <div><label><span class="font-medium">Auto tag regular expression</span> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Optional - regex to trigger this tag"></i> <input type="text" class="input form-input"${attr("value", tag.regex)}/></label></div> <div><label class="font-medium"><span class="font-medium">Content</span> `);
    Required($$renderer2);
    $$renderer2.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The tag content"></i> <textarea class="input form-input h-24" maxlength="4096" required="">`);
    const $$body = escape_html(tag.content);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(`</textarea></label> `);
    if (tag.content) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="text-sm font-medium">Preview</p> <div class="block w-full break-words prose prose-slate dark:prose-invert prose-a:text-blurple rounded-md bg-slate-100 p-3 font-mono text-sm shadow-sm dark:bg-slate-900">${html(marked.parse(tag.content.replace(/\n/g, "\n\n").replace(/{+\s?(user)?name\s?}+/gi, "@" + getContext("user").username)))}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    bind_props($$props, { tag });
  });
}
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
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { data } = $$props;
    `/api/admin/guilds/${store_get($$store_subs ??= {}, "$page", page).params.guild}/tags`;
    let { tags } = data;
    tagsState.tags = tags;
    let shown = tagsState.tags;
    let loading = false;
    let touch = { content: null, name: null, regex: null };
    let expanded = null;
    let search = "";
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="mb-8 text-center text-orange-600 dark:text-orange-400"><p><i class="fa-solid fa-triangle-exclamation"></i> <a href="https://discordtickets.app/configuration/tags" class="font-semibold hover:underline">Read the documentation</a> to avoid problems.</p></div> <h1 class="m-4 text-center text-4xl font-bold">Tags</h1> `);
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <div class="m-2 mx-auto flex max-w-5xl flex-col-reverse gap-12 md:mt-8 lg:flex-row"><div class="w-full"><div class="grid grid-cols-1 gap-4"><div><input type="text" class="input form-input" placeholder="Search"${attr("value", search)}/></div> <!--[-->`);
      const each_array = ensure_array_like(shown);
      for (let i = 0, $$length = each_array.length; i < $$length; i++) {
        let tag = each_array[i];
        $$renderer3.push(`<div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700"><span class="text-lg font-semibold">${escape_html(tag.name)}</span> <p class="cursor-pointer select-none text-gray-500 transition duration-300 hover:text-blurple dark:text-slate-400 dark:hover:text-blurple"><i${attr_class(`fa-solid ${stringify(expanded === tag.id ? "fa-angle-up" : "fa-angle-down")} float-right text-xl`)}></i> <span class="text-sm">Click to ${escape_html(expanded === tag.id ? "collapse" : "expand")}</span></p> `);
        if (expanded === tag.id) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="m-2"><form${attr("id", tag.id)}${attr("name", tag.name)}>`);
          TagInputs($$renderer3, {
            get tag() {
              return tagsState.tags[i];
            },
            set tag($$value) {
              tagsState.tags[i] = $$value;
              $$settled = false;
            }
          });
          $$renderer3.push(`<!----></form> <div class="mt-4 flex flex-grow gap-4"><button type="button"${attr("disabled", loading, true)} class="flex-1 rounded-lg bg-red-300 p-2 px-5 font-medium transition duration-300 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed dark:bg-red-500/75 dark:hover:bg-red-500 dark:hover:text-white">`);
          {
            $$renderer3.push("<!--[!-->");
            $$renderer3.push(`<i class="fa-solid fa-trash"></i>`);
          }
          $$renderer3.push(`<!--]--> Delete</button> <button type="submit"${attr("for", tag.id)}${attr("form", tag.id)}${attr("disabled", loading, true)} class="flex-1 rounded-lg bg-green-300 p-2 px-5 font-medium transition duration-300 hover:bg-green-500 hover:text-white disabled:cursor-not-allowed dark:bg-green-500/75 dark:hover:bg-green-500 dark:hover:text-white">`);
          {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--> Save</button></div></div>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--></div>`);
      }
      $$renderer3.push(`<!--]--></div></div> <div class="w-full"><div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700"><h3 class="text-center text-xl font-bold">Create a tag</h3> <form class="my-4 text-lg"><div class="grid grid-cols-1 gap-2">`);
      TagInputs($$renderer3, {
        get tag() {
          return touch;
        },
        set tag($$value) {
          touch = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> <button type="submit"${attr("disabled", loading, true)} class="mt-4 rounded-lg bg-green-300 p-2 px-5 font-medium transition duration-300 hover:bg-green-500 hover:text-white disabled:cursor-not-allowed dark:bg-green-500/75 dark:hover:bg-green-500 dark:hover:text-white">`);
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> Create</button></div></form></div></div></div> `);
      {
        let children = function($$renderer4, { data: toasted }) {
          BootstrapToast($$renderer4, { data: toasted });
        };
        ToastContainer($$renderer3, {
          duration: 3e3,
          theme: data.theme,
          children,
          $$slots: { default: true }
        });
      }
      $$renderer3.push(`<!---->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
