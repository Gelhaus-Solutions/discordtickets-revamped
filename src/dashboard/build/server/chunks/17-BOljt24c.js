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
const component = async () => component_cache ??= (await import('./_page@settings.svelte-DxvtH4BC.js')).default;
const universal_id = "src/routes/settings/[guild]/+page.js";
const imports = ["_app/immutable/nodes/17.DExnpbgn.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CHf6lzKQ.js","_app/immutable/chunks/BP9m31RR.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DU67LJ2q.js","_app/immutable/chunks/DiLIn2sP.js","_app/immutable/chunks/DutcwCkN.js","_app/immutable/chunks/DgjFhv82.js","_app/immutable/chunks/-ATjx--3.js","_app/immutable/chunks/BF80Z7Uk.js","_app/immutable/chunks/DD8OrDcP.js","_app/immutable/chunks/Ea2ubrQi.js","_app/immutable/chunks/D33agL7i.js","_app/immutable/chunks/BM7kgzkz.js","_app/immutable/chunks/BrVZ75iX.js","_app/immutable/chunks/Di13zlrF.js","_app/immutable/chunks/DDx0LxoA.js","_app/immutable/chunks/oqEqrbEC.js","_app/immutable/chunks/DULtF6vX.js","_app/immutable/chunks/BufDZPIL.js","_app/immutable/chunks/Rf5LdWmi.js","_app/immutable/chunks/BSBiBUc2.js","_app/immutable/chunks/B9JY1_cP.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/AjyQmA-5.js","_app/immutable/chunks/69_IOA4Y.js"];
const stylesheets = ["_app/immutable/assets/Spinner.Dhwq8sds.css"];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=17-BOljt24c.js.map
