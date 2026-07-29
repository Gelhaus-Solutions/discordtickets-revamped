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
const component = async () => component_cache ??= (await import('./_page.svelte-66sOeqty.js')).default;
const universal_id = "src/routes/settings/[guild]/automations/[automation]/runs/+page.js";
const imports = ["_app/immutable/nodes/20.pQsBekj0.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/DXUvcUDv.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DIx5a5kv.js","_app/immutable/chunks/qt56qy7l.js","_app/immutable/chunks/DjrTSzZO.js","_app/immutable/chunks/BYBfjtKl.js","_app/immutable/chunks/BrQvzMiV.js","_app/immutable/chunks/DkEWTxrr.js","_app/immutable/chunks/B7QG9Zh1.js","_app/immutable/chunks/DBoR8Jcs.js","_app/immutable/chunks/B-8_0BXs.js","_app/immutable/chunks/DNXSlFYn.js","_app/immutable/chunks/BI25tEkL.js","_app/immutable/chunks/BEqSopPw.js","_app/immutable/chunks/m9LoM0Fs.js","_app/immutable/chunks/DJjhjc5w.js","_app/immutable/chunks/BmP4pMmO.js","_app/immutable/chunks/C8QAWR9V.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=20-DTMcAQsj.js.map
