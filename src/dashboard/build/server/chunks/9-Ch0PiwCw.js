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
const component = async () => component_cache ??= (await import('./_page.svelte-sa_pe_Nb.js')).default;
const universal_id = "src/routes/(default)/[guild]/+page.js";
const imports = ["_app/immutable/nodes/9.CqNvsk2V.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/DS7_lcac.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/w0yj2jlX.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/BooD_1dB.js","_app/immutable/chunks/DP_MZUJz.js","_app/immutable/chunks/D6OMl6Um.js","_app/immutable/chunks/BeOQa38I.js","_app/immutable/chunks/Do0hC5vz.js","_app/immutable/chunks/-Srq_yTr.js","_app/immutable/chunks/t68F5GHz.js","_app/immutable/chunks/D9CK0TUC.js","_app/immutable/chunks/Dhbirp5Y.js","_app/immutable/chunks/BbLmn6CC.js","_app/immutable/chunks/Ccka-6AH.js","_app/immutable/chunks/BgOtEVpo.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/BK0SFyA8.js","_app/immutable/chunks/B17Q6ahh.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=9-Ch0PiwCw.js.map
