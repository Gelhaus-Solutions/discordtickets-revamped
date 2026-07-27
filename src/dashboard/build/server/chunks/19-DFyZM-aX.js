import { e as error } from './index-wpIsICWW.js';

async function load({
  fetch,
  params
}) {
  const fetchOptions = { credentials: "include" };
  let body;
  if (params.category === "new") {
    body = {
      channelName: "",
      claiming: false,
      description: "",
      discordCategory: "new",
      enableFeedback: false,
      emoji: "",
      image: "",
      memberLimit: 1,
      name: "",
      openingMessage: "",
      pingRoles: [],
      questions: [],
      ratelimit: null,
      requiredRoles: [],
      requireTopic: false,
      staffRoles: [],
      totalLimit: 50,
      channelMode: "CHANNEL",
      backupCategoryId: null
    };
  } else {
    const response = await fetch(
      `/api/admin/guilds/${params.guild}/categories/${params.category}`,
      fetchOptions
    );
    const isJSON = response.headers.get("Content-Type")?.includes("json");
    body = isJSON ? await response.json() : await response.text();
    if (!response.ok) {
      error(response.status, isJSON ? JSON.stringify(body) : body);
    }
  }
  let url = `/api/admin/guilds/${params.guild}/categories`;
  if (params.category !== "new") url += `/${params.category}`;
  return {
    url,
    category: body,
    channels: await (await fetch(`/api/admin/guilds/${params.guild}/data?query=channels.cache`, fetchOptions)).json(),
    roles: await (await fetch(`/api/admin/guilds/${params.guild}/data?query=roles.cache`, fetchOptions)).json(),
    categories: await (await fetch(`/api/admin/guilds/${params.guild}/categories`, fetchOptions)).json(),
    settings: await (await fetch(`/api/admin/guilds/${params.guild}/settings`, fetchOptions)).json()
  };
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 19;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BP3-_Iby.js')).default;
const universal_id = "src/routes/settings/[guild]/categories/[category]/+page.js";
const imports = ["_app/immutable/nodes/19.D1Q274vL.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/Bcg53WOX.js","_app/immutable/chunks/mLgVBLBO.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/Deqeumkw.js","_app/immutable/chunks/DGU3ppqY.js","_app/immutable/chunks/DpaVjVpY.js","_app/immutable/chunks/DdrKTUDB.js","_app/immutable/chunks/Durl6y2z.js","_app/immutable/chunks/CEg1HVZO.js","_app/immutable/chunks/DTLSGLfB.js","_app/immutable/chunks/BWZqID2X.js","_app/immutable/chunks/COXAts_t.js","_app/immutable/chunks/DjffNsZu.js","_app/immutable/chunks/HlL_WWD4.js","_app/immutable/chunks/CWmzcjye.js","_app/immutable/chunks/CgJC5Yow.js","_app/immutable/chunks/5EBxWskT.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/DSwvs_u7.js","_app/immutable/chunks/B5UnL3w_.js","_app/immutable/chunks/BV_ssYUv.js","_app/immutable/chunks/C-oaICqf.js","_app/immutable/chunks/C0vmHbms.js","_app/immutable/chunks/CuqbR5yU.js","_app/immutable/chunks/BzV5izST.js","_app/immutable/chunks/CWDIjas3.js","_app/immutable/chunks/CmF3Rx4_.js","_app/immutable/chunks/tqEZc0fb.js","_app/immutable/chunks/CeCm6xE7.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/CDUkP6Q1.js","_app/immutable/chunks/BkC7o0Te.js","_app/immutable/chunks/9vMhiHWs.js","_app/immutable/chunks/BcEfFbAF.js","_app/immutable/chunks/BkPoVagP.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=19-DFyZM-aX.js.map
