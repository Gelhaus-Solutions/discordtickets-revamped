async function load({ fetch }) {
  const fetchOptions = { credentials: "include" };
  return { guilds: await (await fetch("/api/admin/guilds", fetchOptions)).json() };
}

var _page = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 16;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-DVjYHrXx.js')).default;
const universal_id = "src/routes/settings/+page.js";
const imports = ["_app/immutable/nodes/16.mk8Pihxi.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/mLgVBLBO.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/Deqeumkw.js","_app/immutable/chunks/DGU3ppqY.js","_app/immutable/chunks/DpaVjVpY.js","_app/immutable/chunks/DdrKTUDB.js","_app/immutable/chunks/CEg1HVZO.js","_app/immutable/chunks/B4_oswaU.js","_app/immutable/chunks/Bcg53WOX.js","_app/immutable/chunks/C0vmHbms.js","_app/immutable/chunks/B17Q6ahh.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=16-Dkm5Gm8W.js.map
