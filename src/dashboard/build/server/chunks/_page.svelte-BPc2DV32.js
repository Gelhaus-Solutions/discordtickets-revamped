import { ai as store_get, aj as unsubscribe_stores, ao as attr, ak as ensure_array_like, af as attr_class, am as stringify, ah as getContext, au as bind_props } from './index2-B7lo9Ma0.js';
import { p as page } from './stores-BjlJSBuQ.js';
import { m as marked } from './marked.esm-DcwJ8j7Z.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';
import { R as Required } from './Required-DajgSg18.js';
import { h as html } from './html-FW6Ia4bL.js';
import { T as ToastContainer, B as BootstrapToast } from './FlatToast.svelte_svelte_type_style_lang-CsvlMSms.js';
import { t as tagsState } from './state.svelte2-CZg8XtUa.js';
import './root-tBuNxqOs.js';
import './exports-7ECo9oy7.js';
import './state.svelte-D5lsa5ep.js';
import './index-vPI-6AVn.js';

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

export { _page as default };
//# sourceMappingURL=_page.svelte-BPc2DV32.js.map
