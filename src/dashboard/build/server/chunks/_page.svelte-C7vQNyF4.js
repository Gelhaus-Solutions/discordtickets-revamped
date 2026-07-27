import { ao as attr, am as stringify } from './index2-BjPIasya.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';
import './root-BZvlTPwp.js';
import './exports-7ECo9oy7.js';
import './state.svelte-B7ni-XI1.js';
import './marked.esm-DcwJ8j7Z.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const NICK_MAX_LENGTH = 32;
    const BIO_MAX_LENGTH = 190;
    const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/gif,image/webp";
    const fromData = () => ({
      botAvatar: data?.botAvatar || "",
      botBanner: data?.botBanner || "",
      botBio: data?.botBio || "",
      botUsername: data?.botUsername || ""
    });
    fromData();
    let customization = fromData();
    $$renderer2.push(`<h1 class="m-4 text-center text-4xl font-bold">Bot Customization</h1> <div class="m-2 mx-auto max-w-lg p-4 text-lg">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="mb-8 text-center text-blue-600 dark:text-blue-400"><p class="font-semibold"><i class="fa-solid fa-info-circle"></i> Per-Server Settings</p> <p>Customize the bot's appearance for this server. These settings will override the bot's default
			appearance when it interacts in this server.</p></div> <form><div class="my-4 grid grid-cols-1 gap-8"><div><label for="botAvatarInput" class="font-medium">Bot Avatar <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Upload a custom avatar for the bot in this server (PNG, JPG, GIF or WebP, max 2MB)"></i></label> <div class="mt-2 flex flex-col items-center gap-4">`);
    if (customization.botAvatar) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<img${attr("src", customization.botAvatar)} alt="Bot Avatar" class="h-32 w-32 rounded-full border-2 border-blurple"/> <button type="button" class="rounded-lg bg-red-300 p-2 px-4 font-medium transition duration-300 hover:bg-red-500 hover:text-white dark:bg-red-500/50 dark:hover:bg-red-500 dark:hover:text-white"><i class="fa-solid fa-trash"></i> Remove Avatar</button>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 dark:border-slate-600 dark:bg-slate-800"><i class="fa-solid fa-image text-4xl text-gray-300 dark:text-slate-600"></i></div>`);
    }
    $$renderer2.push(`<!--]--> <input id="botAvatarInput" type="file"${attr("accept", ACCEPTED_IMAGE_TYPES)} class="max-w-xs"/></div></div> <div><label for="botBannerInput" class="font-medium">Bot Banner <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Upload a custom banner for the bot in this server (PNG, JPG, GIF or WebP, max 2MB)"></i></label> <div class="mt-2 flex flex-col items-center gap-4">`);
    if (customization.botBanner) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<img${attr("src", customization.botBanner)} alt="Bot Banner" class="h-32 w-full rounded-lg border-2 border-blurple object-cover"/> <button type="button" class="rounded-lg bg-red-300 p-2 px-4 font-medium transition duration-300 hover:bg-red-500 hover:text-white dark:bg-red-500/50 dark:hover:bg-red-500 dark:hover:text-white"><i class="fa-solid fa-trash"></i> Remove Banner</button>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 dark:border-slate-600 dark:bg-slate-800"><i class="fa-solid fa-panorama text-4xl text-gray-300 dark:text-slate-600"></i></div>`);
    }
    $$renderer2.push(`<!--]--> <input id="botBannerInput" type="file"${attr("accept", ACCEPTED_IMAGE_TYPES)} class="max-w-xs"/></div></div> <div><label for="botUsernameInput" class="font-medium">Bot Nickname <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"${attr("title", `Custom nickname for the bot in this server (max ${stringify(NICK_MAX_LENGTH)} characters)`)}></i></label> <input id="botUsernameInput" type="text" class="input form-input mt-2" placeholder="Leave blank to use default"${attr("maxlength", NICK_MAX_LENGTH)}${attr("value", customization.botUsername)}/> <p class="mt-1 text-sm text-gray-500 dark:text-slate-400">${escape_html(customization.botUsername?.length || 0)}/32</p></div> <div><label for="botBioInput" class="font-medium">Bot Description <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"${attr("title", `Custom description or bio for the bot in this server (max ${stringify(BIO_MAX_LENGTH)} characters)`)}></i></label> <textarea id="botBioInput" class="input form-textarea mt-2" placeholder="Leave blank to use default description" rows="4"${attr("maxlength", BIO_MAX_LENGTH)}>`);
    const $$body = escape_html(customization.botBio);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(`</textarea> <p class="mt-1 text-sm text-gray-500 dark:text-slate-400">${escape_html(customization.botBio?.length || 0)}/190</p></div></div> <div class="mt-8 flex gap-4"><button type="submit"${attr("disabled", true, true)} class="flex-1 rounded-lg bg-green-300 p-2 px-5 font-medium transition duration-300 hover:bg-green-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500/50 dark:hover:bg-green-500 dark:hover:text-white">`);
    {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<i class="fa-solid fa-save"></i>`);
    }
    $$renderer2.push(`<!--]--> Save Changes</button> <a href="./general" class="flex items-center justify-center rounded-lg bg-gray-300 p-2 px-5 font-medium transition duration-300 hover:bg-gray-500 hover:text-white dark:bg-slate-600 dark:hover:bg-slate-500"><i class="fa-solid fa-arrow-left"></i> Back</a></div></form></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-C7vQNyF4.js.map
