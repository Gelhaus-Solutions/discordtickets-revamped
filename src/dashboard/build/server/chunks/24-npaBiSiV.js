import { e as error } from './index-wpIsICWW.js';

async function load({
  fetch,
  params
}) {
  const fetchOptions = { credentials: "include" };
  const [categories, channels, settings] = await Promise.all([
    fetch(`/api/admin/guilds/${params.guild}/categories`, fetchOptions).then((r) => r.json()),
    fetch(`/api/admin/guilds/${params.guild}/data?query=channels.cache`, fetchOptions).then((r) => r.json()),
    // `/settings` carries primaryColour and footer; the guild root returns stats.
    fetch(`/api/admin/guilds/${params.guild}/settings`, fetchOptions).then((r) => r.ok ? r.json() : {})
  ]);
  if (params.panel === "new") {
    return {
      categories,
      channels,
      panel: null,
      settings
    };
  }
  const response = await fetch(`/api/admin/guilds/${params.guild}/panels/${params.panel}`, fetchOptions);
  const isJSON = response.headers.get("Content-Type")?.includes("json");
  const body = isJSON ? await response.json() : await response.text();
  if (!response.ok) {
    error(response.status, isJSON ? JSON.stringify(body) : body);
  }
  return {
    categories,
    channels,
    panel: body,
    settings
  };
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 24;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-Y-TgwF_v.js')).default;
const universal_id = "src/routes/settings/[guild]/panels/[panel]/+page.js";
const imports = ["_app/immutable/nodes/24.BAVyiNKA.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BP9m31RR.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DU67LJ2q.js","_app/immutable/chunks/DiLIn2sP.js","_app/immutable/chunks/DutcwCkN.js","_app/immutable/chunks/DgjFhv82.js","_app/immutable/chunks/BF80Z7Uk.js","_app/immutable/chunks/BSBiBUc2.js","_app/immutable/chunks/By5s1nM2.js","_app/immutable/chunks/CWmzcjye.js","_app/immutable/chunks/BM7kgzkz.js","_app/immutable/chunks/BrVZ75iX.js","_app/immutable/chunks/DQBBg6CQ.js","_app/immutable/chunks/3-Vl3FpW.js","_app/immutable/chunks/CHf6lzKQ.js","_app/immutable/chunks/47TXDseE.js","_app/immutable/chunks/BjjX7O55.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/DB3rCr-e.js","_app/immutable/chunks/Rf5LdWmi.js","_app/immutable/chunks/D33agL7i.js","_app/immutable/chunks/Bx6_9jBx.js","_app/immutable/chunks/BufDZPIL.js","_app/immutable/chunks/BVPTV-ap.js","_app/immutable/chunks/j5xx8EL5.js","_app/immutable/chunks/B9JY1_cP.js","_app/immutable/chunks/BhQh7H-k.js","_app/immutable/chunks/Cpj98o6Y.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=24-npaBiSiV.js.map
