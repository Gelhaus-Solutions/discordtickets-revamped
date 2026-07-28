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
const imports = ["_app/immutable/nodes/26.BLUFG7cz.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/mLgVBLBO.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/Deqeumkw.js","_app/immutable/chunks/DGU3ppqY.js","_app/immutable/chunks/DpaVjVpY.js","_app/immutable/chunks/DdrKTUDB.js","_app/immutable/chunks/CEg1HVZO.js","_app/immutable/chunks/DjffNsZu.js","_app/immutable/chunks/HlL_WWD4.js","_app/immutable/chunks/C-oaICqf.js","_app/immutable/chunks/C0vmHbms.js","_app/immutable/chunks/Cuao9ud2.js","_app/immutable/chunks/DNREuzDQ.js","_app/immutable/chunks/Bcg53WOX.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B4_oswaU.js","_app/immutable/chunks/B17Q6ahh.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=26-BE73qtAy.js.map
