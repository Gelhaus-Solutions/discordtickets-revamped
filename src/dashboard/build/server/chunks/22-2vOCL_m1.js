import { e as error } from './index-wpIsICWW.js';

async function load({ fetch, params }) {
  const fetchOptions = { credentials: "include" };
  const response = await fetch(`/api/admin/guilds/${params.guild}/categories`, fetchOptions);
  const isJSON = response.headers.get("Content-Type")?.includes("json");
  const body = isJSON ? await response.json() : await response.text();
  if (!response.ok) {
    error(response.status, isJSON ? JSON.stringify(body) : body);
  } else {
    return {
      categories: body,
      channels: await (await fetch(`/api/admin/guilds/${params.guild}/data?query=channels.cache`, fetchOptions)).json()
    };
  }
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 22;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-CawwnlK2.js')).default;
const universal_id = "src/routes/settings/[guild]/panels/+page.js";
const imports = ["_app/immutable/nodes/22.82bod2c4.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/w0yj2jlX.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/BooD_1dB.js","_app/immutable/chunks/DP_MZUJz.js","_app/immutable/chunks/D6OMl6Um.js","_app/immutable/chunks/CKSmJmMa.js","_app/immutable/chunks/Do0hC5vz.js","_app/immutable/chunks/-Srq_yTr.js","_app/immutable/chunks/t68F5GHz.js","_app/immutable/chunks/pWFdQPuX.js","_app/immutable/chunks/B8fiHuBK.js","_app/immutable/chunks/r2wwZTEc.js","_app/immutable/chunks/D9CK0TUC.js","_app/immutable/chunks/Dhbirp5Y.js","_app/immutable/chunks/BlfGCrMp.js","_app/immutable/chunks/BbLmn6CC.js","_app/immutable/chunks/Ccka-6AH.js","_app/immutable/chunks/BgOtEVpo.js","_app/immutable/chunks/BK0SFyA8.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/DSwvs_u7.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/oOXq3wLi.js","_app/immutable/chunks/BeFxoXHY.js","_app/immutable/chunks/CQd6UhM_.js","_app/immutable/chunks/BLCeSZTc.js","_app/immutable/chunks/D2SRZtkk.js","_app/immutable/chunks/CGQk-Mxg.js","_app/immutable/chunks/BrJJN1Z4.js","_app/immutable/chunks/BFDVpp59.js"];
const stylesheets = ["_app/immutable/assets/22.fJvXC6Rv.css"];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=22-2vOCL_m1.js.map
