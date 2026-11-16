import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  StrictMode,
  createElement as h,
  forwardRef,
  useState,
  type ButtonHTMLAttributes,
} from "react";
import { renderToString } from "react-dom/server";
import type { TooltipChangeReason } from "../dist/index.js";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
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
  dispatchPointer,
  resetDom,
  setBox,
  setViewport,
} from "./support/dom.ts";

afterEach(() => {
  cleanup();
  resetDom();
});

function getTrigger(name = "Trigger"): HTMLElement {
  const trigger = [...document.querySelectorAll<HTMLElement>("button")].find(
    (button) => button.textContent?.trim() === name,
  );
  assert.ok(trigger, `trigger ${name} not found`);
  return trigger;
}

function getTooltip(): HTMLElement | null {
  return document.querySelector<HTMLElement>("[role='tooltip']");
}

function basicTooltip() {
  return h(
    Tooltip,
    null,
    h(TooltipTrigger, null, "Trigger"),
    h(TooltipContent, { "data-testid": "tooltip" }, "Useful hint"),
  );
}

test("opens on keyboard focus, exposes tooltip semantics, and preserves focus", async () => {
  render(basicTooltip());
  const trigger = getTrigger();

  await act(async () => {
    trigger.focus();
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getTooltip()));
  const tooltip = getTooltip();
  assert.ok(tooltip);
  assert.equal(tooltip.getAttribute("role"), "tooltip");
  assert.equal(tooltip.textContent, "Useful hint");
  assert.equal(trigger.getAttribute("aria-describedby"), tooltip.id);
  assert.equal(document.activeElement, trigger);
  assert.equal(tooltip.hasAttribute("tabindex"), false);
});

test("opens on hover after the configured delay and closes on pointer leave", async () => {
  render(
    h(
      Tooltip,
      { delay: 10, closeDelay: 10 },
      h(TooltipTrigger, null, "Hover"),
      h(TooltipContent, null, "Hover hint"),
    ),
  );
  const trigger = getTrigger("Hover");

  fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
  assert.equal(getTooltip(), null);
  await waitFor(() => assert.ok(getTooltip()));

  fireEvent.pointerLeave(trigger);
  await new Promise((resolve) => setTimeout(resolve, 25));
  await waitFor(() => assert.equal(getTooltip(), null));
  assert.equal(trigger.hasAttribute("aria-describedby"), false);
});

test("ignores touch hover but still opens on focus", async () => {
  render(
    h(
      Tooltip,
      { delay: 0 },
      h(TooltipTrigger, null, "Touch"),
      h(TooltipContent, null, "Touch hint"),
    ),
  );
  const trigger = getTrigger("Touch");
  fireEvent.pointerEnter(trigger, { pointerType: "touch" });
  await act(async () => {
    await Promise.resolve();
  });
  assert.equal(getTooltip(), null);

  await act(async () => {
    trigger.focus();
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getTooltip()));
});

test("Escape closes the tooltip and does not move focus", async () => {
  render(
    h(
      Tooltip,
      { closeDelay: 0 },
      h(TooltipTrigger, null, "Escape"),
      h(TooltipContent, null, "Escape hint"),
    ),
  );
  const trigger = getTrigger("Escape");
  trigger.focus();
  await waitFor(() => assert.ok(getTooltip()));

  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getTooltip(), null));
  assert.equal(document.activeElement, trigger);
});

test("content does not become a focus destination", async () => {
  render(
    h(
      Tooltip,
      { defaultOpen: true },
      h(TooltipTrigger, null, "Focus"),
      h(TooltipContent, null, "Informational"),
    ),
  );
  await waitFor(() => assert.ok(getTooltip()));
  const tooltip = getTooltip();
  assert.ok(tooltip);
  assert.equal(tooltip.tabIndex, -1);
  assert.equal(tooltip.hasAttribute("tabindex"), false);
});

test("uses a provider's shared delay and skip-delay window", async () => {
  const provider = h(
    TooltipProvider,
    { delay: 20, closeDelay: 5, skipDelayDuration: 500 },
    h(
      "div",
      null,
      h(
        Tooltip,
        null,
        h(TooltipTrigger, null, "First"),
        h(TooltipContent, null, "First hint"),
      ),
      h(
        Tooltip,
        null,
        h(TooltipTrigger, null, "Second"),
        h(TooltipContent, null, "Second hint"),
      ),
    ),
  );
  render(provider);
  const first = getTrigger("First");
  const second = getTrigger("Second");

  fireEvent.pointerEnter(first, { pointerType: "mouse" });
  assert.equal(getTooltip(), null);
  await waitFor(() =>
    assert.match(getTooltip()?.textContent ?? "", /First hint/),
  );

  fireEvent.pointerLeave(first);
  fireEvent.pointerEnter(second, { pointerType: "mouse" });
  await waitFor(() =>
    assert.match(getTooltip()?.textContent ?? "", /Second hint/),
  );
});

test("close delay is configurable and the provider is optional", async () => {
  render(
    h(
      Tooltip,
      { delay: 0, closeDelay: 40 },
      h(TooltipTrigger, null, "Delay"),
      h(TooltipContent, null, "Delay hint"),
    ),
  );
  const trigger = getTrigger("Delay");
  fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
  await waitFor(() => assert.ok(getTooltip()));
  fireEvent.pointerLeave(trigger);
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.ok(getTooltip());
  await new Promise((resolve) => setTimeout(resolve, 45));
  await waitFor(() => assert.equal(getTooltip(), null));
});

test("hoverable content can be entered before the close delay expires", async () => {
  render(
    h(
      Tooltip,
      { delay: 0, closeDelay: 30 },
      h(TooltipTrigger, null, "Hoverable"),
      h(TooltipContent, null, "Hoverable hint"),
    ),
  );
  const trigger = getTrigger("Hoverable");
  fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
  await waitFor(() => assert.ok(getTooltip()));
  const tooltip = getTooltip();
  assert.ok(tooltip);

  fireEvent.pointerLeave(trigger);
  fireEvent.pointerEnter(tooltip);
  await new Promise((resolve) => setTimeout(resolve, 45));
  await waitFor(() => assert.ok(getTooltip()));

  fireEvent.pointerLeave(tooltip);
  await new Promise((resolve) => setTimeout(resolve, 45));
  await waitFor(() => assert.equal(getTooltip(), null));
});

test("disabled Tooltip does not open and native event handlers remain intact", async () => {
  let clicks = 0;
  render(
    h(
      "div",
      null,
      h(
        Tooltip,
        { disabled: true, delay: 0 },
        h(
          TooltipTrigger,
          {
            onClick: () => {
              clicks += 1;
            },
          },
          "Disabled tooltip",
        ),
        h(TooltipContent, null, "Hidden"),
      ),
      h("button", { type: "button", id: "outside" }, "Outside"),
    ),
  );
  const trigger = getTrigger("Disabled tooltip");
  fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
  await act(async () => {
    trigger.focus();
    await Promise.resolve();
  });
  await act(async () => {
    await Promise.resolve();
  });
  assert.equal(getTooltip(), null);
  fireEvent.click(trigger);
  assert.equal(clicks, 1);
  assert.equal(getTooltip(), null);

  await act(async () => {
    dispatchPointer(document.body);
    await Promise.resolve();
  });
});

test("click closes an open tooltip and never toggles it open", async () => {
  let clicks = 0;
  render(
    h(
      "div",
      null,
      h(
        Tooltip,
        { delay: 0, closeDelay: 0 },
        h(
          TooltipTrigger,
          {
            onClick: () => {
              clicks += 1;
            },
          },
          "Click",
        ),
        h(TooltipContent, null, "Click hint"),
      ),
    ),
  );
  const trigger = getTrigger("Click");
  fireEvent.click(trigger);
  assert.equal(clicks, 1);
  await act(async () => {
    await Promise.resolve();
  });
  assert.equal(getTooltip(), null);

  fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
  await waitFor(() => assert.ok(getTooltip()));
  fireEvent.click(trigger);
  await waitFor(() => assert.equal(getTooltip(), null));
  assert.equal(clicks, 2);
});

test("controlled open state is not changed by hover or click", async () => {
  const changes: Array<[boolean, TooltipChangeReason]> = [];
  render(
    h(
      Tooltip,
      {
        open: false,
        delay: 0,
        onOpenChange: (next, reason) => changes.push([next, reason]),
      },
      h(TooltipTrigger, null, "Controlled"),
      h(TooltipContent, null, "Controlled hint"),
    ),
  );
  const trigger = getTrigger("Controlled");
  fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
  await act(async () => {
    await Promise.resolve();
  });
  assert.equal(getTooltip(), null);
  assert.deepEqual(changes.at(-1), [true, "hover"]);
  fireEvent.click(trigger);
  assert.equal(getTooltip(), null);
});

test("supports all physical sides, offsets, and that positioning props stay off the DOM", async () => {
  setViewport(2000, 2000);
  const sides = [
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

  function Example(props: {
    side: (typeof sides)[number][0];
    align: (typeof sides)[number][1];
  }) {
    return h(
      Tooltip,
      { defaultOpen: true },
      h(TooltipTrigger, null, "Sides"),
      h(
        TooltipContent,
        {
          side: props.side,
          align: props.align,
          sideOffset: 6,
          alignOffset: 2,
          collisionAvoidance: { flip: false, shift: false },
        },
        "Side hint",
      ),
    );
  }

  const view = render(h(Example, { side: "top", align: "start" }));
  await waitFor(() => assert.ok(getTooltip()));
  const trigger = getTrigger("Sides");
  setBox(trigger, { x: 900, y: 900, width: 80, height: 40 });

  for (const [side, align] of sides) {
    view.rerender(h(Example, { side, align }));
    await waitFor(() => {
      const tooltip = getTooltip();
      assert.equal(tooltip?.dataset.side, side);
      assert.equal(tooltip?.dataset.align, align);
    });
  }
  const tooltip = getTooltip();
  assert.equal(tooltip?.hasAttribute("side"), false);
  assert.equal(tooltip?.hasAttribute("sideoffset"), false);
  assert.equal(tooltip?.hasAttribute("alignoffset"), false);
});

test("RTL alignment follows direction while physical sides stay physical", async () => {
  setViewport(2000, 2000);
  const view = render(
    h(
      Tooltip,
      { defaultOpen: true, dir: "rtl" },
      h(TooltipTrigger, null, "RTL"),
      h(
        TooltipContent,
        {
          side: "bottom",
          align: "start",
          collisionAvoidance: { flip: false, shift: false },
        },
        "RTL hint",
      ),
    ),
  );
  await waitFor(() => {
    assert.equal(getTooltip()?.dataset.side, "bottom");
    assert.equal(getTooltip()?.dataset.align, "start");
  });
  view.rerender(
    h(
      Tooltip,
      { defaultOpen: true, dir: "rtl" },
      h(TooltipTrigger, null, "RTL"),
      h(
        TooltipContent,
        {
          side: "right",
          align: "start",
          collisionAvoidance: { flip: false, shift: false },
        },
        "RTL hint",
      ),
    ),
  );
  await waitFor(() => assert.equal(getTooltip()?.dataset.side, "right"));
});

test("supports custom trigger components without nesting interactive elements", async () => {
  const ref = { current: null as HTMLButtonElement | null };
  const CustomButton = forwardRef<
    HTMLButtonElement,
    ButtonHTMLAttributes<HTMLButtonElement>
  >(function CustomButton(props, forwardedRef) {
    return h("button", { ...props, ref: forwardedRef, type: "button" });
  });

  render(
    h(
      Tooltip,
      { delay: 0 },
      h(
        TooltipTrigger,
        { asChild: true, ref },
        h(CustomButton, { "aria-label": "More actions" }, "⋯"),
      ),
      h(TooltipContent, null, "Custom hint"),
    ),
  );
  const trigger = getTrigger("⋯");
  assert.equal(trigger, ref.current);
  assert.equal(trigger.getAttribute("aria-label"), "More actions");
  await act(async () => {
    trigger.focus();
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getTooltip()));
});

test("works inside a Popover and preserves Popover Escape priority", async () => {
  render(
    h(
      Popover,
      { defaultOpen: true },
      h(PopoverTrigger, null, "Parent popover"),
      h(
        PopoverContent,
        { "data-testid": "popover" },
        h(
          Tooltip,
          { delay: 0, closeDelay: 0 },
          h(TooltipTrigger, null, "Tooltip in popover"),
          h(TooltipContent, null, "Nested hint"),
        ),
      ),
    ),
  );

  await waitFor(() =>
    assert.ok(document.querySelector("[data-testid='popover']")),
  );
  const trigger = getTrigger("Tooltip in popover");
  await act(async () => {
    trigger.focus();
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getTooltip()));
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getTooltip(), null));
  assert.ok(document.querySelector("[data-testid='popover']"));
});

test("works inside a dialog-like layer and closes only the tooltip on Escape", async () => {
  function DialogFixture() {
    const [element, setElement] = useState<HTMLDivElement | null>(null);
    useLayer({ element, onDismiss: () => {} });
    return h(
      "div",
      { ref: setElement, "data-testid": "dialog" },
      h(
        Tooltip,
        { delay: 0, closeDelay: 0 },
        h(TooltipTrigger, null, "Tooltip in dialog"),
        h(TooltipContent, null, "Dialog hint"),
      ),
    );
  }

  render(h(DialogFixture));
  const trigger = getTrigger("Tooltip in dialog");
  await act(async () => {
    trigger.focus();
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getTooltip()));
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getTooltip(), null));
  assert.ok(document.querySelector("[data-testid='dialog']"));
});

test("renders safely on the server and under Strict Mode", async () => {
  const html = renderToString(basicTooltip());
  assert.match(html, /Trigger/);
  assert.equal(html.includes("Useful hint"), false);

  render(h(StrictMode, null, basicTooltip()));
  const trigger = getTrigger();
  await act(async () => {
    trigger.focus();
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getTooltip()));
  await act(async () => {
    trigger.blur();
    await Promise.resolve();
  });
  await act(async () => {
    dispatchEscape();
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getTooltip(), null));
});

test("closes on outside pointer press and focus leaving the trigger", async () => {
  render(
    h(
      "div",
      null,
      h(
        Tooltip,
        { delay: 0, closeDelay: 0 },
        h(TooltipTrigger, null, "Outside"),
        h(TooltipContent, null, "Outside hint"),
      ),
      h("button", { type: "button", id: "other" }, "Other"),
    ),
  );
  const trigger = getTrigger("Outside");
  await act(async () => {
    trigger.focus();
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getTooltip()));
  await act(async () => {
    dispatchPointer(document.body);
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getTooltip(), null));

  await act(async () => {
    (document.getElementById("other") as HTMLButtonElement).focus();
    await Promise.resolve();
  });
  await act(async () => {
    trigger.focus();
    await Promise.resolve();
  });
  await waitFor(() => assert.ok(getTooltip()));
  await act(async () => {
    (document.getElementById("other") as HTMLButtonElement).focus();
    await Promise.resolve();
  });
  await waitFor(() => assert.equal(getTooltip(), null));
});

test("supports the disabled-button wrapper pattern without enabling the button", async () => {
  render(
    h(
      Tooltip,
      { delay: 0 },
      h(
        TooltipTrigger,
        { asChild: true },
        h(
          "span",
          {
            tabIndex: 0,
            "data-testid": "disabled-wrapper",
          },
          h("button", { type: "button", disabled: true }, "Save"),
        ),
      ),
      h(TooltipContent, null, "Saving is currently unavailable."),
    ),
  );

  const wrapper = document.querySelector(
    "[data-testid='disabled-wrapper']",
  ) as HTMLElement;
  assert.ok(wrapper);
  assert.equal(wrapper.querySelector("button")?.disabled, true);
  await act(async () => {
    wrapper.focus();
    await Promise.resolve();
  });
  await waitFor(() =>
    assert.match(getTooltip()?.textContent ?? "", /unavailable/),
  );
  assert.equal(wrapper.querySelector("button")?.disabled, true);
});

test("disableHoverableContent makes leaving the trigger close even if the pointer enters content", async () => {
  render(
    h(
      Tooltip,
      { delay: 0, closeDelay: 30, disableHoverableContent: true },
      h(TooltipTrigger, null, "NotHoverable"),
      h(TooltipContent, null, "Non-hoverable"),
    ),
  );
  const trigger = getTrigger("NotHoverable");
  fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
  await waitFor(() => assert.ok(getTooltip()));
  const tooltip = getTooltip();
  assert.ok(tooltip);
  fireEvent.pointerLeave(trigger);
  fireEvent.pointerEnter(tooltip);
  await new Promise((resolve) => setTimeout(resolve, 45));
  await waitFor(() => assert.equal(getTooltip(), null));
});

test("supports custom and inline portal rendering", async () => {
  const custom = document.createElement("div");
  custom.id = "tooltip-custom-portal";
  document.body.append(custom);

  const customView = render(
    h(
      Tooltip,
      { defaultOpen: true },
      h(TooltipTrigger, null, "Custom portal"),
      h(TooltipContent, { portal: custom }, "Custom portal hint"),
    ),
  );
  await waitFor(() => assert.ok(getTooltip()));
  assert.equal(getTooltip()?.parentElement, custom);
  customView.unmount();

  render(
    h(
      Tooltip,
      { defaultOpen: true },
      h(TooltipTrigger, null, "Inline tooltip"),
      h(TooltipContent, { portal: false }, "Inline hint"),
    ),
  );
  await waitFor(() => assert.ok(getTooltip()));
  assert.notEqual(getTooltip()?.parentElement, document.body);
});

test("cleans up pending timers when unmounted", async () => {
  const view = render(
    h(
      Tooltip,
      { delay: 40 },
      h(TooltipTrigger, null, "Cleanup"),
      h(TooltipContent, null, "Cleanup hint"),
    ),
  );
  const trigger = getTrigger("Cleanup");
  fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
  view.unmount();
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(getTooltip(), null);
});

test("supports separate nested providers with independent behavior", async () => {
  render(
    h(
      "div",
      null,
      h(
        TooltipProvider,
        { delay: 0, closeDelay: 0 },
        h(
          Tooltip,
          null,
          h(TooltipTrigger, null, "Provider A"),
          h(TooltipContent, null, "A hint"),
        ),
      ),
      h(
        TooltipProvider,
        { delay: 0, closeDelay: 0 },
        h(
          Tooltip,
          null,
          h(TooltipTrigger, null, "Provider B"),
          h(TooltipContent, null, "B hint"),
        ),
      ),
    ),
  );
  fireEvent.pointerEnter(getTrigger("Provider A"), { pointerType: "mouse" });
  await waitFor(() => assert.match(getTooltip()?.textContent ?? "", /A hint/));
  fireEvent.pointerLeave(getTrigger("Provider A"));
  fireEvent.pointerEnter(getTrigger("Provider B"), { pointerType: "mouse" });
  await waitFor(() => assert.match(getTooltip()?.textContent ?? "", /B hint/));
});

test("the nearest nested provider governs timing", async () => {
  render(
    h(
      TooltipProvider,
      { delay: 200, closeDelay: 0 },
      h(
        TooltipProvider,
        { delay: 0, closeDelay: 0 },
        h(
          Tooltip,
          null,
          h(TooltipTrigger, null, "Nested provider"),
          h(TooltipContent, null, "Immediate inner timing"),
        ),
      ),
    ),
  );
  fireEvent.pointerEnter(getTrigger("Nested provider"), {
    pointerType: "mouse",
  });
  await act(async () => {
    await Promise.resolve();
  });
  assert.match(getTooltip()?.textContent ?? "", /Immediate inner timing/);
});
