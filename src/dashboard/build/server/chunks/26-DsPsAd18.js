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

const index = 26;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-BamsHbgi.js')).default;
const universal_id = "src/routes/settings/[guild]/transcripts/+page.js";
const imports = ["_app/immutable/nodes/26.Bl58F2dX.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BP9m31RR.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DU67LJ2q.js","_app/immutable/chunks/DiLIn2sP.js","_app/immutable/chunks/DutcwCkN.js","_app/immutable/chunks/DgjFhv82.js","_app/immutable/chunks/BF80Z7Uk.js","_app/immutable/chunks/BSBiBUc2.js","_app/immutable/chunks/By5s1nM2.js","_app/immutable/chunks/BM7kgzkz.js","_app/immutable/chunks/BrVZ75iX.js","_app/immutable/chunks/YC17g77b.js","_app/immutable/chunks/nDzxlPLT.js","_app/immutable/chunks/CHf6lzKQ.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/Cl0TUqvD.js","_app/immutable/chunks/B17Q6ahh.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=26-DsPsAd18.js.map
