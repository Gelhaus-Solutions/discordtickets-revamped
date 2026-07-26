import { ak as ensure_array_like, ao as attr, as as fallback, ar as bind_props, f as attr_class, am as stringify, al as attr_style, at as slot, h as clsx, k as store_get, l as unsubscribe_stores, au as sanitize_props, av as attributes, ah as noop } from './index2-D-VkFrUc.js';
import { e as run } from './root-OrB--9Lj.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';
import './exports-7ECo9oy7.js';
import './state.svelte-DvtRQi3Q.js';
import { e as emoji } from './index-U7-39QVn.js';
import { R as Required } from './Required-DajgSg18.js';
import './marked.esm-DcwJ8j7Z.js';
import { w as writable } from './index-PiinLdtd.js';
import { h as html } from './html-FW6Ia4bL.js';
import './_commonjsHelpers-BFTU3MAI.js';

const now = () => Date.now();
const raf = {
  // don't access requestAnimationFrame eagerly outside method
  // this allows basic testing of user code without JSDOM
  // bunder will eval and remove ternary when the user's app is built
  tick: (
    /** @param {any} _ */
    (_) => noop()
  ),
  now: () => now(),
  tasks: /* @__PURE__ */ new Set()
};
function loop(callback) {
  let task;
  if (raf.tasks.size === 0) ;
  return {
    promise: new Promise((fulfill) => {
      raf.tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      raf.tasks.delete(task);
    }
  };
}
function CircleSpinner($$renderer, $$props) {
  let color = fallback($$props["color"], () => `cornflowerblue`, true);
  let duration = fallback($$props["duration"], () => `1.5s`, true);
  let size = fallback($$props["size"], () => `1em`, true);
  $$renderer.push(`<div${attr_style(`--duration: ${stringify(duration)}`, {
    "border-color": `${stringify(color)} transparent ${stringify(color)} ${stringify(color)}`,
    width: size,
    height: size
  })} class="svelte-avhlr7"></div>`);
  bind_props($$props, { color, duration, size });
}
function is_date(obj) {
  return Object.prototype.toString.call(obj) === "[object Date]";
}
function tick_spring(ctx, last_value, current_value, target_value) {
  if (typeof current_value === "number" || is_date(current_value)) {
    const delta = target_value - current_value;
    const velocity = (current_value - last_value) / (ctx.dt || 1 / 60);
    const spring2 = ctx.opts.stiffness * delta;
    const damper = ctx.opts.damping * velocity;
    const acceleration = (spring2 - damper) * ctx.inv_mass;
    const d = (velocity + acceleration) * ctx.dt;
    if (Math.abs(d) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) {
      return target_value;
    } else {
      ctx.settled = false;
      return is_date(current_value) ? new Date(current_value.getTime() + d) : current_value + d;
    }
  } else if (Array.isArray(current_value)) {
    return current_value.map(
      (_, i) => (
        // @ts-ignore
        tick_spring(ctx, last_value[i], current_value[i], target_value[i])
      )
    );
  } else if (typeof current_value === "object") {
    const next_value = {};
    for (const k in current_value) {
      next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
    }
    return next_value;
  } else {
    throw new Error(`Cannot spring ${typeof current_value} values`);
  }
}
function spring(value, opts = {}) {
  const store = writable(value);
  const { stiffness = 0.15, damping = 0.8, precision = 0.01 } = opts;
  let last_time;
  let task;
  let current_token;
  let last_value = (
    /** @type {T} */
    value
  );
  let target_value = (
    /** @type {T | undefined} */
    value
  );
  let inv_mass = 1;
  let inv_mass_recovery_rate = 0;
  let cancel_task = false;
  function set(new_value, opts2 = {}) {
    target_value = new_value;
    const token = current_token = {};
    if (value == null || opts2.hard || spring2.stiffness >= 1 && spring2.damping >= 1) {
      cancel_task = true;
      last_time = raf.now();
      last_value = new_value;
      store.set(value = target_value);
      return Promise.resolve();
    } else if (opts2.soft) {
      const rate = opts2.soft === true ? 0.5 : +opts2.soft;
      inv_mass_recovery_rate = 1 / (rate * 60);
      inv_mass = 0;
    }
    if (!task) {
      last_time = raf.now();
      cancel_task = false;
      task = loop((now2) => {
        if (cancel_task) {
          cancel_task = false;
          task = null;
          return false;
        }
        inv_mass = Math.min(inv_mass + inv_mass_recovery_rate, 1);
        const elapsed = Math.min(now2 - last_time, 1e3 / 30);
        const ctx = {
          inv_mass,
          opts: spring2,
          settled: true,
          dt: elapsed * 60 / 1e3
        };
        const next_value = tick_spring(ctx, last_value, value, target_value);
        last_time = now2;
        last_value = /** @type {T} */
        value;
        store.set(value = /** @type {T} */
        next_value);
        if (ctx.settled) {
          task = null;
        }
        return !ctx.settled;
      });
    }
    return new Promise((fulfil) => {
      task.promise.then(() => {
        if (token === current_token) fulfil();
      });
    });
  }
  const spring2 = {
    set,
    update: (fn, opts2) => set(fn(
      /** @type {T} */
      target_value,
      /** @type {T} */
      value
    ), opts2),
    subscribe: store.subscribe,
    stiffness,
    damping,
    precision
  };
  return spring2;
}
function Wiggle($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let wiggle = fallback($$props["wiggle"], false);
    let angle = fallback(
      $$props["angle"],
      0
      // try 20
    );
    let scale = fallback(
      $$props["scale"],
      1
      // try 1.2
    );
    let dx = fallback(
      $$props["dx"],
      0
      // try 10
    );
    let dy = fallback(
      $$props["dy"],
      0
      // try 10
    );
    let duration = fallback($$props["duration"], 200);
    let stiffness = fallback($$props["stiffness"], 0.05);
    let damping = fallback($$props["damping"], 0.1);
    let rest_state = { angle: 0, scale: 1, dx: 0, dy: 0 };
    let store = spring(rest_state, { stiffness, damping });
    if (wiggle) setTimeout(() => wiggle = false, duration);
    store.set(wiggle ? { scale, angle, dx, dy } : rest_state);
    $$renderer2.push(`<span${attr_style("", {
      transform: `rotate(${stringify(store_get($$store_subs ??= {}, "$store", store).angle)}deg) scale(${stringify(store_get($$store_subs ??= {}, "$store", store).scale)}) translate(${stringify(store_get($$store_subs ??= {}, "$store", store).dx)}px, ${stringify(store_get($$store_subs ??= {}, "$store", store).dy)}px)`
    })}><!--[-->`);
    slot($$renderer2, $$props, "default", {}, null);
    $$renderer2.push(`<!--]--></span>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
    bind_props($$props, { wiggle, angle, scale, dx, dy, duration, stiffness, damping });
  });
}
function ChevronExpand($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  $$renderer.push(`<svg${attributes(
    {
      ...$$sanitized_props,
      fill: "currentColor",
      viewBox: "0 0 16 16"
    },
    void 0,
    void 0,
    void 0,
    3
  )}><path d="M3.646 9.146a.5.5 0 0 1 .708 0L8 12.793l3.646-3.647a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 0-.708zm0-2.292a.5.5 0 0 0 .708 0L8 3.207l3.646 3.647a.5.5 0 0 0 .708-.708l-4-4a.5.5 0 0 0-.708 0l-4 4a.5.5 0 0 0 0 .708z"></path></svg>`);
}
function Cross($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  $$renderer.push(`<svg${attributes(
    {
      ...$$sanitized_props,
      viewBox: "0 0 24 24",
      fill: "currentColor"
    },
    void 0,
    void 0,
    void 0,
    3
  )}><path d="M18.3 5.71a.996.996 0 0 0-1.41 0L12 10.59L7.11 5.7A.996.996 0 1 0 5.7 7.11L10.59 12L5.7 16.89a.996.996 0 1 0 1.41 1.41L12 13.41l4.89 4.89a.996.996 0 1 0 1.41-1.41L13.41 12l4.89-4.89c.38-.38.38-1.02 0-1.4z"></path></svg>`);
}
function Disabled($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  $$renderer.push(`<svg${attributes(
    {
      ...$$sanitized_props,
      viewBox: "0 0 24 24",
      fill: "currentColor"
    },
    void 0,
    void 0,
    void 0,
    3
  )}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10Zm-4.906-3.68L18.32 7.094A8 8 0 0 1 7.094 18.32ZM5.68 16.906A8 8 0 0 1 16.906 5.68L5.68 16.906Z"></path></svg>`);
}
const get_label = (opt) => {
  if (opt instanceof Object) {
    if (opt.label === void 0) {
      console.error(`MultiSelect option ${JSON.stringify(opt)} is an object but has no label key`);
    }
    return opt.label;
  }
  return `${opt}`;
};
function get_style(option, key = null) {
  let css_str = ``;
  if (![`selected`, `option`, null].includes(key)) {
    console.error(`MultiSelect: Invalid key=${key} for get_style`);
  }
  if (typeof option == `object` && option.style) {
    if (typeof option.style == `string`) {
      css_str = option.style;
    }
    if (typeof option.style == `object`) {
      if (key && key in option.style)
        return option.style[key] ?? ``;
      else {
        console.error(`Invalid style object for option=${JSON.stringify(option)}`);
      }
    }
  }
  if (css_str.trim() && !css_str.trim().endsWith(`;`))
    css_str += `;`;
  return css_str;
}
function MultiSelect($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let is_selected;
    let activeIndex = fallback($$props["activeIndex"], null);
    let activeOption = fallback($$props["activeOption"], null);
    let createOptionMsg = fallback($$props["createOptionMsg"], () => `Create this option...`, true);
    let allowUserOptions = fallback($$props["allowUserOptions"], false);
    let allowEmpty = fallback($$props["allowEmpty"], false);
    let autocomplete = fallback($$props["autocomplete"], () => `off`, true);
    let autoScroll = fallback($$props["autoScroll"], true);
    let breakpoint = fallback($$props["breakpoint"], 800);
    let defaultDisabledTitle = fallback($$props["defaultDisabledTitle"], () => `This option is disabled`, true);
    let disabled = fallback($$props["disabled"], false);
    let disabledInputTitle = fallback($$props["disabledInputTitle"], () => `This input is disabled`, true);
    let duplicateOptionMsg = fallback($$props["duplicateOptionMsg"], () => `This option is already selected`, true);
    let duplicates = fallback($$props["duplicates"], false);
    let key = fallback($$props["key"], (opt) => `${get_label(opt)}`.toLowerCase());
    let filterFunc = fallback($$props["filterFunc"], (opt, searchText2) => {
      if (!searchText2) return true;
      return `${get_label(opt)}`.toLowerCase().includes(searchText2.toLowerCase());
    });
    let closeDropdownOnSelect = fallback($$props["closeDropdownOnSelect"], () => `desktop`, true);
    let form_input = fallback($$props["form_input"], null);
    let highlightMatches = fallback($$props["highlightMatches"], true);
    let id = fallback($$props["id"], null);
    let input = fallback($$props["input"], null);
    let inputClass = fallback($$props["inputClass"], () => ``, true);
    let inputStyle = fallback($$props["inputStyle"], null);
    let inputmode = fallback($$props["inputmode"], null);
    let invalid = fallback($$props["invalid"], false);
    let liActiveOptionClass = fallback($$props["liActiveOptionClass"], () => ``, true);
    let liActiveUserMsgClass = fallback($$props["liActiveUserMsgClass"], () => ``, true);
    let liOptionClass = fallback($$props["liOptionClass"], () => ``, true);
    let liOptionStyle = fallback($$props["liOptionStyle"], null);
    let liSelectedClass = fallback($$props["liSelectedClass"], () => ``, true);
    let liSelectedStyle = fallback($$props["liSelectedStyle"], null);
    let liUserMsgClass = fallback($$props["liUserMsgClass"], () => ``, true);
    let loading = fallback($$props["loading"], false);
    let matchingOptions = fallback($$props["matchingOptions"], () => [], true);
    let maxOptions = fallback($$props["maxOptions"], void 0);
    let maxSelect = fallback(
      $$props["maxSelect"],
      null
      // null means there is no upper limit for selected.length
    );
    let maxSelectMsg = fallback($$props["maxSelectMsg"], (current, max) => max > 1 ? `${current}/${max}` : ``);
    let maxSelectMsgClass = fallback($$props["maxSelectMsgClass"], () => ``, true);
    let name = fallback($$props["name"], null);
    let noMatchingOptionsMsg = fallback($$props["noMatchingOptionsMsg"], () => `No matching options`, true);
    let open = fallback($$props["open"], false);
    let options = $$props["options"];
    let outerDiv = fallback($$props["outerDiv"], null);
    let outerDivClass = fallback($$props["outerDivClass"], () => ``, true);
    let parseLabelsAsHtml = fallback(
      $$props["parseLabelsAsHtml"],
      false
      // should not be combined with allowUserOptions!
    );
    let pattern = fallback($$props["pattern"], null);
    let placeholder = fallback($$props["placeholder"], null);
    let removeAllTitle = fallback($$props["removeAllTitle"], () => `Remove all`, true);
    let removeBtnTitle = fallback($$props["removeBtnTitle"], () => `Remove`, true);
    let minSelect = fallback(
      $$props["minSelect"],
      null
      // null means there is no lower limit for selected.length
    );
    let required = fallback($$props["required"], false);
    let resetFilterOnAdd = fallback($$props["resetFilterOnAdd"], true);
    let searchText = fallback($$props["searchText"], () => ``, true);
    let selected = fallback($$props["selected"], () => options?.filter((opt) => opt instanceof Object && opt?.preselected).slice(0, maxSelect ?? void 0) ?? [], true);
    let sortSelected = fallback($$props["sortSelected"], false);
    let selectedOptionsDraggable = fallback($$props["selectedOptionsDraggable"], () => !sortSelected, true);
    let style = fallback($$props["style"], null);
    let ulOptionsClass = fallback($$props["ulOptionsClass"], () => ``, true);
    let ulSelectedClass = fallback($$props["ulSelectedClass"], () => ``, true);
    let ulSelectedStyle = fallback($$props["ulSelectedStyle"], null);
    let ulOptionsStyle = fallback($$props["ulOptionsStyle"], null);
    let value = fallback($$props["value"], null);
    const selected_to_value = (selected2) => {
      value = maxSelect === 1 ? selected2[0] ?? null : selected2;
    };
    const value_to_selected = (value2) => {
      if (maxSelect === 1) selected = value2 ? [value2] : [];
      else selected = value2 ?? [];
    };
    let wiggle = false;
    if (!(options?.length > 0)) {
      if (allowUserOptions || loading || disabled || allowEmpty) {
        options = [];
      } else {
        console.error(`MultiSelect received no options`);
      }
    }
    if (maxSelect !== null && maxSelect < 1) {
      console.error(`MultiSelect's maxSelect must be null or positive integer, got ${maxSelect}`);
    }
    if (!Array.isArray(selected)) {
      console.error(`MultiSelect's selected prop should always be an array, got ${selected}`);
    }
    if (maxSelect && typeof required === `number` && required > maxSelect) {
      console.error(`MultiSelect maxSelect=${maxSelect} < required=${required}, makes it impossible for users to submit a valid form`);
    }
    if (parseLabelsAsHtml && allowUserOptions) {
      console.warn(`Don't combine parseLabelsAsHtml and allowUserOptions. It's susceptible to XSS attacks!`);
    }
    if (sortSelected && selectedOptionsDraggable) {
      console.warn(`MultiSelect's sortSelected and selectedOptionsDraggable should not be combined as any user re-orderings of selected options will be undone by sortSelected on component re-renders.`);
    }
    if (allowUserOptions && !createOptionMsg && createOptionMsg !== null) {
      console.error(`MultiSelect has allowUserOptions=${allowUserOptions} but createOptionMsg=${createOptionMsg} is falsy. This prevents the "Add option" <span> from showing up, resulting in a confusing user experience.`);
    }
    if (maxOptions && (typeof maxOptions != `number` || maxOptions < 0 || maxOptions % 1 != 0)) {
      console.error(`MultiSelect's maxOptions must be undefined or a positive integer, got ${maxOptions}`);
    }
    let option_msg_is_active = false;
    if (activeIndex !== null && !matchingOptions[activeIndex]) {
      throw `Run time error, activeIndex=${activeIndex} is out of bounds, matchingOptions.length=${matchingOptions.length}`;
    }
    let drag_idx = null;
    selected_to_value(selected);
    value_to_selected(value);
    matchingOptions = options.filter((opt) => filterFunc(opt, searchText) && (!selected.map(key).includes(key(opt)) || duplicates));
    activeOption = matchingOptions[activeIndex ?? -1] ?? null;
    is_selected = (label) => selected.map(get_label).includes(label);
    form_input?.setCustomValidity(``);
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div${attr_class(`multiselect ${stringify(outerDivClass)}`, "svelte-1dct8e3", {
        "disabled": disabled,
        "single": maxSelect === 1,
        "open": open,
        "invalid": invalid
      })}${attr("title", disabled ? disabledInputTitle : null)}${attr("data-id", id)} role="searchbox" tabindex="-1"${attr_style(style)}><input${attr("name", name)}${attr("required", required, true)}${attr("value", selected.length >= Number(required) ? JSON.stringify(selected) : null)} tabindex="-1" aria-hidden="true" aria-label="ignore this, used only to prevent form submission if select is required but empty" class="form-control svelte-1dct8e3"/> <!--[-->`);
      slot($$renderer3, $$props, "expand-icon", { open }, () => {
        ChevronExpand($$renderer3, {
          width: "15px",
          style: "min-width: 1em; padding: 0 1pt; cursor: pointer;"
        });
      });
      $$renderer3.push(`<!--]--> <ul${attr_class(`selected ${stringify(ulSelectedClass)}`, "svelte-1dct8e3")} aria-label="selected options"${attr_style(ulSelectedStyle)}><!--[-->`);
      const each_array = ensure_array_like(selected);
      for (let idx = 0, $$length = each_array.length; idx < $$length; idx++) {
        let option = each_array[idx];
        $$renderer3.push(`<li${attr_class(clsx(liSelectedClass), "svelte-1dct8e3", { "active": drag_idx === idx })} role="option" aria-selected="true"${attr("draggable", selectedOptionsDraggable && !disabled && selected.length > 1)}${attr_style(`${stringify(get_style(option, `selected`))} ${stringify(liSelectedStyle)}`)}><!--[-->`);
        slot($$renderer3, $$props, "selected", { option, idx }, () => {
          $$renderer3.push(`<!--[-->`);
          slot($$renderer3, $$props, "default", { option, idx }, () => {
            if (parseLabelsAsHtml) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`${html(get_label(option))}`);
            } else {
              $$renderer3.push("<!--[!-->");
              $$renderer3.push(`${escape_html(get_label(option))}`);
            }
            $$renderer3.push(`<!--]-->`);
          });
          $$renderer3.push(`<!--]-->`);
        });
        $$renderer3.push(`<!--]--> `);
        if (!disabled && (minSelect === null || selected.length > minSelect)) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<button type="button"${attr("title", `${stringify(removeBtnTitle)} ${stringify(get_label(option))}`)} class="remove svelte-1dct8e3"><!--[-->`);
          slot($$renderer3, $$props, "remove-icon", {}, () => {
            Cross($$renderer3, { width: "15px" });
          });
          $$renderer3.push(`<!--]--></button>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--></li>`);
      }
      $$renderer3.push(`<!--]--> <input${attr_class(clsx(inputClass), "svelte-1dct8e3")}${attr_style(inputStyle)}${attr("value", searchText)}${attr("id", id)}${attr("disabled", disabled, true)}${attr("autocomplete", autocomplete)}${attr("inputmode", inputmode)}${attr("pattern", pattern)}${attr("placeholder", selected.length == 0 ? placeholder : null)}${attr("aria-invalid", invalid ? `true` : null)}/> <!--[-->`);
      slot($$renderer3, $$props, "after-input", { selected, disabled, invalid, id, placeholder, open, required }, null);
      $$renderer3.push(`<!--]--></ul> `);
      if (loading) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<!--[-->`);
        slot($$renderer3, $$props, "spinner", {}, () => {
          CircleSpinner($$renderer3, {});
        });
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (disabled) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<!--[-->`);
        slot($$renderer3, $$props, "disabled-icon", {}, () => {
          Disabled($$renderer3, {
            width: "14pt",
            style: "margin: 0 2pt;",
            "data-name": "disabled-icon"
          });
        });
        $$renderer3.push(`<!--]-->`);
      } else if (selected.length > 0) {
        $$renderer3.push("<!--[1-->");
        if (maxSelect && (maxSelect > 1 || maxSelectMsg)) {
          $$renderer3.push("<!--[-->");
          Wiggle($$renderer3, {
            angle: 20,
            get wiggle() {
              return wiggle;
            },
            set wiggle($$value) {
              wiggle = $$value;
              $$settled = false;
            },
            children: ($$renderer4) => {
              $$renderer4.push(`<span${attr_class(`max-select-msg ${stringify(maxSelectMsgClass)}`, "svelte-1dct8e3")}>${escape_html(maxSelectMsg?.(selected.length, maxSelect))}</span>`);
            },
            $$slots: { default: true }
          });
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--> `);
        if (maxSelect !== 1 && selected.length > 1) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<button type="button" class="remove remove-all svelte-1dct8e3"${attr("title", removeAllTitle)}><!--[-->`);
          slot($$renderer3, $$props, "remove-icon", {}, () => {
            Cross($$renderer3, { width: "15px" });
          });
          $$renderer3.push(`<!--]--></button>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]-->`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      if (searchText && noMatchingOptionsMsg || options?.length > 0) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<ul${attr_class(`options ${stringify(ulOptionsClass)}`, "svelte-1dct8e3", { "hidden": !open })} role="listbox"${attr("aria-multiselectable", maxSelect === null || maxSelect > 1)}${attr("aria-expanded", open)}${attr("aria-disabled", disabled ? `true` : null)}${attr_style(ulOptionsStyle)}><!--[-->`);
        const each_array_1 = ensure_array_like(matchingOptions.slice(0, Math.max(0, maxOptions ?? 0) || Infinity));
        for (let idx = 0, $$length = each_array_1.length; idx < $$length; idx++) {
          let option = each_array_1[idx];
          const {
            label,
            disabled: disabled2 = null,
            title = null,
            selectedTitle = null,
            disabledTitle = defaultDisabledTitle
          } = option instanceof Object ? option : { label: option };
          const active = activeIndex === idx;
          $$renderer3.push(`<li${attr("title", disabled2 ? disabledTitle : is_selected(label) && selectedTitle || title)}${attr_class(`${stringify(liOptionClass)} ${stringify(active ? liActiveOptionClass : ``)}`, "svelte-1dct8e3", {
            "selected": is_selected(label),
            "active": active,
            "disabled": disabled2
          })} role="option" aria-selected="false"${attr_style(`${stringify(get_style(option, `option`))} ${stringify(liOptionStyle)}`)}><!--[-->`);
          slot($$renderer3, $$props, "option", { option, idx }, () => {
            $$renderer3.push(`<!--[-->`);
            slot($$renderer3, $$props, "default", { option, idx }, () => {
              if (parseLabelsAsHtml) {
                $$renderer3.push("<!--[-->");
                $$renderer3.push(`${html(get_label(option))}`);
              } else {
                $$renderer3.push("<!--[!-->");
                $$renderer3.push(`${escape_html(get_label(option))}`);
              }
              $$renderer3.push(`<!--]-->`);
            });
            $$renderer3.push(`<!--]-->`);
          });
          $$renderer3.push(`<!--]--></li>`);
        }
        $$renderer3.push(`<!--]--> `);
        if (searchText) {
          $$renderer3.push("<!--[-->");
          const text_input_is_duplicate = selected.map(get_label).includes(searchText);
          const is_dupe = !duplicates && text_input_is_duplicate && `dupe`;
          const can_create = Boolean(allowUserOptions && createOptionMsg) && `create`;
          const no_match = Boolean(matchingOptions?.length == 0 && noMatchingOptionsMsg) && `no-match`;
          const msgType = is_dupe || can_create || no_match;
          if (msgType) {
            $$renderer3.push("<!--[-->");
            const msg = {
              dupe: duplicateOptionMsg,
              create: createOptionMsg,
              "no-match": noMatchingOptionsMsg
            }[msgType];
            $$renderer3.push(`<li${attr("title", createOptionMsg)} role="option" aria-selected="false"${attr_class(`user-msg ${stringify(liUserMsgClass)} ${stringify(``)}`, "svelte-1dct8e3", { "active": option_msg_is_active })}${attr_style("", {
              cursor: {
                dupe: `not-allowed`,
                create: `pointer`,
                "no-match": `default`
              }[msgType]
            })}><!--[-->`);
            slot($$renderer3, $$props, "user-msg", { searchText, msgType, msg }, () => {
              $$renderer3.push(`${escape_html(msg)}`);
            });
            $$renderer3.push(`<!--]--></li>`);
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]-->`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--></ul>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, {
      activeIndex,
      activeOption,
      createOptionMsg,
      allowUserOptions,
      allowEmpty,
      autocomplete,
      autoScroll,
      breakpoint,
      defaultDisabledTitle,
      disabled,
      disabledInputTitle,
      duplicateOptionMsg,
      duplicates,
      key,
      filterFunc,
      closeDropdownOnSelect,
      form_input,
      highlightMatches,
      id,
      input,
      inputClass,
      inputStyle,
      inputmode,
      invalid,
      liActiveOptionClass,
      liActiveUserMsgClass,
      liOptionClass,
      liOptionStyle,
      liSelectedClass,
      liSelectedStyle,
      liUserMsgClass,
      loading,
      matchingOptions,
      maxOptions,
      maxSelect,
      maxSelectMsg,
      maxSelectMsgClass,
      name,
      noMatchingOptionsMsg,
      open,
      options,
      outerDiv,
      outerDivClass,
      parseLabelsAsHtml,
      pattern,
      placeholder,
      removeAllTitle,
      removeBtnTitle,
      minSelect,
      required,
      resetFilterOnAdd,
      searchText,
      selected,
      sortSelected,
      selectedOptionsDraggable,
      style,
      ulOptionsClass,
      ulSelectedClass,
      ulSelectedStyle,
      ulOptionsStyle,
      value
    });
  });
}
function scroll_into_view_if_needed_polyfill(centerIfNeeded = true) {
  const elem = this;
  const observer = new IntersectionObserver(function([entry]) {
    const ratio = entry.intersectionRatio;
    if (ratio < 1) {
      const place = ratio <= 0 && centerIfNeeded ? `center` : `nearest`;
      elem.scrollIntoView({
        block: place,
        inline: place
      });
    }
    this.disconnect();
  });
  observer.observe(elem);
  return observer;
}
if (typeof Element !== `undefined` && !Element.prototype?.scrollIntoViewIfNeeded && typeof IntersectionObserver !== `undefined`) {
  Element.prototype.scrollIntoViewIfNeeded = scroll_into_view_if_needed_polyfill;
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let tmp = data, categories = tmp.categories, channels = tmp.channels;
    channels = channels.filter((c) => c.type === 0);
    let loading = false;
    let panel = {
      categories: [],
      channel: "new",
      description: "",
      image: "",
      title: "",
      type: "BUTTON",
      thumbnail: ""
    };
    let selectedCategories = [];
    const categoryOptions = categories.reduce(
      (acc, c) => {
        acc[(emoji.get(c.emoji) ?? "") + c.name] = c.id;
        return acc;
      },
      {}
    );
    run(() => {
      panel.type = panel.categories.length > 5 ? "MENU" : panel.categories.length > 1 && panel.type === "MESSAGE" ? "BUTTON" : panel.type;
    });
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<h1 class="m-4 text-center text-4xl font-bold">Create a panel</h1> <div class="m-2 mx-auto max-w-3xl sm:p-4">`);
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700"><div class="text-center">`);
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--></div> <form class="my-4 text-lg"><div class="grid grid-cols-1 gap-4 md:grid-cols-2"><div><label><span class="font-medium">Type</span> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How will members use the panel?"></i> `);
      $$renderer3.select(
        {
          class: "input form-multiselect font-normal",
          required: true,
          value: panel.type
        },
        ($$renderer4) => {
          $$renderer4.option(
            {
              value: "BUTTON",
              class: "p-1",
              disabled: panel.categories.length > 5
            },
            ($$renderer5) => {
              $$renderer5.push(`Buttons`);
            }
          );
          $$renderer4.option({ value: "MENU", class: "p-1" }, ($$renderer5) => {
            $$renderer5.push(`Select menu (dropdown)`);
          });
        }
      );
      $$renderer3.push(`</label></div> <div><label class="font-medium"><span class="font-medium">Channel</span> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The channel to send the panel message to"></i> `);
      $$renderer3.select(
        {
          required: true,
          class: "input form-multiselect font-normal",
          value: panel.channel
        },
        ($$renderer4) => {
          $$renderer4.option({ value: "new" }, ($$renderer5) => {
            $$renderer5.push(`Create a new channel`);
          });
          $$renderer4.push(`<hr/><!--[-->`);
          const each_array = ensure_array_like(channels);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let channel = each_array[$$index];
            $$renderer4.push(`<!---->${escape_html(channel.id)} `);
            $$renderer4.option({ value: channel.id, class: "p-1" }, ($$renderer5) => {
              $$renderer5.push(`${escape_html(channel.name)}`);
            });
          }
          $$renderer4.push(`<!--]-->`);
        },
        void 0,
        void 0,
        void 0,
        void 0,
        true
      );
      $$renderer3.push(`</label></div> <div><label class="font-medium"><span class="font-medium">Categories</span> `);
      Required($$renderer3);
      $$renderer3.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The category options to be available"></i> `);
      MultiSelect($$renderer3, {
        outerDivClass: "text-base my-1 p-2 rounded-md border-transparent bg-gray-100 dark:bg-slate-800 font-normal shadow-sm transition-colors has-[:focus]:ring-2 has-[:focus]:ring-blurple",
        inputClass: "p-0 rounded-md bg-transparent transition-colors border-0 focus:ring-0",
        ulSelectedClass: "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300",
        liSelectedClass: "bg-blurple text-white text-sm font-semibold font-mono",
        ulOptionsClass: "bg-white dark:bg-slate-900 p-2 max-h-48 overflow-y-auto",
        liOptionClass: "rounded-md",
        liActiveOptionClass: "bg-blurple text-white",
        liUserMsgClass: "text-red-700 dark:text-red-500 bg-red-400/40 dark:bg-red-500/20",
        liActiveUserMsgClass: "",
        maxSelectMsgClass: "text-xs",
        noMatchingOptionsMsg: "Create a category in the categories section",
        required: true,
        maxSelect: panel.type === "MENU" ? 25 : 5,
        options: Object.keys(categoryOptions),
        get selected() {
          return selectedCategories;
        },
        set selected($$value) {
          selectedCategories = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></label></div> <div><label><span class="font-medium">Title</span> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The embed title"></i> <input type="text" class="input form-input" required=""${attr("value", panel.title)}/></label></div> <div><label><span class="font-medium">Large image</span> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Optional - the embed image"></i> <input type="url" class="input form-input"${attr("value", panel.image)}/></label></div> <div><label><span class="font-medium">Small image (thumbnail)</span> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Optional - the embed thumbnail"></i> <input type="url" class="input form-input"${attr("value", panel.thumbnail)}/></label></div> <div><label class="font-medium"><span class="font-medium">Description</span> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Optional - the embed description"></i> <textarea class="input form-input h-24" maxlength="4096">`);
      const $$body = escape_html(panel.description);
      if ($$body) {
        $$renderer3.push(`${$$body}`);
      }
      $$renderer3.push(`</textarea></label></div> <div class="place-self-center"><button type="submit"${attr("disabled", loading, true)} class="mt-4 rounded-lg bg-green-300 p-2 px-5 font-medium transition duration-300 hover:bg-green-500 hover:text-white disabled:cursor-not-allowed dark:bg-green-500/50 dark:hover:bg-green-500 dark:hover:text-white">`);
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> Create</button></div></div></form></div> <div class="mx-auto mt-8 max-w-lg text-center text-base"><div class="rounded-xl border-2 border-cyan-500 bg-cyan-500/20 p-2"><i class="fa-solid fa-circle-info text-2xl text-cyan-500"></i> <br/> Looking to edit or remove a panel? Just delete the message or channel in Discord.</div></div></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-BYiKDDYG.js.map
