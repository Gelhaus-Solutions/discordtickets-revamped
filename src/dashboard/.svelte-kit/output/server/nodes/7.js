import * as universal from '../entries/pages/settings/_guild_/_layout.js';

export const index = 7;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/settings/_guild_/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/settings/[guild]/+layout.js";
export const imports = ["_app/immutable/nodes/7.D3HhAqpG.js","_app/immutable/chunks/Cxx9n8vM.js","_app/immutable/chunks/CYgJF_JY.js","_app/immutable/chunks/B17Q6ahh.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/CWXCXDbJ.js","_app/immutable/chunks/DIeogL5L.js","_app/immutable/chunks/BTVB6o0Y.js","_app/immutable/chunks/CR2HCHDG.js","_app/immutable/chunks/DU73alKZ.js"];
export const stylesheets = [];
export const fonts = [];
