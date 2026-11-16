import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { defineComponent, h, nextTick, ref } from "vue";
import { mount } from "@vue/test-utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
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

function slot(...children: unknown[]) {
  return { default: () => children as never[] };
}

function popoverApp(props: Record<string, unknown> = {}) {
  return defineComponent({
    setup() {
      return () =>
        h("div", [
          h(
            Popover,
            props,
            slot(
              h(PopoverTrigger, { id: "trigger" }, slot("Open")),
              h(
                PopoverContent,
                { id: "content" },
                slot("Body", h(PopoverClose, { id: "close" }, slot("Close"))),
              ),
            ),
          ),
        ]);
    },
  });
}

test("Popover parts open on click and close on Escape, outside press, and PopoverClose", async () => {
  const wrapper = mount(popoverApp(), { attachTo: document.body });
  await nextTick();
  const trigger = document.getElementById("trigger") as HTMLElement;
  const content = document.getElementById("content") as HTMLElement;
  assert.equal(content.hidden, true);
  assert.equal(trigger.getAttribute("type"), "button");

  click(trigger);
  await nextTick();
  assert.equal(content.hidden, false);
  assert.equal(trigger.getAttribute("aria-expanded"), "true");

  dispatchEscape(document);
  await nextTick();
  assert.equal(content.hidden, true);

  click(trigger);
  await nextTick();
  dispatchPointer(document.body);
  await nextTick();
  assert.equal(content.hidden, true);

  click(trigger);
  await nextTick();
  click(document.getElementById("close") as HTMLElement);
  await nextTick();
  assert.equal(content.hidden, true);
  wrapper.unmount();
});

test("Popover supports v-model:open and reports changes", async () => {
  const open = ref(false);
  const changes: boolean[] = [];
  const App = defineComponent({
    setup() {
      return () =>
        h(
          Popover,
          {
            open: open.value,
            "onUpdate:open": (next: boolean) => {
              changes.push(next);
              open.value = next;
            },
          },
          slot(
            h(PopoverTrigger, { id: "trigger" }, slot("Open")),
            h(PopoverContent, { id: "content" }, slot("Body")),
          ),
        );
    },
  });
  const wrapper = mount(App, { attachTo: document.body });
  await nextTick();
  const content = document.getElementById("content") as HTMLElement;

  click(document.getElementById("trigger") as HTMLElement);
  await nextTick();
  assert.deepEqual(changes, [true]);
  assert.equal(content.hidden, false);

  open.value = false;
  await nextTick();
  await nextTick();
  assert.equal(content.hidden, true);
  wrapper.unmount();
});

test("Dialog parts wire title, description, backdrop, and close", async () => {
  const App = defineComponent({
    setup() {
      return () =>
        h(
          Dialog,
          null,
          slot(
            h(DialogTrigger, { id: "trigger" }, slot("Edit profile")),
            h(DialogBackdrop, { id: "backdrop" }),
            h(
              DialogContent,
              { id: "content" },
              slot(
                h(DialogTitle, { id: "title" }, slot("Edit profile")),
                h(
                  DialogDescription,
                  { id: "description" },
                  slot("Update your profile information."),
                ),
                h(DialogClose, { id: "close" }, slot("Cancel")),
              ),
            ),
          ),
        );
    },
  });
  const wrapper = mount(App, { attachTo: document.body });
  await nextTick();
  await nextTick();
  const content = document.getElementById("content") as HTMLElement;
  const backdrop = document.getElementById("backdrop") as HTMLElement;
  assert.equal(content.getAttribute("aria-labelledby"), "title");
  assert.equal(content.getAttribute("aria-describedby"), "description");

  click(document.getElementById("trigger") as HTMLElement);
  await nextTick();
  assert.equal(content.getAttribute("role"), "dialog");
  assert.equal(content.getAttribute("aria-modal"), "true");
  assert.equal(content.hidden, false);
  assert.equal(backdrop.hidden, false);

  click(document.getElementById("close") as HTMLElement);
  await nextTick();
  assert.equal(content.hidden, true);
  assert.equal(backdrop.hidden, true);
  wrapper.unmount();
});

test("Tooltip parts open on hover with role tooltip", async () => {
  const App = defineComponent({
    setup() {
      return () =>
        h(
          Tooltip,
          { delay: 0, closeDelay: 0 },
          slot(
            h(TooltipTrigger, { id: "trigger" }, slot("Info")),
            h(TooltipContent, { id: "content" }, slot("Hint")),
          ),
        );
    },
  });
  const wrapper = mount(App, { attachTo: document.body });
  await nextTick();
  const trigger = document.getElementById("trigger") as HTMLElement;
  const content = document.getElementById("content") as HTMLElement;
  const enter = new window.PointerEvent("pointerenter", { bubbles: true });
  Object.defineProperty(enter, "pointerType", { value: "mouse" });
  trigger.dispatchEvent(enter);
  await nextTick();
  assert.equal(content.hidden, false);
  assert.equal(content.getAttribute("role"), "tooltip");
  assert.match(trigger.getAttribute("aria-describedby") ?? "", /content/);
  wrapper.unmount();
});

test("ContextMenu parts open on contextmenu and select items", async () => {
  const selected: string[] = [];
  const App = defineComponent({
    setup() {
      return () =>
        h(
          ContextMenu,
          null,
          slot(
            h(ContextMenuTrigger, { id: "trigger" }, slot("Edit profile")),
            h(
              ContextMenuContent,
              { id: "content" },
              slot(
                h(
                  ContextMenuItem,
                  { id: "edit", onSelect: () => selected.push("edit") },
                  slot("Edit"),
                ),
                h(
                  ContextMenuItem,
                  {
                    id: "off",
                    disabled: true,
                    onSelect: () => selected.push("off"),
                  },
                  slot("Delete"),
                ),
              ),
            ),
          ),
        );
    },
  });
  const wrapper = mount(App, { attachTo: document.body });
  await nextTick();
  const trigger = document.getElementById("trigger") as HTMLElement;
  const content = document.getElementById("content") as HTMLElement;
  assert.equal(trigger.getAttribute("tabindex"), "0");

  trigger.dispatchEvent(
    new window.MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 10,
      clientY: 20,
    }),
  );
  await nextTick();
  assert.equal(content.hidden, false);
  assert.equal(content.getAttribute("role"), "menu");

  click(document.getElementById("off") as HTMLElement);
  await nextTick();
  assert.deepEqual(selected, []);
  assert.equal(content.hidden, false);

  click(document.getElementById("edit") as HTMLElement);
  await nextTick();
  assert.deepEqual(selected, ["edit"]);
  assert.equal(content.hidden, true);
  wrapper.unmount();
});

test("parts throw a clear error outside their root", () => {
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = () => {};
  console.warn = () => {};
  try {
    assert.throws(
      () => mount(PopoverTrigger),
      /<PopoverTrigger> must be used inside <Popover>/,
    );
  } finally {
    console.error = originalError;
    console.warn = originalWarn;
  }
});
