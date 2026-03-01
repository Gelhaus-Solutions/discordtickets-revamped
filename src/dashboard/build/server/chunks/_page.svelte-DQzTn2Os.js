import { ao as attr, ak as ensure_array_like, f as attr_class, am as stringify } from './index2-D-VkFrUc.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';
import './root-OrB--9Lj.js';
import './exports-7ECo9oy7.js';
import './state.svelte-DvtRQi3Q.js';
import { m as ms } from './index-B7gr3AnY.js';
import './marked.esm-DcwJ8j7Z.js';
import './_commonjsHelpers-BFTU3MAI.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    let tmp = data, settings = tmp.settings, channels = tmp.channels, locales = tmp.locales, roles = tmp.roles;
    channels = channels.filter((c) => c.type === 0);
    roles = roles.filter((r) => r.name !== "@everyone").sort((a, b) => b.rawPosition - a.rawPosition);
    roles.forEach((r) => {
      r._hexColor = r.color > 0 ? `#${r.color.toString(16).padStart(6, "0")}` : null;
      r._style = r._hexColor ? `color: ${r._hexColor}` : "";
    });
    settings.autoClose = settings.autoClose ? ms(settings.autoClose) : "";
    settings.logChannel = settings.logChannel ?? "";
    settings.staleAfter = settings.staleAfter ? ms(settings.staleAfter) : "";
    settings.workingHours = settings.workingHours.map((v) => v === null ? [] : v);
    let autoTag = Array.isArray(settings.autoTag) ? "custom" : settings.autoTag;
    let loading = false;
    $$renderer2.push(`<h1 class="m-4 text-center text-4xl font-bold">General settings</h1> <div class="m-2 mx-auto max-w-lg p-4 text-lg">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="mb-8 text-center text-orange-600 dark:text-orange-400"><p class="font-semibold"><i class="fa-solid fa-triangle-exclamation"></i> Warning</p> <p>This page is made to be "just about functional". <a href="https://discordtickets.app/configuration/general" class="font-semibold hover:underline">Read the documentation</a> to avoid breaking something.</p></div> <form><div class="my-4 grid grid-cols-1 gap-8"><div><label class="font-medium">Auto close after <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How long should the bot wait before closing (for close command and stale tickets)?"></i> <input type="text" class="input form-input"${attr("value", settings.autoClose)}/></label></div> <div><label class="font-medium">Auto tag channels <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Which channels should the bot respond with tags in?"></i> `);
    $$renderer2.select(
      {
        class: "input form-multiselect block font-normal",
        value: autoTag
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "custom" }, ($$renderer4) => {
          $$renderer4.push(`Specific channels`);
        });
        $$renderer3.option({ value: "ticket" }, ($$renderer4) => {
          $$renderer4.push(`Only ticket channels`);
        });
        $$renderer3.option({ value: "!ticket" }, ($$renderer4) => {
          $$renderer4.push(`All non-ticket channels`);
        });
        $$renderer3.option({ value: "all" }, ($$renderer4) => {
          $$renderer4.push(`All channels`);
        });
      }
    );
    $$renderer2.push(` `);
    if (autoTag === "custom") {
      $$renderer2.push("<!--[-->");
      $$renderer2.select(
        {
          multiple: true,
          class: "input form-multiselect font-normal",
          value: settings.autoTag
        },
        ($$renderer3) => {
          $$renderer3.push(`<!--[-->`);
          const each_array = ensure_array_like(channels);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let channel = each_array[$$index];
            $$renderer3.option({ value: channel.id, class: "m-1 rounded p-1" }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(channel.name)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
      );
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></label></div> <div><label for="archive" class="font-medium">Archive <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Save messages sent in tickets for future use?"></i> <input type="checkbox" id="archive" name="archive" class="form-checkbox"${attr("checked", settings.archive, true)}/></label></div> <div><label class="font-medium">Blocklist <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Which roles should the bot ignore?"></i> `);
    $$renderer2.select(
      {
        multiple: true,
        class: "input form-multiselect h-44 font-normal",
        value: settings.blocklist
      },
      ($$renderer3) => {
        $$renderer3.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(roles);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let role = each_array_1[$$index_1];
          $$renderer3.option({ value: role.id, class: "m-1 rounded p-1", style: role._style }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(role.unicodeEmoji || "")}
								${escape_html(role.name)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      }
    );
    $$renderer2.push(`</label></div> <div><div class="font-medium">Buttons <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Which buttons should be enabled (if the feature is enabled in the category)?"></i> <div class="mx-4"><div><label for="claimButton" class="text-base font-medium">Claim <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Add a claim/unclaim button to the opening message (if enabled in category)?"></i> <input type="checkbox" id="claimButton" name="claimButton" class="form-checkbox"${attr("checked", settings.claimButton, true)}/></label></div> <div><label for="closeButton" class="text-base font-medium">Close <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Add a close button to the opening message?"></i> <input type="checkbox" id="closeButton" name="closeButton" class="form-checkbox"${attr("checked", settings.closeButton, true)}/></label></div> <div><label for="closeReasonButton" class="text-base font-medium">Close with Reason <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Add a 'close with reason' button to the opening message?"></i> <input type="checkbox" id="closeReasonButton" name="closeReasonButton" class="form-checkbox"${attr("checked", settings.closeReasonButton, true)}/></label></div></div></div></div> <div><label class="font-medium">Error colour <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="What colour should error embeds be?"></i> <input type="text" class="input form-input"${attr("value", settings.errorColour)}/></label></div> <div><label class="font-medium">Footer <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="What text should be at the bottom of embeds?"></i> <input type="text" class="input form-input"${attr("value", settings.footer)}/></label></div> <div><label class="font-medium">Locale <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Which language should the bot respond in?"></i> `);
    $$renderer2.select({ class: "input form-multiselect", value: settings.locale }, ($$renderer3) => {
      $$renderer3.push(`<!--[-->`);
      const each_array_2 = ensure_array_like(locales);
      for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
        let locale = each_array_2[$$index_2];
        $$renderer3.option({ value: locale, class: "p-1" }, ($$renderer4) => {
          $$renderer4.push(`${escape_html(locale)}`);
        });
      }
      $$renderer3.push(`<!--]-->`);
    });
    $$renderer2.push(`</label></div> <div><label class="font-medium">Log channel <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Which channel should logs be sent to?"></i> `);
    $$renderer2.select(
      { class: "input form-multiselect", value: settings.logChannel },
      ($$renderer3) => {
        $$renderer3.option({ value: "" }, ($$renderer4) => {
          $$renderer4.push(`None`);
        });
        $$renderer3.push(`<hr/><!--[-->`);
        const each_array_3 = ensure_array_like(channels);
        for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
          let channel = each_array_3[$$index_3];
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
    $$renderer2.push(`</label></div> <div><label class="font-medium">Primary colour <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="What colour should normal embeds be?"></i> <input type="text" class="input form-input"${attr("value", settings.primaryColour)}/></label></div> <div><label class="font-medium">Stale after <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="When should the bot remind members/staff about messages with no reply?"></i> <input type="text" class="input form-input"${attr("value", settings.staleAfter)}/></label></div> <div><label class="font-medium">Success colour <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="What colour should success embeds be?"></i> <input type="text" class="input form-input"${attr("value", settings.successColour)}/></label></div> <div><div class="grid grid-cols-1 gap-2 font-medium"><div>Working hours <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="When can your members expect staff to be available?"></i> <p class="cursor-pointer select-none text-gray-500 transition duration-300 hover:text-blurple dark:text-slate-400 dark:hover:text-blurple"><i${attr_class(`fa-solid ${stringify("fa-angle-down")} float-right text-xl`)}></i> <span class="text-sm">Click to ${escape_html("expand")}</span></p></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div></div> <button type="submit"${attr("disabled", loading, true)} class="float-right mt-4 rounded-lg bg-green-300 p-2 px-5 font-medium transition duration-300 hover:bg-green-500 hover:text-white disabled:cursor-not-allowed dark:bg-green-500/50 dark:hover:bg-green-500 dark:hover:text-white">`);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> Submit</button></form> `);
    if (data.analytics) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="mt-12"><h2 class="text-3xl font-bold mb-6">Server Analytics</h2> <div class="grid grid-cols-1 gap-4 md:grid-cols-4 mb-8"><div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Total Tickets</div> <div class="mt-2 text-3xl font-bold">${escape_html(data.analytics.totalTickets || 0)}</div></div> <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Avg Response Time</div> <div class="mt-2 text-3xl font-bold">`);
      if (data.analytics.avgResponseTime) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`${escape_html(Math.round(data.analytics.avgResponseTime / 60))}m`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`N/A`);
      }
      $$renderer2.push(`<!--]--></div></div> <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Avg Resolution Time</div> <div class="mt-2 text-3xl font-bold">`);
      if (data.analytics.avgResolutionTime) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`${escape_html(Math.round(data.analytics.avgResolutionTime / 3600))}h`);
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`N/A`);
      }
      $$renderer2.push(`<!--]--></div></div> <div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><div class="text-sm font-semibold text-gray-600 dark:text-slate-400">Open Tickets</div> <div class="mt-2 text-3xl font-bold text-orange-600">${escape_html(data.analytics.openTickets || 0)}</div></div></div> `);
      if (data.analytics.byAssignee && Object.keys(data.analytics.byAssignee).length > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700"><h3 class="text-2xl font-bold mb-4">Tickets by Staff Member</h3> <div class="overflow-x-auto"><table class="w-full text-left"><thead class="border-b border-gray-200 dark:border-gray-600"><tr><th class="px-4 py-2 font-semibold text-gray-700 dark:text-slate-300">Staff Member</th><th class="px-4 py-2 text-right font-semibold text-gray-700 dark:text-slate-300">Tickets Assigned</th><th class="px-4 py-2 text-right font-semibold text-gray-700 dark:text-slate-300">Resolved</th><th class="px-4 py-2 text-right font-semibold text-gray-700 dark:text-slate-300">Avg Resolution Time</th></tr></thead><tbody><!--[-->`);
        const each_array_6 = ensure_array_like(Object.entries(data.analytics.byAssignee));
        for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
          let [assigneeId, stats] = each_array_6[$$index_6];
          $$renderer2.push(`<tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"><td class="px-4 py-3">${escape_html(stats.name || `User ${assigneeId}`)}</td><td class="px-4 py-3 text-right font-medium">${escape_html(stats.assigned || 0)}</td><td class="px-4 py-3 text-right font-medium">${escape_html(stats.resolved || 0)}</td><td class="px-4 py-3 text-right">`);
          if (stats.avgResolutionTime) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`${escape_html(Math.round(stats.avgResolutionTime / 3600))}h`);
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`N/A`);
          }
          $$renderer2.push(`<!--]--></td></tr>`);
        }
        $$renderer2.push(`<!--]--></tbody></table></div></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-DQzTn2Os.js.map
