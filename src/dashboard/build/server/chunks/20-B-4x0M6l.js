import { e as error } from './index-wpIsICWW.js';

async function load({ fetch, params }) {
  const base = `/api/admin/guilds/${params.guild}/automations`;
  const responses = await Promise.all([
    fetch(`${base}/${params.automation}`),
    fetch(`${base}/${params.automation}/runs?limit=50`),
    fetch(`${base}/nodes`)
  ]);
  for (const response of responses) {
    if (response.ok) continue;
    const isJSON = response.headers.get("Content-Type")?.includes("json");
    const body = isJSON ? await response.json() : await response.text();
    error(response.status, isJSON ? JSON.stringify(body) : body);
  }
  const [automation, runs, catalogue] = await Promise.all(responses.map((r) => r.json()));
  return { automation, catalogue, runs: runs.runs };
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 20;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BEwjq_8a.js')).default;
const universal_id = "src/routes/settings/[guild]/automations/[automation]/runs/+page.js";
const imports = ["_app/immutable/nodes/20.CIi1EVsD.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/DXUvcUDv.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DIx5a5kv.js","_app/immutable/chunks/qt56qy7l.js","_app/immutable/chunks/DjrTSzZO.js","_app/immutable/chunks/BYBfjtKl.js","_app/immutable/chunks/BrQvzMiV.js","_app/immutable/chunks/DkEWTxrr.js","_app/immutable/chunks/B7QG9Zh1.js","_app/immutable/chunks/oER7Dh_v.js","_app/immutable/chunks/DQ8rtQl1.js","_app/immutable/chunks/DNXSlFYn.js","_app/immutable/chunks/Dln3yJkF.js","_app/immutable/chunks/BEqSopPw.js","_app/immutable/chunks/m9LoM0Fs.js","_app/immutable/chunks/DJjhjc5w.js","_app/immutable/chunks/BmP4pMmO.js","_app/immutable/chunks/CTTrJg5p.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=20-B-4x0M6l.js.map
