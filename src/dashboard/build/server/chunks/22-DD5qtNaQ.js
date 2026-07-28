import { e as error } from './index-wpIsICWW.js';

async function load({
  fetch,
  params
}) {
  const fetchOptions = { credentials: "include" };
  const response = await fetch(`/api/admin/guilds/${params.guild}/settings`, fetchOptions);
  const isJSON = response.headers.get("Content-Type")?.includes("json");
  const body = isJSON ? await response.json() : await response.text();
  if (!response.ok) {
    error(response.status, isJSON ? JSON.stringify(body) : body);
  } else {
    let analytics = null;
    try {
      const analyticsRes = await fetch(`/api/admin/guilds/${params.guild}/analytics`, fetchOptions);
      if (analyticsRes.ok) {
        analytics = await analyticsRes.json();
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
    return {
      settings: body,
      analytics,
      channels: await (await fetch(`/api/admin/guilds/${params.guild}/data?query=channels.cache`, fetchOptions)).json(),
      locales: await (await fetch("/api/locales", fetchOptions)).json(),
      roles: await (await fetch(`/api/admin/guilds/${params.guild}/data?query=roles.cache`, fetchOptions)).json()
    };
  }
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 22;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BN1ovThq.js')).default;
const universal_id = "src/routes/settings/[guild]/general/+page.js";
const imports = ["_app/immutable/nodes/22.C5ndVtBT.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CHf6lzKQ.js","_app/immutable/chunks/BP9m31RR.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DU67LJ2q.js","_app/immutable/chunks/DiLIn2sP.js","_app/immutable/chunks/DutcwCkN.js","_app/immutable/chunks/DgjFhv82.js","_app/immutable/chunks/Di13zlrF.js","_app/immutable/chunks/BF80Z7Uk.js","_app/immutable/chunks/Rf5LdWmi.js","_app/immutable/chunks/CWgo5oyw.js","_app/immutable/chunks/BVPTV-ap.js","_app/immutable/chunks/BSBiBUc2.js","_app/immutable/chunks/By5s1nM2.js","_app/immutable/chunks/CWmzcjye.js","_app/immutable/chunks/BM7kgzkz.js","_app/immutable/chunks/BrVZ75iX.js","_app/immutable/chunks/DQBBg6CQ.js","_app/immutable/chunks/3-Vl3FpW.js","_app/immutable/chunks/47TXDseE.js","_app/immutable/chunks/5EBxWskT.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/BjjX7O55.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/DB3rCr-e.js","_app/immutable/chunks/D33agL7i.js","_app/immutable/chunks/Bx6_9jBx.js","_app/immutable/chunks/BufDZPIL.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=22-DD5qtNaQ.js.map
