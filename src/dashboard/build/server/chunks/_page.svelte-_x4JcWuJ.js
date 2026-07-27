import { ao as attr, ak as ensure_array_like, ai as store_get, a1 as derived, aj as unsubscribe_stores } from './index2-BjPIasya.js';
import { p as page } from './stores-wxKY5z2p.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';
import './root-BZvlTPwp.js';
import './exports-7ECo9oy7.js';
import './state.svelte-B7ni-XI1.js';
import { R as Required } from './Required-DajgSg18.js';
import './marked.esm-DcwJ8j7Z.js';
import { n as newBlock, a as newLayout, B as BlockEditor_1, P as Preview, h as hasEntryPoint } from './Preview-fn6b7m6K.js';
import './index-U7-39QVn.js';
import './_commonjsHelpers-BFTU3MAI.js';
import './html-FW6Ia4bL.js';
import 'crypto';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { data } = $$props;
    const isNew = derived(() => store_get($$store_subs ??= {}, "$page", page).params.panel === "new");
    const channels = data.channels.filter((c) => c.type === 0);
    const starterLayout = () => {
      const container = newBlock("container");
      const text = container.blocks[0];
      text.content = "## Need help?\nPick a category below to open a ticket.";
      const buttons = newBlock("buttons");
      buttons.buttons = data.categories.slice(0, 5).map((c) => ({
        categoryId: c.id,
        emoji: null,
        kind: "ticket",
        label: null,
        style: null
      }));
      container.blocks = [text, newBlock("separator"), buttons, newBlock("footer")];
      return { ...newLayout(), blocks: [container] };
    };
    let name = data.panel?.name ?? "Ticket panel";
    let channel = data.panel?.channelId ?? "new";
    let layout = data.panel?.layout ?? starterLayout();
    let loading = false;
    const missingEntryPoint = derived(() => !hasEntryPoint(layout));
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<h1 class="m-4 text-center text-4xl font-bold">${escape_html(isNew() ? "Create a panel" : "Edit panel")}</h1> <div class="m-2 mx-auto max-w-3xl sm:p-4">`);
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <form class="flex flex-col gap-4"><div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700"><div class="grid grid-cols-1 gap-4 md:grid-cols-2"><label><span class="font-medium">Name</span> `);
      Required($$renderer3);
      $$renderer3.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Only shown in the dashboard, to tell your panels apart"></i> <input type="text" maxlength="100" class="input form-input" required=""${attr("value", name)}/></label> <label><span class="font-medium">Channel</span> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The channel the panel message is posted in"></i> `);
      $$renderer3.select(
        {
          required: true,
          class: "input form-multiselect font-normal",
          value: channel
        },
        ($$renderer4) => {
          if (isNew()) {
            $$renderer4.push("<!--[-->");
            $$renderer4.option({ value: "new" }, ($$renderer5) => {
              $$renderer5.push(`Create a new channel`);
            });
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--><!--[-->`);
          const each_array = ensure_array_like(channels);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let c = each_array[$$index];
            $$renderer4.option({ value: c.id }, ($$renderer5) => {
              $$renderer5.push(`${escape_html(c.name)}`);
            });
          }
          $$renderer4.push(`<!--]-->`);
        }
      );
      $$renderer3.push(`</label></div> `);
      if (channel !== "new") {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<p class="mt-2 text-center text-cyan-500"><i class="fa-solid fa-circle-info"></i> Make sure members can read, but not send messages, in that channel.</p>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--></div> <div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700"><h2 class="mb-1 font-medium">Layout</h2> <p class="mb-3 text-sm text-gray-500 dark:text-slate-400">Drag blocks to reorder them. Members need at least one ticket button or select menu to open
				a ticket.</p> `);
      if (missingEntryPoint()) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<p class="mb-3 rounded-lg border-2 border-amber-500 bg-amber-500/10 p-2 text-sm"><i class="fa-solid fa-triangle-exclamation text-amber-500"></i> This panel has no ticket button or select menu, so nobody can open a ticket from it.</p>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      BlockEditor_1($$renderer3, {
        categories: data.categories,
        context: "panel",
        get blocks() {
          return layout.blocks;
        },
        set blocks($$value) {
          layout.blocks = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></div> `);
      Preview($$renderer3, {
        layout,
        categories: data.categories,
        context: "panel",
        primaryColour: data.settings?.primaryColour ?? "#009999",
        footer: data.settings?.footer ?? ""
      });
      $$renderer3.push(`<!----> <div class="flex justify-center gap-2"><a${attr("href", `/settings/${store_get($$store_subs ??= {}, "$page", page).params.guild}/panels`)} class="rounded-lg bg-gray-200 p-2 px-5 font-medium transition duration-300 hover:bg-gray-400 dark:bg-slate-600 dark:hover:bg-slate-500">Cancel</a> <button type="submit"${attr("disabled", loading, true)} class="rounded-lg bg-green-300 p-2 px-5 font-medium transition duration-300 hover:bg-green-500 hover:text-white disabled:cursor-not-allowed dark:bg-green-500/50 dark:hover:bg-green-500">`);
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> ${escape_html(isNew() ? "Create" : "Save")}</button></div></form></div>`);
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
//# sourceMappingURL=_page.svelte-_x4JcWuJ.js.map
