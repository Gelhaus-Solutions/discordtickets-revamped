import { s as setContext, e as derived, f as ensure_array_like, i as await_block, j as spread_props, h as head, b as store_get, u as unsubscribe_stores } from "../../../chunks/index2.js";
import "../../../chunks/url.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/root.js";
import "cookie";
import "ms";
import { n as navigating } from "../../../chunks/stores.js";
import "clsx";
import { S as Spinner } from "../../../chunks/Spinner.js";
const key = Symbol("modal");
function setModal(modal) {
  setContext(key, modal);
}
function StackedModalContext($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const { modal, children } = $$props;
    setModal(modal);
    children($$renderer2);
    $$renderer2.push(`<!---->`);
  });
}
class StackedModal extends EventTarget {
  static _idCounter = 0;
  _props;
  result = createDeferredPromise();
  id;
  component;
  modals;
  exitBeforeEnter = false;
  constructor(modals2, { id, component, props }) {
    super();
    this.id = id || (StackedModal._idCounter++).toString();
    this.component = component;
    this._props = props ?? {};
    this.modals = modals2;
  }
  #isOpen = derived(() => {
    if (this.modals.stack.length === 0) {
      return false;
    }
    const isCurrent = this.modals.stack[this.modals.stack.length - 1].id === this.id;
    return isCurrent && !this.modals.transitioning;
  });
  get isOpen() {
    return this.#isOpen();
  }
  set isOpen($$value) {
    return this.#isOpen($$value);
  }
  get index() {
    return this.modals.stack.indexOf(this);
  }
  get props() {
    return {
      ...this._props,
      id: this.id,
      index: this.index,
      isOpen: this.isOpen,
      close: this.close
    };
  }
  close = (...args) => {
    if (this.onBeforeClose?.() === false) {
      return false;
    }
    const value = args[0];
    this.dispatchEvent(new CustomEvent("close", { detail: value }));
    this.result.resolve(value);
    return true;
  };
  get promise() {
    return this.result.promise;
  }
  onBeforeClose;
}
function createDeferredPromise() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
class ModalStack {
  /**
   * The current stack of modals
   */
  stack = [];
  /**
   * The last action that was performed on the modals stack. This
   * can be useful for animations
   */
  action = null;
  /**
   * Whether we're currently waiting for transitions to finish
   * before opening the next modal
   */
  transitioning = false;
  /**
   * Opens a new modal
   */
  open = async (component, props, options) => {
    if (this.transitioning) {
      return;
    }
    if (options?.replace) {
      const closed = this.stack[this.stack.length - 1]?.close();
      if (!closed) {
        throw new Error("Current modal prevented closing");
      }
    }
    this.action = "push";
    const currentModal = this.stack[this.stack.length - 1];
    if (currentModal?.exitBeforeEnter) {
      this.transitioning = true;
    }
    const modal = new StackedModal(this, { id: options?.id, component, props });
    this.stack.push(modal);
    modal.addEventListener(
      "close",
      () => {
        if (modal.exitBeforeEnter) {
          this.transitioning = true;
        }
        if (this.stack.indexOf(modal) > -1) {
          this.stack.splice(this.stack.indexOf(modal), 1);
        }
        this.action = "pop";
      },
      { once: true }
    );
    return modal.promise;
  };
  /**
   * Closes the last `amount` of modals in the stack
   *
   * If closing was prevented by any modal it returns false
   */
  close = (amount = 1) => {
    if (typeof amount !== "number" || amount < 1) {
      throw new Error(`amount must be a number greater than 0. Received ${amount}`);
    }
    const closedModals = this.stack.slice(this.stack.length - amount).reverse();
    let closedAmount = 0;
    for (const modal of closedModals) {
      const closed = modal.close();
      if (!closed) {
        break;
      }
      closedAmount++;
    }
    return amount === closedAmount;
  };
  /**
   * Closes a modal by its id. Can be provided with `options.id` in modals.open(Comp, props, options)
   */
  closeById = (id) => {
    const modal = this.stack.find((modal2) => modal2.id === id);
    if (!modal) {
      return false;
    }
    return modal.close();
  };
  /**
   * Closes all modals in the stack.
   *
   * If closing was prevented by any modal, it returns false
   */
  closeAll = () => {
    return this.close(this.stack.length);
  };
}
const modals = new ModalStack();
function Modals($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    function isLazyModal(component) {
      return typeof component.prototype === "undefined";
    }
    const { $$slots, $$events, ...props } = $$props;
    if (modals.stack.length > 0) {
      $$renderer2.push("<!--[-->");
      props.backdrop?.($$renderer2, modals);
      $$renderer2.push(`<!---->`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <!--[-->`);
    const each_array = ensure_array_like(modals.stack);
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let m = each_array[i];
      StackedModalContext($$renderer2, {
        modal: m,
        children: ($$renderer3) => {
          if (isLazyModal(m.component)) {
            $$renderer3.push("<!--[-->");
            await_block(
              $$renderer3,
              m.component(),
              () => {
                props.loading?.($$renderer3, modals);
                $$renderer3.push(`<!---->`);
              },
              (component) => {
                if (props.modal) {
                  $$renderer3.push("<!--[-->");
                  props.modal($$renderer3, { component: component.default, props: m.props }, modals);
                  $$renderer3.push(`<!---->`);
                } else {
                  $$renderer3.push("<!--[!-->");
                  if (component.default) {
                    $$renderer3.push("<!--[-->");
                    component.default($$renderer3, spread_props([m.props]));
                    $$renderer3.push("<!--]-->");
                  } else {
                    $$renderer3.push("<!--[!-->");
                    $$renderer3.push("<!--]-->");
                  }
                }
                $$renderer3.push(`<!--]-->`);
              }
            );
            $$renderer3.push(`<!--]-->`);
          } else {
            $$renderer3.push("<!--[!-->");
            if (props.modal) {
              $$renderer3.push("<!--[-->");
              props.modal($$renderer3, { component: m.component, props: m.props }, modals);
              $$renderer3.push(`<!---->`);
            } else {
              $$renderer3.push("<!--[!-->");
              if (m.component) {
                $$renderer3.push("<!--[-->");
                m.component($$renderer3, spread_props([m.props]));
                $$renderer3.push("<!--]-->");
              } else {
                $$renderer3.push("<!--[!-->");
                $$renderer3.push("<!--]-->");
              }
            }
            $$renderer3.push(`<!--]-->`);
          }
          $$renderer3.push(`<!--]-->`);
        }
      });
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { data, children } = $$props;
    const { client, user, theme } = data;
    head("15zgomd", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Discord Tickets</title>`);
      });
      $$renderer3.push(`<link rel="icon" href="/favicon.png"/>`);
    });
    $$renderer2.push(`<div class="absolute h-max min-h-screen w-full bg-gray-200 dark:bg-slate-900">`);
    {
      let backdrop = function($$renderer3, { close }) {
        $$renderer3.push(`<div class="backdrop"></div>`);
      }, loading = function($$renderer3) {
        $$renderer3.push(`<div>`);
        Spinner($$renderer3);
        $$renderer3.push(`<!----></div>`);
      };
      Modals($$renderer2, {
        backdrop,
        loading,
        $$slots: { backdrop: true, loading: true }
      });
    }
    $$renderer2.push(`<!----> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="text-gray-800 dark:text-slate-300">`);
    if (store_get($$store_subs ??= {}, "$navigating", navigating) || true) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex h-dvh items-center justify-center">`);
      Spinner($$renderer2);
      $$renderer2.push(`<!----></div>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
