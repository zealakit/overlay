import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { StrictMode, createElement as h, createRef, useState } from "react";
import { renderToString } from "react-dom/server";
import type { ContextMenuChangeReason } from "../dist/index.js";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  Dialog,
  DialogContent,
  DialogTitle,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
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
  setBox,
  setViewport,
} from "./support/dom.ts";

afterEach(() => {
  cleanup();
  resetDom();
});

function getTrigger(name = "Area"): HTMLElement {
  const trigger = [
    ...document.querySelectorAll<HTMLElement>("[data-context-menu-trigger]"),
  ].find((element) => element.textContent?.trim() === name);
  assert.ok(trigger, `trigger ${name} not found`);
  return trigger;
}

function getMenu(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[role='menu']");
}

function getItems(): HTMLElement[] {
  return [
    ...document.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    ),
  ];
}

function rightClick(target: Element, x = 120, y = 80): MouseEvent {
  const event = new window.MouseEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    button: 2,
    clientX: x,
    clientY: y,
  });
  target.dispatchEvent(event);
  return event;
}

function basicMenu() {
  let selected = 0;
  return {
    selected: () => selected,
    element: h(
      ContextMenu,
      null,
      h(ContextMenuTrigger, null, "Area"),
      h(
        ContextMenuContent,
        { "data-testid": "menu" },
        h(
          ContextMenuItem,
          {
            onSelect: () => {
              selected += 1;
            },
          },
          "Copy",
        ),
        h(ContextMenuSeparator),
        h(ContextMenuItem, { disabled: true }, "Unavailable"),
      ),
    ),
  };
}

test("opens at the pointer, focuses the first item, and selects an item", async () => {
  const fixture = basicMenu();
  render(fixture.element);
  const trigger = getTrigger();
  await act(async () => {
    const event = rightClick(trigger, 140, 90);
    assert.equal(event.defaultPrevented, true);
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getMenu()));
  const menu = getMenu();
  assert.ok(menu);
  assert.equal(trigger.getAttribute("aria-expanded"), "true");
  await waitFor(() => assert.equal(document.activeElement, getItems()[0]));
  const copy = getItems()[0];
  assert.ok(copy);
  fireEvent.click(copy);
  await waitFor(() => assert.equal(getMenu(), null));
  assert.equal(fixture.selected(), 1);
  await waitFor(() => assert.equal(document.activeElement, trigger));
});

test("disabled ContextMenu does not suppress or open the native menu", async () => {
  render(
    h(
      ContextMenu,
      { disabled: true },
      h(ContextMenuTrigger, null, "Area"),
      h(ContextMenuContent, null, h(ContextMenuItem, null, "Copy")),
    ),
  );
  const trigger = getTrigger();
  const event = rightClick(trigger);
  assert.equal(event.defaultPrevented, false);
  await act(async () => {
    await Promise.resolve();
  });
  assert.equal(getMenu(), null);
  assert.equal(trigger.getAttribute("aria-expanded"), "false");
});

test("keyboard invocation anchors to the trigger and Escape restores focus", async () => {
  render(
    h(
      ContextMenu,
      null,
      h(ContextMenuTrigger, null, "Area"),
      h(ContextMenuContent, null, h(ContextMenuItem, null, "Copy")),
    ),
  );
  const trigger = getTrigger();
  trigger.focus();
  await act(async () => {
    dispatchKey(trigger, { key: "F10", shiftKey: true });
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getMenu()));
  await waitFor(() => assert.equal(document.activeElement, getItems()[0]));
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getMenu(), null));
  assert.equal(document.activeElement, trigger);

  await act(async () => {
    dispatchKey(trigger, { key: "ContextMenu" });
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getMenu()));
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
});

test("controlled state follows parent state and reports reasons", async () => {
  const changes: Array<[boolean, ContextMenuChangeReason]> = [];
  function Fixture() {
    const [open, setOpen] = useState(false);
    return h(
      "div",
      null,
      h(
        ContextMenu,
        {
          open,
          onOpenChange: (next: boolean, reason: ContextMenuChangeReason) => {
            changes.push([next, reason]);
            setOpen(next);
          },
        },
        h(ContextMenuTrigger, null, "Area"),
        h(ContextMenuContent, null, h(ContextMenuItem, null, "Copy")),
      ),
      h(
        "button",
        { type: "button", onClick: () => setOpen(true) },
        "Programmatic open",
      ),
    );
  }
  render(h(Fixture));
  await act(async () => {
    const opener = [
      ...document.querySelectorAll<HTMLButtonElement>("button"),
    ].find((button) => button.textContent?.trim() === "Programmatic open");
    assert.ok(opener);
    opener.click();
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getMenu()));
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getMenu(), null));
  assert.deepEqual(changes.at(-1), [false, "escape"]);
});

test("supports closeOnSelect false and select-event prevention", async () => {
  render(
    h(
      ContextMenu,
      null,
      h(ContextMenuTrigger, null, "Area"),
      h(
        ContextMenuContent,
        null,
        h(ContextMenuItem, { closeOnSelect: false }, "Stay open"),
        h(
          ContextMenuItem,
          {
            onSelect: (event) => event.preventDefault(),
          },
          "Also stays",
        ),
      ),
    ),
  );
  fireEvent.contextMenu(getTrigger());
  await waitFor(() => assert.ok(getMenu()));
  fireEvent.click(getItems()[0]);
  await act(async () => {
    await Promise.resolve();
  });
  assert.ok(getMenu());
  fireEvent.click(getItems()[1]);
  await act(async () => {
    await Promise.resolve();
  });
  assert.ok(getMenu());
});

test("supports checkbox and radio items without closing by default", async () => {
  function Fixture() {
    const [checked, setChecked] = useState(false);
    const [value, setValue] = useState("one");
    return h(
      ContextMenu,
      null,
      h(ContextMenuTrigger, null, "Area"),
      h(
        ContextMenuContent,
        null,
        h(
          ContextMenuCheckboxItem,
          {
            checked,
            onCheckedChange: setChecked,
            "data-testid": "checkbox",
          },
          "Show grid",
        ),
        h(
          ContextMenuRadioGroup,
          { value, onValueChange: setValue },
          h(ContextMenuRadioItem, { value: "one" }, "One"),
          h(ContextMenuRadioItem, { value: "two" }, "Two"),
        ),
        h(ContextMenuShortcut, null, "⌘S"),
      ),
    );
  }
  render(h(Fixture));
  fireEvent.contextMenu(getTrigger());
  await waitFor(() => assert.ok(getMenu()));
  const checkbox = document.querySelector("[data-testid='checkbox']");
  assert.ok(checkbox);
  assert.equal(checkbox.getAttribute("role"), "menuitemcheckbox");
  assert.equal(checkbox.getAttribute("aria-checked"), "false");
  fireEvent.click(checkbox);
  await act(async () => {
    await Promise.resolve();
  });
  assert.equal(checkbox.getAttribute("aria-checked"), "true");
  assert.ok(getMenu());

  const radios = [...document.querySelectorAll('[role="menuitemradio"]')];
  assert.equal(radios[0]?.getAttribute("aria-checked"), "true");
  fireEvent.click(radios[1] as HTMLElement);
  await act(async () => {
    await Promise.resolve();
  });
  assert.equal(radios[1]?.getAttribute("aria-checked"), "true");
  assert.equal(radios[0]?.getAttribute("aria-checked"), "false");
  assert.ok(getMenu());
});

test("supports groups, labels, separators, and non-focusable hints", async () => {
  render(
    h(
      ContextMenu,
      null,
      h(ContextMenuTrigger, null, "Area"),
      h(
        ContextMenuContent,
        null,
        h(
          ContextMenuGroup,
          null,
          h(ContextMenuLabel, null, "Edit"),
          h(ContextMenuItem, null, "Copy"),
          h(ContextMenuItem, null, "Paste"),
        ),
        h(ContextMenuSeparator, { "data-testid": "separator" }),
        h(
          ContextMenuItem,
          null,
          h("span", null, "Delete"),
          h(ContextMenuShortcut, null, "⌫"),
        ),
      ),
    ),
  );
  fireEvent.contextMenu(getTrigger());
  await waitFor(() => assert.ok(getMenu()));
  const label = document.querySelector("[data-context-menu-label]");
  const group = label?.parentElement;
  assert.ok(label && group);
  assert.equal(group.getAttribute("role"), "group");
  assert.equal(group.getAttribute("aria-labelledby"), label.id);
  const separator = document.querySelector("[data-testid='separator']");
  assert.equal(separator?.tagName, "HR");
  assert.equal(separator?.hasAttribute("tabindex"), false);
  const shortcut = document.querySelector("[data-context-menu-shortcut]");
  assert.equal(shortcut?.getAttribute("aria-hidden"), "true");
});

test("positions the root menu at the pointer coordinates", async () => {
  setViewport(800, 600);
  render(basicMenu().element);
  await act(async () => {
    rightClick(getTrigger(), 140, 90);
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getMenu()));
  await waitFor(() => {
    const menu = getMenu();
    assert.equal(menu?.style.left, "140px");
    assert.equal(menu?.style.top, "90px");
    assert.equal(menu?.dataset.side, "bottom");
    assert.equal(menu?.dataset.align, "start");
  });
});

test("supports arrow, Home/End, Enter/Space, and typeahead keyboard navigation", async () => {
  let selected = "";
  render(
    h(
      ContextMenu,
      null,
      h(ContextMenuTrigger, null, "Area"),
      h(
        ContextMenuContent,
        null,
        h(
          ContextMenuItem,
          {
            onSelect: () => {
              selected = "copy";
            },
          },
          "Copy",
        ),
        h(
          ContextMenuItem,
          {
            onSelect: () => {
              selected = "paste";
            },
          },
          "Paste",
        ),
        h(ContextMenuItem, { disabled: true }, "Disabled"),
        h(
          ContextMenuItem,
          {
            onSelect: () => {
              selected = "rename";
            },
          },
          "Rename",
        ),
      ),
    ),
  );
  fireEvent.contextMenu(getTrigger());
  await waitFor(() => assert.ok(getMenu()));
  await waitFor(() =>
    assert.equal(document.activeElement?.textContent, "Copy"),
  );

  await act(async () => {
    dispatchKey(document.activeElement ?? document, { key: "ArrowDown" });
    await Promise.resolve();
  });
  assert.equal(document.activeElement?.textContent, "Paste");
  await act(async () => {
    dispatchKey(document.activeElement ?? document, { key: "End" });
    await Promise.resolve();
  });
  assert.equal(document.activeElement?.textContent, "Rename");
  await act(async () => {
    dispatchKey(document.activeElement ?? document, { key: "Home" });
    await Promise.resolve();
  });
  assert.equal(document.activeElement?.textContent, "Copy");
  await act(async () => {
    dispatchKey(document.activeElement ?? document, { key: "r" });
    await Promise.resolve();
  });
  assert.equal(document.activeElement?.textContent, "Rename");
  await act(async () => {
    dispatchKey(document.activeElement ?? document, { key: "Enter" });
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getMenu(), null));
  assert.equal(selected, "rename");

  fireEvent.contextMenu(getTrigger());
  await waitFor(() => assert.ok(getMenu()));
  await waitFor(() =>
    assert.equal(document.activeElement?.textContent, "Copy"),
  );
  await act(async () => {
    dispatchKey(document.activeElement ?? document, { key: " " });
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getMenu(), null));
  assert.equal(selected, "copy");
});

test("outside pointer and right-click dismissal close the menu", async () => {
  render(basicMenu().element);
  fireEvent.contextMenu(getTrigger());
  await waitFor(() => assert.ok(getMenu()));
  await act(async () => {
    dispatchPointer(document.body);
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getMenu(), null));

  fireEvent.contextMenu(getTrigger());
  await waitFor(() => assert.ok(getMenu()));
  const event = rightClick(document.body, 10, 10);
  await act(async () => {
    await Promise.resolve();
  });
  assert.equal(event.defaultPrevented, false);
  await waitFor(() => assert.equal(getMenu(), null));
});

test("multiple independent ContextMenus replace the active menu", async () => {
  render(
    h(
      "div",
      null,
      h(
        ContextMenu,
        null,
        h(ContextMenuTrigger, null, "First"),
        h(ContextMenuContent, null, h(ContextMenuItem, null, "First action")),
      ),
      h(
        ContextMenu,
        null,
        h(ContextMenuTrigger, null, "Second"),
        h(ContextMenuContent, null, h(ContextMenuItem, null, "Second action")),
      ),
    ),
  );
  fireEvent.contextMenu(getTrigger("First"));
  await waitFor(() => assert.equal(getMenu()?.textContent, "First action"));
  const second = getTrigger("Second");
  await act(async () => {
    rightClick(second);
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getMenu()?.textContent, "Second action"));
});

test("opens a submenu with pointer/ArrowRight and closes it with ArrowLeft", async () => {
  render(
    h(
      ContextMenu,
      null,
      h(ContextMenuTrigger, null, "Area"),
      h(
        ContextMenuContent,
        null,
        h(ContextMenuItem, null, "Top"),
        h(
          ContextMenuSub,
          null,
          h(ContextMenuSubTrigger, null, "More"),
          h(
            ContextMenuSubContent,
            null,
            h(ContextMenuItem, null, "Nested one"),
            h(ContextMenuItem, null, "Nested two"),
          ),
        ),
      ),
    ),
  );
  fireEvent.contextMenu(getTrigger());
  await waitFor(() => assert.ok(getMenu()));
  const subTrigger = getItems().find((item) => item.textContent === "More");
  assert.ok(subTrigger);
  await act(async () => {
    fireEvent.pointerEnter(subTrigger);
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='menu']").length, 2),
  );
  const submenu = document.querySelector<HTMLElement>(
    "[role='menu'][data-submenu]",
  );
  assert.ok(submenu);
  assert.equal(subTrigger.getAttribute("aria-expanded"), "true");
  await waitFor(() => assert.equal(document.activeElement, getItems().at(-2)));
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='menu']").length, 1),
  );
  assert.equal(document.activeElement, subTrigger);
  assert.ok(getMenu());

  await act(async () => {
    dispatchKey(subTrigger, { key: "ArrowRight" });
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='menu']").length, 2),
  );
  const nested = getItems().find((item) => item.textContent === "Nested one");
  await waitFor(() => assert.equal(document.activeElement, nested));
  await act(async () => {
    dispatchKey(document.activeElement ?? document, { key: "ArrowLeft" });
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='menu']").length, 1),
  );
  assert.equal(document.activeElement, subTrigger);
});

test("supports RTL submenu direction and logical arrow keys", async () => {
  render(
    h(
      ContextMenu,
      { dir: "rtl" },
      h(ContextMenuTrigger, null, "Area"),
      h(
        ContextMenuContent,
        null,
        h(
          ContextMenuSub,
          null,
          h(ContextMenuSubTrigger, null, "المزيد"),
          h(ContextMenuSubContent, null, h(ContextMenuItem, null, "عنصر")),
        ),
      ),
    ),
  );
  fireEvent.contextMenu(getTrigger());
  await waitFor(() => assert.ok(getMenu()));
  const subTrigger = getItems()[0];
  assert.ok(subTrigger);
  await act(async () => {
    dispatchKey(subTrigger, { key: "ArrowLeft" });
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='menu']").length, 2),
  );
  const submenu = document.querySelector<HTMLElement>(
    "[role='menu'][data-submenu]",
  );
  assert.equal(submenu?.getAttribute("dir"), "rtl");
  assert.equal(submenu?.dataset.side, "left");
  await act(async () => {
    dispatchKey(document.activeElement ?? document, { key: "ArrowRight" });
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='menu']").length, 1),
  );
});

test("works inside a Dialog without closing it and can open a Dialog from an item", async () => {
  function Fixture() {
    const [dialogOpen, setDialogOpen] = useState(false);
    return h(
      "div",
      null,
      h(
        Dialog,
        { defaultOpen: true },
        h(
          DialogContent,
          null,
          h(DialogTitle, null, "Outer"),
          h(
            ContextMenu,
            null,
            h(ContextMenuTrigger, null, "Area"),
            h(
              ContextMenuContent,
              null,
              h(
                ContextMenuItem,
                {
                  onSelect: () => {
                    setDialogOpen(true);
                  },
                },
                "Open child dialog",
              ),
            ),
          ),
        ),
      ),
      h(
        Dialog,
        { open: dialogOpen, onOpenChange: setDialogOpen },
        h(DialogContent, null, h(DialogTitle, null, "Child")),
      ),
    );
  }
  render(h(Fixture));
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='dialog']").length, 1),
  );
  fireEvent.contextMenu(getTrigger());
  await waitFor(() => assert.ok(getMenu()));
  assert.ok(getMenu()?.closest("[role='dialog']"));
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getMenu(), null));
  assert.equal(document.querySelectorAll("[role='dialog']").length, 1);

  fireEvent.contextMenu(getTrigger());
  await waitFor(() => assert.ok(getMenu()));
  const item = getItems()[0];
  assert.ok(item);
  fireEvent.click(item);
  await waitFor(() => assert.equal(getMenu(), null));
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='dialog']").length, 2),
  );
});

test("supports custom portal targets and inline rendering", async () => {
  const custom = document.createElement("div");
  custom.id = "context-menu-portal";
  document.body.append(custom);
  render(
    h(
      ContextMenu,
      null,
      h(ContextMenuTrigger, null, "Area"),
      h(
        ContextMenuContent,
        { portal: custom },
        h(ContextMenuItem, null, "Custom"),
      ),
    ),
  );
  fireEvent.contextMenu(getTrigger());
  await waitFor(() => assert.ok(getMenu()));
  assert.equal(getMenu()?.parentElement, custom);
});

test("supports SSR and Strict Mode", async () => {
  const html = renderToString(
    h(
      ContextMenu,
      null,
      h(ContextMenuTrigger, null, "Area"),
      h(ContextMenuContent, null, h(ContextMenuItem, null, "Copy")),
    ),
  );
  assert.match(html, /Area/);
  assert.equal(html.includes('role="menu"'), false);

  render(
    h(
      StrictMode,
      null,
      h(
        ContextMenu,
        null,
        h(ContextMenuTrigger, null, "Area"),
        h(ContextMenuContent, null, h(ContextMenuItem, null, "Copy")),
      ),
    ),
  );
  fireEvent.contextMenu(getTrigger());
  await waitFor(() => assert.ok(getMenu()));
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getMenu(), null));
});

test("collision handling keeps the menu inside a small viewport", async () => {
  setViewport(300, 200);
  render(basicMenu().element);
  await act(async () => {
    rightClick(getTrigger(), 280, 180);
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getMenu()));
  const menu = getMenu();
  assert.ok(menu);
  setBox(menu, { x: 0, y: 0, width: 160, height: 120 });
  await act(async () => {
    window.dispatchEvent(new Event("resize"));
    await Promise.resolve();
  });
  await waitFor(() => {
    assert.equal(menu.dataset.side, "top");
    assert.ok(Number.parseFloat(menu.style.left) <= 140);
  });
});

test("supports RTL root alignment and data attributes", async () => {
  render(
    h(
      ContextMenu,
      { dir: "rtl" },
      h(ContextMenuTrigger, null, "Area"),
      h(
        ContextMenuContent,
        {
          style: { direction: "rtl" },
          collisionAvoidance: { flip: false, shift: false },
        },
        h(ContextMenuItem, null, "نسخ"),
      ),
    ),
  );
  fireEvent.contextMenu(getTrigger(), { clientX: 500, clientY: 50 });
  await waitFor(() => assert.ok(getMenu()));
  const menu = getMenu();
  assert.ok(menu);
  setBox(menu, { x: 0, y: 0, width: 160, height: 80 });
  await act(async () => {
    window.dispatchEvent(new Event("resize"));
    await Promise.resolve();
  });
  assert.equal(menu?.getAttribute("dir"), "rtl");
  assert.equal(menu?.dataset.side, "bottom");
  assert.equal(menu?.dataset.align, "start");
  assert.equal(Number.parseFloat(menu.style.left), 340);
  assert.equal(menu?.hasAttribute("data-context-menu"), true);
});

test("supports custom trigger and item elements with refs and native props", async () => {
  const triggerRef = createRef<HTMLButtonElement>();
  let selected = 0;
  render(
    h(
      ContextMenu,
      null,
      h(
        ContextMenuTrigger,
        { asChild: true, ref: triggerRef, "data-testid": "custom-trigger" },
        h("button", { type: "button" }, "Custom target"),
      ),
      h(
        ContextMenuContent,
        null,
        h(
          ContextMenuItem,
          {
            asChild: true,
            onSelect: () => {
              selected += 1;
            },
          },
          h("a", { href: "#copy" }, "Custom item"),
        ),
      ),
    ),
  );
  const trigger = getTrigger("Custom target");
  assert.equal(triggerRef.current, trigger);
  assert.equal(trigger.getAttribute("data-testid"), "custom-trigger");
  fireEvent.contextMenu(trigger);
  await waitFor(() => assert.ok(getMenu()));
  const item = getItems()[0];
  assert.equal(item.tagName, "A");
  assert.equal(item.getAttribute("role"), "menuitem");
  fireEvent.click(item);
  await waitFor(() => assert.equal(getMenu(), null));
  assert.equal(selected, 1);
});

test("keeps a submenu open while moving into it, then closes after pointer leave", async () => {
  render(
    h(
      ContextMenu,
      null,
      h(ContextMenuTrigger, null, "Area"),
      h(
        ContextMenuContent,
        null,
        h(
          ContextMenuSub,
          null,
          h(ContextMenuSubTrigger, null, "More"),
          h(ContextMenuSubContent, null, h(ContextMenuItem, null, "Nested")),
        ),
      ),
    ),
  );
  fireEvent.contextMenu(getTrigger());
  await waitFor(() => assert.ok(getMenu()));
  const subTrigger = getItems()[0];
  await act(async () => {
    fireEvent.pointerEnter(subTrigger);
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='menu']").length, 2),
  );
  const submenu = document.querySelector<HTMLElement>(
    "[role='menu'][data-submenu]",
  );
  assert.ok(submenu);

  fireEvent.pointerLeave(subTrigger);
  fireEvent.pointerEnter(submenu);
  await new Promise((resolve) => setTimeout(resolve, 140));
  assert.equal(document.querySelectorAll("[role='menu']").length, 2);

  fireEvent.pointerLeave(submenu);
  await new Promise((resolve) => setTimeout(resolve, 140));
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='menu']").length, 1),
  );
  assert.ok(getMenu());
});

test("supports inline rendering", async () => {
  render(
    h(
      ContextMenu,
      null,
      h(ContextMenuTrigger, null, "Area"),
      h(
        ContextMenuContent,
        { portal: false },
        h(ContextMenuItem, null, "Inline"),
      ),
    ),
  );
  fireEvent.contextMenu(getTrigger());
  await waitFor(() => assert.ok(getMenu()));
  assert.equal(getMenu()?.closest("[data-context-menu]"), getMenu());
});

test("selecting a nested item closes the whole menu hierarchy", async () => {
  let selected = false;
  render(
    h(
      ContextMenu,
      null,
      h(ContextMenuTrigger, null, "Area"),
      h(
        ContextMenuContent,
        null,
        h(
          ContextMenuSub,
          null,
          h(ContextMenuSubTrigger, null, "More"),
          h(
            ContextMenuSubContent,
            null,
            h(
              ContextMenuItem,
              {
                onSelect: () => {
                  selected = true;
                },
              },
              "Nested action",
            ),
          ),
        ),
      ),
    ),
  );
  fireEvent.contextMenu(getTrigger());
  await waitFor(() => assert.ok(getMenu()));
  const subTrigger = getItems()[0];
  await act(async () => {
    dispatchKey(subTrigger, { key: "ArrowRight" });
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='menu']").length, 2),
  );
  const nested = getItems().find(
    (item) => item.textContent === "Nested action",
  );
  assert.ok(nested);
  fireEvent.click(nested);
  await waitFor(() =>
    assert.equal(document.querySelectorAll("[role='menu']").length, 0),
  );
  assert.equal(selected, true);
});
