import { h as head, d as attr, b as store_get, u as unsubscribe_stores } from "../../../../chunks/index2.js";
import { p as page } from "../../../../chunks/stores.js";
import { I18nLite } from "@eartharoid/i18n";
import { e as escape_html } from "../../../../chunks/escaping.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { data } = $$props;
    const { client, guild, translations } = data;
    const i18n = new I18nLite();
    const t = i18n.loadParsed(...translations).createTranslator();
    head("1wusdxj", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(t("common:title", { guild: guild.name, client: client.username }))}</title>`);
      });
    });
    $$renderer2.push(`<div>`);
    if (guild.privilegeLevel > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="w-full bg-dgrey-400 p-1 text-xs dark:bg-dgrey-950"><div class="container mx-auto"><div class="flex justify-center gap-8"><a${attr("href", `/${store_get($$store_subs ??= {}, "$page", page).params.guild}/staff`)} class="rounded-md bg-dgrey-900/10 px-2 py-1 text-dgrey-700 duration-300 hover:bg-dgrey-900/20 dark:bg-dgrey-400/10 dark:text-dgrey-400/75 dark:hover:bg-dgrey-400/20 hover:dark:text-dgrey-400/100"><div class="flex items-center gap-2"><i class="fa-solid fa-user-group"></i> ${escape_html(t("common:staff_dashboard"))}</div></a> `);
      if (guild.privilegeLevel >= 2) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<a${attr("href", `/settings/${guild.id}`)} class="rounded-md bg-dgrey-900/10 px-2 py-1 text-dgrey-700 duration-300 hover:bg-dgrey-900/20 dark:bg-dgrey-400/10 dark:text-dgrey-400/75 dark:hover:bg-dgrey-400/20 hover:dark:text-dgrey-400/100"><div class="flex items-center gap-2"><i class="fa-solid fa-gear"></i> ${escape_html(t("common:settings_panel"))}</div></a>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div>todo</div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
