import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { StrictMode, createElement as h, createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import type { DialogChangeReason } from "../dist/index.js";
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  DialogViewport,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useLayer,
} from "../dist/index.js";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import {
  dispatchEscape,
  dispatchKey,
  dispatchPointer,
  resetDom,
} from "./support/dom.ts";

afterEach(() => {
  cleanup();
  resetDom();
});

function getTrigger(name = "Open dialog"): HTMLElement {
  const trigger = [...document.querySelectorAll<HTMLElement>("button")].find(
    (button) => button.textContent?.trim() === name,
  );
  assert.ok(trigger, `trigger ${name} not found`);
  return trigger;
}

function getDialog(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[role='dialog']");
}

function basicDialog(props: Record<string, unknown> = {}) {
  return h(
    Dialog,
    props,
    h(DialogTrigger, null, "Open dialog"),
    h(
      DialogContent,
      { "data-testid": "dialog-popup" },
      h(
        DialogHeader,
        null,
        h(DialogTitle, null, "Edit profile"),
        h(DialogDescription, null, "Update your profile information."),
      ),
      h("button", { type: "button" }, "Save"),
      h(DialogClose, null, "Cancel"),
    ),
  );
}

test("opens modally with dialog semantics, container focus, and background inertness", async () => {
  const view = render(basicDialog());
  const trigger = getTrigger();
  await act(async () => {
    trigger.focus();
    trigger.click();
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getDialog()));
  const dialog = getDialog();
  assert.ok(dialog);
  assert.equal(dialog.getAttribute("role"), "dialog");
  assert.equal(dialog.getAttribute("aria-modal"), "true");
  assert.equal(
    dialog.getAttribute("aria-labelledby"),
    dialog.querySelector("h2")?.id,
  );
  assert.equal(
    dialog.getAttribute("aria-describedby"),
    dialog.querySelector("p")?.id,
  );
  assert.equal(document.activeElement, dialog);
  assert.equal(dialog.tabIndex, -1);

  const container = view.container as HTMLElement;
  assert.equal(container.getAttribute("inert"), "");
  assert.equal(container.getAttribute("aria-hidden"), "true");
  assert.equal(document.body.style.overflow, "hidden");
});

test("Escape closes and restores trigger focus, background, and scrolling", async () => {
  const view = render(basicDialog());
  const trigger = getTrigger();
  await act(async () => {
    trigger.focus();
    trigger.click();
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getDialog()));
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getDialog(), null));
  await waitFor(() => assert.equal(document.activeElement, trigger));
  assert.equal((view.container as HTMLElement).hasAttribute("inert"), false);
  assert.equal(document.body.style.overflow, "");
});

test("DialogClose closes with the close-button relationship", async () => {
  const changes: Array<[boolean, DialogChangeReason]> = [];
  render(
    h(
      Dialog,
      {
        onOpenChange: (open: boolean, reason: DialogChangeReason) =>
          changes.push([open, reason]),
      },
      h(DialogTrigger, null, "Open dialog"),
      h(
        DialogContent,
        null,
        h(DialogTitle, null, "Close test"),
        h(DialogClose, null, "Cancel"),
      ),
    ),
  );
  fireEvent.click(getTrigger());
  await waitFor(() => assert.ok(getDialog()));
  const cancel = [
    ...document.querySelectorAll<HTMLButtonElement>("button"),
  ].find((button) => button.textContent?.trim() === "Cancel");
  assert.ok(cancel);
  fireEvent.click(cancel);
  await waitFor(() => assert.equal(getDialog(), null));
  assert.deepEqual(changes.at(-1), [false, "close-button"]);
});

test("outside pointer press on the backdrop dismisses, inside content does not", async () => {
  render(basicDialog());
  fireEvent.click(getTrigger());
  await waitFor(() => assert.ok(getDialog()));
  const dialog = getDialog();
  const inside = dialog?.querySelector("button");
  assert.ok(inside);
  await act(async () => {
    dispatchPointer(inside as EventTarget);
    await Promise.resolve();
  });
  assert.ok(getDialog());
  const backdrop = document.querySelector("[data-dialog-backdrop]");
  assert.ok(backdrop);
  await act(async () => {
    dispatchPointer(backdrop as EventTarget);
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getDialog(), null));
});

test("supports disabled Escape and outside dismissal independently", async () => {
  render(
    h(
      Dialog,
      { dismissOnEscape: false, dismissOnOutsidePress: false },
      h(DialogTrigger, null, "Open dialog"),
      h(DialogContent, null, h(DialogTitle, null, "Sticky")),
    ),
  );
  fireEvent.click(getTrigger());
  await waitFor(() => assert.ok(getDialog()));
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  const backdrop = document.querySelector("[data-dialog-backdrop]");
  await act(async () => {
    dispatchPointer(backdrop as EventTarget);
    await Promise.resolve();
  });
  assert.ok(getDialog());
});

test("controlled state is not changed by trigger interaction", async () => {
  const changes: Array<[boolean, DialogChangeReason]> = [];
  render(
    h(
      Dialog,
      {
        open: false,
        onOpenChange: (open: boolean, reason: DialogChangeReason) =>
          changes.push([open, reason]),
      },
      h(DialogTrigger, null, "Open dialog"),
      h(DialogContent, null, h(DialogTitle, null, "Controlled")),
    ),
  );
  fireEvent.click(getTrigger());
  await act(async () => {
    await Promise.resolve();
  });
  assert.equal(getDialog(), null);
  assert.deepEqual(changes.at(-1), [true, "trigger"]);
});

test("non-modal leaves the background interactive, untrapped, and unscrolled", async () => {
  const view = render(
    h(
      "div",
      null,
      h(
        Dialog,
        { modal: false },
        h(DialogTrigger, null, "Open dialog"),
        h(
          DialogContent,
          null,
          h(DialogTitle, null, "Non-modal"),
          h("input", { "aria-label": "Inside field" }),
        ),
      ),
      h("button", { type: "button", id: "background-action" }, "Background"),
    ),
  );
  const trigger = getTrigger();
  await act(async () => {
    trigger.focus();
    trigger.click();
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getDialog()));
  const dialog = getDialog();
  assert.ok(dialog);
  assert.equal(dialog.getAttribute("aria-modal"), null);
  assert.equal(dialog.hasAttribute("data-non-modal"), true);
  assert.equal(document.querySelector("[data-dialog-backdrop]"), null);
  assert.equal((view.container as HTMLElement).hasAttribute("inert"), false);
  assert.equal(document.body.style.overflow, "");
  assert.equal(document.activeElement, trigger);
  assert.equal(dialog.getAttribute("aria-modal"), null);

  const background = document.getElementById(
    "background-action",
  ) as HTMLButtonElement;
  background.focus();
  assert.equal(document.activeElement, background);

  await act(async () => {
    dispatchPointer(background);
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getDialog(), null));
});

test("Tab and Shift+Tab wrap within a modal Dialog", async () => {
  render(basicDialog());
  fireEvent.click(getTrigger());
  await waitFor(() => assert.ok(getDialog()));
  const dialog = getDialog();
  assert.ok(dialog);
  assert.equal(document.activeElement, dialog);

  const first = dialog.querySelector("button");
  assert.ok(first);
  const last = [...dialog.querySelectorAll<HTMLButtonElement>("button")].at(-1);
  assert.ok(last);

  await act(async () => {
    dispatchKey(document, { key: "Tab" });
    await Promise.resolve();
  });
  assert.equal(document.activeElement, first);

  await act(async () => {
    dispatchKey(document, { key: "Tab", shiftKey: true });
    await Promise.resolve();
  });
  assert.equal(document.activeElement, last);
});

test("supports custom initial and final focus targets", async () => {
  function Fixture() {
    const [finalTarget, setFinalTarget] = useState<HTMLElement | null>(null);
    return h(
      "div",
      null,
      h("button", { type: "button", id: "final-target" }, "Final"),
      h(
        Dialog,
        null,
        h(DialogTrigger, null, "Open dialog"),
        h(
          DialogContent,
          {
            initialFocus: "first",
            finalFocus: finalTarget,
          },
          h(DialogTitle, null, "Focus"),
          h("button", { type: "button" }, "First action"),
        ),
      ),
      h(
        "button",
        {
          type: "button",
          onClick: () =>
            setFinalTarget(document.getElementById("final-target")),
        },
        "Set final",
      ),
    );
  }

  render(h(Fixture));
  fireEvent.click(getTrigger());
  await waitFor(() => assert.ok(getDialog()));
  const dialog = getDialog();
  assert.equal(document.activeElement, dialog?.querySelector("button"));

  await act(async () => {
    getTrigger("Set final").click();
    await Promise.resolve();
  });
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getDialog(), null));
  await waitFor(() =>
    assert.equal(
      document.activeElement,
      document.getElementById("final-target"),
    ),
  );
});

test("works without a close button and can be closed programmatically", async () => {
  function Fixture() {
    const [open, setOpen] = useState(false);
    return h(
      "div",
      null,
      h(
        Dialog,
        { open, onOpenChange: setOpen },
        h(DialogTrigger, null, "Open dialog"),
        h(
          DialogContent,
          null,
          h(DialogTitle, null, "No close button"),
          h("button", { type: "button" }, "Save action"),
        ),
      ),
      h(
        "button",
        { type: "button", onClick: () => setOpen(false) },
        "Programmatic close",
      ),
    );
  }
  render(h(Fixture));
  fireEvent.click(getTrigger());
  await waitFor(() => assert.ok(getDialog()));
  assert.equal(
    [...document.querySelectorAll("button")].some(
      (button) => button.textContent?.trim() === "Close",
    ),
    false,
  );
  await act(async () => {
    getTrigger("Programmatic close").click();
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getDialog(), null));
});

test("inside form interaction and submit do not close the Dialog", async () => {
  render(
    h(
      Dialog,
      null,
      h(DialogTrigger, null, "Open dialog"),
      h(
        DialogContent,
        null,
        h(DialogTitle, null, "Form"),
        h(
          "form",
          {
            onSubmit: (event: Event) => event.preventDefault(),
          },
          h("input", { "aria-label": "Name", defaultValue: "" }),
          h("textarea", { "aria-label": "Notes" }),
          h(DialogFooter, null, h("button", { type: "submit" }, "Save")),
        ),
      ),
    ),
  );
  fireEvent.click(getTrigger());
  await waitFor(() => assert.ok(getDialog()));
  const input = document.querySelector<HTMLInputElement>(
    "input[aria-label='Name']",
  );
  const textarea = document.querySelector<HTMLTextAreaElement>(
    "textarea[aria-label='Notes']",
  );
  assert.ok(input && textarea);
  input.focus();
  fireEvent.change(input, { target: { value: "Ada" } });
  textarea.focus();
  fireEvent.change(textarea, { target: { value: "Notes" } });
  assert.ok(getDialog());

  const submit = [
    ...document.querySelectorAll<HTMLButtonElement>("button"),
  ].find((button) => button.textContent?.trim() === "Save");
  assert.ok(submit);
  fireEvent.click(submit);
  await act(async () => {
    await Promise.resolve();
  });
  assert.ok(getDialog());
});

test("supports custom portal containers and inline composition", async () => {
  const custom = document.createElement("div");
  custom.id = "dialog-portal-target";
  document.body.append(custom);

  const portalView = render(
    h(
      Dialog,
      null,
      h(DialogTrigger, null, "Open dialog"),
      h(
        DialogContent,
        { portal: custom },
        h(DialogTitle, null, "Custom portal"),
      ),
    ),
  );
  fireEvent.click(getTrigger());
  await waitFor(() => assert.ok(getDialog()));
  assert.equal(
    getDialog()?.closest("[data-dialog-portal]")?.parentElement,
    custom,
  );
  portalView.unmount();

  const inlineView = render(
    h(
      Dialog,
      null,
      h(DialogTrigger, null, "Open dialog"),
      h(DialogContent, { portal: false }, h(DialogTitle, null, "Inline")),
    ),
  );
  fireEvent.click(getTrigger());
  await waitFor(() => assert.ok(getDialog()));
  assert.equal(getDialog()?.closest("[data-dialog-portal]"), null);
  assert.equal(
    (inlineView.container as HTMLElement).hasAttribute("inert"),
    false,
  );
});

test("supports advanced Portal/Backdrop/Viewport/Popup composition", async () => {
  render(
    h(
      Dialog,
      null,
      h(DialogTrigger, null, "Open dialog"),
      h(
        DialogPortal,
        null,
        h(DialogBackdrop, { "data-testid": "custom-backdrop" }),
        h(
          DialogViewport,
          { "data-testid": "custom-viewport" },
          h(
            DialogPopup,
            { "data-testid": "custom-popup" },
            h(DialogTitle, null, "Advanced"),
            h(DialogClose, null, "Close"),
          ),
        ),
      ),
    ),
  );
  fireEvent.click(getTrigger());
  await waitFor(() => assert.ok(getDialog()));
  assert.ok(document.querySelector("[data-testid='custom-backdrop']"));
  assert.ok(document.querySelector("[data-testid='custom-viewport']"));
  assert.equal(getDialog()?.hasAttribute("data-testid"), true);
});

test("nested Dialogs give Escape priority to the child and restore focus/scroll correctly", async () => {
  const view = render(
    h(
      Dialog,
      null,
      h(DialogTrigger, null, "Open dialog"),
      h(
        DialogContent,
        null,
        h(DialogTitle, null, "Parent"),
        h(DialogClose, null, "Close parent"),
        h(
          Dialog,
          null,
          h(DialogTrigger, null, "Open child"),
          h(
            DialogContent,
            null,
            h(DialogTitle, null, "Child"),
            h(DialogClose, null, "Close child"),
          ),
        ),
      ),
    ),
  );

  fireEvent.click(getTrigger("Open dialog"));
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='dialog']").length, 1),
  );
  fireEvent.click(getTrigger("Open child"));
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='dialog']").length, 2),
  );
  assert.equal(document.body.style.overflow, "hidden");
  assert.equal((view.container as HTMLElement).getAttribute("inert"), "");

  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='dialog']").length, 1),
  );
  const childTrigger = getTrigger("Open child");
  await waitFor(() => assert.equal(document.activeElement, childTrigger));
  assert.equal(document.body.style.overflow, "hidden");

  fireEvent.click(getTrigger("Close parent"));
  await waitFor(() => assert.equal(getDialog(), null));
  await waitFor(() =>
    assert.equal(document.activeElement, getTrigger("Open dialog")),
  );
  assert.equal((view.container as HTMLElement).hasAttribute("inert"), false);
  assert.equal(document.body.style.overflow, "");
});

test("Dialog inside Popover closes first and does not dismiss the Popover", async () => {
  render(
    h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, null, "Open popover"),
      h(
        PopoverContent,
        { "data-testid": "popover" },
        h(
          Dialog,
          null,
          h(DialogTrigger, null, "Open dialog"),
          h(
            DialogContent,
            null,
            h(DialogTitle, null, "Dialog above popover"),
            h(DialogClose, null, "Close dialog"),
          ),
        ),
      ),
    ),
  );

  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popover']")),
  );
  fireEvent.click(getTrigger("Open dialog"));
  await waitFor(() => assert.ok(getDialog()));
  assert.equal(document.activeElement, getDialog());
  assert.ok(document.querySelector("[data-testid='popover']"));

  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getDialog(), null));
  assert.ok(document.querySelector("[data-testid='popover']"));
});

test("Popover inside Dialog portals into the dialog boundary and keeps the Dialog open", async () => {
  render(
    h(
      Dialog,
      { defaultOpen: true },
      h(DialogTrigger, null, "Open dialog"),
      h(
        DialogContent,
        null,
        h(DialogTitle, null, "Dialog with popover"),
        h(
          Popover,
          null,
          h(PopoverTrigger, null, "Open child popover"),
          h(
            PopoverContent,
            { "data-testid": "child-popover" },
            h("input", { "aria-label": "Popover field" }),
          ),
        ),
      ),
    ),
  );

  await waitFor(() => assert.ok(getDialog()));
  fireEvent.click(getTrigger("Open child popover"));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='child-popover']")),
  );
  const popover = document.querySelector("[data-testid='child-popover']");
  assert.ok(popover);
  assert.ok(popover.closest("[role='dialog']"));

  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelector("[data-testid='child-popover']"), null),
  );
  assert.ok(getDialog());
});

test("Tooltip inside Dialog closes independently without closing the Dialog", async () => {
  render(
    h(
      Dialog,
      { defaultOpen: true },
      h(DialogTrigger, null, "Open dialog"),
      h(
        DialogContent,
        null,
        h(DialogTitle, null, "Dialog with tooltip"),
        h(
          Tooltip,
          { delay: 0, closeDelay: 0 },
          h(TooltipTrigger, null, "Tooltip trigger"),
          h(TooltipContent, null, "Nested hint"),
        ),
      ),
    ),
  );

  await waitFor(() => assert.ok(getDialog()));
  const trigger = getTrigger("Tooltip trigger");
  await act(async () => {
    trigger.focus();
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(document.querySelector("[role='tooltip']")));
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelector("[role='tooltip']"), null),
  );
  assert.ok(getDialog());
  assert.equal(document.activeElement, trigger);
});

test("supports external controlled triggers and restores the active element", async () => {
  function Fixture() {
    const [open, setOpen] = useState(false);
    return h(
      "div",
      null,
      h(
        "button",
        { type: "button", onClick: () => setOpen(true) },
        "External open",
      ),
      h(
        Dialog,
        { open, onOpenChange: setOpen },
        h(DialogContent, null, h(DialogTitle, null, "External")),
      ),
    );
  }

  render(h(Fixture));
  const external = getTrigger("External open");
  await act(async () => {
    external.focus();
    external.click();
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getDialog()));
  assert.equal(document.activeElement, getDialog());
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getDialog(), null));
  await waitFor(() => assert.equal(document.activeElement, external));
});

test("supports custom trigger components and disabled triggers", async () => {
  render(
    h(
      "div",
      null,
      h(
        Dialog,
        null,
        h(
          DialogTrigger,
          { asChild: true },
          h(
            "a",
            { href: "#dialog", "aria-label": "Settings dialog" },
            "Settings",
          ),
        ),
        h(DialogContent, null, h(DialogTitle, null, "Custom trigger")),
      ),
      h(
        Dialog,
        null,
        h(DialogTrigger, { disabled: true }, "Disabled dialog"),
        h(DialogContent, null, h(DialogTitle, null, "Disabled")),
      ),
    ),
  );

  const custom = document.querySelector<HTMLAnchorElement>(
    "a[aria-label='Settings dialog']",
  );
  assert.ok(custom);
  assert.equal(custom.getAttribute("aria-haspopup"), "dialog");
  fireEvent.click(custom);
  await waitFor(() => assert.ok(getDialog()));

  const disabled = getTrigger("Disabled dialog");
  assert.equal((disabled as HTMLButtonElement).disabled, true);
  fireEvent.click(disabled);
  assert.equal(document.querySelectorAll("[role='dialog']").length, 1);
});

test("keeps consumer layout and scroll styles off the popup by default", async () => {
  render(
    h(
      Dialog,
      null,
      h(DialogTrigger, null, "Open dialog"),
      h(
        DialogContent,
        { style: { maxHeight: "70vh" } },
        h(DialogTitle, null, "Scrollable"),
        h(DialogHeader, { "data-testid": "sticky-header" }, "Header"),
        h("div", { style: { overflowY: "auto" } }, "Content"),
        h(DialogFooter, { "data-testid": "sticky-footer" }, "Footer"),
      ),
    ),
  );
  fireEvent.click(getTrigger());
  await waitFor(() => assert.ok(getDialog()));
  const dialog = getDialog();
  assert.ok(dialog);
  assert.equal(dialog.style.maxHeight, "70vh");
  assert.equal(dialog.style.width, "");
  assert.equal(dialog.style.padding, "");
  assert.ok(document.querySelector("[data-testid='sticky-header']"));
  assert.ok(document.querySelector("[data-testid='sticky-footer']"));
});

test("supports RTL direction and SSR/Strict Mode safely", async () => {
  const html = renderToString(
    h(
      Dialog,
      { dir: "rtl" },
      h(DialogTrigger, null, "Open dialog"),
      h(DialogContent, null, h(DialogTitle, null, "RTL")),
    ),
  );
  assert.match(html, /Open dialog/);
  assert.equal(html.includes('role="dialog"'), false);

  render(
    h(
      StrictMode,
      null,
      h(
        Dialog,
        { dir: "rtl" },
        h(DialogTrigger, null, "Open dialog"),
        h(
          DialogContent,
          null,
          h(DialogTitle, null, "RTL"),
          h(DialogClose, null, "Close"),
        ),
      ),
    ),
  );
  fireEvent.click(getTrigger());
  await waitFor(() => assert.ok(getDialog()));
  assert.equal(getDialog()?.getAttribute("dir"), "rtl");
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getDialog(), null));
});

test("cleans up scroll lock and inert background on unmount", async () => {
  const view = render(basicDialog());
  fireEvent.click(getTrigger());
  await waitFor(() => assert.ok(getDialog()));
  assert.equal(document.body.style.overflow, "hidden");
  view.unmount();
  await waitFor(() => assert.equal(document.body.style.overflow, ""));
  assert.equal((view.container as HTMLElement).hasAttribute("inert"), false);
  assert.equal(getDialog(), null);
});

test("Tooltip and Dialog layers respect the deepest overlay on Escape", async () => {
  function DialogLayerFixture() {
    const [element, setElement] = useState<HTMLDivElement | null>(null);
    useLayer({ element, onDismiss: () => {} });
    return h(
      "div",
      { ref: setElement, "data-testid": "dialog-fixture" },
      h(
        Tooltip,
        { delay: 0, closeDelay: 0 },
        h(TooltipTrigger, null, "Layer tooltip"),
        h(TooltipContent, null, "Layer hint"),
      ),
    );
  }

  render(h(DialogLayerFixture));
  const trigger = getTrigger("Layer tooltip");
  await act(async () => {
    trigger.focus();
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(document.querySelector("[role='tooltip']")));
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelector("[role='tooltip']"), null),
  );
  assert.ok(document.querySelector("[data-testid='dialog-fixture']"));
});

test("DialogClose supports asChild and outside/escape reasons are reported", async () => {
  const changes: Array<[boolean, DialogChangeReason]> = [];
  render(
    h(
      Dialog,
      {
        defaultOpen: true,
        onOpenChange: (open: boolean, reason: DialogChangeReason) =>
          changes.push([open, reason]),
      },
      h(DialogTrigger, null, "Open dialog"),
      h(
        DialogContent,
        null,
        h(DialogTitle, null, "Reasons"),
        h(
          DialogClose,
          { asChild: true },
          h("a", { href: "#close" }, "Custom cancel"),
        ),
      ),
    ),
  );
  await waitFor(() => assert.ok(getDialog()));
  const cancel = document.querySelector<HTMLAnchorElement>("a[href='#close']");
  assert.ok(cancel);
  fireEvent.click(cancel);
  await waitFor(() => assert.equal(getDialog(), null));
  assert.deepEqual(changes.at(-1), [false, "close-button"]);
});

test("focus containment discovers dynamically added focusable content", async () => {
  function Fixture() {
    const [extra, setExtra] = useState(false);
    return h(
      Dialog,
      { defaultOpen: true },
      h(DialogTrigger, null, "Open dialog"),
      h(
        DialogContent,
        null,
        h(DialogTitle, null, "Dynamic"),
        h("button", { type: "button" }, "First"),
        h(
          "button",
          { type: "button", onClick: () => setExtra(true) },
          "Add action",
        ),
        extra ? h("button", { type: "button" }, "New action") : null,
      ),
    );
  }
  render(h(Fixture));
  await waitFor(() => assert.ok(getDialog()));
  const dialog = getDialog();
  assert.ok(dialog);
  const add = [...dialog.querySelectorAll<HTMLButtonElement>("button")].find(
    (button) => button.textContent === "Add action",
  );
  assert.ok(add);
  fireEvent.click(add);
  await waitFor(() =>
    assert.ok(
      [...dialog.querySelectorAll("button")].some(
        (button) => button.textContent === "New action",
      ),
    ),
  );
  const buttons = [...dialog.querySelectorAll<HTMLButtonElement>("button")];
  buttons.at(-1)?.focus();
  await act(async () => {
    dispatchKey(document, { key: "Tab" });
    await Promise.resolve();
  });
  assert.equal(document.activeElement, buttons[0]);
});

test("Dialog inside Popover restores focus to the Dialog trigger after closing", async () => {
  render(
    h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, null, "Open popover"),
      h(
        PopoverContent,
        { "data-testid": "dialog-popover" },
        h(
          Dialog,
          null,
          h(DialogTrigger, null, "Open inner dialog"),
          h(DialogContent, null, h(DialogTitle, null, "Inner")),
        ),
      ),
    ),
  );
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='dialog-popover']")),
  );
  const inner = getTrigger("Open inner dialog");
  fireEvent.click(inner);
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='dialog']").length, 1),
  );
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='dialog']").length, 0),
  );
  await waitFor(() => assert.equal(document.activeElement, inner));
  assert.ok(document.querySelector("[data-testid='dialog-popover']"));
});

test("nested Dialogs expose state attributes and keep the parent modal boundary inert", async () => {
  render(
    h(
      Dialog,
      null,
      h(DialogTrigger, null, "Open parent"),
      h(
        DialogContent,
        null,
        h(DialogTitle, null, "Parent"),
        h(DialogClose, null, "Close parent"),
        h(
          Dialog,
          null,
          h(DialogTrigger, null, "Open nested"),
          h(
            DialogContent,
            null,
            h(DialogTitle, null, "Nested"),
            h(DialogClose, null, "Close nested"),
          ),
        ),
      ),
    ),
  );

  fireEvent.click(getTrigger("Open parent"));
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='dialog']").length, 1),
  );
  const parentPopup = [
    ...document.querySelectorAll<HTMLElement>("[role='dialog']"),
  ].find(
    (dialog) =>
      document.getElementById(dialog.getAttribute("aria-labelledby") ?? "")
        ?.textContent === "Parent",
  );
  assert.ok(parentPopup);
  const parentRoot = parentPopup.closest<HTMLElement>("[data-dialog-portal]");
  assert.ok(parentRoot);
  assert.equal(parentPopup.hasAttribute("data-nested"), false);

  fireEvent.click(getTrigger("Open nested"));
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='dialog']").length, 2),
  );
  const nestedPopup = [
    ...document.querySelectorAll<HTMLElement>("[role='dialog']"),
  ].find(
    (dialog) =>
      document.getElementById(dialog.getAttribute("aria-labelledby") ?? "")
        ?.textContent === "Nested",
  );
  assert.ok(nestedPopup);
  const nestedRoot = nestedPopup.closest<HTMLElement>("[data-dialog-portal]");
  assert.ok(nestedRoot);
  assert.equal(nestedPopup.hasAttribute("data-nested"), true);
  assert.equal(parentPopup.hasAttribute("data-nested-dialog-open"), true);
  assert.equal(parentRoot.getAttribute("inert"), "");
  assert.equal(nestedRoot.hasAttribute("inert"), false);

  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='dialog']").length, 1),
  );
  assert.equal(parentRoot.hasAttribute("inert"), false);
  assert.equal(parentPopup.hasAttribute("data-nested-dialog-open"), false);
});

test("keepMounted exposes closed state without trapping, locking, or inerting", async () => {
  const view = render(
    h(
      Dialog,
      null,
      h(DialogTrigger, null, "Open dialog"),
      h(
        DialogContent,
        { keepMounted: true, "data-testid": "mounted-dialog" },
        h(DialogTitle, null, "Mounted"),
        h(DialogClose, null, "Close"),
      ),
    ),
  );

  const popup = document.querySelector<HTMLElement>(
    "[data-testid='mounted-dialog']",
  );
  assert.ok(popup);
  assert.equal(popup.hidden, true);
  assert.equal(popup.dataset.state, "closed");
  assert.equal(popup.hasAttribute("data-closed"), true);
  assert.equal((view.container as HTMLElement).hasAttribute("inert"), false);
  assert.equal(document.body.style.overflow, "");

  fireEvent.click(getTrigger());
  await waitFor(() => assert.ok(getDialog()));
  assert.equal(popup.hidden, false);
  assert.equal(popup.dataset.state, "open");
  assert.equal(popup.hasAttribute("data-open"), true);
  assert.equal(document.activeElement, popup);

  fireEvent.click(getTrigger("Close"));
  await waitFor(() => assert.equal(popup.hidden, true));
  assert.equal(popup.dataset.state, "closed");
  assert.equal(document.body.style.overflow, "");
  assert.equal((view.container as HTMLElement).hasAttribute("inert"), false);
});

test("forwards refs and native trigger props", async () => {
  const triggerRef = createRef<HTMLButtonElement>();
  const contentRef = createRef<HTMLDivElement>();
  const closeRef = createRef<HTMLButtonElement>();
  let clicks = 0;

  render(
    h(
      Dialog,
      null,
      h(
        DialogTrigger,
        {
          ref: triggerRef,
          onClick: () => {
            clicks += 1;
          },
          "data-testid": "dialog-trigger",
        },
        "Open dialog",
      ),
      h(
        DialogContent,
        { ref: contentRef, "aria-label": "Ref dialog" },
        h(DialogTitle, null, "Refs"),
        h(DialogClose, { ref: closeRef }, "Close refs"),
      ),
    ),
  );

  const trigger = getTrigger();
  assert.equal(triggerRef.current, trigger);
  assert.equal(trigger.getAttribute("data-testid"), "dialog-trigger");
  fireEvent.click(trigger);
  await waitFor(() => assert.ok(getDialog()));
  assert.equal(clicks, 1);
  assert.equal(contentRef.current, getDialog());
  assert.equal(closeRef.current?.textContent, "Close refs");
});

test("handles a trigger that disconnects while the Dialog is open", async () => {
  function Fixture() {
    const [showTrigger, setShowTrigger] = useState(true);
    return h(
      Dialog,
      null,
      showTrigger ? h(DialogTrigger, null, "Open dialog") : null,
      h(
        DialogContent,
        null,
        h(DialogTitle, null, "Disconnected trigger"),
        h(
          "button",
          {
            type: "button",
            onClick: () => setShowTrigger(false),
          },
          "Remove trigger",
        ),
      ),
    );
  }

  render(h(Fixture));
  fireEvent.click(getTrigger("Open dialog"));
  await waitFor(() => assert.ok(getDialog()));
  fireEvent.click(getTrigger("Remove trigger"));
  await waitFor(() =>
    assert.equal(
      [...document.querySelectorAll("button")].some(
        (button) => button.textContent?.trim() === "Open dialog",
      ),
      false,
    ),
  );
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getDialog(), null));
});
