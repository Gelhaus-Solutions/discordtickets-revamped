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
const imports = ["_app/immutable/nodes/9.Z_-VtLB6.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/DS7_lcac.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/mLgVBLBO.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/Deqeumkw.js","_app/immutable/chunks/DGU3ppqY.js","_app/immutable/chunks/DpaVjVpY.js","_app/immutable/chunks/B5lc6iIk.js","_app/immutable/chunks/CEg1HVZO.js","_app/immutable/chunks/C-oaICqf.js","_app/immutable/chunks/C0vmHbms.js","_app/immutable/chunks/Cuao9ud2.js","_app/immutable/chunks/DNREuzDQ.js","_app/immutable/chunks/Bcg53WOX.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B4_oswaU.js","_app/immutable/chunks/B17Q6ahh.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=9-CY4f2T8r.js.map
