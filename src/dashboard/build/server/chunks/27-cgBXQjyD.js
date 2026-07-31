import { e as error } from './index-wpIsICWW.js';

async function load({ fetch, params }) {
  const fetchOptions = { credentials: "include" };
  const [categories, channels, settings, automations] = await Promise.all([
    fetch(`/api/admin/guilds/${params.guild}/categories`, fetchOptions).then((r) => r.json()),
    fetch(`/api/admin/guilds/${params.guild}/data?query=channels.cache`, fetchOptions).then(
      (r) => r.json()
    ),
    // `/settings` carries primaryColour and footer; the guild root returns stats.
    fetch(`/api/admin/guilds/${params.guild}/settings`, fetchOptions).then(
      (r) => r.ok ? r.json() : {}
    ),
    // Only automations a button press can start — anything else would be a
    // button that does nothing, and the API rejects it on save.
    fetch(`/api/admin/guilds/${params.guild}/automations`, fetchOptions).then(
      (r) => r.ok ? r.json() : []
    )
  ]);
  const buttonAutomations = (Array.isArray(automations) ? automations : []).filter(
    (a) => a.triggerTypes?.includes("trigger.button.pressed")
  );
  if (params.panel === "new") {
    return {
      automations: buttonAutomations,
      categories,
      channels,
      panel: null,
      settings
    };
  }
  const response = await fetch(
    `/api/admin/guilds/${params.guild}/panels/${params.panel}`,
    fetchOptions
  );
  const isJSON = response.headers.get("Content-Type")?.includes("json");
  const body = isJSON ? await response.json() : await response.text();
  if (!response.ok) {
    error(response.status, isJSON ? JSON.stringify(body) : body);
  }
  return {
    automations: buttonAutomations,
    categories,
    channels,
    panel: body,
    settings
  };
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 27;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-ClnmPmty.js')).default;
const universal_id = "src/routes/settings/[guild]/panels/[panel]/+page.js";
const imports = ["_app/immutable/nodes/27.OlshOtAi.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/DXUvcUDv.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DIx5a5kv.js","_app/immutable/chunks/BEqSopPw.js","_app/immutable/chunks/m9LoM0Fs.js","_app/immutable/chunks/DJjhjc5w.js","_app/immutable/chunks/DjrTSzZO.js","_app/immutable/chunks/BYBfjtKl.js","_app/immutable/chunks/BrQvzMiV.js","_app/immutable/chunks/uUQSZ6BK.js","_app/immutable/chunks/CWmzcjye.js","_app/immutable/chunks/DkEWTxrr.js","_app/immutable/chunks/B7QG9Zh1.js","_app/immutable/chunks/oER7Dh_v.js","_app/immutable/chunks/DQ8rtQl1.js","_app/immutable/chunks/DNXSlFYn.js","_app/immutable/chunks/Dln3yJkF.js","_app/immutable/chunks/uAL33ikp.js","_app/immutable/chunks/69_IOA4Y.js","_app/immutable/chunks/DC57nLQ5.js","_app/immutable/chunks/BmP4pMmO.js","_app/immutable/chunks/CpZM6PbW.js","_app/immutable/chunks/B9IUuZVk.js","_app/immutable/chunks/CEYzwpi2.js","_app/immutable/chunks/CIDipo3b.js","_app/immutable/chunks/DZWSnNZ5.js","_app/immutable/chunks/CFtkVArN.js","_app/immutable/chunks/Cpj98o6Y.js","_app/immutable/chunks/C4g5Gih9.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=27-cgBXQjyD.js.map
