import { e as escape_html } from "../../../../chunks/escaping.js";
import "clsx";
function _layout($$renderer, $$props) {
  let { data, children } = $$props;
  const { guild } = data;
  $$renderer.push(`<div class="text-center"><a href="./" class="link mb-4 inline-block rounded-xl bg-gray-50/75 p-2 px-4 font-medium text-gray-500 shadow-sm dark:bg-slate-800/75 dark:text-slate-400"><i class="fa-solid fa-arrow-left"></i> ${escape_html(guild.name)}</a></div> `);
  children?.($$renderer);
  $$renderer.push(`<!---->`);
}
export {
  _layout as default
};
