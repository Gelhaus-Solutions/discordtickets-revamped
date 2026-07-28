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
const imports = ["_app/immutable/nodes/17.B4d-AfBa.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/Bcg53WOX.js","_app/immutable/chunks/mLgVBLBO.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/Deqeumkw.js","_app/immutable/chunks/DGU3ppqY.js","_app/immutable/chunks/DpaVjVpY.js","_app/immutable/chunks/DdrKTUDB.js","_app/immutable/chunks/BkC7o0Te.js","_app/immutable/chunks/CEg1HVZO.js","_app/immutable/chunks/CDUkP6Q1.js","_app/immutable/chunks/9vMhiHWs.js","_app/immutable/chunks/BV_ssYUv.js","_app/immutable/chunks/C-oaICqf.js","_app/immutable/chunks/C0vmHbms.js","_app/immutable/chunks/vf1gAsXo.js","_app/immutable/chunks/Cuao9ud2.js","_app/immutable/chunks/DNREuzDQ.js","_app/immutable/chunks/B4_oswaU.js","_app/immutable/chunks/Durl6y2z.js","_app/immutable/chunks/DTLSGLfB.js","_app/immutable/chunks/DjffNsZu.js","_app/immutable/chunks/CuqbR5yU.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/5sIGbp09.js","_app/immutable/chunks/69_IOA4Y.js"];
const stylesheets = ["_app/immutable/assets/Spinner.Dhwq8sds.css"];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=17-H11MRU7S.js.map
