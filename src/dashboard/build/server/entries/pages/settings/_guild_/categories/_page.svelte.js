import { f as ensure_array_like, d as attr } from "../../../../../chunks/index2.js";
import emoji from "emoji-name-map";
import { e as escape_html } from "../../../../../chunks/escaping.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const { categories } = data;
    $$renderer2.push(`<h1 class="m-4 text-center text-4xl font-bold">Categories</h1> <div class="m-2 mx-auto max-w-lg p-4"><div class="grid grid-cols-1 gap-4"><a href="./categories/new"><div class="link rounded-xl bg-gray-100 p-4 text-center text-lg font-semibold shadow-sm dark:bg-slate-800"><i class="fa-solid fa-circle-plus mr-2"></i><span>Create</span></div></a> <!--[-->`);
    const each_array = ensure_array_like(categories);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let category = each_array[$$index];
      $$renderer2.push(`<a${attr("href", `./categories/${category.id}`)}><div class="link group flex flex-col-reverse gap-1 rounded-xl bg-gray-100 p-4 shadow-sm dark:bg-slate-800 md:flex-row-reverse md:justify-between"><div class="float-right min-w-max text-center text-sm text-gray-500 transition duration-300 group-hover:text-white dark:text-slate-400 dark:group-hover:text-white md:text-left">`);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <p><i class="fa-solid fa-clock mr-2"></i> ${escape_html(category.stats.avgResponseTime)}
							response</p> <p><i class="fa-solid fa-square-check mr-2"></i> ${escape_html(category.stats.avgResolutionTime)}
							resolution</p></div> <div class="flex items-center gap-4"><span class="text-5xl">`);
      if (category.emoji) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`${escape_html(emoji.get(category.emoji) ?? "")}`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></span> <div><p class="text-xl font-semibold"><span>${escape_html(category.name)}</span></p> <p>${escape_html(category.description)}</p></div></div></div></a>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
export {
  _page as default
};
