import { e as error } from './index-wpIsICWW.js';

async function load({ fetch, params }) {
  const response = await fetch(`/api/admin/guilds/${params.guild}/settings`);
  const isJSON = response.headers.get("Content-Type")?.includes("json");
  const body = isJSON ? await response.json() : await response.text();
  if (!response.ok) {
    error(response.status, isJSON ? JSON.stringify(body) : body);
  } else {
    return {
      settings: body,
      channels: await (await fetch(`/api/admin/guilds/${params.guild}/data?query=channels.cache`)).json(),
      locales: await (await fetch(`/api/locales`)).json(),
      roles: await (await fetch(`/api/admin/guilds/${params.guild}/data?query=roles.cache`)).json()
    };
  }
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 21;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-DMWR7Ch6.js')).default;
const universal_id = "src/routes/settings/[guild]/general/+page.js";
const imports = ["_app/immutable/nodes/21.Crl92002.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BgOtEVpo.js","_app/immutable/chunks/w0yj2jlX.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/BooD_1dB.js","_app/immutable/chunks/DP_MZUJz.js","_app/immutable/chunks/D6OMl6Um.js","_app/immutable/chunks/CKSmJmMa.js","_app/immutable/chunks/CGQk-Mxg.js","_app/immutable/chunks/Do0hC5vz.js","_app/immutable/chunks/-Srq_yTr.js","_app/immutable/chunks/t68F5GHz.js","_app/immutable/chunks/pWFdQPuX.js","_app/immutable/chunks/B8fiHuBK.js","_app/immutable/chunks/r2wwZTEc.js","_app/immutable/chunks/D9CK0TUC.js","_app/immutable/chunks/Dhbirp5Y.js","_app/immutable/chunks/BbLmn6CC.js","_app/immutable/chunks/Ccka-6AH.js","_app/immutable/chunks/BK0SFyA8.js","_app/immutable/chunks/5EBxWskT.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/D7lO7nIc.js","_app/immutable/chunks/oOXq3wLi.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/BeFxoXHY.js","_app/immutable/chunks/CQd6UhM_.js","_app/immutable/chunks/BLCeSZTc.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=21-CvWyp_E1.js.map
