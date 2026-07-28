import { ao as attr, am as stringify, j as getContext, ak as ensure_array_like, a1 as derived, f as attr_class, ar as bind_props } from './index2-BjPIasya.js';
import { e as run } from './root-BZvlTPwp.js';
import { m as ms } from './index-B7gr3AnY.js';
import { d as displayEmoji } from './emoji-BSutn8sX.js';
import { E as EmojiPicker, B as BlockEditor_1, P as Preview } from './Preview-CD_C04L7.js';
import { m as marked } from './marked.esm-DcwJ8j7Z.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';
import './exports-7ECo9oy7.js';
import './state.svelte-B7ni-XI1.js';
import { R as Required } from './Required-DajgSg18.js';
import { q as questionsState } from './state.svelte2-CZg8XtUa.js';
import { h as html } from './html-FW6Ia4bL.js';
import './_commonjsHelpers-BFTU3MAI.js';
import 'crypto';

const LIMITS = {
  choiceOptions: 10,
  description: 100,
  label: 45,
  optionLabel: 100,
  optionValue: 100,
  placeholder: 150,
  selectOptions: 25,
  selectValues: 25,
  textPlaceholder: 100,
  textValue: 4e3,
  uploadFiles: 10
};
const QUESTION_TYPES = [
  {
    value: "TEXT",
    label: "Text box",
    kind: "text",
    hint: "A single or multi-line text input"
  },
  {
    value: "MENU",
    label: "Dropdown (choices)",
    kind: "select",
    hint: "A dropdown of options you define"
  },
  {
    value: "RADIO_GROUP",
    label: "Radio buttons",
    kind: "choice",
    hint: "Pick exactly one of 2–10 options"
  },
  {
    value: "CHECKBOX_GROUP",
    label: "Checkboxes",
    kind: "choice",
    hint: "Pick any number of up to 10 options"
  },
  {
    value: "CHECKBOX",
    label: "Single checkbox",
    kind: "checkbox",
    hint: "A yes/no tick box"
  },
  {
    value: "USER_SELECT",
    label: "User picker",
    kind: "entity",
    hint: "Pick members of the server"
  },
  {
    value: "ROLE_SELECT",
    label: "Role picker",
    kind: "entity",
    hint: "Pick roles"
  },
  {
    value: "MENTIONABLE_SELECT",
    label: "User or role picker",
    kind: "entity",
    hint: "Pick members and/or roles"
  },
  {
    value: "CHANNEL_SELECT",
    label: "Channel picker",
    kind: "entity",
    hint: "Pick channels"
  },
  {
    value: "FILE_UPLOAD",
    label: "File upload",
    kind: "upload",
    hint: "Attach files — they are re-posted into the ticket so the links keep working"
  },
  {
    value: "TEXT_DISPLAY",
    label: "Text block (no input)",
    kind: "display",
    hint: "Static text shown in the modal — asks nothing and stores nothing"
  }
];
const kindOf = (type) => QUESTION_TYPES.find((t) => t.value === type)?.kind ?? null;
const OPTION_RANGE = {
  CHECKBOX_GROUP: [1, LIMITS.choiceOptions],
  MENU: [1, LIMITS.selectOptions],
  RADIO_GROUP: [2, LIMITS.choiceOptions]
};
const CHANNEL_TYPES = [
  { value: 0, label: "Text" },
  { value: 2, label: "Voice" },
  { value: 4, label: "Category" },
  { value: 5, label: "Announcement" },
  { value: 11, label: "Public thread" },
  { value: 12, label: "Private thread" },
  { value: 13, label: "Stage" },
  { value: 15, label: "Forum" }
];
function configOf(question) {
  if (!question.config || typeof question.config !== "object")
    question.config = {};
  return question.config;
}
function applyTypeDefaults(question) {
  const kind = kindOf(question.type);
  question.config ??= {};
  if (kind === "text") {
    question.maxLength = 1e3;
    question.minLength = 0;
  } else if (kind === "select" || kind === "entity") {
    question.maxLength = 1;
    question.minLength = question.required ? 1 : 0;
  } else if (question.type === "CHECKBOX_GROUP") {
    question.maxLength = Math.max(1, question.options?.length || 1);
    question.minLength = question.required ? 1 : 0;
  } else if (question.type === "RADIO_GROUP") {
    question.maxLength = 1;
    question.minLength = question.required ? 1 : 0;
  } else if (kind === "upload") {
    question.config.maxFiles ??= 1;
    question.config.minFiles ??= 0;
  }
}
function QuestionFields($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { question = void 0, labelHelp = "The title of the question" } = $$props;
    const config = derived(() => configOf(question));
    $$renderer2.push(`<div><label class="font-medium">Label `);
    Required($$renderer2);
    $$renderer2.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"${attr("title", labelHelp)}></i> <input type="text" class="input form-input text-sm" required=""${attr("maxlength", LIMITS.label)}${attr("value", question.label)}/></label></div> <div><label class="font-medium">Description <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Optional help text shown under the label"></i> <input type="text" class="input form-input text-sm"${attr("maxlength", LIMITS.description)}${attr("value", config().description ?? "")}/></label></div>`);
    bind_props($$props, { question });
  });
}
function TextQuestion($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { question = void 0 } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      QuestionFields($$renderer3, {
        get question() {
          return question;
        },
        set question($$value) {
          question = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> <div><label class="font-medium">Maximum length <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The maximum input length"></i> <input type="number" class="input form-input text-sm" required="" min="1"${attr("max", LIMITS.textValue)}${attr("value", question.maxLength)}/></label></div> <div><label class="font-medium">Minimum length <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The minimum input length"></i> <input type="number" class="input form-input text-sm" required="" min="0"${attr("max", LIMITS.textValue)}${attr("value", question.minLength)}/></label></div> <div><label class="font-medium">Placeholder <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The placeholder value, such as a hint"></i> <input type="text" class="input form-input text-sm"${attr("maxlength", LIMITS.textPlaceholder)}${attr("value", question.placeholder)}/></label></div> <div><label${attr("for", `required-${stringify(question.id)}`)} class="font-medium">Required <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Require input?"></i> <input type="checkbox"${attr("id", `required-${stringify(question.id)}`)} class="form-checkbox"${attr("checked", question.required, true)}/></label></div> <div><label class="font-medium">Style <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How big should the input box be?"></i> `);
      $$renderer3.select(
        {
          class: "input form-multiselect",
          required: true,
          value: question.style
        },
        ($$renderer4) => {
          $$renderer4.option({ value: 1, class: "p-1" }, ($$renderer5) => {
            $$renderer5.push(`Short (single-line)`);
          });
          $$renderer4.option({ value: 2, class: "p-1" }, ($$renderer5) => {
            $$renderer5.push(`Long (multi-line)`);
          });
        }
      );
      $$renderer3.push(`</label></div> <div><label class="font-medium">Value <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="A pre-filled value"></i> <textarea class="input form-input text-sm"${attr("maxlength", LIMITS.textValue)}>`);
      const $$body = escape_html(question.value);
      if ($$body) {
        $$renderer3.push(`${$$body}`);
      }
      $$renderer3.push(`</textarea></label></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { question });
  });
}
function OptionsEditor($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { question = void 0, emoji = false } = $$props;
    const range = derived(() => OPTION_RANGE[question.type] ?? [1, LIMITS.choiceOptions]);
    const options = derived(() => Array.isArray(question.options) ? question.options : []);
    const duplicates = derived(() => {
      const seen = /* @__PURE__ */ new Set();
      const dupes = /* @__PURE__ */ new Set();
      for (const option of options()) {
        const value = (option.value ?? "").trim() || (option.label ?? "").trim();
        if (!value) continue;
        if (seen.has(value)) dupes.add(value);
        seen.add(value);
      }
      return dupes;
    });
    const valueOf = (option) => (option.value ?? "").trim() || (option.label ?? "").trim();
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="flex flex-col gap-2"><div class="font-medium">Options (${escape_html(options().length)}/${escape_html(range()[1])}) `);
      Required($$renderer3);
      $$renderer3.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The choices members can pick from"></i></div> `);
      if (options().length < range()[0]) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<p class="text-sm text-yellow-600 dark:text-yellow-400">This question needs at least ${escape_html(range()[0])} option${escape_html(range()[0] === 1 ? "" : "s")}.</p>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <!--[-->`);
      const each_array = ensure_array_like(options());
      for (let i = 0, $$length = each_array.length; i < $$length; i++) {
        let option = each_array[i];
        $$renderer3.push(`<div class="rounded-lg bg-white p-2 dark:bg-slate-900/60"><div class="flex items-center gap-2"><span class="text-xs font-semibold text-gray-500 dark:text-slate-400">${escape_html(i + 1)}</span> <input type="text" class="input form-input flex-1 text-sm" required=""${attr("maxlength", LIMITS.optionLabel)} placeholder="Label"${attr("value", option.label)}/> <button type="button" class="px-1 text-gray-500 transition duration-300 hover:text-blurple disabled:opacity-30" title="Move up"${attr("disabled", i === 0, true)}><i class="fa-solid fa-angle-up"></i></button> <button type="button" class="px-1 text-gray-500 transition duration-300 hover:text-blurple disabled:opacity-30" title="Move down"${attr("disabled", i === options().length - 1, true)}><i class="fa-solid fa-angle-down"></i></button> <button type="button" class="px-1 text-red-300 transition duration-300 hover:text-red-500 dark:text-red-500/50 dark:hover:text-red-500" title="Remove"><i class="fa-solid fa-xmark"></i></button></div> <div class="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"><label class="text-sm"><span class="font-medium">Description</span> <input type="text" class="input form-input text-sm"${attr("maxlength", LIMITS.optionLabel)}${attr("value", option.description)}/></label> <label class="text-sm"><span class="font-medium">Value <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="What gets stored as the answer. Defaults to the label."></i></span> <input type="text" class="input form-input text-sm"${attr("maxlength", LIMITS.optionValue)}${attr("placeholder", option.label ?? "")}${attr("value", option.value)}/> `);
        if (duplicates().has(valueOf(option))) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<span class="text-xs text-red-500">Another option already stores “${escape_html(valueOf(option))}”.</span>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--></label> `);
        if (emoji) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<div class="text-sm sm:col-span-2"><span class="font-medium">Emoji</span> `);
          EmojiPicker($$renderer3, {
            get value() {
              return option.emoji;
            },
            set value($$value) {
              option.emoji = $$value;
              $$settled = false;
            }
          });
          $$renderer3.push(`<!----></div>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--></div></div>`);
      }
      $$renderer3.push(`<!--]--> `);
      if (options().length < range()[1]) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div class="text-center"><button type="button" class="rounded-lg p-2 px-5 font-medium text-green-500 transition duration-300 hover:text-green-300 dark:text-green-500 dark:hover:text-green-500/50"><i class="fa-solid fa-circle-plus"></i> Add option</button></div>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { question });
  });
}
function ValueRange($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { question = void 0, ceiling = LIMITS.selectValues } = $$props;
    $$renderer2.push(`<div><label class="font-medium">Maximum choices <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How many things can be picked?"></i> <input type="number" class="input form-input text-sm" required="" min="1"${attr("max", ceiling)}${attr("value", question.maxLength ?? 1)}/></label></div> <div><label class="font-medium">Minimum choices <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The fewest that must be picked"></i> <input type="number" class="input form-input text-sm" required=""${attr("min", question.required ? 1 : 0)}${attr("max", question.maxLength ?? 1)}${attr("value", question.minLength ?? 0)}/></label></div> <div><label${attr("for", `required-${stringify(question.id)}`)} class="font-medium">Required <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Must the member answer this?"></i> <input type="checkbox"${attr("id", `required-${stringify(question.id)}`)} class="form-checkbox"${attr("checked", question.required, true)}/></label></div>`);
    bind_props($$props, { question });
  });
}
function MenuQuestion($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { question = void 0 } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      QuestionFields($$renderer3, {
        get question() {
          return question;
        },
        set question($$value) {
          question = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      OptionsEditor($$renderer3, {
        emoji: true,
        get question() {
          return question;
        },
        set question($$value) {
          question = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> <div><label class="font-medium">Placeholder <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Shown before anything is picked"></i> <input type="text" class="input form-input text-sm"${attr("maxlength", LIMITS.placeholder)}${attr("value", question.placeholder)}/></label></div> `);
      ValueRange($$renderer3, {
        ceiling: Math.max(1, question.options?.length ?? 1),
        get question() {
          return question;
        },
        set question($$value) {
          question = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!---->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { question });
  });
}
function ChoiceQuestion($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { question = void 0 } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      QuestionFields($$renderer3, {
        get question() {
          return question;
        },
        set question($$value) {
          question = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      OptionsEditor($$renderer3, {
        get question() {
          return question;
        },
        set question($$value) {
          question = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      if (question.type === "CHECKBOX_GROUP") {
        $$renderer3.push("<!--[-->");
        ValueRange($$renderer3, {
          ceiling: Math.max(1, question.options?.length ?? 1),
          get question() {
            return question;
          },
          set question($$value) {
            question = $$value;
            $$settled = false;
          }
        });
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push(`<div><label${attr("for", `required-${stringify(question.id)}`)} class="font-medium">Required <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Must the member pick one?"></i> <input type="checkbox"${attr("id", `required-${stringify(question.id)}`)} class="form-checkbox"${attr("checked", question.required, true)}/></label></div>`);
      }
      $$renderer3.push(`<!--]-->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { question });
  });
}
function CheckboxQuestion($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { question = void 0 } = $$props;
    const config = derived(() => configOf(question));
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      QuestionFields($$renderer3, {
        labelHelp: "The text shown beside the tick box",
        get question() {
          return question;
        },
        set question($$value) {
          question = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> <div><label${attr("for", `default-checked-${stringify(question.id)}`)} class="font-medium">Ticked by default <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Should the box start ticked?"></i> <input type="checkbox"${attr("id", `default-checked-${stringify(question.id)}`)} class="form-checkbox"${attr("checked", Boolean(config().defaultChecked), true)}/></label></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { question });
  });
}
function EntityQuestion($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { question = void 0 } = $$props;
    const config = derived(() => configOf(question));
    const selected = derived(() => new Set(config().channelTypes ?? []));
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      QuestionFields($$renderer3, {
        get question() {
          return question;
        },
        set question($$value) {
          question = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> <div><label class="font-medium">Placeholder <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Shown before anything is picked"></i> <input type="text" class="input form-input text-sm"${attr("maxlength", LIMITS.placeholder)}${attr("value", question.placeholder)}/></label></div> `);
      if (question.type === "CHANNEL_SELECT") {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div><div class="font-medium">Channel types <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Which kinds of channel can be picked? None selected means all of them."></i></div> <div class="mt-1 flex flex-wrap gap-2"><!--[-->`);
        const each_array = ensure_array_like(CHANNEL_TYPES);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let type = each_array[$$index];
          $$renderer3.push(`<button type="button"${attr_class(`rounded-lg px-3 py-1 text-sm font-medium transition duration-300 ${stringify(selected().has(type.value) ? "bg-blurple text-white" : "bg-gray-200 dark:bg-slate-700")}`)}>${escape_html(type.label)}</button>`);
        }
        $$renderer3.push(`<!--]--></div></div>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      ValueRange($$renderer3, {
        get question() {
          return question;
        },
        set question($$value) {
          question = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!---->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { question });
  });
}
function UploadQuestion($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { question = void 0 } = $$props;
    const config = derived(() => configOf(question));
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      QuestionFields($$renderer3, {
        get question() {
          return question;
        },
        set question($$value) {
          question = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> <div><label class="font-medium">Maximum files <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How many files can be attached?"></i> <input type="number" class="input form-input text-sm" required="" min="1"${attr("max", LIMITS.uploadFiles)}${attr("value", config().maxFiles ?? 1)}/></label></div> <div><label class="font-medium">Minimum files <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The fewest files that must be attached"></i> <input type="number" class="input form-input text-sm" required=""${attr("min", question.required ? 1 : 0)}${attr("max", config().maxFiles ?? 1)}${attr("value", config().minFiles ?? 0)}/></label></div> <div><label${attr("for", `required-${stringify(question.id)}`)} class="font-medium">Required <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Must the member attach something?"></i> <input type="checkbox"${attr("id", `required-${stringify(question.id)}`)} class="form-checkbox"${attr("checked", question.required, true)}/></label></div> <p class="text-sm text-gray-500 dark:text-slate-400">Uploaded files are re-posted into the ticket channel when it opens. Discord's own upload links
	expire within a day, so without that the transcript would be left with dead links.</p>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { question });
  });
}
function TextDisplayQuestion($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { question = void 0 } = $$props;
    const config = derived(() => configOf(question));
    $$renderer2.push(`<div><label class="font-medium">Name `);
    Required($$renderer2);
    $$renderer2.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Only shown here, to identify this block in the list"></i> <input type="text" class="input form-input text-sm" required=""${attr("maxlength", LIMITS.label)}${attr("value", question.label)}/></label></div> <div><label class="font-medium">Text `);
    Required($$renderer2);
    $$renderer2.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Markdown shown in the modal"></i> <textarea class="input form-input text-sm" required="" rows="4" maxlength="1000">`);
    const $$body = escape_html(config().content ?? "");
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(`</textarea></label></div>`);
    bind_props($$props, { question });
  });
}
function Questions($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let loading = {};
    let expanded = null;
    const EDITORS = {
      checkbox: CheckboxQuestion,
      choice: ChoiceQuestion,
      display: TextDisplayQuestion,
      entity: EntityQuestion,
      select: MenuQuestion,
      text: TextQuestion,
      upload: UploadQuestion
    };
    const hintFor = (type) => QUESTION_TYPES.find((t) => t.value === type)?.hint ?? "";
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
              onchange: () => applyTypeDefaults(questionsState.questions[i])
            },
            ($$renderer4) => {
              $$renderer4.option({ value: null, class: "p-1", disabled: true }, ($$renderer5) => {
                $$renderer5.push(`Select an input type`);
              });
              $$renderer4.push(`<!--[-->`);
              const each_array_1 = ensure_array_like(QUESTION_TYPES);
              for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
                let type = each_array_1[$$index];
                $$renderer4.option({ value: type.value, class: "p-1" }, ($$renderer5) => {
                  $$renderer5.push(`${escape_html(type.label)}`);
                });
              }
              $$renderer4.push(`<!--]-->`);
            }
          );
          $$renderer3.push(`</label> `);
          if (hintFor(q.type)) {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<p class="mt-1 text-xs text-gray-500 dark:text-slate-400">${escape_html(hintFor(q.type))}</p>`);
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--></div> `);
          if (EDITORS[kindOf(q.type)]) {
            $$renderer3.push("<!--[-->");
            const Editor = EDITORS[kindOf(q.type)];
            if (Editor) {
              $$renderer3.push("<!--[-->");
              Editor($$renderer3, {
                get question() {
                  return questionsState.questions[i];
                },
                set question($$value) {
                  questionsState.questions[i] = $$value;
                  $$settled = false;
                }
              });
              $$renderer3.push("<!--]-->");
            } else {
              $$renderer3.push("<!--[!-->");
              $$renderer3.push("<!--]-->");
            }
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
    let useBlockEditor = Boolean(data.category?.messageLayout);
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
    let filteredChannels = derived(() => {
      if (category.channelMode === "FORUM") {
        return channels.filter((c) => c.type === 15);
      } else if (category.channelMode === "THREAD") {
        return channels.filter((c) => c.type === 0);
      } else {
        return channels.filter((c) => c.type === 4);
      }
    });
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
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="mb-8 text-center text-orange-600 dark:text-orange-400"><p><i class="fa-solid fa-triangle-exclamation"></i> <a href="https://discordtickets.app/configuration/categories" class="font-semibold hover:underline">Read the documentation</a> to avoid problems.</p></div> <h1 class="m-4 text-center text-4xl font-bold">Categories</h1> <h2 class="m-4 text-center text-2xl font-semibold text-gray-500 dark:text-slate-400">${escape_html(displayEmoji(category.emoji))}
	${escape_html(category.name || "New category")}</h2> <div class="m-2 mx-auto max-w-5xl p-4 text-lg">`);
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <form class="my-4"><div class="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-12"><div class="grid grid-cols-1 gap-8"><div><label class="font-medium">Name `);
      Required($$renderer3);
      $$renderer3.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The name of the category"></i> <input type="text" class="input form-input" required=""${attr("value", category.name)}/></label></div> <div><label class="font-medium">Channel name `);
      if (category.id) {
        $$renderer3.push("<!--[-->");
        Required($$renderer3);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The name of ticket channels"></i> <input type="text" class="input form-input"${attr("placeholder", `ticket-${stringify("{")}num${stringify("}")}`)}${attr("required", !!category.id, true)}${attr("value", category.channelName)}/></label> `);
      if (category.channelName) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<p class="mb-1 mt-2 text-sm font-semibold">Preview</p> <div class="block w-full break-words rounded-md bg-blurple/20 p-3 font-mono text-sm shadow-sm dark:bg-blurple/20"><i class="fa-solid fa-hashtag text-gray-500 dark:text-slate-400"></i> <span class="marked">${html(marked.parse(category.channelName.replace(/\n/g, "\n\n")).replace(/{+\s?num(ber)?\s?}+/gi, 1).replace(/{+\s?(nick|display)(name)?\s?}+/gi, getContext("user").username).replace(/{+\s?(user)?name\s?}+/gi, getContext("user").username))}</span></div>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--></div> <div><label for="claiming" class="font-medium">Claiming <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Allow staff to claim tickets?"></i> <input type="checkbox" id="claiming" name="claiming" class="form-checkbox"${attr("checked", category.claiming, true)}/></label></div> <div><label for="autoAssign" class="font-medium">Auto-assign <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Automatically assign the ticket to the first staff member who responds?"></i> <input type="checkbox" id="autoAssign" name="autoAssign" class="form-checkbox"${attr("checked", category.autoAssign, true)}/></label></div> <div><label class="font-medium">Cooldown <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How long should members have to wait before creating another ticket?"></i> <input type="text" class="input form-input"${attr("value", category.cooldown)}/></label></div> <div><label class="font-medium">Description `);
      Required($$renderer3);
      $$renderer3.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="What is this category for?"></i> <input type="text" class="input form-input" required=""${attr("value", category.description)}/></label></div> <div><label class="font-medium">`);
      if (category.channelMode === "FORUM") {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`Discord forum channel`);
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push(`Discord category`);
      }
      $$renderer3.push(`<!--]--> `);
      Required($$renderer3);
      $$renderer3.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400"${attr("title", category.channelMode === "FORUM" ? "Which forum channel should tickets be created in?" : "Which category channel should ticket channels be created under?")}></i> `);
      $$renderer3.select(
        {
          class: "input form-multiselect",
          required: true,
          value: category.discordCategory
        },
        ($$renderer4) => {
          if (!category.discordCategory || category.discordCategory === "new") {
            $$renderer4.push("<!--[-->");
            $$renderer4.option({ value: "new" }, ($$renderer5) => {
              $$renderer5.push(`Create a new ${escape_html(category.channelMode === "FORUM" ? "forum" : "category")}`);
            });
            $$renderer4.push(` <hr/>`);
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--><!--[-->`);
          const each_array = ensure_array_like(filteredChannels());
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let channel = each_array[$$index];
            $$renderer4.option({ value: channel.id, class: "p-1" }, ($$renderer5) => {
              $$renderer5.push(`${escape_html(channel.name)}`);
            });
          }
          $$renderer4.push(`<!--]-->`);
        },
        void 0,
        void 0,
        void 0,
        void 0,
        true
      );
      $$renderer3.push(`</label></div> <div><label class="font-medium">Channel Mode <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How should ticket channels be created?"></i> `);
      $$renderer3.select({ class: "input form-multiselect", value: category.channelMode }, ($$renderer4) => {
        $$renderer4.push(`<!--[-->`);
        const each_array_1 = ensure_array_like(channelModes);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let mode = each_array_1[$$index_1];
          $$renderer4.option({ value: mode.value, class: "p-1" }, ($$renderer5) => {
            $$renderer5.push(`${escape_html(mode.label)}`);
          });
        }
        $$renderer4.push(`<!--]-->`);
      });
      $$renderer3.push(`</label></div> <div>`);
      if (category.channelMode === "CHANNEL") {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<label class="font-medium">Backup Category <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Alternative category to use when primary is full"></i> `);
        $$renderer3.select(
          {
            class: "input form-multiselect",
            value: category.backupCategoryId
          },
          ($$renderer4) => {
            $$renderer4.option({ value: null, class: "p-1" }, ($$renderer5) => {
              $$renderer5.push(`None`);
            });
            $$renderer4.push(`<hr/><!--[-->`);
            const each_array_2 = ensure_array_like(categories);
            for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
              let cat = each_array_2[$$index_2];
              if (cat.id !== category.id) {
                $$renderer4.push("<!--[-->");
                $$renderer4.option({ value: cat.id, class: "p-1" }, ($$renderer5) => {
                  $$renderer5.push(`${escape_html(displayEmoji(cat.emoji))} ${escape_html(cat.name)}`);
                });
              } else {
                $$renderer4.push("<!--[!-->");
              }
              $$renderer4.push(`<!--]-->`);
            }
            $$renderer4.push(`<!--]-->`);
          },
          void 0,
          void 0,
          void 0,
          void 0,
          true
        );
        $$renderer3.push(`</label>`);
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push(`<label class="font-medium opacity-50 cursor-not-allowed">Backup Category <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Not available for Thread or Forum modes"></i> <select class="input form-multiselect opacity-50 cursor-not-allowed" disabled="">`);
        $$renderer3.option({}, ($$renderer4) => {
          $$renderer4.push(`Not available for this mode`);
        });
        $$renderer3.push(`</select></label>`);
      }
      $$renderer3.push(`<!--]--></div> <div><label class="font-medium">Emoji `);
      Required($$renderer3);
      $$renderer3.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Emoji used for buttons &amp; dropdowns"></i> `);
      EmojiPicker($$renderer3, {
        required: true,
        placeholder: "Choose an emoji",
        get value() {
          return category.emoji;
        },
        set value($$value) {
          category.emoji = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></label></div> <div><label for="enableFeedback" class="font-medium">Feedback <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Gather feedback from members?"></i> <input type="checkbox" id="enableFeedback" name="enableFeedback" class="form-checkbox"${attr("checked", category.enableFeedback, true)}/></label></div> <div><label class="font-medium">Image <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="A link to an image to be sent with the opening message."></i> <input type="url" class="input form-input"${attr("value", category.image)}/></label></div> <div><label class="font-medium">Member limit <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="How many tickets in this category can each member have open?"></i> <input type="number" min="1" max="10" class="input form-input"${attr("value", category.memberLimit)}/></label></div> <div><div class="font-medium">Opening message `);
      Required($$renderer3);
      $$renderer3.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The message sent when a ticket in this category is opened."></i></div> `);
      if (useBlockEditor) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<p class="mb-2 mt-1 text-sm text-gray-500 dark:text-slate-400">Drag blocks to reorder them. Mentions, answers and the ticket controls are filled in
							for each ticket.</p> `);
        BlockEditor_1($$renderer3, {
          categories: [],
          context: "opening",
          get blocks() {
            return category.messageLayout.blocks;
          },
          set blocks($$value) {
            category.messageLayout.blocks = $$value;
            $$settled = false;
          }
        });
        $$renderer3.push(`<!----> <button type="button" class="mt-2 text-sm text-gray-500 underline dark:text-slate-400">Switch back to the simple editor</button>`);
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push(`<textarea class="input form-input" required="" rows="4" maxlength="1000">`);
        const $$body = escape_html(category.openingMessage);
        if ($$body) {
          $$renderer3.push(`${$$body}`);
        }
        $$renderer3.push(`</textarea> <button type="button" class="mt-2 text-sm text-blurple underline"><i class="fa-solid fa-table-cells-large"></i> Use the block editor for full control</button>`);
      }
      $$renderer3.push(`<!--]--> `);
      if (useBlockEditor) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div class="mt-3">`);
        Preview($$renderer3, {
          layout: category.messageLayout,
          categories: [],
          context: "opening",
          primaryColour: data.settings.primaryColour,
          footer: data.settings.footer ?? ""
        });
        $$renderer3.push(`<!----></div>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <!---->`);
      {
        $$renderer3.push(`<!---->`);
        {
          if (category.openingMessage && !useBlockEditor) {
            $$renderer3.push("<!--[-->");
            $$renderer3.push(`<p class="mb-1 mt-2 text-sm font-semibold">Preview</p> <discord-messages${attr("no-background", true)}${attr("light-theme", data.theme !== "dark")} class="bloc w-full border-0"><discord-message${attr("author", data.client.username)}${attr("avatar", data.client.avatar)}${attr("bot", true)}${attr("timestamp", `Today at ${(/* @__PURE__ */ new Date()).toLocaleTimeString("default", { hour: "numeric", minute: "numeric" })}`)} class="py-2" highlight="">`);
            if (category.pingRoles?.length > 0) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<!--[-->`);
              const each_array_3 = ensure_array_like(category.pingRoles);
              for (let index = 0, $$length = each_array_3.length; index < $$length; index++) {
                let id = each_array_3[index];
                const role = getRole(id);
                if (role) {
                  $$renderer3.push("<!--[-->");
                  if (index > 0) {
                    $$renderer3.push("<!--[-->");
                    $$renderer3.push(` `);
                  } else {
                    $$renderer3.push("<!--[!-->");
                  }
                  $$renderer3.push(`<!--]--> <discord-mention${attr("color", role?._hexColor)} type="role">${escape_html(role?.name)}</discord-mention>`);
                } else {
                  $$renderer3.push("<!--[!-->");
                }
                $$renderer3.push(`<!--]-->`);
              }
              $$renderer3.push(`<!--]--> , <br/>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> <discord-mention highlight="">${escape_html(data.user.username)}</discord-mention> has created a new ticket <discord-embed slot="embeds"${attr("color", data.settings.primaryColour)}${attr("author-image", `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.webp`)}${attr("author-name", data.user.username)}${attr("image", category.image)}><discord-embed-description slot="description" class="break-words prose prose-slate prose-sm dark:prose-invert prose-a:text-blurple">${html(marked.parse(category.openingMessage).replace(/{+\s?(user)?name\s?}+/gi, `<discord-mention>${data.user.username}</discord-mention>`).replace(/{+\s?avgResponseTime\s?}+/gi, data.guild.stats.avgResponseTime).replace(/{+\s?avgResolutionTime\s?}+/gi, data.guild.stats.avgResolutionTime))}</discord-embed-description> `);
            if (category.requireTopic) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<discord-embed-fields slot="fields"><discord-embed-field field-title="Topic">This is a pretty good preview</discord-embed-field></discord-embed-fields>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (data.settings.footer) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<discord-embed-footer slot="footer"${attr("footer-image", data.client.avatar)}>${escape_html(data.settings.footer)}</discord-embed-footer>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--></discord-embed> <discord-attachments slot="components"><discord-action-row>`);
            if (category.requireTopic || questionsState.questions.length > 0) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<discord-button type="secondary">✏️ Edit</discord-button>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (category.claiming && data.settings.claimButton) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<discord-button type="secondary">🙌 Claim</discord-button>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--> `);
            if (data.settings.closeButton) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<discord-button type="destructive">✖️ Close</discord-button>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]--></discord-action-row></discord-attachments></discord-message></discord-messages>`);
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]-->`);
        }
        $$renderer3.push(`<!---->`);
      }
      $$renderer3.push(`<!----></div> <div><label class="font-medium">Ping roles <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Roles that should be pinged upon ticket creation."></i> `);
      $$renderer3.select(
        {
          multiple: true,
          class: "input form-multiselect h-44 font-normal",
          value: category.pingRoles
        },
        ($$renderer4) => {
          $$renderer4.push(`<!--[-->`);
          const each_array_4 = ensure_array_like(roles);
          for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
            let role = each_array_4[$$index_4];
            $$renderer4.option({ value: role.id, class: "m-1 rounded p-1", style: role._style }, ($$renderer5) => {
              $$renderer5.push(`${escape_html(role.unicodeEmoji || "")}
									${escape_html(role.name)}`);
            });
          }
          $$renderer4.push(`<!--]-->`);
        }
      );
      $$renderer3.push(`</label></div> <div><label class="font-medium">Slow mode <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Should slow mode be enabled?"></i> `);
      $$renderer3.select(
        {
          class: "input form-multiselect font-normal",
          value: category.ratelimit
        },
        ($$renderer4) => {
          $$renderer4.option({ value: null, class: "p-1" }, ($$renderer5) => {
            $$renderer5.push(`Off`);
          });
          $$renderer4.push(`<!--[-->`);
          const each_array_5 = ensure_array_like(slowmodes);
          for (let $$index_5 = 0, $$length = each_array_5.length; $$index_5 < $$length; $$index_5++) {
            let slowmode = each_array_5[$$index_5];
            $$renderer4.option({ value: ms(slowmode) / 1e3, class: "p-1" }, ($$renderer5) => {
              $$renderer5.push(`${escape_html(slowmode)}`);
            });
          }
          $$renderer4.push(`<!--]-->`);
        }
      );
      $$renderer3.push(`</label></div> <div><label class="font-medium">Required roles <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Roles that a user needs to create a ticket."></i> `);
      $$renderer3.select(
        {
          multiple: true,
          class: "input form-multiselect h-44 font-normal",
          value: category.requiredRoles
        },
        ($$renderer4) => {
          $$renderer4.push(`<!--[-->`);
          const each_array_6 = ensure_array_like(roles);
          for (let $$index_6 = 0, $$length = each_array_6.length; $$index_6 < $$length; $$index_6++) {
            let role = each_array_6[$$index_6];
            $$renderer4.option({ value: role.id, class: "m-1 rounded p-1", style: role._style }, ($$renderer5) => {
              $$renderer5.push(`${escape_html(role.unicodeEmoji || "")}
									${escape_html(role.name)}`);
            });
          }
          $$renderer4.push(`<!--]-->`);
        }
      );
      $$renderer3.push(`</label></div> <div><label for="requireTopic" class="font-medium">Require topic <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Require a topic before ticket creation?"></i> <input type="checkbox" id="requireTopic" name="requireTopic" class="form-checkbox"${attr("disabled", questionsState.questions.length > 0, true)}${attr("checked", category.requireTopic, true)}/></label></div> <div><label class="font-medium">Staff roles `);
      Required($$renderer3);
      $$renderer3.push(`<!----> <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Roles that will be able to view tickets."></i> `);
      $$renderer3.select(
        {
          multiple: true,
          required: true,
          class: "input form-multiselect h-44 font-normal",
          value: category.staffRoles
        },
        ($$renderer4) => {
          $$renderer4.push(`<!--[-->`);
          const each_array_7 = ensure_array_like(roles);
          for (let $$index_7 = 0, $$length = each_array_7.length; $$index_7 < $$length; $$index_7++) {
            let role = each_array_7[$$index_7];
            $$renderer4.option({ value: role.id, class: "m-1 rounded p-1", style: role._style }, ($$renderer5) => {
              $$renderer5.push(`${escape_html(role.unicodeEmoji || "")}
									${escape_html(role.name)}`);
            });
          }
          $$renderer4.push(`<!--]-->`);
        }
      );
      $$renderer3.push(`</label></div> `);
      if (category.channelMode === "CHANNEL") {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div><label class="font-medium">Total limit <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="The total number of tickets that can be open at once."></i> <input type="number" min="1" max="50" class="input form-input"${attr("value", category.totalLimit)}/></label></div>`);
      } else {
        $$renderer3.push("<!--[!-->");
        $$renderer3.push(`<div><label class="font-medium opacity-50 cursor-not-allowed">Total limit <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Not available for Thread or Forum modes"></i> <input type="number" disabled="" class="input form-input opacity-50 cursor-not-allowed" placeholder="Not available for this mode"/></label></div>`);
      }
      $$renderer3.push(`<!--]--></div> <div><div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700"><div class="flex flex-col gap-4"><div class="text-center"><h3 class="text-xl font-bold">Questions</h3> <p class="text-gray-500 dark:text-slate-400">${escape_html(questionsState.questions.length)}/5</p></div> `);
      if (questionsState.questions.length > 0) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div><label class="font-medium">Custom topic <i class="fa-solid fa-circle-question cursor-help text-gray-500 dark:text-slate-400" title="Which question's value should be used as the ticket topic?"></i> `);
        $$renderer3.select(
          {
            class: "input form-multiselect font-normal",
            value: category.customTopic
          },
          ($$renderer4) => {
            $$renderer4.option({ value: null, class: "p-1" }, ($$renderer5) => {
              $$renderer5.push(`None`);
            });
            $$renderer4.push(`<hr/><!--[-->`);
            const each_array_8 = ensure_array_like(questionsState.questions.filter((q) => q.type === "TEXT"));
            for (let $$index_8 = 0, $$length = each_array_8.length; $$index_8 < $$length; $$index_8++) {
              let q = each_array_8[$$index_8];
              $$renderer4.option({ value: q.id, class: "p-1" }, ($$renderer5) => {
                $$renderer5.push(`${escape_html(q.label)}`);
              });
            }
            $$renderer4.push(`<!--]-->`);
          },
          void 0,
          void 0,
          void 0,
          void 0,
          true
        );
        $$renderer3.push(`</label></div>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <div>`);
      Questions($$renderer3);
      $$renderer3.push(`<!----></div> `);
      if (questionsState.questions.length < 5) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<div class="text-center"><button type="button" class="rounded-lg p-2 px-5 font-medium text-green-500 transition duration-300 hover:text-green-300 disabled:cursor-not-allowed dark:text-green-500 dark:hover:text-green-500/50"><i class="fa-solid fa-circle-plus"></i> Add</button></div>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--></div></div> <div class="flex justify-end gap-4">`);
      if (category.id) {
        $$renderer3.push("<!--[-->");
        $$renderer3.push(`<button type="button"${attr("disabled", loadingDelete, true)} class="mt-4 rounded-lg bg-red-300 p-2 px-5 font-medium transition duration-300 hover:bg-red-500 hover:text-white disabled:cursor-not-allowed dark:bg-red-500/50 dark:hover:bg-red-500 dark:hover:text-white">`);
        {
          $$renderer3.push("<!--[!-->");
          $$renderer3.push(`<i class="fa-solid fa-trash"></i>`);
        }
        $$renderer3.push(`<!--]--> Delete</button>`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <button type="submit"${attr("disabled", loadingSubmit, true)} class="mt-4 rounded-lg bg-green-300 p-2 px-5 font-medium transition duration-300 hover:bg-green-500 hover:text-white disabled:cursor-not-allowed dark:bg-green-500/50 dark:hover:bg-green-500 dark:hover:text-white">`);
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> Submit</button></div></div></div></form></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Bv_13Rgr.js.map
