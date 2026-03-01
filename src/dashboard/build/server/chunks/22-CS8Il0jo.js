import { e as error } from './index-BcOZ6EV9.js';
import './utils-FiC4zhrQ.js';

async function load({ fetch, params }) {
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
      locales: await (await fetch(`/api/locales`, fetchOptions)).json(),
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
const component = async () => component_cache ??= (await import('./_page.svelte-DQzTn2Os.js')).default;
const universal_id = "src/routes/settings/[guild]/general/+page.js";
const imports = ["_app/immutable/nodes/22.BrbZMFZz.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BAc9Nw6w.js","_app/immutable/chunks/CWXCXDbJ.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/BTVB6o0Y.js","_app/immutable/chunks/BnKh12PZ.js","_app/immutable/chunks/DU73alKZ.js","_app/immutable/chunks/DuqOsHh6.js","_app/immutable/chunks/C79_WgZ5.js","_app/immutable/chunks/DNgBoiT1.js","_app/immutable/chunks/C9yEqpEA.js","_app/immutable/chunks/CUQ3wp6X.js","_app/immutable/chunks/CdsDKcub.js","_app/immutable/chunks/C43HmXkP.js","_app/immutable/chunks/r2wwZTEc.js","_app/immutable/chunks/DeGpVRd_.js","_app/immutable/chunks/J_wX4PLQ.js","_app/immutable/chunks/CgrvsY6N.js","_app/immutable/chunks/L_7WN5SN.js","_app/immutable/chunks/Bt5PpDoa.js","_app/immutable/chunks/5EBxWskT.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/D7lO7nIc.js","_app/immutable/chunks/CFD2bbYg.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/CZwjNc88.js","_app/immutable/chunks/D8EB0mrL.js","_app/immutable/chunks/DG6z6l1p.js","_app/immutable/chunks/CSnVTN25.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=22-CS8Il0jo.js.map
