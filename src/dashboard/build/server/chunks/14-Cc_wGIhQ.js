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
const imports = ["_app/immutable/nodes/14.CfOMDak8.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/DS7_lcac.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/mLgVBLBO.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/Deqeumkw.js","_app/immutable/chunks/B5lc6iIk.js","_app/immutable/chunks/CEg1HVZO.js","_app/immutable/chunks/DTLSGLfB.js","_app/immutable/chunks/COXAts_t.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=14-Cc_wGIhQ.js.map
