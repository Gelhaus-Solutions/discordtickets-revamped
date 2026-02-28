import { r as redirect, e as error } from './index-BcOZ6EV9.js';
import './utils-FiC4zhrQ.js';

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
const component = async () => component_cache ??= (await import('./_page@settings.svelte-uUOp5t1C.js')).default;
const universal_id = "src/routes/settings/[guild]/+page.js";
const imports = ["_app/immutable/nodes/17.Bc6s5mjy.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/nwo5WiIq.js","_app/immutable/chunks/_fu6EM7d.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DbFbsu9R.js","_app/immutable/chunks/BkvMZOlF.js","_app/immutable/chunks/Caq5s-y_.js","_app/immutable/chunks/CdfWQzPM.js","_app/immutable/chunks/BUjxqbhU.js","_app/immutable/chunks/BZKIRd09.js","_app/immutable/chunks/B_DfNNzh.js","_app/immutable/chunks/CG3JaKlL.js","_app/immutable/chunks/B-HGQZHm.js","_app/immutable/chunks/BMnviba6.js","_app/immutable/chunks/BALO3cCj.js","_app/immutable/chunks/CzA9-LZ0.js","_app/immutable/chunks/B4e910Rm.js","_app/immutable/chunks/B1XTWJtk.js","_app/immutable/chunks/ChD_GQq7.js","_app/immutable/chunks/hFXt_2hJ.js","_app/immutable/chunks/BMZ6xVa9.js","_app/immutable/chunks/D7lO7nIc.js","_app/immutable/chunks/BHIk14_I.js","_app/immutable/chunks/DD97wVFk.js","_app/immutable/chunks/ByBQdF1a.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/W-KJuYg7.js","_app/immutable/chunks/69_IOA4Y.js"];
const stylesheets = ["_app/immutable/assets/Spinner.Dhwq8sds.css"];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=17-BE6jetg6.js.map
