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
const imports = ["_app/immutable/nodes/16.DwE0Z8b5.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/BP9m31RR.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/DU67LJ2q.js","_app/immutable/chunks/DiLIn2sP.js","_app/immutable/chunks/DutcwCkN.js","_app/immutable/chunks/DgjFhv82.js","_app/immutable/chunks/BF80Z7Uk.js","_app/immutable/chunks/Cl0TUqvD.js","_app/immutable/chunks/CHf6lzKQ.js","_app/immutable/chunks/BrVZ75iX.js","_app/immutable/chunks/B17Q6ahh.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page as universal, universal_id };
//# sourceMappingURL=16-C-9tBDOQ.js.map
