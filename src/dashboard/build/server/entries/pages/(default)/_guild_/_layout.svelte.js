import { h as head, d as attr } from "../../../../chunks/index2.js";
function _layout($$renderer, $$props) {
  let { data, children } = $$props;
  const { guild } = data;
  head("oq2bo2", $$renderer, ($$renderer2) => {
    $$renderer2.push(`<link rel="icon"${attr("href", `${guild.logo}`)}/>`);
  });
  $$renderer.push(`<div>`);
  children?.($$renderer);
  $$renderer.push(`<!----></div>`);
}
export {
  _layout as default
};
