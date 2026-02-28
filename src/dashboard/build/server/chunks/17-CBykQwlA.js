import { r as redirect, e as error } from './index-wpIsICWW.js';

async function load({ fetch, params, url }) {
  const fetchOptions = { credentials: "include" };
  const response = await fetch(`/api/admin/guilds/${params.guild}`, fetchOptions);
  const isJSON = response.headers.get("Content-Type")?.includes("json");
  const body = isJSON ? await response.json() : await response.text();
  if (response.status === 401 && body.elevate) {
    redirect(307, `/auth/login?r=${encodeURIComponent(url.pathname + url.search)}&role=${body.elevate}`);
  } else if (!response.ok) {
    error(response.status, isJSON ? JSON.stringify(body) : body);
  } else {
    return {
      guild: body,
      problems: await (await fetch(`/api/admin/guilds/${params.guild}/problems`, fetchOptions)).json()
    };
  }
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 17;
let component_cache;
const component = async () => component_cache ??= (await import('./_page@settings.svelte-FNXstu6n.js')).default;
const universal_id = "src/routes/settings/[guild]/+page.js";
const imports = ["_app/immutable/nodes/17.yq9A7xjg.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BgOtEVpo.js","_app/immutable/chunks/w0yj2jlX.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/BooD_1dB.js","_app/immutable/chunks/DP_MZUJz.js","_app/immutable/chunks/D6OMl6Um.js","_app/immutable/chunks/CKSmJmMa.js","_app/immutable/chunks/DBfb9ksp.js","_app/immutable/chunks/Do0hC5vz.js","_app/immutable/chunks/-Srq_yTr.js","_app/immutable/chunks/t68F5GHz.js","_app/immutable/chunks/DEPaeXhG.js","_app/immutable/chunks/BsdD4XgB.js","_app/immutable/chunks/BeFxoXHY.js","_app/immutable/chunks/D9CK0TUC.js","_app/immutable/chunks/Dhbirp5Y.js","_app/immutable/chunks/CGQk-Mxg.js","_app/immutable/chunks/BbLmn6CC.js","_app/immutable/chunks/Ccka-6AH.js","_app/immutable/chunks/BK0SFyA8.js","_app/immutable/chunks/D7lO7nIc.js","_app/immutable/chunks/BLCeSZTc.js","_app/immutable/chunks/B8fiHuBK.js","_app/immutable/chunks/BrJJN1Z4.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/Bp7MuV1J.js","_app/immutable/chunks/69_IOA4Y.js"];
const stylesheets = ["_app/immutable/assets/Spinner.Dhwq8sds.css"];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=17-CBykQwlA.js.map
