import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  createContextMenu,
  createDialog,
  createPopover,
  createTooltip,
} from "../dist/index.js";
import { dispatchEscape, dispatchPointer, resetDom } from "./support/dom.ts";

afterEach(() => {
  resetDom();
});

function append<T extends HTMLElement>(markup: string): T {
  document.body.insertAdjacentHTML("beforeend", markup);
  const element = document.body.lastElementChild;
  assert.ok(element);
  return element as T;
}

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

test("Svelte createPopover exposes readable state and opens/dismisses", async () => {
  const trigger = append<HTMLButtonElement>(
    '<button id="sp-trigger" type="button">Open</button>',
  );
  const content = append<HTMLDivElement>('<div id="sp-content">Popover</div>');
  const popover = createPopover({ trigger, content, portal: document.body });
  const states: boolean[] = [];
  const unsubscribe = popover.subscribe((state) => {
    states.push(state.isOpen);
  });
  assert.deepEqual(states, [false]);
  click(trigger);
  assert.equal(popover.isOpen, true);
  assert.equal(content.hidden, false);
  dispatchPointer(document.body);
  assert.equal(popover.isOpen, false);
  assert.equal(content.hidden, true);
  assert.equal(states.at(-1), false);
  unsubscribe();
  popover.destroy();
});

test("Svelte createTooltip toggles on hover with tooltip semantics", () => {
  const trigger = append<HTMLButtonElement>(
    '<button id="st-trigger" type="button">Info</button>',
  );
  const content = append<HTMLDivElement>('<div id="st-content">Hint</div>');
  const tooltip = createTooltip({
    trigger,
    content,
    delay: 0,
    closeDelay: 0,
  });
  pointer(trigger, "pointerenter");
  assert.equal(content.hidden, false);
  assert.equal(content.getAttribute("role"), "tooltip");
  assert.match(trigger.getAttribute("aria-describedby") ?? "", /st-content/);
  pointer(trigger, "pointerleave");
  assert.equal(content.hidden, true);
  tooltip.destroy();
});

test("Svelte createDialog handles modal focus, scroll, and restoration", () => {
  const trigger = append<HTMLButtonElement>(
    '<button id="sd-trigger" type="button">Open</button>',
  );
  const content = append<HTMLDivElement>('<div id="sd-content">Dialog</div>');
  const dialog = createDialog({
    trigger,
    content,
    modal: true,
    portal: document.body,
  });
  trigger.focus();
  click(trigger);
  assert.equal(dialog.isOpen, true);
  assert.equal(content.getAttribute("role"), "dialog");
  assert.equal(content.getAttribute("aria-modal"), "true");
  assert.equal(document.activeElement, content);
  assert.equal(document.body.style.overflow, "hidden");
  dispatchEscape(document);
  assert.equal(document.activeElement, trigger);
  assert.equal(document.body.style.overflow, "");
  dialog.destroy();
});

test("Svelte createContextMenu supports pointer and keyboard navigation", () => {
  const trigger = append<HTMLDivElement>('<div id="scm-trigger">Target</div>');
  const content = append<HTMLDivElement>(
    '<div id="scm-content"><div role="menuitem">Copy</div><div role="menuitem">Paste</div></div>',
  );
  const menu = createContextMenu({ trigger, content, portal: document.body });
  const event = new window.MouseEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    button: 2,
    clientX: 40,
    clientY: 30,
  });
  trigger.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  assert.equal(content.getAttribute("role"), "menu");
  assert.equal(document.activeElement?.textContent, "Copy");
  (document.activeElement as HTMLElement).dispatchEvent(
    new window.KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    }),
  );
  assert.equal(document.activeElement?.textContent, "Paste");
  click(document.activeElement as HTMLElement);
  assert.equal(menu.isOpen, false);
  assert.equal(document.activeElement, trigger);
  menu.destroy();
});
