import * as universal from '../entries/pages/settings/_page.js';

export const index = 16;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/settings/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/settings/+page.js";
export const imports = ["_app/immutable/nodes/16.CXZ-Og1I.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CWXCXDbJ.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/BTVB6o0Y.js","_app/immutable/chunks/BnKh12PZ.js","_app/immutable/chunks/DU73alKZ.js","_app/immutable/chunks/DuqOsHh6.js","_app/immutable/chunks/DNgBoiT1.js","_app/immutable/chunks/C9yEqpEA.js","_app/immutable/chunks/CUQ3wp6X.js","_app/immutable/chunks/Bt5PpDoa.js","_app/immutable/chunks/BAc9Nw6w.js","_app/immutable/chunks/J_wX4PLQ.js","_app/immutable/chunks/B17Q6ahh.js"];
export const stylesheets = [];
export const fonts = [];
