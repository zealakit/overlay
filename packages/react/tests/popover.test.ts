import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  StrictMode,
  createElement as h,
  createRef,
  forwardRef,
  useState,
  type ButtonHTMLAttributes,
} from "react";
import type { PopoverChangeReason } from "../dist/index.js";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverPopup,
  PopoverPositioner,
  PopoverTrigger,
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
  dispatchPointer,
  resetDom,
  setBox,
  setViewport,
} from "./support/dom.ts";

afterEach(() => {
  cleanup();
  resetDom();
});

function getTrigger(name = "Open"): HTMLButtonElement {
  const trigger = [
    ...document.querySelectorAll<HTMLButtonElement>("button"),
  ].find((button) => button.textContent === name);
  assert.ok(trigger, `trigger ${name} not found`);
  return trigger;
}

function getPopup(): HTMLElement {
  const popup = document.querySelector<HTMLElement>("[data-testid='popup']");
  assert.ok(popup, "popup not found");
  return popup;
}

function basicPopover() {
  return h(
    Popover,
    null,
    h(PopoverTrigger, null, "Open"),
    h(
      PopoverContent,
      { "data-testid": "popup", className: "panel", style: { maxWidth: 320 } },
      h(
        PopoverHeader,
        null,
        h(PopoverTitle, null, "Account"),
        h(PopoverDescription, null, "Manage your account."),
      ),
      h("p", null, "Plain content"),
      h(PopoverClose, null, "Close"),
    ),
  );
}

test("basic popover composition wires trigger, content, and native props", async () => {
  render(basicPopover());

  const trigger = getTrigger();
  assert.equal(trigger.getAttribute("aria-expanded"), "false");
  assert.equal(trigger.getAttribute("aria-controls"), null);

  trigger.focus();
  fireEvent.click(trigger);
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );

  const popup = getPopup();
  assert.equal(trigger.getAttribute("aria-expanded"), "true");
  assert.equal(trigger.getAttribute("aria-controls"), popup.id);
  assert.equal(popup.className, "panel");
  assert.equal(popup.style.maxWidth, "320px");
  assert.equal(popup.dataset.state, "open");
  assert.equal(popup.hasAttribute("data-open"), true);
  assert.equal(
    popup.getAttribute("aria-labelledby"),
    popup.querySelector("h2")?.id,
  );
  assert.equal(
    popup.getAttribute("aria-describedby"),
    popup.querySelector("p")?.id,
  );
  assert.equal(popup.querySelector("h2")?.textContent, "Account");
  assert.equal(popup.textContent?.includes("Plain content"), true);

  fireEvent.click(getTrigger("Close"));
  await waitFor(() =>
    assert.equal(document.querySelector("[data-testid='popup']"), null),
  );
  assert.equal(trigger.getAttribute("aria-expanded"), "false");
  assert.equal(document.activeElement, trigger);
});

test("controlled state and change reasons do not conflict", async () => {
  const changes: Array<[boolean, PopoverChangeReason]> = [];

  function App() {
    const [open, setOpen] = useState(false);
    return h(
      Popover,
      {
        open,
        onOpenChange: (next: boolean, reason: PopoverChangeReason) => {
          changes.push([next, reason]);
          setOpen(next);
        },
      },
      h(PopoverTrigger, null, "Toggle"),
      h(
        PopoverContent,
        { "data-testid": "popup" },
        h("button", { type: "button", id: "inside" }, "Inside"),
      ),
    );
  }

  render(h(App));
  fireEvent.click(getTrigger("Toggle"));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  assert.deepEqual(changes.at(-1), [true, "trigger"]);

  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelector("[data-testid='popup']"), null),
  );
  assert.deepEqual(changes.at(-1), [false, "escape"]);

  fireEvent.click(getTrigger("Toggle"));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  await act(async () => {
    dispatchPointer(document.body);
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelector("[data-testid='popup']"), null),
  );
  assert.deepEqual(changes.at(-1), [false, "outside-press"]);
});

test("asChild composes a custom trigger without nested buttons", async () => {
  const ref = createRef<HTMLButtonElement>();
  let clicks = 0;

  render(
    h(
      Popover,
      null,
      h(
        PopoverTrigger,
        {
          asChild: true,
          ref,
          onClick: () => {
            clicks += 1;
          },
        },
        h("button", { type: "button", className: "custom" }, "Custom"),
      ),
      h(PopoverContent, { "data-testid": "popup" }, "Content"),
    ),
  );

  const trigger = getTrigger("Custom");
  assert.equal(trigger, ref.current);
  assert.equal(trigger.className, "custom");
  assert.equal(document.querySelectorAll("button button").length, 0);

  fireEvent.click(trigger);
  assert.equal(clicks, 1);
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
});

test("disabled trigger does not open", async () => {
  render(
    h(
      Popover,
      null,
      h(PopoverTrigger, { disabled: true }, "Disabled"),
      h(PopoverContent, { "data-testid": "popup" }, "Content"),
    ),
  );

  fireEvent.click(getTrigger("Disabled"));
  await act(async () => {
    await Promise.resolve();
  });
  assert.equal(document.querySelector("[data-testid='popup']"), null);
});

test("form controls stay interactive and do not dismiss the popover", async () => {
  render(
    h(
      Popover,
      null,
      h(PopoverTrigger, null, "Form"),
      h(
        PopoverContent,
        { "data-testid": "popup" },
        h("label", null, "Name", h("input", { id: "name" })),
        h("label", null, "Notes", h("textarea", { id: "notes" })),
        h("button", { type: "button", id: "submit" }, "Submit"),
      ),
    ),
  );

  fireEvent.click(getTrigger("Form"));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );

  const input = document.getElementById("name") as HTMLInputElement;
  const textarea = document.getElementById("notes") as HTMLTextAreaElement;
  await act(async () => {
    input.focus();
    fireEvent.change(input, { target: { value: "Huy" } });
    textarea.focus();
    fireEvent.change(textarea, { target: { value: "Hello" } });
  });

  assert.equal(input.value, "Huy");
  assert.equal(textarea.value, "Hello");
  assert.ok(document.querySelector("[data-testid='popup']"));
});

test("supports all twelve physical placements and forwards offsets", async () => {
  setViewport(2000, 2000);
  const placements = [
    ["top", "start"],
    ["top", "center"],
    ["top", "end"],
    ["bottom", "start"],
    ["bottom", "center"],
    ["bottom", "end"],
    ["left", "start"],
    ["left", "center"],
    ["left", "end"],
    ["right", "start"],
    ["right", "center"],
    ["right", "end"],
  ] as const;

  function Playground(props: {
    side: "top" | "bottom" | "left" | "right";
    align: "start" | "center" | "end";
  }) {
    return h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, null, "Anchor"),
      h(
        PopoverContent,
        {
          "data-testid": "popup",
          side: props.side,
          align: props.align,
          sideOffset: 10,
          alignOffset: 4,
          collisionAvoidance: { flip: false, shift: false },
        },
        "Content",
      ),
    );
  }

  const view = render(h(Playground, { side: "top", align: "start" }));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  const trigger = getTrigger("Anchor");
  setBox(trigger, { x: 900, y: 900, width: 80, height: 40 });

  for (const [side, align] of placements) {
    view.rerender(h(Playground, { side, align }));
    await waitFor(() => {
      const popup = getPopup();
      assert.equal(popup.dataset.side, side);
      assert.equal(popup.dataset.align, align);
    });
  }

  const popup = getPopup();
  assert.equal(popup.hasAttribute("side"), false);
  assert.equal(popup.hasAttribute("sideoffset"), false);
  assert.equal(popup.hasAttribute("alignoffset"), false);
  assert.equal(popup.hasAttribute("collisionavoidance"), false);
});

test("RTL maps horizontal start/end alignment while left/right stay physical", async () => {
  setViewport(2000, 2000);
  const view = render(
    h(
      Popover,
      { defaultOpen: true, dir: "rtl" },
      h(PopoverTrigger, null, "RTL"),
      h(
        PopoverContent,
        {
          "data-testid": "popup",
          side: "bottom",
          align: "start",
          style: { direction: "rtl" },
          collisionAvoidance: { flip: false, shift: false },
        },
        "Content",
      ),
    ),
  );

  const trigger = getTrigger("RTL");
  const popup = getPopup();
  setBox(trigger, { x: 900, y: 900, width: 80, height: 40 });
  setBox(popup, { x: 0, y: 0, width: 200, height: 80 });

  await waitFor(() => {
    assert.equal(popup.dataset.side, "bottom");
    assert.equal(popup.dataset.align, "start");
  });

  await act(async () => {
    window.dispatchEvent(new Event("resize"));
    await Promise.resolve();
  });
  await waitFor(() => {
    // RTL "start" resolves to the physical right edge: 900 + 80 - 200.
    assert.equal(Number.parseFloat(popup.style.left), 780);
  });

  view.rerender(
    h(
      Popover,
      { defaultOpen: true, dir: "rtl" },
      h(PopoverTrigger, null, "RTL"),
      h(
        PopoverContent,
        {
          "data-testid": "popup",
          side: "right",
          align: "start",
          collisionAvoidance: { flip: false, shift: false },
        },
        "Content",
      ),
    ),
  );

  await waitFor(() => {
    assert.equal(getPopup().dataset.side, "right");
    assert.equal(getPopup().dataset.align, "start");
  });
});

test("supports dismissal opt-outs and close-button reason", async () => {
  const changes: Array<[boolean, PopoverChangeReason]> = [];
  render(
    h(
      Popover,
      {
        dismissOnEscape: false,
        dismissOnOutsidePress: false,
        onOpenChange: (next: boolean, reason: PopoverChangeReason) => {
          changes.push([next, reason]);
        },
      },
      h(PopoverTrigger, null, "OptOut"),
      h(
        PopoverContent,
        { "data-testid": "popup" },
        h(PopoverClose, null, "Dismiss"),
      ),
    ),
  );

  fireEvent.click(getTrigger("OptOut"));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );

  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  assert.ok(document.querySelector("[data-testid='popup']"));

  await act(async () => {
    dispatchPointer(document.body);
    await Promise.resolve();
  });
  assert.ok(document.querySelector("[data-testid='popup']"));

  fireEvent.click(getTrigger("Dismiss"));
  await waitFor(() =>
    assert.equal(document.querySelector("[data-testid='popup']"), null),
  );
  assert.deepEqual(changes.at(-1), [false, "close-button"]);
});

test("portals to the default body, a custom container, or renders in place", async () => {
  const custom = document.createElement("div");
  custom.id = "custom-portal";
  document.body.append(custom);

  const defaultView = render(
    h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, null, "Default"),
      h(PopoverContent, { "data-testid": "popup" }, "Default content"),
    ),
  );
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  assert.equal(getPopup().parentElement, document.body);
  defaultView.unmount();

  const customView = render(
    h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, null, "Custom"),
      h(
        PopoverContent,
        { "data-testid": "popup", portal: custom },
        "Custom content",
      ),
    ),
  );
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  assert.equal(getPopup().parentElement, custom);
  customView.unmount();

  render(
    h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, null, "Inline"),
      h(
        PopoverContent,
        { "data-testid": "popup", portal: false },
        "Inline content",
      ),
    ),
  );
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  assert.notEqual(getPopup().parentElement, document.body);
});

test("advanced Portal/Positioner/Popup composition works without Content", async () => {
  render(
    h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, null, "Advanced"),
      h(
        PopoverPositioner,
        { side: "right", align: "start" },
        h(
          PopoverPopup,
          { "data-testid": "popup", className: "advanced-popup" },
          "Advanced content",
        ),
      ),
    ),
  );

  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  assert.equal(getPopup().className, "advanced-popup");
  assert.equal(getPopup().dataset.side, "right");
});

test("supports a separate anchor and dynamic anchor replacement", async () => {
  setViewport(2000, 2000);

  function AnchorCase() {
    const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
    const [second, setSecond] = useState<HTMLButtonElement | null>(null);
    return h(
      "div",
      null,
      h("button", { ref: setAnchor, type: "button", id: "anchor" }, "Anchor"),
      h("button", { ref: setSecond, type: "button", id: "second" }, "Second"),
      h(
        "button",
        {
          type: "button",
          id: "switch",
          onClick: () => setAnchor(second),
        },
        "Switch",
      ),
      h(
        Popover,
        null,
        h(PopoverTrigger, null, "Open"),
        h(
          PopoverContent,
          {
            anchor,
            side: "right",
            align: "start",
            collisionAvoidance: { flip: false, shift: false },
            "data-testid": "popup",
          },
          "Anchored content",
        ),
      ),
    );
  }

  render(h(AnchorCase));
  const anchor = document.getElementById("anchor") as HTMLButtonElement;
  const second = document.getElementById("second") as HTMLButtonElement;
  setBox(anchor, { x: 300, y: 20, width: 80, height: 40 });
  setBox(second, { x: 500, y: 20, width: 60, height: 40 });

  fireEvent.click(getTrigger("Open"));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  await waitFor(() => assert.equal(getPopup().style.left, "380px"));
  fireEvent.click(document.getElementById("switch") as HTMLButtonElement);
  await waitFor(() => assert.equal(getPopup().style.left, "560px"));
});

test("does not steal focus by default and restores it when closing", async () => {
  render(
    h(
      Popover,
      null,
      h(PopoverTrigger, null, "Focus"),
      h(
        PopoverContent,
        { "data-testid": "popup" },
        h("button", { type: "button", id: "inside" }, "Inside"),
        h(PopoverClose, null, "Close"),
      ),
    ),
  );

  const trigger = getTrigger("Focus");
  trigger.focus();
  fireEvent.click(trigger);
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  assert.equal(document.activeElement, trigger);

  const inside = document.getElementById("inside") as HTMLButtonElement;
  inside.focus();
  fireEvent.click(getTrigger("Close"));
  await waitFor(() =>
    assert.equal(document.querySelector("[data-testid='popup']"), null),
  );
  assert.equal(document.activeElement, trigger);
});

test("does not trap focus by default", async () => {
  render(
    h(
      "div",
      null,
      h(
        Popover,
        null,
        h(PopoverTrigger, null, "NoTrap"),
        h(PopoverContent, { "data-testid": "popup" }, "Content"),
      ),
      h("button", { type: "button", id: "outside-focus" }, "Outside"),
    ),
  );

  fireEvent.click(getTrigger("NoTrap"));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  const outside = document.getElementById("outside-focus") as HTMLButtonElement;
  outside.focus();
  assert.equal(document.activeElement, outside);
});

test("supports explicit initial focus and focus containment", async () => {
  render(
    h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, null, "Trap"),
      h(
        PopoverContent,
        { "data-testid": "popup", initialFocus: true, trapFocus: true },
        h("button", { type: "button", id: "first" }, "First"),
        h("button", { type: "button", id: "second" }, "Second"),
      ),
    ),
  );

  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  await waitFor(() => assert.equal(document.activeElement?.id, "first"));
  const first = document.getElementById("first") as HTMLButtonElement;
  const second = document.getElementById("second") as HTMLButtonElement;
  second.focus();
  await act(async () => {
    fireEvent.keyDown(second, { key: "Tab" });
    await Promise.resolve();
  });
  assert.equal(document.activeElement, first);
});

test("nested popovers isolate child dismissal and preserve the parent", async () => {
  function Nested() {
    return h(
      Popover,
      null,
      h(PopoverTrigger, null, "Parent"),
      h(
        PopoverContent,
        { "data-testid": "parent-popup" },
        h(
          Popover,
          null,
          h(PopoverTrigger, null, "Child"),
          h(PopoverContent, { "data-testid": "child-popup" }, "Child content"),
        ),
        "Parent content",
      ),
    );
  }

  render(h(Nested));
  fireEvent.click(getTrigger("Parent"));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='parent-popup']")),
  );
  fireEvent.click(getTrigger("Child"));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='child-popup']")),
  );

  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelector("[data-testid='child-popup']"), null),
  );
  assert.ok(document.querySelector("[data-testid='parent-popup']"));

  await act(async () => {
    dispatchPointer(document.body);
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelector("[data-testid='parent-popup']"), null),
  );
});

test("renders on the server and remains Strict Mode safe", async () => {
  const { renderToString } = await import("react-dom/server");
  const html = renderToString(
    h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, null, "SSR"),
      h(
        PopoverContent,
        { "data-testid": "popup" },
        h(PopoverTitle, null, "SSR title"),
        "SSR content",
      ),
    ),
  );
  assert.match(html, /aria-expanded="true"/);
  assert.match(html, /SSR/);
  assert.equal(html.includes("SSR content"), false);

  render(
    h(
      StrictMode,
      null,
      h(
        Popover,
        null,
        h(PopoverTrigger, null, "Strict"),
        h(PopoverContent, { "data-testid": "popup" }, "Strict content"),
      ),
    ),
  );
  fireEvent.click(getTrigger("Strict"));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelector("[data-testid='popup']"), null),
  );
});

test("forwards side and align offsets without leaking positioning props to the DOM", async () => {
  setViewport(2000, 2000);
  render(
    h(
      Popover,
      null,
      h(PopoverTrigger, null, "Offset"),
      h(
        PopoverContent,
        {
          "data-testid": "popup",
          side: "right",
          align: "start",
          sideOffset: 8,
          alignOffset: 4,
          collisionAvoidance: { flip: false, shift: false },
        },
        "Content",
      ),
    ),
  );

  const trigger = getTrigger("Offset");
  setBox(trigger, { x: 10, y: 20, width: 100, height: 40 });
  fireEvent.click(trigger);
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );

  await waitFor(() => {
    const popup = getPopup();
    assert.equal(popup.style.left, "118px");
    assert.equal(popup.style.top, "24px");
    assert.equal(
      popup.style.getPropertyValue("--popover-anchor-width"),
      "100px",
    );
    assert.equal(
      popup.style.getPropertyValue("--popover-anchor-height"),
      "40px",
    );
    assert.equal(popup.hasAttribute("side"), false);
    assert.equal(popup.hasAttribute("sideoffset"), false);
    assert.equal(popup.hasAttribute("alignoffset"), false);
    assert.equal(popup.getAttribute("role"), null);
    assert.equal(popup.getAttribute("aria-modal"), null);
  });
});

test("collision avoidance can flip or be disabled", async () => {
  setViewport(400, 300);
  const anchor = document.createElement("button");
  document.body.append(anchor);
  setBox(anchor, { x: 360, y: 80, width: 60, height: 30 });

  function Case({ flip }: { flip: boolean }) {
    return h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, null, "Flip"),
      h(
        PopoverContent,
        {
          "data-testid": "popup",
          anchor,
          side: "right",
          align: "start",
          sideOffset: 8,
          collisionAvoidance: { flip, shift: false },
        },
        "Content",
      ),
    );
  }

  const view = render(h(Case, { flip: true }));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  await waitFor(() => assert.equal(getPopup().dataset.side, "left"));

  view.rerender(h(Case, { flip: false }));
  await waitFor(() => assert.equal(getPopup().dataset.side, "right"));
});

test("supports custom button components and consumer event cancellation", async () => {
  const ref = createRef<HTMLButtonElement>();
  const CustomButton = forwardRef<
    HTMLButtonElement,
    ButtonHTMLAttributes<HTMLButtonElement>
  >(function CustomButton(props, forwardedRef) {
    return h("button", { ...props, ref: forwardedRef, type: "button" });
  });

  const view = render(
    h(
      Popover,
      null,
      h(
        PopoverTrigger,
        { asChild: true, ref },
        h(CustomButton, { "aria-label": "Open settings" }, "Settings"),
      ),
      h(PopoverContent, { "data-testid": "popup" }, "Custom content"),
    ),
  );

  const trigger = getTrigger("Settings");
  assert.equal(trigger, ref.current);
  assert.equal(trigger.getAttribute("aria-label"), "Open settings");
  trigger.focus();
  fireEvent.click(trigger);
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  view.unmount();

  render(
    h(
      Popover,
      null,
      h(
        PopoverTrigger,
        {
          asChild: true,
          onClick: (event) => event.preventDefault(),
        },
        h("button", { type: "button" }, "Cancel"),
      ),
      h(PopoverContent, { "data-testid": "cancelled-popup" }, "No"),
    ),
  );
  fireEvent.click(getTrigger("Cancel"));
  await act(async () => {
    await Promise.resolve();
  });
  assert.equal(document.querySelector("[data-testid='cancelled-popup']"), null);
});

test("supports a trigger inside an input group without nested interactive elements", async () => {
  render(
    h(
      "div",
      { role: "group", "aria-label": "Search" },
      h("input", { "aria-label": "Search input" }),
      h(
        Popover,
        null,
        h(
          PopoverTrigger,
          { asChild: true },
          h("button", { type: "button", className: "group-button" }, "Filters"),
        ),
        h(PopoverContent, { "data-testid": "popup" }, "Filters content"),
      ),
    ),
  );

  assert.equal(document.querySelectorAll("button button").length, 0);
  assert.ok(document.querySelector("input[aria-label='Search input']"));
  fireEvent.click(getTrigger("Filters"));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
});

test("supports dynamic content without closing the popover", async () => {
  function Dynamic() {
    const [count, setCount] = useState(1);
    return h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, null, "Dynamic"),
      h(
        PopoverContent,
        { "data-testid": "popup" },
        h("p", null, `Items: ${count}`),
        h(
          "button",
          {
            type: "button",
            id: "add",
            onClick: () => setCount((current) => current + 1),
          },
          "Add",
        ),
      ),
    );
  }

  render(h(Dynamic));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  fireEvent.click(document.getElementById("add") as HTMLButtonElement);
  await waitFor(() => assert.match(getPopup().textContent ?? "", /Items: 2/));
  assert.ok(document.querySelector("[data-testid='popup']"));
});

test("integrates a popover inside a dialog-like parent layer and respects layer order", async () => {
  function DialogFixture() {
    const [dialogElement, setDialogElement] = useState<HTMLDivElement | null>(
      null,
    );
    const [dialogOpen, setDialogOpen] = useState(true);
    const layer = useLayer({
      element: dialogElement,
      onDismiss: () => setDialogOpen(false),
    });

    if (!dialogOpen) {
      return null;
    }

    return h(
      "div",
      { ref: setDialogElement, "data-testid": "dialog" },
      dialogOpen
        ? h(
            Popover,
            { parentLayer: layer.handle },
            h(PopoverTrigger, null, "Dialog popover"),
            h(PopoverContent, { "data-testid": "popup" }, "Inside dialog"),
          )
        : null,
    );
  }

  render(h(DialogFixture));
  fireEvent.click(getTrigger("Dialog popover"));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );

  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelector("[data-testid='popup']"), null),
  );
  assert.ok(document.querySelector("[data-testid='dialog']"));

  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelector("[data-testid='dialog']"), null),
  );
});

test("a dialog-like layer inside a popover takes Escape priority", async () => {
  function DialogLayer({ onClose }: { onClose: () => void }) {
    const [element, setElement] = useState<HTMLDivElement | null>(null);
    const layer = useLayer({
      element,
      onDismiss: onClose,
      dismissOnOutsidePress: false,
    });
    return h(
      "div",
      {
        ref: setElement,
        "data-testid": "inner-dialog",
        "data-topmost": String(layer.isTopmost),
      },
      "Dialog content",
    );
  }

  function App() {
    const [dialogOpen, setDialogOpen] = useState(false);
    return h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, null, "Parent"),
      h(
        PopoverContent,
        { "data-testid": "popup" },
        dialogOpen
          ? h(DialogLayer, { onClose: () => setDialogOpen(false) })
          : h(
              "button",
              {
                type: "button",
                id: "open-dialog",
                onClick: () => setDialogOpen(true),
              },
              "Open dialog",
            ),
      ),
    );
  }

  render(h(App));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  fireEvent.click(document.getElementById("open-dialog") as HTMLButtonElement);
  await waitFor(() => {
    const dialog = document.querySelector("[data-testid='inner-dialog']");
    assert.ok(dialog);
    assert.equal(dialog.getAttribute("data-topmost"), "true");
  });

  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelector("[data-testid='inner-dialog']"), null),
  );
  assert.ok(document.querySelector("[data-testid='popup']"));
});

test("parent focus containment yields to an open child popover", async () => {
  render(
    h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, null, "Focus parent"),
      h(
        PopoverContent,
        { "data-testid": "parent-popup", trapFocus: true },
        h(
          Popover,
          null,
          h(PopoverTrigger, null, "Focus child"),
          h(
            PopoverContent,
            { "data-testid": "child-popup" },
            h("button", { type: "button", id: "child-focus" }, "Child focus"),
          ),
        ),
      ),
    ),
  );

  fireEvent.click(getTrigger("Focus child"));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='child-popup']")),
  );
  const childFocus = document.getElementById(
    "child-focus",
  ) as HTMLButtonElement;
  childFocus.focus();
  assert.equal(document.activeElement, childFocus);
});

test("multiple independent popovers keep isolated state", async () => {
  render(
    h(
      "div",
      null,
      h(
        Popover,
        null,
        h(PopoverTrigger, null, "First"),
        h(PopoverContent, { "data-testid": "first-popup" }, "First content"),
      ),
      h(
        Popover,
        null,
        h(PopoverTrigger, null, "Second"),
        h(PopoverContent, { "data-testid": "second-popup" }, "Second content"),
      ),
    ),
  );

  fireEvent.click(getTrigger("First"));
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='first-popup']")),
  );

  const secondTrigger = getTrigger("Second");
  await act(async () => {
    dispatchPointer(secondTrigger);
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.equal(document.querySelector("[data-testid='first-popup']"), null),
  );

  fireEvent.click(secondTrigger);
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='second-popup']")),
  );
});

test("supports disabled asChild triggers and asChild close controls", async () => {
  render(
    h(
      Popover,
      null,
      h(
        PopoverTrigger,
        { asChild: true, disabled: true },
        h("button", { type: "button" }, "Disabled custom"),
      ),
      h(PopoverContent, { "data-testid": "disabled-popup" }, "No"),
    ),
  );
  fireEvent.click(getTrigger("Disabled custom"));
  await act(async () => {
    await Promise.resolve();
  });
  assert.equal(document.querySelector("[data-testid='disabled-popup']"), null);
  cleanup();

  render(
    h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, null, "AsChild close"),
      h(
        PopoverContent,
        { "data-testid": "popup" },
        h(
          PopoverClose,
          { asChild: true },
          h("button", { type: "button", id: "custom-close" }, "Done"),
        ),
      ),
    ),
  );
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popup']")),
  );
  fireEvent.click(document.getElementById("custom-close") as HTMLButtonElement);
  await waitFor(() =>
    assert.equal(document.querySelector("[data-testid='popup']"), null),
  );
});

test("preserves consumer transform styles while positions use left/top", async () => {
  render(
    h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, null, "Transform"),
      h(
        PopoverContent,
        {
          "data-testid": "transform-popup",
          style: { transform: "translateY(3px)" },
        },
        "Animated content",
      ),
    ),
  );
  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='transform-popup']")),
  );
  const popup = document.querySelector<HTMLElement>(
    "[data-testid='transform-popup']",
  );
  assert.ok(popup);
  assert.equal(popup.style.transform, "translateY(3px)");
  await waitFor(() => assert.notEqual(popup.style.left, ""));
  assert.equal(popup.style.transform, "translateY(3px)");
});
