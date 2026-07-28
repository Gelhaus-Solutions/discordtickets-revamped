import { _ as __variableDynamicImportRuntimeHelper } from './dynamic-import-helper-uMTE3ehW.js';
import { i as importJSON } from './i18n-ue4QmWvy.js';

async function load({
  parent,
  url
}) {
  const { locale } = await parent();
  return {
    translations: importJSON(
      await __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "../../../lib/locales/en-GB/_common.json": () => import('./_common-BCxAG6Xd.js') }), `../../../lib/locales/${locale}/_common.json`, 7),
      await __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "../../../lib/locales/en-GB/misc.json": () => import('./misc-Gf_O-cD6.js') }), `../../../lib/locales/${locale}/misc.json`, 7)
    ),
    query: url.search
  };
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 14;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-D75cqAnG.js')).default;
const universal_id = "src/routes/(default)/login/+page.js";
const imports = ["_app/immutable/nodes/14.CbtK-J1p.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/DS7_lcac.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BP9m31RR.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DU67LJ2q.js","_app/immutable/chunks/BgiKB3bD.js","_app/immutable/chunks/BF80Z7Uk.js","_app/immutable/chunks/Rf5LdWmi.js","_app/immutable/chunks/BVPTV-ap.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=14-BCbnVe5x.js.map
