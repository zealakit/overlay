import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { defineComponent, h, nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";
import {
  useContextMenu,
  useDialog,
  usePopover,
  useTooltip,
} from "../dist/index.js";
import { dispatchEscape, dispatchPointer, resetDom } from "./support/dom.ts";

afterEach(() => {
  resetDom();
});

function click(element: Element): void {
  element.dispatchEvent(
    new window.MouseEvent("click", { bubbles: true, cancelable: true }),
  );
}

function pointer(
  element: Element,
  type: "pointerenter" | "pointerleave",
  pointerType = "mouse",
): void {
  const event = new window.PointerEvent(type, {
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  element.dispatchEvent(event);
}

test("Vue usePopover opens, dismisses, and updates reactive state", async () => {
  const trigger = ref<HTMLElement | null>(null);
  const content = ref<HTMLElement | null>(null);
  let popover: ReturnType<typeof usePopover> | undefined;
  const App = defineComponent({
    setup() {
      popover = usePopover({
        trigger,
        content,
        placement: "bottom-start",
      });
      return () =>
        h("div", [
          h(
            "button",
            { ref: (el: unknown) => (trigger.value = el as HTMLElement) },
            "Open",
          ),
          h(
            "div",
            { ref: (el: unknown) => (content.value = el as HTMLElement) },
            "Popover",
          ),
        ]);
    },
  });
  const wrapper = mount(App, { attachTo: document.body });
  await nextTick();
  const triggerEl = trigger.value;
  const contentEl = content.value;
  assert.ok(triggerEl && contentEl);
  assert.ok(popover);
  assert.equal(popover.isOpen.value, false);
  assert.equal(contentEl.hidden, true);

  click(triggerEl);
  await nextTick();
  assert.equal(popover.isOpen.value, true);
  assert.equal(contentEl.hidden, false);
  assert.equal(triggerEl.getAttribute("aria-expanded"), "true");

  dispatchPointer(document.body);
  await nextTick();
  assert.equal(popover.isOpen.value, false);
  assert.equal(contentEl.hidden, true);
  wrapper.unmount();
});

test("Vue useTooltip supports hover/focus and tooltip ARIA", async () => {
  const trigger = ref<HTMLElement | null>(null);
  const content = ref<HTMLElement | null>(null);
  const App = defineComponent({
    setup() {
      const tooltip = useTooltip({
        trigger,
        content,
        delay: 0,
        closeDelay: 0,
      });
      return () =>
        h("div", [
          h(
            "button",
            { ref: (el: unknown) => (trigger.value = el as HTMLElement) },
            "Info",
          ),
          h(
            "div",
            { ref: (el: unknown) => (content.value = el as HTMLElement) },
            "Hint",
          ),
          h("span", { "data-open": String(tooltip.isOpen.value) }),
        ]);
    },
  });
  const wrapper = mount(App, { attachTo: document.body });
  await nextTick();
  const triggerEl = trigger.value;
  const contentEl = content.value;
  assert.ok(triggerEl && contentEl);
  pointer(triggerEl, "pointerenter");
  await nextTick();
  assert.equal(contentEl.hidden, false);
  assert.equal(contentEl.getAttribute("role"), "tooltip");
  assert.match(triggerEl.getAttribute("aria-describedby") ?? "", /content/);
  dispatchEscape(document);
  await nextTick();
  assert.equal(contentEl.hidden, true);
  wrapper.unmount();
});

test("Vue useDialog handles modal focus, scroll, and cleanup", async () => {
  const trigger = ref<HTMLElement | null>(null);
  const content = ref<HTMLElement | null>(null);
  const backdrop = ref<HTMLElement | null>(null);
  const App = defineComponent({
    setup() {
      const dialog = useDialog({
        trigger,
        content,
        backdrop,
        modal: true,
        portal: document.body,
      });
      return () =>
        h("div", [
          h(
            "button",
            { ref: (el: unknown) => (trigger.value = el as HTMLElement) },
            "Open",
          ),
          h(
            "div",
            { ref: (el: unknown) => (content.value = el as HTMLElement) },
            "Dialog",
          ),
          h("div", {
            ref: (el: unknown) => (backdrop.value = el as HTMLElement),
            "data-backdrop": "",
          }),
          h("span", { "data-open": String(dialog.isOpen.value) }),
        ]);
    },
  });
  const wrapper = mount(App, { attachTo: document.body });
  await nextTick();
  const triggerEl = trigger.value;
  const contentEl = content.value;
  assert.ok(triggerEl && contentEl);
  click(triggerEl);
  await nextTick();
  assert.equal(contentEl.getAttribute("role"), "dialog");
  assert.equal(contentEl.getAttribute("aria-modal"), "true");
  assert.equal(document.activeElement, contentEl);
  assert.equal(document.body.style.overflow, "hidden");
  dispatchEscape(document);
  await nextTick();
  assert.equal(document.activeElement, triggerEl);
  assert.equal(document.body.style.overflow, "");
  wrapper.unmount();
});

test("Vue useContextMenu opens at pointer and supports keyboard navigation", async () => {
  const trigger = ref<HTMLElement | null>(null);
  const content = ref<HTMLElement | null>(null);
  const App = defineComponent({
    setup() {
      const menu = useContextMenu({
        trigger,
        content,
        portal: document.body,
      });
      return () =>
        h("div", [
          h(
            "div",
            { ref: (el: unknown) => (trigger.value = el as HTMLElement) },
            "Target",
          ),
          h(
            "div",
            { ref: (el: unknown) => (content.value = el as HTMLElement) },
            [
              h("div", { role: "menuitem" }, "Copy"),
              h("div", { role: "menuitem" }, "Paste"),
            ],
          ),
          h("span", { "data-open": String(menu.isOpen.value) }),
        ]);
    },
  });
  const wrapper = mount(App, { attachTo: document.body });
  await nextTick();
  const triggerEl = trigger.value;
  const contentEl = content.value;
  assert.ok(triggerEl && contentEl);
  const event = new window.MouseEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    button: 2,
    clientX: 80,
    clientY: 40,
  });
  triggerEl.dispatchEvent(event);
  await nextTick();
  assert.equal(event.defaultPrevented, true);
  assert.equal(contentEl.getAttribute("role"), "menu");
  assert.equal(document.activeElement?.textContent, "Copy");
  (document.activeElement as HTMLElement).dispatchEvent(
    new window.KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    }),
  );
  assert.equal(document.activeElement?.textContent, "Paste");
  dispatchEscape(document);
  await nextTick();
  assert.equal(contentEl.hidden, true);
  assert.equal(document.activeElement, triggerEl);
  wrapper.unmount();
});

test("Vue controlled open follows external state", async () => {
  const isOpen = ref(false);
  const trigger = ref<HTMLElement | null>(null);
  const content = ref<HTMLElement | null>(null);
  const App = defineComponent({
    setup() {
      usePopover({
        trigger,
        content,
        open: isOpen,
        onOpenChange: (next) => {
          isOpen.value = next;
        },
      });
      return () =>
        h("div", [
          h(
            "button",
            {
              ref: (el: unknown) => (trigger.value = el as HTMLElement),
              onClick: () => undefined,
            },
            "Open",
          ),
          h(
            "div",
            { ref: (el: unknown) => (content.value = el as HTMLElement) },
            "Popover",
          ),
        ]);
    },
  });
  const wrapper = mount(App, { attachTo: document.body });
  await nextTick();
  assert.ok(trigger.value && content.value);
  click(trigger.value);
  await nextTick();
  await nextTick();
  assert.equal(isOpen.value, true);
  assert.equal(content.value.hidden, false);
  dispatchEscape(document);
  await nextTick();
  assert.equal(isOpen.value, false);
  assert.equal(content.value.hidden, true);
  wrapper.unmount();
});
