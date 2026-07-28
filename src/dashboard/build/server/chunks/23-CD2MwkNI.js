import { e as error } from './index-wpIsICWW.js';

async function load({
  fetch,
  params
}) {
  const fetchOptions = { credentials: "include" };
  const response = await fetch(`/api/admin/guilds/${params.guild}/panels`, fetchOptions);
  const isJSON = response.headers.get("Content-Type")?.includes("json");
  const body = isJSON ? await response.json() : await response.text();
  if (!response.ok) {
    error(response.status, isJSON ? JSON.stringify(body) : body);
  } else {
    return { panels: body };
  }
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 23;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-CZY22ruX.js')).default;
const universal_id = "src/routes/settings/[guild]/panels/+page.js";
const imports = ["_app/immutable/nodes/23.oD5f6eWD.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/mLgVBLBO.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/Deqeumkw.js","_app/immutable/chunks/DGU3ppqY.js","_app/immutable/chunks/DpaVjVpY.js","_app/immutable/chunks/DdrKTUDB.js","_app/immutable/chunks/CEg1HVZO.js","_app/immutable/chunks/DTLSGLfB.js","_app/immutable/chunks/C-oaICqf.js","_app/immutable/chunks/C0vmHbms.js","_app/immutable/chunks/Cuao9ud2.js","_app/immutable/chunks/DNREuzDQ.js","_app/immutable/chunks/Bcg53WOX.js","_app/immutable/chunks/B4_oswaU.js","_app/immutable/chunks/BkPoVagP.js","_app/immutable/chunks/BV_ssYUv.js","_app/immutable/chunks/B5UnL3w_.js","_app/immutable/chunks/Durl6y2z.js","_app/immutable/chunks/COXAts_t.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=23-CD2MwkNI.js.map
