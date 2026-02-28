import { _ as __variableDynamicImportRuntimeHelper } from "../../../../chunks/dynamic-import-helper.js";
import { i as importJSON } from "../../../../chunks/i18n.js";
async function load({ parent, url }) {
  const { locale } = await parent();
  return {
    translations: importJSON(
      await __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "../../../lib/locales/en-GB/_common.json": () => import("../../../../chunks/_common.js") }), `../../../lib/locales/${locale}/_common.json`, 7),
      await __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "../../../lib/locales/en-GB/misc.json": () => import("../../../../chunks/misc.js") }), `../../../lib/locales/${locale}/misc.json`, 7)
    ),
    query: url.search
  };
}
export {
  load
};
