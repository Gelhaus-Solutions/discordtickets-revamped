import { e as error } from './index-wpIsICWW.js';

async function load({ fetch, params }) {
  const [listResponse, catalogueResponse] = await Promise.all([
    fetch(`/api/admin/guilds/${params.guild}/automations`),
    fetch(`/api/admin/guilds/${params.guild}/automations/nodes`)
  ]);
  for (const response of [listResponse, catalogueResponse]) {
    if (response.ok) continue;
    const isJSON = response.headers.get("Content-Type")?.includes("json");
    const body = isJSON ? await response.json() : await response.text();
    error(response.status, isJSON ? JSON.stringify(body) : body);
  }
  return {
    automations: await listResponse.json(),
    catalogue: await catalogueResponse.json()
  };
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 18;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BDd1kqmG.js')).default;
const universal_id = "src/routes/settings/[guild]/automations/+page.js";
const imports = ["_app/immutable/nodes/18.C9gWA9ZM.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/DNXSlFYn.js","_app/immutable/chunks/DXUvcUDv.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DIx5a5kv.js","_app/immutable/chunks/BEqSopPw.js","_app/immutable/chunks/m9LoM0Fs.js","_app/immutable/chunks/DJjhjc5w.js","_app/immutable/chunks/qt56qy7l.js","_app/immutable/chunks/DjrTSzZO.js","_app/immutable/chunks/BYBfjtKl.js","_app/immutable/chunks/BrQvzMiV.js","_app/immutable/chunks/DkEWTxrr.js","_app/immutable/chunks/B7QG9Zh1.js","_app/immutable/chunks/BBtOUB17.js","_app/immutable/chunks/CKl5tbu3.js","_app/immutable/chunks/DwU0rVOp.js","_app/immutable/chunks/JGtkTdJX.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/D1LahZIy.js","_app/immutable/chunks/DG23Wkn6.js","_app/immutable/chunks/BFUi58Va.js","_app/immutable/chunks/BmP4pMmO.js","_app/immutable/chunks/C9bhuRDj.js","_app/immutable/chunks/CpZM6PbW.js","_app/immutable/chunks/B9IUuZVk.js","_app/immutable/chunks/C8QAWR9V.js"];
const stylesheets = ["_app/immutable/assets/FlatToast.DYPRwk0y.css"];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=18-d2ulH91u.js.map
