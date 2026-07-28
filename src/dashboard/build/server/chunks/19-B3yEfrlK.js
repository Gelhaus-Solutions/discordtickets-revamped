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
const component = async () => component_cache ??= (await import('./_page.svelte-Bv_13Rgr.js')).default;
const universal_id = "src/routes/settings/[guild]/categories/[category]/+page.js";
const imports = ["_app/immutable/nodes/19.CIPenVJz.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CHf6lzKQ.js","_app/immutable/chunks/BP9m31RR.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DU67LJ2q.js","_app/immutable/chunks/DiLIn2sP.js","_app/immutable/chunks/DutcwCkN.js","_app/immutable/chunks/DgjFhv82.js","_app/immutable/chunks/BufDZPIL.js","_app/immutable/chunks/BF80Z7Uk.js","_app/immutable/chunks/Rf5LdWmi.js","_app/immutable/chunks/CWgo5oyw.js","_app/immutable/chunks/BVPTV-ap.js","_app/immutable/chunks/BSBiBUc2.js","_app/immutable/chunks/By5s1nM2.js","_app/immutable/chunks/CWmzcjye.js","_app/immutable/chunks/sg6CFjGt.js","_app/immutable/chunks/5EBxWskT.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/BhQh7H-k.js","_app/immutable/chunks/VgIumAZI.js","_app/immutable/chunks/B9JY1_cP.js","_app/immutable/chunks/D33agL7i.js","_app/immutable/chunks/BM7kgzkz.js","_app/immutable/chunks/BrVZ75iX.js","_app/immutable/chunks/DDx0LxoA.js","_app/immutable/chunks/oqEqrbEC.js","_app/immutable/chunks/DULtF6vX.js","_app/immutable/chunks/Bx6_9jBx.js","_app/immutable/chunks/Ea2ubrQi.js","_app/immutable/chunks/BjjX7O55.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/C1wWb913.js","_app/immutable/chunks/DB3rCr-e.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=19-B3yEfrlK.js.map
