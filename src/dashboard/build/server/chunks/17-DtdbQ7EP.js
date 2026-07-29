import { r as redirect, e as error } from './index-wpIsICWW.js';

async function load({
  fetch,
  params,
  url
}) {
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
const component = async () => component_cache ??= (await import('./_page@settings.svelte-rgD0uka1.js')).default;
const universal_id = "src/routes/settings/[guild]/+page.js";
const imports = ["_app/immutable/nodes/17.B7HApDaf.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/DNXSlFYn.js","_app/immutable/chunks/DXUvcUDv.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DIx5a5kv.js","_app/immutable/chunks/BEqSopPw.js","_app/immutable/chunks/m9LoM0Fs.js","_app/immutable/chunks/DJjhjc5w.js","_app/immutable/chunks/D_3LDXL8.js","_app/immutable/chunks/DjrTSzZO.js","_app/immutable/chunks/BYBfjtKl.js","_app/immutable/chunks/BrQvzMiV.js","_app/immutable/chunks/B3L5ZVYx.js","_app/immutable/chunks/D1LahZIy.js","_app/immutable/chunks/BmP4pMmO.js","_app/immutable/chunks/DkEWTxrr.js","_app/immutable/chunks/B7QG9Zh1.js","_app/immutable/chunks/DG23Wkn6.js","_app/immutable/chunks/CLHVse_Z.js","_app/immutable/chunks/BarUeDzD.js","_app/immutable/chunks/Bv5iHoat.js","_app/immutable/chunks/B9IUuZVk.js","_app/immutable/chunks/uUQSZ6BK.js","_app/immutable/chunks/CIDipo3b.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/D2w3dHbI.js","_app/immutable/chunks/69_IOA4Y.js"];
const stylesheets = ["_app/immutable/assets/Spinner.Dhwq8sds.css"];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=17-DtdbQ7EP.js.map
