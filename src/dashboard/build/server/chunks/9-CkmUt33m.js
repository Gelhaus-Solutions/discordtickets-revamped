import { _ as __variableDynamicImportRuntimeHelper } from './dynamic-import-helper-uMTE3ehW.js';
import { i as importJSON } from './i18n-ue4QmWvy.js';

async function load({ parent }) {
  const { locale } = await parent();
  return {
    translations: importJSON(await __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "../../../lib/locales/en-GB/_common.json": () => import('./_common-BCxAG6Xd.js') }), `../../../lib/locales/${locale}/_common.json`, 7))
  };
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 9;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-e7aQn3Cp.js')).default;
const universal_id = "src/routes/(default)/[guild]/+page.js";
const imports = ["_app/immutable/nodes/9.BkvOnIt3.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/DS7_lcac.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CWXCXDbJ.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/BTVB6o0Y.js","_app/immutable/chunks/BnKh12PZ.js","_app/immutable/chunks/DU73alKZ.js","_app/immutable/chunks/BTn3qVvx.js","_app/immutable/chunks/DNgBoiT1.js","_app/immutable/chunks/C9yEqpEA.js","_app/immutable/chunks/CUQ3wp6X.js","_app/immutable/chunks/DeGpVRd_.js","_app/immutable/chunks/J_wX4PLQ.js","_app/immutable/chunks/C_rMYQo-.js","_app/immutable/chunks/D4qYK9Iq.js","_app/immutable/chunks/BAc9Nw6w.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/CaUQ-Vxm.js","_app/immutable/chunks/B17Q6ahh.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=9-CkmUt33m.js.map
