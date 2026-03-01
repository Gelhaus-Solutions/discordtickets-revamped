import { e as error } from './index-BcOZ6EV9.js';
import './utils-FiC4zhrQ.js';

async function load({ fetch, params }) {
  const response = await fetch(`/api/admin/guilds/${params.guild}/customization`);
  const isJSON = response.headers.get("Content-Type")?.includes("json");
  const body = isJSON ? await response.json() : await response.text();
  if (!response.ok) {
    error(response.status, isJSON ? JSON.stringify(body) : body);
  } else {
    return body || {};
  }
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 20;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-EJWJNLF9.js')).default;
const universal_id = "src/routes/settings/[guild]/customization/+page.js";
const imports = ["_app/immutable/nodes/20.CEUweGG-.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BAc9Nw6w.js","_app/immutable/chunks/CWXCXDbJ.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/BTVB6o0Y.js","_app/immutable/chunks/BnKh12PZ.js","_app/immutable/chunks/DU73alKZ.js","_app/immutable/chunks/DNgBoiT1.js","_app/immutable/chunks/C9yEqpEA.js","_app/immutable/chunks/CUQ3wp6X.js","_app/immutable/chunks/C43HmXkP.js","_app/immutable/chunks/r2wwZTEc.js","_app/immutable/chunks/DeGpVRd_.js","_app/immutable/chunks/J_wX4PLQ.js","_app/immutable/chunks/CjzHswfe.js","_app/immutable/chunks/C1PfqNCt.js","_app/immutable/chunks/BR6RR1uv.js","_app/immutable/chunks/CZwjNc88.js","_app/immutable/chunks/D8EB0mrL.js","_app/immutable/chunks/DG6z6l1p.js","_app/immutable/chunks/DuqOsHh6.js","_app/immutable/chunks/CSnVTN25.js"];
const stylesheets = ["_app/immutable/assets/20.DpflOhB8.css"];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=20-Bqcq9QBy.js.map
