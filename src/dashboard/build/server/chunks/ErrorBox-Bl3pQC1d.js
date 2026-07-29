import { af as attr_class } from './index2-B7lo9Ma0.js';
import { T as Tree_1, f as flatten } from './data-LIyun-gF.js';

function ErrorBox($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { error = {}, boxStyles = "bg-red-400/40 dark:bg-red-500/20" } = $$props;
    console.error(error);
    $$renderer2.push(`<div id="error" class="mx-auto my-8 max-w-xl overflow-x-auto break-words"><div${attr_class(`${boxStyles} flex flex-col gap-4 rounded-lg px-6 py-4 text-sm`)}><p class="my-2 text-center text-xl font-bold text-black dark:text-white">Sorry, something went wrong.</p> <div><p class="font-mono text-sm"><span class="font-bold text-black dark:text-white">Error</span></p> `);
    Tree_1($$renderer2, { entry: flatten(error) });
    $$renderer2.push(`<!----></div></div></div>`);
  });
}

export { ErrorBox as E };
//# sourceMappingURL=ErrorBox-Bl3pQC1d.js.map
