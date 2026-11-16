import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  createContextMenu,
  createDialog,
  createPopover,
  createTooltip,
} from "../dist/index.js";
import { dispatchPointer, resetDom, setBox } from "./support/dom.ts";

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

function key(target: EventTarget, keyName: string, shiftKey = false): void {
  target.dispatchEvent(
    new window.KeyboardEvent("keydown", {
      key: keyName,
      shiftKey,
      bubbles: true,
      cancelable: true,
    }),
  );
}

test("Vanilla Popover opens, positions, dismisses, and cleans up", async () => {
  const trigger = append<HTMLButtonElement>(
    '<button id="p-trigger" type="button">Open</button>',
  );
  const content = append<HTMLDivElement>('<div id="p-content">Popover</div>');
  const popover = createPopover({
    trigger,
    content,
    placement: "bottom-start",
    offset: 8,
    portal: document.body,
  });

  assert.equal(content.hidden, true);
  assert.equal(trigger.getAttribute("aria-expanded"), "false");
  click(trigger);
  assert.equal(popover.isOpen, true);
  assert.equal(content.hidden, false);
  assert.equal(trigger.getAttribute("aria-expanded"), "true");
  assert.equal(document.activeElement, document.body);
  await popover.update();

  key(document, "Escape");
  assert.equal(popover.isOpen, false);
  assert.equal(content.hidden, true);
  assert.equal(trigger.getAttribute("aria-expanded"), "false");

  click(trigger);
  dispatchPointer(document.body);
  assert.equal(popover.isOpen, false);
  popover.destroy();
  click(trigger);
  assert.equal(popover.isOpen, false);
});

test("RTL start alignment resolves to the physical end once", async () => {
  const trigger = append<HTMLButtonElement>(
    '<button id="rtl-trigger" type="button">فتح</button>',
  );
  const content = append<HTMLDivElement>('<div id="rtl-content">محتوى</div>');
  setBox(trigger, { x: 900, y: 20, width: 80, height: 40 });
  setBox(content, { x: 0, y: 0, width: 200, height: 80 });
  // happy-dom does not derive computed direction from the dir attribute.
  content.style.direction = "rtl";

  const popover = createPopover({
    trigger,
    content,
    dir: "rtl",
    placement: "bottom-start",
    flip: false,
    shift: false,
  });

  popover.open();
  await popover.update();

  // RTL "start" is the physical right edge: trigger.right - floating.width.
  assert.equal(content.style.left, "780px");
  popover.destroy();
});

test("Vanilla Tooltip opens on hover/focus with tooltip semantics", async () => {
  const trigger = append<HTMLButtonElement>(
    '<button id="t-trigger" type="button">Info</button>',
  );
  const content = append<HTMLDivElement>('<div id="t-content">Hint</div>');
  const tooltip2 = createTooltip({
    trigger,
    content,
    delay: 0,
    closeDelay: 0,
  });
  pointer(trigger, "pointerenter");
  assert.equal(content.hidden, false);
  assert.equal(content.getAttribute("role"), "tooltip");
  assert.match(trigger.getAttribute("aria-describedby") ?? "", /t-content/);
  pointer(trigger, "pointerleave");
  assert.equal(content.hidden, true);
  assert.equal(trigger.hasAttribute("aria-describedby"), false);

  trigger.focus();
  assert.equal(content.hidden, false);
  key(document, "Escape");
  assert.equal(content.hidden, true);
  tooltip2.destroy();
});

test("Vanilla Dialog manages modal focus, scroll, and restoration", async () => {
  const trigger = append<HTMLButtonElement>(
    '<button id="d-trigger" type="button">Open dialog</button>',
  );
  const content = append<HTMLDivElement>(
    '<div id="d-content"><button id="d-inner">Inside</button></div>',
  );
  const dialog = createDialog({
    trigger,
    content,
    modal: true,
    portal: document.body,
  });
  const shell = document.body.firstElementChild as HTMLElement;
  assert.ok(shell);
  assert.equal(content.hidden, true);

  trigger.focus();
  click(trigger);
  assert.equal(dialog.isOpen, true);
  assert.equal(content.hidden, false);
  assert.equal(content.getAttribute("role"), "dialog");
  assert.equal(content.getAttribute("aria-modal"), "true");
  assert.equal(document.activeElement, content);
  assert.equal(document.body.style.overflow, "hidden");
  assert.equal(shell.getAttribute("inert"), "");

  key(document, "Escape");
  assert.equal(dialog.isOpen, false);
  assert.equal(document.activeElement, trigger);
  assert.equal(document.body.style.overflow, "");
  assert.equal(shell.hasAttribute("inert"), false);
  dialog.destroy();
});

test("Vanilla Dialog non-modal leaves background interactive", () => {
  const trigger = append<HTMLButtonElement>(
    '<button id="dn-trigger" type="button">Open</button>',
  );
  const content = append<HTMLDivElement>('<div id="dn-content">Panel</div>');
  const dialog = createDialog({
    trigger,
    content,
    modal: false,
    portal: document.body,
  });
  click(trigger);
  assert.equal(dialog.isOpen, true);
  assert.equal(content.getAttribute("aria-modal"), null);
  assert.equal(document.body.style.overflow, "");
  key(document, "Escape");
  dialog.destroy();
});

test("Vanilla ContextMenu opens at pointer, focuses items, and navigates", () => {
  const trigger = append<HTMLDivElement>('<div id="cm-trigger">Target</div>');
  const content = append<HTMLDivElement>(
    '<div id="cm-content"><div role="menuitem">Copy</div><div role="menuitem">Paste</div></div>',
  );
  let selected = "";
  const menu = createContextMenu({
    trigger,
    content,
    portal: document.body,
    onSelect: (item) => {
      selected = item.textContent ?? "";
    },
  });
  const event = new window.MouseEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    button: 2,
    clientX: 100,
    clientY: 60,
  });
  trigger.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  assert.equal(menu.isOpen, true);
  assert.equal(content.getAttribute("role"), "menu");
  assert.equal(document.activeElement?.textContent, "Copy");
  key(document.activeElement as Element, "ArrowDown");
  assert.equal(document.activeElement?.textContent, "Paste");
  click(document.activeElement as Element);
  assert.equal(menu.isOpen, false);
  assert.equal(selected, "Paste");
  assert.equal(document.activeElement, trigger);
  menu.destroy();
});

test("Vanilla ContextMenu disabled preserves native context menu", () => {
  const trigger = append<HTMLDivElement>('<div id="cd-trigger">Target</div>');
  const content = append<HTMLDivElement>('<div id="cd-content">Menu</div>');
  const menu = createContextMenu({ trigger, content, disabled: true });
  const event = new window.MouseEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    button: 2,
  });
  trigger.dispatchEvent(event);
  assert.equal(event.defaultPrevented, false);
  assert.equal(menu.isOpen, false);
  menu.destroy();
});

test("Vanilla controlled Popover and nested Dialog layers coordinate", async () => {
  const trigger = append<HTMLButtonElement>(
    '<button id="ctrl-trigger" type="button">Controlled</button>',
  );
  const content = append<HTMLDivElement>(
    '<div id="ctrl-content">Controlled</div>',
  );
  let controlled: ReturnType<typeof createPopover>;
  controlled = createPopover({
    trigger,
    content,
    open: false,
    onOpenChange: (open) => controlled.setOpen(open),
  });
  click(trigger);
  assert.equal(controlled.isOpen, true);
  assert.equal(content.hidden, false);
  controlled.setOpen(false);
  assert.equal(controlled.isOpen, false);
  assert.equal(content.hidden, true);
  controlled.destroy();

  const parentTrigger = append<HTMLButtonElement>(
    '<button id="nested-parent-trigger" type="button">Parent</button>',
  );
  const parentContent = append<HTMLDivElement>(
    '<div id="nested-parent-content"><button id="nested-child-trigger" type="button">Child</button></div>',
  );
  const childContent = append<HTMLDivElement>(
    '<div id="nested-child-content">Child dialog</div>',
  );
  const parent = createDialog({
    trigger: parentTrigger,
    content: parentContent,
    portal: document.body,
    modal: true,
  });
  const child = createDialog({
    trigger: document.getElementById("nested-child-trigger") as HTMLElement,
    content: childContent,
    portal: document.body,
    modal: true,
  });
  click(parentTrigger);
  assert.equal(parent.isOpen, true);
  click(document.getElementById("nested-child-trigger") as HTMLElement);
  assert.equal(child.isOpen, true);
  assert.equal(document.body.style.overflow, "hidden");
  key(document, "Escape");
  assert.equal(child.isOpen, false);
  assert.equal(parent.isOpen, true);
  assert.equal(document.body.style.overflow, "hidden");
  key(document, "Escape");
  assert.equal(parent.isOpen, false);
  assert.equal(document.body.style.overflow, "");
  parent.destroy();
  child.destroy();
});

test("Vanilla ContextMenu keeps checkbox/radio items open and skips disabled items", () => {
  const trigger = append<HTMLDivElement>('<div id="kind-trigger">Target</div>');
  const content = append<HTMLDivElement>(
    '<div id="kind-content"><div role="menuitemcheckbox" aria-checked="false">Grid</div><div role="menuitemradio" aria-checked="false">One</div><div role="menuitem" aria-disabled="true">Disabled</div></div>',
  );
  const menu = createContextMenu({ trigger, content });
  const event = new window.MouseEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    button: 2,
  });
  trigger.dispatchEvent(event);
  assert.equal(menu.isOpen, true);
  click(content.querySelector('[role="menuitemcheckbox"]') as HTMLElement);
  assert.equal(menu.isOpen, true);
  click(content.querySelector('[role="menuitemradio"]') as HTMLElement);
  assert.equal(menu.isOpen, true);
  const disabled = content.querySelector('[role="menuitem"]') as HTMLElement;
  assert.equal(disabled.getAttribute("aria-disabled"), "true");
  menu.destroy();
});
