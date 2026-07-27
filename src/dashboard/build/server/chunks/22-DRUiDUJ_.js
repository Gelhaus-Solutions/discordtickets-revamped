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
const component = async () => component_cache ??= (await import('./_page.svelte-BG0lNZQn.js')).default;
const universal_id = "src/routes/settings/[guild]/general/+page.js";
const imports = ["_app/immutable/nodes/22.DD2y1pDa.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/Bcg53WOX.js","_app/immutable/chunks/mLgVBLBO.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/Deqeumkw.js","_app/immutable/chunks/DGU3ppqY.js","_app/immutable/chunks/DpaVjVpY.js","_app/immutable/chunks/DdrKTUDB.js","_app/immutable/chunks/vf1gAsXo.js","_app/immutable/chunks/CEg1HVZO.js","_app/immutable/chunks/DTLSGLfB.js","_app/immutable/chunks/BWZqID2X.js","_app/immutable/chunks/COXAts_t.js","_app/immutable/chunks/DjffNsZu.js","_app/immutable/chunks/HlL_WWD4.js","_app/immutable/chunks/CWmzcjye.js","_app/immutable/chunks/C-oaICqf.js","_app/immutable/chunks/C0vmHbms.js","_app/immutable/chunks/BzV5izST.js","_app/immutable/chunks/CWDIjas3.js","_app/immutable/chunks/CmF3Rx4_.js","_app/immutable/chunks/5EBxWskT.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/CeCm6xE7.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/BkPoVagP.js","_app/immutable/chunks/BV_ssYUv.js","_app/immutable/chunks/B5UnL3w_.js","_app/immutable/chunks/Durl6y2z.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=22-DRUiDUJ_.js.map
