async function load({
  fetch,
  params
}) {
  try {
    return {
      transcripts: [],
      totalTranscripts: 0,
      searched: false
    };
  } catch (err) {
    console.error("Failed to load transcripts:", err);
    return {
      transcripts: [],
      totalTranscripts: 0,
      searched: false
    };
  }
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 25;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BV3iUR6u.js')).default;
const universal_id = "src/routes/settings/[guild]/transcripts/+page.js";
const imports = ["_app/immutable/nodes/25.DQkO5SAd.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CWXCXDbJ.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/BTVB6o0Y.js","_app/immutable/chunks/BnKh12PZ.js","_app/immutable/chunks/DU73alKZ.js","_app/immutable/chunks/DuqOsHh6.js","_app/immutable/chunks/DNgBoiT1.js","_app/immutable/chunks/C9yEqpEA.js","_app/immutable/chunks/CUQ3wp6X.js","_app/immutable/chunks/C43HmXkP.js","_app/immutable/chunks/DeGpVRd_.js","_app/immutable/chunks/J_wX4PLQ.js","_app/immutable/chunks/BB3l6-Ux.js","_app/immutable/chunks/Bmpa36zG.js","_app/immutable/chunks/BAc9Nw6w.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B-9ZgKd7.js","_app/immutable/chunks/B17Q6ahh.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=25-BzG8-2Vn.js.map
