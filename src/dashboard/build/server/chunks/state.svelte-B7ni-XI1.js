import { af as noop } from './index2-BjPIasya.js';
import './root-BZvlTPwp.js';

const is_legacy = noop.toString().includes("$$") || /function \w+\(\) \{\}/.test(noop.toString());
if (is_legacy) {
  ({
    url: new URL("https://example.com")
  });
}
//# sourceMappingURL=state.svelte-B7ni-XI1.js.map
