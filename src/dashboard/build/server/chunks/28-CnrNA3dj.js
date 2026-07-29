import { e as error } from './index-wpIsICWW.js';

async function load({
  fetch,
  params
}) {
  const response = await fetch(`/api/admin/guilds/${params.guild}/tags`);
  const isJSON = response.headers.get("Content-Type")?.includes("json");
  const body = isJSON ? await response.json() : await response.text();
  if (!response.ok) {
    error(response.status, isJSON ? JSON.stringify(body) : body);
  } else {
    return { tags: body };
  }
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 28;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BPc2DV32.js')).default;
const universal_id = "src/routes/settings/[guild]/tags/+page.js";
const imports = ["_app/immutable/nodes/28.l_3lKsYh.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/DXUvcUDv.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DIx5a5kv.js","_app/immutable/chunks/BEqSopPw.js","_app/immutable/chunks/m9LoM0Fs.js","_app/immutable/chunks/DJjhjc5w.js","_app/immutable/chunks/DjrTSzZO.js","_app/immutable/chunks/BYBfjtKl.js","_app/immutable/chunks/BrQvzMiV.js","_app/immutable/chunks/uUQSZ6BK.js","_app/immutable/chunks/CWmzcjye.js","_app/immutable/chunks/DkEWTxrr.js","_app/immutable/chunks/B7QG9Zh1.js","_app/immutable/chunks/CLHVse_Z.js","_app/immutable/chunks/BarUeDzD.js","_app/immutable/chunks/DNXSlFYn.js","_app/immutable/chunks/Bv5iHoat.js","_app/immutable/chunks/DC57nLQ5.js","_app/immutable/chunks/BmP4pMmO.js","_app/immutable/chunks/CpZM6PbW.js","_app/immutable/chunks/B9IUuZVk.js","_app/immutable/chunks/uAL33ikp.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/JGtkTdJX.js","_app/immutable/chunks/D1LahZIy.js","_app/immutable/chunks/DG23Wkn6.js","_app/immutable/chunks/BFUi58Va.js","_app/immutable/chunks/M72f9keJ.js"];
const stylesheets = ["_app/immutable/assets/FlatToast.DYPRwk0y.css"];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=28-CnrNA3dj.js.map
