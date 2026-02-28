import * as universal from '../entries/pages/settings/_page.js';

export const index = 16;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/settings/_page.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/settings/+page.js";
export const imports = ["_app/immutable/nodes/16.DaNsMzOa.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/w0yj2jlX.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/BooD_1dB.js","_app/immutable/chunks/DP_MZUJz.js","_app/immutable/chunks/D6OMl6Um.js","_app/immutable/chunks/CKSmJmMa.js","_app/immutable/chunks/Do0hC5vz.js","_app/immutable/chunks/-Srq_yTr.js","_app/immutable/chunks/t68F5GHz.js","_app/immutable/chunks/BK0SFyA8.js","_app/immutable/chunks/BgOtEVpo.js","_app/immutable/chunks/Dhbirp5Y.js","_app/immutable/chunks/B17Q6ahh.js"];
export const stylesheets = [];
export const fonts = [];
