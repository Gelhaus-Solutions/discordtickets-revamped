import { _ as __variableDynamicImportRuntimeHelper } from './dynamic-import-helper-uMTE3ehW.js';
import { i as importJSON } from './i18n-ue4QmWvy.js';

async function load({ parent }) {
  const { locale } = await parent();
  return { translations: importJSON(await __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "../../../lib/locales/en-GB/_common.json": () => import('./_common-BCxAG6Xd.js') }), `../../../lib/locales/${locale}/_common.json`, 7)) };
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 9;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-DcB10Sna.js')).default;
const universal_id = "src/routes/(default)/[guild]/+page.js";
const imports = ["_app/immutable/nodes/9.BlwRKRsV.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/DS7_lcac.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BP9m31RR.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DU67LJ2q.js","_app/immutable/chunks/DiLIn2sP.js","_app/immutable/chunks/DutcwCkN.js","_app/immutable/chunks/BgiKB3bD.js","_app/immutable/chunks/BF80Z7Uk.js","_app/immutable/chunks/BM7kgzkz.js","_app/immutable/chunks/BrVZ75iX.js","_app/immutable/chunks/DDx0LxoA.js","_app/immutable/chunks/oqEqrbEC.js","_app/immutable/chunks/CHf6lzKQ.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/DULtF6vX.js","_app/immutable/chunks/B17Q6ahh.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=9-BCDqXRBK.js.map
