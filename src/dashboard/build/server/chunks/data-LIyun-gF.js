import { ak as ensure_array_like, af as attr_class, al as attr_style, am as stringify } from './index2-B7lo9Ma0.js';
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
        const j = JSON.parse(v);
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

export { Tree_1 as T, flatten as f };
//# sourceMappingURL=data-LIyun-gF.js.map
