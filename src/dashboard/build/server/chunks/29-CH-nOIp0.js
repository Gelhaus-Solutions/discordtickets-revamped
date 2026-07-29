async function load({ fetch, params }) {
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

const index = 29;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-DXmb8X9e.js')).default;
const universal_id = "src/routes/settings/[guild]/transcripts/+page.js";
const imports = ["_app/immutable/nodes/29.5DaBQe5u.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/DXUvcUDv.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DIx5a5kv.js","_app/immutable/chunks/BEqSopPw.js","_app/immutable/chunks/m9LoM0Fs.js","_app/immutable/chunks/DJjhjc5w.js","_app/immutable/chunks/DjrTSzZO.js","_app/immutable/chunks/BYBfjtKl.js","_app/immutable/chunks/BrQvzMiV.js","_app/immutable/chunks/uUQSZ6BK.js","_app/immutable/chunks/DkEWTxrr.js","_app/immutable/chunks/B7QG9Zh1.js","_app/immutable/chunks/DLhPBRaW.js","_app/immutable/chunks/COfbegZV.js","_app/immutable/chunks/DNXSlFYn.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/BUuB4WrH.js","_app/immutable/chunks/B17Q6ahh.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=29-CH-nOIp0.js.map
