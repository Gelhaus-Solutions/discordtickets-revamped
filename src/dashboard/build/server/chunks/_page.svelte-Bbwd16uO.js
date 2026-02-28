import { j as getContext, m as head, an as attr_style, n as attr, f as attr_class, ao as stringify } from './index2-D6kyOzXX.js';
import { I as I18nLite } from './I18n-ChmA8YU3.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const { client, translations, query } = data;
    const i18n = new I18nLite();
    const t = i18n.loadParsed(...translations).createTranslator();
    let theme = getContext("theme");
    head("195ffct", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(t("login_title", { username: client.username }))}</title>`);
      });
      $$renderer3.push(`<link rel="icon"${attr("href", `${client.avatar}?size=32`)}/>`);
    });
    $$renderer2.push(`<div class="min-h-screen bg-cover bg-no-repeat"${attr_style(`background-image: url("/assets/topgg-${theme}.webp")`)}><div class="min-h-screen bg-gradient-to-bl from-blurple/50 to-white/10 dark:from-blurple/25 dark:to-blurple/5"><div class="flex flex-col gap-0 backdrop-blur-sm lg:flex-row"><div class="lg:min-h-screen lg:w-1/2"><div class="flex justify-center p-8 lg:min-h-screen"><div class="flex items-center gap-8"><img${attr("src", `${client.avatar}?size=512`)} alt="" class="h-24 w-24 rounded-full"/> <h1 class="text-2xl font-bold lg:text-4xl">${escape_html(client.username)}</h1></div></div></div> <div class="lg:w-1/2"><div class="flex items-center justify-center lg:min-h-screen lg:justify-stretch"><div class="m-4 rounded-lg bg-dgrey-100 shadow-2xl dark:bg-dgrey-900"><div class="flex flex-col items-center gap-6 p-8 sm:p-12"><div class="text-lg font-semibold">${escape_html(t("please_login"))}</div> <a${attr("href", "/auth/login" + query)} class="rounded-lg border-2 border-white/50 bg-blurple p-2 px-5 font-semibold text-white ring-blurple transition duration-300 hover:bg-blurple/75 focus:outline-none focus:ring-2 dark:border-white/25"><span class="flex flex-row items-center gap-2"><i class="fa-brands fa-discord"></i> ${escape_html(t("continue_with_discord"))}</span></a></div> <div class="rounded-b-lg bg-dgrey-400 p-1.5 text-xs dark:bg-dgrey-950 dark:text-dgrey-400/75"><div class="flex justify-evenly"><div><div class="flex items-center gap-2"><i class="fa-solid fa-globe"></i> ${escape_html(t("common:language"))}</div></div> <div><div class="flex items-center gap-2"><i${attr_class(`fa-solid ${stringify(theme === "dark" ? "fa-moon" : "fa-sun")}`)}></i> ${escape_html(t("common:theme"))}</div></div></div></div></div></div></div></div></div></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Bbwd16uO.js.map
