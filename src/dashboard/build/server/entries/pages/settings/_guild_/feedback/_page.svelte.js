import { d as attr, b as store_get, u as unsubscribe_stores } from "../../../../../chunks/index2.js";
import { b as base } from "../../../../../chunks/server.js";
import "../../../../../chunks/url.js";
import "@sveltejs/kit/internal/server";
import "../../../../../chunks/root.js";
import { p as page } from "../../../../../chunks/stores.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    $$renderer2.push(`<h1 class="m-4 text-center text-4xl font-bold">Feedback</h1> <div class="mx-auto my-8 max-w-lg text-center"><div class="my-8"><img${attr("src", `${base}/assets/undraw_reviews.svg`)} alt="Reviews illustration" width="70%" height="auto" class="mx-auto"/></div> <div class="my-8 text-lg font-semibold"><a${attr("href", `${base}/${store_get($$store_subs ??= {}, "$page", page).params.guild}/feedback`)} class="transition duration-300 hover:text-blurple">View feedback in the portal <i class="fa-solid fa-arrow-right-long"></i></a></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _page as default
};
