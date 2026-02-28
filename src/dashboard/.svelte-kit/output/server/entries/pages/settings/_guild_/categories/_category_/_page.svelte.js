import { d as attr, m as bind_props, f as ensure_array_like, a as attr_class, l as stringify, g as getContext } from "../../../../../../chunks/index2.js";
import { a as run } from "../../../../../../chunks/root.js";
import ms from "ms";
import emoji from "emoji-name-map";
import { marked } from "marked";
import { e as escape_html } from "../../../../../../chunks/escaping.js";
import "@sveltejs/kit/internal";
import "../../../../../../chunks/url.js";
import "../../../../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../../../../chunks/exports.js";
import "../../../../../../chunks/state.svelte.js";
import "sortablejs";
import { R as Required } from "../../../../../../chunks/Required.js";
import { q as questionsState } from "../../../../../../chunks/state.svelte2.js";
import { h as html } from "../../../../../../chunks/html.js";
function TextQuestion($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { question = void 0 } = $$props;
    $$renderer2.push(`<div><label class="font-medium">Label `);
    Required($$renderer2);
    $$renderer2.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The title of the question"></i> <input type="text" class="input form-input text-sm" required="" maxlength="45"${attr("value", question.label)}/></label></div> <div><label class="font-medium">Maximum length <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The maximum input length"></i> <input type="number" class="input form-input text-sm" required="" min="1" max="1000"${attr("value", question.maxLength)}/></label></div> <div><label class="font-medium">Minimum length <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The minimum input length"></i> <input type="number" class="input form-input text-sm" required="" min="0" max="1000"${attr("value", question.minLength)}/></label></div> <div><label class="font-medium">Placeholder <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The placeholder value, such as a hint"></i> <input type="text" class="input form-input text-sm" maxlength="100"${attr("value", question.placeholder)}/></label></div> <div><label for="required" class="font-medium">Required <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Require input?"></i> <input type="checkbox" id="required" name="required" class="form-checkbox"${attr("checked", question.required, true)}/></label></div> <div><label class="font-medium">Style <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How big should the input box be?"></i> `);
    $$renderer2.select(
      {
        class: "input form-multiselect",
        required: true,
        value: question.style
      },
      ($$renderer3) => {
        $$renderer3.option({ value: 1, class: "p-1" }, ($$renderer4) => {
          $$renderer4.push(`Short (single-line)`);
        });
        $$renderer3.option({ value: 2, class: "p-1" }, ($$renderer4) => {
          $$renderer4.push(`Long (multi-line)`);
        });
      }
    );
    $$renderer2.push(`</label></div> <div><label class="font-medium">Value <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="A pre-filled value"></i> <textarea class="input form-input text-sm" maxlength="1000">`);
    const $$body = escape_html(question.value);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(`</textarea></label></div>`);
    bind_props($$props, { question });
  });
}
function MenuQuestion($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { question = void 0 } = $$props;
    let _maxLength = question._maxLength;
    question.maxLength = {
      get maxLength() {
        return _maxLength;
      },
      set maxLength(input) {
        _maxLength = Math.min(25, input);
      }
    };
    $$renderer2.push(`<div><label class="font-medium">Label `);
    Required($$renderer2);
    $$renderer2.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The title of the question"></i> <input type="text" class="input form-input text-sm" required="" maxlength="45"${attr("value", question.label)}/></label></div> <div><label class="font-medium">Maximum values <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How many choices can be selected?"></i> <input type="number" class="input form-input text-sm" required="" min="1" max="25"${attr("value", question.maxLength)}/></label></div> <div><label class="font-medium">Minimum values <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The minimum number of select choices"></i> <input type="number" class="input form-input text-sm" default="1" required="" min="0" max="25"${attr("value", question.minLength)}/></label></div> <div><div class="font-medium">Options (${escape_html(question.options.length)}/25) `);
    Required($$renderer2);
    $$renderer2.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The options that members can choose from"></i> <button type="button" class="rounded-lg px-2 font-medium text-yellow-500 transition duration-300 hover:text-yellow-300 disabled:cursor-not-allowed dark:text-yellow-500 dark:hover:text-yellow-500/50"><i class="fa-solid fa-pencil"></i> Edit</button></div> <div><ul class="list-inside list-disc"><!--[-->`);
    const each_array = ensure_array_like(question.options);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let option = each_array[$$index];
      $$renderer2.push(`<li>${escape_html(option.label)}</li>`);
    }
    $$renderer2.push(`<!--]--></ul></div></div> <div><div><label class="font-medium">Placeholder <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The placeholder (label)"></i> <input type="text" class="input form-input text-sm" maxlength="150"${attr("value", question.placeholder)}/></label></div></div>`);
    bind_props($$props, { question });
  });
}
function Questions($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let loading = {};
    let expanded = null;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="list-group flex flex-col gap-2"><!--[-->`);
      const each_array = ensure_array_like(questionsState.questions);
      for (let i = 0, $$length = each_array.length; i < $$length; i++) {
        let q = each_array[i];
        $$renderer3.push(`<div${attr("data-id", q.id)} class="list-group-item rounded-xl bg-gray-100/50 p-4 dark:bg-slate-800/50"><div class="w-full"><div class="flex items-center gap-2 md:gap-4"><i class="handle fa-solid fa-grip-vertical cursor-move text-gray-500 dark:text-slate-400"></i> <div class="w-full">${escape_html(q.label)} <button type="button"${attr("disabled", loading[q.id], true)} class="text-red-300 transition duration-300 hover:text-red-500 disabled:cursor-not-allowed dark:text-red-500/50 dark:hover:text-red-500" title="Remove">`);
        if (loading[q.id]) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<i class="fa-solid fa-spinner animate-spin"></i>`);
        } else {
          $$renderer3.push("<!--[!-->");
          $$renderer3.push(`<i class="fa-solid fa-xmark"></i>`);
        }
        $$renderer3.push(`<!--]--></button> <button type="button" class="flex w-full cursor-pointer select-none justify-between font-medium text-gray-500 transition duration-300 hover:text-blurple dark:text-slate-400 dark:hover:text-blurple"><span class="text-sm">Click to ${escape_html(expanded === q.id ? "collapse" : "expand")}</span> <i${attr_class(`fa-solid ${stringify(expanded === q.id ? "fa-angle-up" : "fa-angle-down")} self-end text-xl`)}></i></button></div></div> `);
        if (expanded === q.id) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="my-4 text-sm"><div class="grid grid-cols-1 gap-3"><div><label class="font-medium">Type `);
          Required($$renderer3);
          $$renderer3.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="What type of input should the question use?"></i> `);
          $$renderer3.select(
            {
              class: "input form-multiselect text-sm",
              required: true,
              value: q.type,
              onchange: () => {
                if (q.type === "TEXT") q.maxLength = 1e3;
                else if (q.type === "MENU") q.maxLength = 1;
              }
            },
            ($$renderer4) => {
              $$renderer4.option({ value: null, class: "p-1", default: true, disabled: true }, ($$renderer5) => {
                $$renderer5.push(`Select an input type`);
              });
              $$renderer4.option({ value: "TEXT", class: "p-1" }, ($$renderer5) => {
                $$renderer5.push(`Text`);
              });
              $$renderer4.option(
                {
                  value: "MENU",
                  class: "p-1",
                  disabled: true,
                  title: "Disabled until supported by Discord"
                },
                ($$renderer5) => {
                  $$renderer5.push(`Select menu`);
                }
              );
            }
          );
          $$renderer3.push(`</label></div> `);
          if (q.type === "TEXT") {
            $$renderer3.push("<!--[-->");
            TextQuestion($$renderer3, {
              get question() {
                return questionsState.questions[i];
              },
              set question($$value) {
                questionsState.questions[i] = $$value;
                $$settled = false;
              }
            });
          } else if (q.type === "MENU") {
            $$renderer3.push("<!--[1-->");
            MenuQuestion($$renderer3, {
              get question() {
                return questionsState.questions[i];
              },
              set question($$value) {
                questionsState.questions[i] = $$value;
                $$settled = false;
              }
            });
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--></div></div>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--></div></div>`);
      }
      $$renderer3.push(`<!--]--></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let tmp = data, category = tmp.category, channels = tmp.channels, roles = tmp.roles, categories = tmp.categories;
    tmp.url;
    const slowmodes = [
      "5s",
      "10s",
      "15s",
      "30s",
      "1m",
      "2m",
      "5m",
      "10m",
      "15m",
      "30m",
      "1h",
      "2h",
      "6h"
    ];
    const channelModes = [
      { value: "CHANNEL", label: "Channel (Default)" },
      { value: "THREAD", label: "Thread (in category channel)" },
      { value: "FORUM", label: "Forum Channel" }
    ];
    questionsState.questions = category.questions;
    channels = channels.filter((c) => c.type === 4);
    roles = roles.filter((r) => r.name !== "@everyone").sort((a, b) => b.rawPosition - a.rawPosition);
    roles.forEach((r) => {
      r._hexColor = r.color > 0 ? `#${r.color.toString(16).padStart(6, "0")}` : null;
      r._style = r._hexColor ? `color: ${r._hexColor}` : "";
    });
    category.cooldown = category.cooldown ? ms(category.cooldown) : "";
    let loadingSubmit = false;
    let loadingDelete = false;
    const getRole = (id) => roles.find((r) => r.id === id);
    run(() => {
      category.customTopic = questionsState.questions.find((q) => q.id === category.customTopic) ? category.customTopic : null;
    });
    run(() => {
      category.requireTopic = questionsState.questions.length > 0 ? false : category.requireTopic;
    });
    $$renderer2.push(`<div class="mb-8 text-center text-orange-600 dark:text-orange-400"><p><i class="fa-solid fa-triangle-exclamation"></i> <a href="https://discordtickets.app/configuration/categories" class="font-semibold hover:underline">Read the documentation</a> to avoid problems.</p></div> <h1 class="m-4 text-center text-4xl font-bold">Categories</h1> <h2 class="m-4 text-center text-2xl font-semibold text-gray-500 dark:text-slate-400">${escape_html(emoji.get(category.emoji) ?? "")}
	${escape_html(category.name || "New category")}</h2> <div class="m-2 mx-auto max-w-5xl p-4 text-lg">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <form class="my-4"><div class="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-12"><div class="grid grid-cols-1 gap-8"><div><label class="font-medium">Name `);
    Required($$renderer2);
    $$renderer2.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The name of the category"></i> <input type="text" class="input form-input" required=""${attr("value", category.name)}/></label></div> <div><label class="font-medium">Channel name `);
    if (category.id) {
      $$renderer2.push("<!--[-->");
      Required($$renderer2);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The name of ticket channels"></i> <input type="text" class="input form-input"${attr("placeholder", `ticket-${stringify("{")}num${stringify("}")}`)}${attr("required", !!category.id, true)}${attr("value", category.channelName)}/></label> `);
    if (category.channelName) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="mb-1 mt-2 text-sm font-semibold">Preview</p> <div class="block w-full break-words rounded-md bg-blurple/20 p-3 font-mono text-sm shadow-sm dark:bg-blurple/20"><i class="fa-solid fa-hashtag text-gray-500 dark:text-slate-400"></i> <span class="marked">${html(marked.parse(category.channelName.replace(/\n/g, "\n\n")).replace(/{+\s?num(ber)?\s?}+/gi, 1).replace(/{+\s?(nick|display)(name)?\s?}+/gi, getContext("user").username).replace(/{+\s?(user)?name\s?}+/gi, getContext("user").username))}</span></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <div><label for="claiming" class="font-medium">Claiming <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Allow staff to claim tickets?"></i> <input type="checkbox" id="claiming" name="claiming" class="form-checkbox"${attr("checked", category.claiming, true)}/></label></div> <div><label class="font-medium">Cooldown <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How long should members have to wait before creating another ticket?"></i> <input type="text" class="input form-input"${attr("value", category.cooldown)}/></label></div> <div><label class="font-medium">Description `);
    Required($$renderer2);
    $$renderer2.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="What is this category for?"></i> <input type="text" class="input form-input" required=""${attr("value", category.description)}/></label></div> <div><label class="font-medium">Discord category `);
    Required($$renderer2);
    $$renderer2.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Which category channel should ticket channels be created under?"></i> `);
    $$renderer2.select(
      {
        class: "input form-multiselect",
        required: true,
        value: category.discordCategory
      },
      ($$renderer3) => {
        if (!category.discordCategory || category.discordCategory === "new") {
          $$renderer3.push("<!--[-->");
          $$renderer3.option({ value: "new" }, ($$renderer4) => {
            $$renderer4.push(`Create a new category`);
          });
          $$renderer3.push(` <hr/>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--><!--[-->`);
        const each_array = ensure_array_like(channels);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let channel = each_array[$$index];
          $$renderer3.option({ value: channel.id, class: "p-1" }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(channel.name)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      },
      void 0,
      void 0,
      void 0,
      void 0,
      true
    );
    $$renderer2.push(`</label></div> <div><label class="font-medium">Channel Mode <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How should ticket channels be created?"></i> `);
    $$renderer2.select({ class: "input form-multiselect", value: category.channelMode }, ($$renderer3) => {
      $$renderer3.push(`<!--[-->`);
      const each_array_1 = ensure_array_like(channelModes);
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        let mode = each_array_1[$$index_1];
        $$renderer3.option({ value: mode.value, class: "p-1" }, ($$renderer4) => {
          $$renderer4.push(`${escape_html(mode.label)}`);
        });
      }
      $$renderer3.push(`<!--]-->`);
    });
    $$renderer2.push(`</label></div> <div><label class="font-medium">Backup Category <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Alternative category to use when primary is full"></i> `);
    $$renderer2.select(
      {
        class: "input form-multiselect",
        value: category.backupCategoryId
      },
      ($$renderer3) => {
        $$renderer3.option({ value: null, class: "p-1" }, ($$renderer4) => {
          $$renderer4.push(`None`);
        });
        $$renderer3.push(`<hr/><!--[-->`);
        const each_array_2 = ensure_array_like(categories);
        for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
          let cat = each_array_2[$$index_2];
          if (cat.id !== category.id) {
            $$renderer3.push("<!--[-->");
            $$renderer3.option({ value: cat.id, class: "p-1" }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(emoji.get(cat.emoji) ?? "")} ${escape_html(cat.name)}`);
            });
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!--]-->`);
      },
      void 0,
      void 0,
      void 0,
      void 0,
      true
    );
    $$renderer2.push(`</label></div> <div><label class="font-medium">Emoji `);
    Required($$renderer2);
    $$renderer2.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Emoji used for buttons &amp; dropdowns"></i> <span class="text-2xl">${escape_html(emoji.get(category.emoji) ?? "")}</span> <input type="text" class="input form-input" required=""${attr("value", category.emoji)}/></label></div> <div><label for="enableFeedback" class="font-medium">Feedback <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Gather feedback from members?"></i> <input type="checkbox" id="enableFeedback" name="enableFeedback" class="form-checkbox"${attr("checked", category.enableFeedback, true)}/></label></div> <div><label class="font-medium">Image <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="A link to an image to be sent with the opening message."></i> <input type="url" class="input form-input"${attr("value", category.image)}/></label></div> <div><label class="font-medium">Member limit <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How many tickets in this category can each member have open?"></i> <input type="number" min="1" max="10" class="input form-input"${attr("value", category.memberLimit)}/></label></div> <div><label class="font-medium">Opening message `);
    Required($$renderer2);
    $$renderer2.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Content to be sent in the opening message of each ticket."></i> <textarea class="input form-input" required="" rows="4" maxlength="1000">`);
    const $$body = escape_html(category.openingMessage);
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(`</textarea></label> <!---->`);
    {
      $$renderer2.push(`<!---->`);
      {
        if (category.openingMessage) {
          $$renderer2.push("<!--[-->");
          $$renderer2.push(`<p class="mb-1 mt-2 text-sm font-semibold">Preview</p> <discord-messages${attr("no-background", true)}${attr("light-theme", data.theme !== "dark")} class="bloc w-full border-0"><discord-message${attr("author", data.client.username)}${attr("avatar", data.client.avatar)}${attr("bot", true)}${attr("timestamp", `Today at ${(/* @__PURE__ */ new Date()).toLocaleTimeString("default", { hour: "numeric", minute: "numeric" })}`)} class="py-2" highlight="">`);
          if (category.pingRoles?.length > 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<!--[-->`);
            const each_array_3 = ensure_array_like(category.pingRoles);
            for (let index = 0, $$length = each_array_3.length; index < $$length; index++) {
              let id = each_array_3[index];
              const role = getRole(id);
              if (role) {
                $$renderer2.push("<!--[-->");
                if (index > 0) {
                  $$renderer2.push("<!--[-->");
                  $$renderer2.push(` `);
                } else {
                  $$renderer2.push("<!--[!-->");
                }
                $$renderer2.push(`<!--]--> <discord-mention${attr("color", role?._hexColor)} type="role">${escape_html(role?.name)}</discord-mention>`);
              } else {
                $$renderer2.push("<!--[!-->");
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]--> , <br/>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> <discord-mention highlight="">${escape_html(data.user.username)}</discord-mention> has created a new ticket <discord-embed slot="embeds"${attr("color", data.settings.primaryColour)}${attr("author-image", `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.webp`)}${attr("author-name", data.user.username)}${attr("image", category.image)}><discord-embed-description slot="description" class="break-words prose prose-slate prose-sm dark:prose-invert prose-a:text-blurple">${html(marked.parse(category.openingMessage).replace(/{+\s?(user)?name\s?}+/gi, `<discord-mention>${data.user.username}</discord-mention>`).replace(/{+\s?avgResponseTime\s?}+/gi, data.guild.stats.avgResponseTime).replace(/{+\s?avgResolutionTime\s?}+/gi, data.guild.stats.avgResolutionTime))}</discord-embed-description> `);
          if (category.requireTopic) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<discord-embed-fields slot="fields"><discord-embed-field field-title="Topic">This is a pretty good preview</discord-embed-field></discord-embed-fields>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (data.settings.footer) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<discord-embed-footer slot="footer"${attr("footer-image", data.client.avatar)}>${escape_html(data.settings.footer)}</discord-embed-footer>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></discord-embed> <discord-attachments slot="components"><discord-action-row>`);
          if (category.requireTopic || questionsState.questions.length > 0) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<discord-button type="secondary">✏️ Edit</discord-button>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (category.claiming && data.settings.claimButton) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<discord-button type="secondary">🙌 Claim</discord-button>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (data.settings.closeButton) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<discord-button type="destructive">✖️ Close</discord-button>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></discord-action-row></discord-attachments></discord-message></discord-messages>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!---->`);
    }
    $$renderer2.push(`<!----></div> <div><label class="font-medium">Ping roles <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Roles that should be pinged upon ticket creation."></i> `);
    $$renderer2.select(
      {
        multiple: true,
        class: "input form-multiselect h-44 font-normal",
        value: category.pingRoles
      },
      ($$renderer3) => {
        $$renderer3.push(`<!--[-->`);
        const each_array_4 = ensure_array_like(roles);
        for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
          let role = each_array_4[$$index_4];
          $$renderer3.option({ value: role.id, class: "m-1 rounded p-1", style: role._style }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(role.unicodeEmoji || "")}
									${escape_html(role.name)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      }
    );
    $$renderer2.push(`</label></div> <div><label class="font-medium">Slow mode <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Should slow mode be enabled?"></i> `);
    $$renderer2.select(
      {
        class: "input form-multiselect font-normal",
        value: category.ratelimit
      },
      ($$renderer3) => {
        $$renderer3.option({ value: null, class: "p-1" }, ($$renderer4) => {
          $$renderer4.push(`Off`);
        });
        $$renderer3.push(`<!--[-->`);
        const each_array_5 = ensure_array_like(slowmodes);
        for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
          let slowmode = each_array_5[$$index_5];
          $$renderer3.option({ value: ms(slowmode) / 1e3, class: "p-1" }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(slowmode)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      }
    );
    $$renderer2.push(`</label></div> <div><label class="font-medium">Required roles <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Roles that a user needs to create a ticket."></i> `);
    $$renderer2.select(
      {
        multiple: true,
        class: "input form-multiselect h-44 font-normal",
        value: category.requiredRoles
      },
      ($$renderer3) => {
        $$renderer3.push(`<!--[-->`);
        const each_array_6 = ensure_array_like(roles);
        for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
          let role = each_array_6[$$index_6];
          $$renderer3.option({ value: role.id, class: "m-1 rounded p-1", style: role._style }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(role.unicodeEmoji || "")}
									${escape_html(role.name)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      }
    );
    $$renderer2.push(`</label></div> <div><label for="requireTopic" class="font-medium">Require topic <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Require a topic before ticket creation?"></i> <input type="checkbox" id="requireTopic" name="requireTopic" class="form-checkbox"${attr("disabled", questionsState.questions.length > 0, true)}${attr("checked", category.requireTopic, true)}/></label></div> <div><label class="font-medium">Staff roles `);
    Required($$renderer2);
    $$renderer2.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Roles that will be able to view tickets."></i> `);
    $$renderer2.select(
      {
        multiple: true,
        required: true,
        class: "input form-multiselect h-44 font-normal",
        value: category.staffRoles
      },
      ($$renderer3) => {
        $$renderer3.push(`<!--[-->`);
        const each_array_7 = ensure_array_like(roles);
        for (let $$index_7 = 0, $$length = each_array_7.length; $$index_7 < $$length; $$index_7++) {
          let role = each_array_7[$$index_7];
          $$renderer3.option({ value: role.id, class: "m-1 rounded p-1", style: role._style }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(role.unicodeEmoji || "")}
									${escape_html(role.name)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      }
    );
    $$renderer2.push(`</label></div> <div><label class="font-medium">Total limit <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The total number of tickets that can be open at once."></i> <input type="number" min="1" max="50" class="input form-input"${attr("value", category.totalLimit)}/></label></div></div> <div><div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700"><div class="flex flex-col gap-4"><div class="text-center"><h3 class="text-xl font-bold">Questions</h3> <p class="text-gray-500 dark:text-slate-400">${escape_html(questionsState.questions.length)}/5</p></div> `);
    if (questionsState.questions.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div><label class="font-medium">Custom topic <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Which question's value should be used as the ticket topic?"></i> `);
      $$renderer2.select(
        {
          class: "input form-multiselect font-normal",
          value: category.customTopic
        },
        ($$renderer3) => {
          $$renderer3.option({ value: null, class: "p-1" }, ($$renderer4) => {
            $$renderer4.push(`None`);
          });
          $$renderer3.push(`<hr/><!--[-->`);
          const each_array_8 = ensure_array_like(questionsState.questions);
          for (let $$index_8 = 0, $$length = each_array_8.length; $$index_8 < $$length; $$index_8++) {
            let q = each_array_8[$$index_8];
            $$renderer3.option({ value: q.id, class: "p-1" }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(q.label)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        },
        void 0,
        void 0,
        void 0,
        void 0,
        true
      );
      $$renderer2.push(`</label></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div>`);
    Questions($$renderer2);
    $$renderer2.push(`<!----></div> `);
    if (questionsState.questions.length < 5) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-center"><button type="button" class="rounded-lg p-2 px-5 font-medium text-green-500 transition duration-300 hover:text-green-300 disabled:cursor-not-allowed dark:text-green-500 dark:hover:text-green-500/50"><i class="fa-solid fa-circle-plus"></i> Add</button></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div> <div class="flex justify-end gap-4">`);
    if (category.id) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button type="button"${attr("disabled", loadingDelete, true)} class="mt-4 rounded-lg bg-red-300 p-2 px-5 font-medium transition duration-300 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed dark:bg-red-500/50 dark:hover:bg-red-500 dark:hover:text-white">`);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<i class="fa-solid fa-trash"></i>`);
      }
      $$renderer2.push(`<!--]--> Delete</button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <button type="submit"${attr("disabled", loadingSubmit, true)} class="mt-4 rounded-lg bg-green-300 p-2 px-5 font-medium transition duration-300 hover:bg-green-500 hover:text-white disabled:cursor-not-allowed dark:bg-green-500/50 dark:hover:bg-green-500 dark:hover:text-white">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> Submit</button></div></div></div></form></div>`);
  });
}
export {
  _page as default
};
