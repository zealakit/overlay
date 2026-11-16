import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { StrictMode, createElement } from "react";
import type { LayerStack } from "@zealakit/overlay-core";
import { createLayerStack } from "@zealakit/overlay-core";
import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { useOverlay } from "../dist/index.js";
import {
  dispatchEscape,
  dispatchPointer,
  resetDom,
  setBox,
} from "./support/dom.ts";

afterEach(() => {
  cleanup();
  resetDom();
});

function OverlayDemo({
  stack,
  defaultOpen = false,
}: {
  stack: LayerStack;
  defaultOpen?: boolean;
}) {
  const overlay = useOverlay({
    stack,
    autoUpdate: false,
    placement: "bottom-start",
    offset: 8,
    flip: false,
    shift: false,
    defaultOpen,
  });

  return createElement(
    "div",
    null,
    createElement(
      "button",
      {
        ref: overlay.referenceRef,
        id: "trigger",
        type: "button",
        onClick: overlay.toggle,
      },
      "trigger",
    ),
    createElement("div", {
      ref: overlay.floatingRef,
      id: "panel",
      style: overlay.floatingStyles,
    }),
    createElement(
      "button",
      { id: "open", type: "button", onClick: overlay.open },
      "open",
    ),
    createElement(
      "button",
      {
        id: "measure",
        type: "button",
        onClick: () => {
          void overlay.update();
        },
      },
      "measure",
    ),
    createElement("output", { id: "open-state" }, String(overlay.isOpen)),
    createElement("output", { id: "placement" }, overlay.placement),
  );
}

function setGeometry(): void {
  const trigger = document.getElementById("trigger");
  const panel = document.getElementById("panel");
  assert.ok(trigger);
  assert.ok(panel);
  setBox(trigger, { x: 10, y: 20, width: 100, height: 40 });
  setBox(panel, { x: 0, y: 0, width: 200, height: 80 });
}

async function measure(): Promise<void> {
  await act(async () => {
    fireEvent.click(document.getElementById("measure") as HTMLElement);
    await Promise.resolve();
  });
}

test("opens, positions, and registers a layer", async () => {
  const stack = createLayerStack({ document });
  render(createElement(OverlayDemo, { stack }));
  setGeometry();

  fireEvent.click(document.getElementById("open") as HTMLElement);

  await waitFor(() => {
    assert.equal(document.getElementById("open-state")?.textContent, "true");
    assert.equal(stack.size, 1);
  });

  await measure();
  const panel = document.getElementById("panel");
  assert.ok(panel);
  assert.equal(panel.style.position, "absolute");
  assert.equal(panel.style.left, "10px");
  assert.equal(panel.style.top, "68px");
  assert.equal(
    document.getElementById("placement")?.textContent,
    "bottom-start",
  );

  stack.dispose();
});

test("closes on Escape and removes the layer", async () => {
  const stack = createLayerStack({ document });
  render(createElement(OverlayDemo, { stack }));
  setGeometry();

  fireEvent.click(document.getElementById("open") as HTMLElement);
  await waitFor(() => {
    assert.equal(document.getElementById("open-state")?.textContent, "true");
  });

  act(() => {
    dispatchEscape();
  });

  await waitFor(() => {
    assert.equal(document.getElementById("open-state")?.textContent, "false");
    assert.equal(stack.size, 0);
  });

  stack.dispose();
});

test("closes on an outside pointer press", async () => {
  const stack = createLayerStack({ document });
  const outside = document.createElement("p");
  document.body.append(outside);

  render(createElement(OverlayDemo, { stack }));
  setGeometry();

  fireEvent.click(document.getElementById("open") as HTMLElement);
  await waitFor(() => {
    assert.equal(document.getElementById("open-state")?.textContent, "true");
  });

  act(() => {
    dispatchPointer(outside);
  });

  await waitFor(() => {
    assert.equal(document.getElementById("open-state")?.textContent, "false");
  });

  stack.dispose();
});

test("supports defaultOpen and cleans up on unmount", async () => {
  const stack = createLayerStack({ document });
  const view = render(createElement(OverlayDemo, { stack, defaultOpen: true }));
  setGeometry();

  await waitFor(() => {
    assert.equal(document.getElementById("open-state")?.textContent, "true");
    assert.equal(stack.size, 1);
  });

  view.unmount();
  assert.equal(stack.size, 0);

  stack.dispose();
});

test("Strict Mode keeps a single registration while open", async () => {
  const stack = createLayerStack({ document });
  const view = render(
    createElement(StrictMode, null, createElement(OverlayDemo, { stack })),
  );
  setGeometry();

  fireEvent.click(document.getElementById("open") as HTMLElement);
  await waitFor(() => {
    assert.equal(stack.size, 1);
  });

  view.unmount();
  assert.equal(stack.size, 0);
  stack.dispose();
});
