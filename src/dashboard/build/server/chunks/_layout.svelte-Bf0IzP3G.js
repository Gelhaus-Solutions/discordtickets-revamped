import { c as setContext, f as attr_class, h as clsx } from './index2-D6kyOzXX.js';
import './index-CZvAxaSW.js';
import './index-B7gr3AnY.js';
import './escaping-CqgfEcN3.js';
import './_commonjsHelpers-BFTU3MAI.js';

function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, children } = $$props;
    const { client, user, theme, locale } = data;
    setContext("client", client);
    setContext("user", user);
    setContext("theme", theme);
    setContext("locale", locale);
    $$renderer2.push(`<div${attr_class(clsx(theme))}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
  });
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-Bf0IzP3G.js.map
