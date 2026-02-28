import { m as head, am as ensure_array_like, n as attr } from './index2-D6kyOzXX.js';
import { I as I18nLite } from './I18n-ChmA8YU3.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const { client, guilds, translations } = data;
    const i18n = new I18nLite();
    const t = i18n.loadParsed(...translations).createTranslator();
    head("rkr82j", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(t("select_server_title", { username: client.username }))}</title>`);
      });
      $$renderer3.push(`<link rel="icon"${attr("href", `${client.avatar}?size=32`)}/>`);
    });
    $$renderer2.push(`<div class="absolute h-max min-h-screen w-full bg-dgrey-100 text-dgrey-600 dark:bg-dgrey-800 dark:text-dgrey-300"><div class="container mx-auto mt-24 p-4 text-center sm:mt-48"><h1 class="mb-16 text-2xl font-bold">${escape_html(t("select_server"))}</h1> <div class="flex flex-col flex-wrap items-stretch justify-center gap-4 sm:flex-row sm:gap-8"><!--[-->`);
    const each_array = ensure_array_like(guilds);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let guild = each_array[$$index];
      const slug = BigInt(guild.id).toString(36);
      $$renderer2.push(`<a${attr("href", `/${slug}`)}><div class="h-full w-full rounded-lg border-2 border-dgrey-400 bg-dgrey-300 p-4 shadow-black transition-all duration-300 hover:scale-105 hover:shadow-2xl dark:border-dgrey-700 dark:bg-dgrey-900 sm:w-48"><div class="flex flex-row items-center gap-4 sm:flex-col"><img${attr("src", guild.logo)} alt="" class="h-12 w-12 rounded-full sm:mx-auto sm:h-24 sm:w-24"/> <p class="font-semibold">${escape_html(guild.name)}</p></div></div></a>`);
    }
    $$renderer2.push(`<!--]--></div> <div class="m-8 text-sm lg:my-24"><a href="/auth/logout" class="transition-colors duration-300 hover:text-blurple">${escape_html(t("common:logout"))}</a></div></div></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-1FcJMnlx.js.map
