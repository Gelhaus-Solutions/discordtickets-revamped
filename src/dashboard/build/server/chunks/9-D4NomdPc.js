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
const component = async () => component_cache ??= (await import('./_page.svelte-BRNmAUQL.js')).default;
const universal_id = "src/routes/(default)/[guild]/+page.js";
const imports = ["_app/immutable/nodes/9.CnyR-pWA.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/DS7_lcac.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/DXUvcUDv.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DIx5a5kv.js","_app/immutable/chunks/BEqSopPw.js","_app/immutable/chunks/m9LoM0Fs.js","_app/immutable/chunks/qt56qy7l.js","_app/immutable/chunks/DjrTSzZO.js","_app/immutable/chunks/BYBfjtKl.js","_app/immutable/chunks/BrQvzMiV.js","_app/immutable/chunks/DkEWTxrr.js","_app/immutable/chunks/B7QG9Zh1.js","_app/immutable/chunks/dcldmTbN.js","_app/immutable/chunks/C9aehPDr.js","_app/immutable/chunks/DNXSlFYn.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/tCKrE-jn.js","_app/immutable/chunks/B17Q6ahh.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=9-D4NomdPc.js.map
