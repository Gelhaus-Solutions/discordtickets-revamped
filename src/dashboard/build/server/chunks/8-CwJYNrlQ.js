import { _ as __variableDynamicImportRuntimeHelper } from './dynamic-import-helper-uMTE3ehW.js';
import { r as redirect } from './index-wpIsICWW.js';
import { i as importJSON } from './i18n-ue4QmWvy.js';

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
      await __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "../../lib/locales/en-GB/_common.json": () => import('./_common-BCxAG6Xd.js') }), `../../lib/locales/${locale}/_common.json`, 6),
      await __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "../../lib/locales/en-GB/misc.json": () => import('./misc-Gf_O-cD6.js') }), `../../lib/locales/${locale}/misc.json`, 6)
    ),
    guilds
  };
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 8;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-1FcJMnlx.js')).default;
const universal_id = "src/routes/(default)/+page.js";
const imports = ["_app/immutable/nodes/8.Bfp9veWO.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/DS7_lcac.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/w0yj2jlX.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/BooD_1dB.js","_app/immutable/chunks/CKSmJmMa.js","_app/immutable/chunks/BeOQa38I.js","_app/immutable/chunks/Do0hC5vz.js","_app/immutable/chunks/-Srq_yTr.js","_app/immutable/chunks/t68F5GHz.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=8-CwJYNrlQ.js.map
