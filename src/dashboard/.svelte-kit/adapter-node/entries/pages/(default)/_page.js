import { _ as __variableDynamicImportRuntimeHelper } from "../../../chunks/dynamic-import-helper.js";
import { redirect } from "@sveltejs/kit";
import { i as importJSON } from "../../../chunks/i18n.js";
async function load({ parent, fetch }) {
  redirect(302, "/settings");
  const { locale } = await parent();
  const guilds = await (await fetch(`/api/guilds`)).json();
  if (guilds.length === 0) {
    redirect(302, "/settings");
  } else if (guilds.length === 1) {
    redirect(302, `/${guilds[0].id}`);
  }
  return {
    translations: importJSON(
      await __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "../../lib/locales/en-GB/_common.json": () => import("../../../chunks/_common.js") }), `../../lib/locales/${locale}/_common.json`, 6),
      await __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "../../lib/locales/en-GB/misc.json": () => import("../../../chunks/misc.js") }), `../../lib/locales/${locale}/misc.json`, 6)
    ),
    guilds
  };
}
export {
  load
};
