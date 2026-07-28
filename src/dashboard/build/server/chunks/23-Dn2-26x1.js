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
const imports = ["_app/immutable/nodes/23.DfjALB7E.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BP9m31RR.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DU67LJ2q.js","_app/immutable/chunks/DiLIn2sP.js","_app/immutable/chunks/DutcwCkN.js","_app/immutable/chunks/DgjFhv82.js","_app/immutable/chunks/BF80Z7Uk.js","_app/immutable/chunks/Rf5LdWmi.js","_app/immutable/chunks/BM7kgzkz.js","_app/immutable/chunks/BrVZ75iX.js","_app/immutable/chunks/DDx0LxoA.js","_app/immutable/chunks/oqEqrbEC.js","_app/immutable/chunks/CHf6lzKQ.js","_app/immutable/chunks/DULtF6vX.js","_app/immutable/chunks/DB3rCr-e.js","_app/immutable/chunks/D33agL7i.js","_app/immutable/chunks/Bx6_9jBx.js","_app/immutable/chunks/BufDZPIL.js","_app/immutable/chunks/BVPTV-ap.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=23-Dn2-26x1.js.map
