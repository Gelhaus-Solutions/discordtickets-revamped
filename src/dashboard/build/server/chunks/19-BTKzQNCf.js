import { e as error } from './index-BcOZ6EV9.js';
import './utils-FiC4zhrQ.js';

async function load({ fetch, params }) {
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
const component = async () => component_cache ??= (await import('./_page.svelte-DTh2tUR_.js')).default;
const universal_id = "src/routes/settings/[guild]/categories/[category]/+page.js";
const imports = ["_app/immutable/nodes/19.CodNpeYE.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Dp1pzeXC.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/nwo5WiIq.js","_app/immutable/chunks/_fu6EM7d.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DbFbsu9R.js","_app/immutable/chunks/BkvMZOlF.js","_app/immutable/chunks/Caq5s-y_.js","_app/immutable/chunks/CdfWQzPM.js","_app/immutable/chunks/BHIk14_I.js","_app/immutable/chunks/BZKIRd09.js","_app/immutable/chunks/B_DfNNzh.js","_app/immutable/chunks/CG3JaKlL.js","_app/immutable/chunks/CSeQqRbU.js","_app/immutable/chunks/DD97wVFk.js","_app/immutable/chunks/r2wwZTEc.js","_app/immutable/chunks/BSe2IdtJ.js","_app/immutable/chunks/5EBxWskT.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/DSwvs_u7.js","_app/immutable/chunks/B0NBGGFk.js","_app/immutable/chunks/BALO3cCj.js","_app/immutable/chunks/CzA9-LZ0.js","_app/immutable/chunks/B4e910Rm.js","_app/immutable/chunks/ByBQdF1a.js","_app/immutable/chunks/ChD_GQq7.js","_app/immutable/chunks/hFXt_2hJ.js","_app/immutable/chunks/BMZ6xVa9.js","_app/immutable/chunks/DZ1Z5aX_.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/B-HGQZHm.js","_app/immutable/chunks/BUjxqbhU.js","_app/immutable/chunks/BMnviba6.js","_app/immutable/chunks/DJA2_7p-.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=19-BTKzQNCf.js.map
