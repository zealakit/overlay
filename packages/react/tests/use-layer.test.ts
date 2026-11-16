import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { StrictMode, createElement, useState } from "react";
import type {
  DismissReason,
  LayerStack,
  LayerStackHandle,
} from "@zealakit/overlay-core";
import { createLayerStack } from "@zealakit/overlay-core";
import { cleanup, render, waitFor } from "@testing-library/react";
import { useLayer } from "../dist/index.js";
import {
  dispatchEscape,
  dispatchPointer,
  resetDom,
  trackDocumentListeners,
} from "./support/dom.ts";

afterEach(() => {
  cleanup();
  resetDom();
});

type LayerDemoProps = {
  stack?: LayerStack;
  id: string;
  dismissOnEscape?: boolean;
  dismissOnOutsidePress?: boolean;
  onDismiss?: (reason: DismissReason) => void;
  disabled?: boolean;
};

function LayerDemo({
  stack,
  id,
  dismissOnEscape,
  dismissOnOutsidePress,
  onDismiss,
  disabled = false,
}: LayerDemoProps) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [reference, setReference] = useState<HTMLButtonElement | null>(null);
  const layer = useLayer({
    element,
    reference,
    stack,
    dismissOnEscape,
    dismissOnOutsidePress,
    onDismiss,
    disabled,
  });

  return createElement(
    "div",
    null,
    createElement("button", {
      ref: setReference,
      id: `${id}-trigger`,
      type: "button",
    }),
    createElement("div", { ref: setElement, id: `${id}-panel` }),
    createElement(
      "output",
      { id: `${id}-state` },
      `${layer.id ?? "none"}:${String(layer.isTopmost)}`,
    ),
  );
}

type ParentDemoProps = {
  stack: LayerStack;
  onParentDismiss: (reason: DismissReason) => void;
  onChildDismiss: (reason: DismissReason) => void;
};

function ChildLayer({
  stack,
  parent,
  onDismiss,
}: {
  stack: LayerStack;
  parent: LayerStackHandle;
  onDismiss: (reason: DismissReason) => void;
}) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [reference, setReference] = useState<HTMLButtonElement | null>(null);
  const layer = useLayer({ element, reference, stack, parent, onDismiss });

  return createElement(
    "div",
    null,
    createElement("button", {
      ref: setReference,
      id: "child-trigger",
      type: "button",
    }),
    createElement("div", { ref: setElement, id: "child-panel" }),
    createElement("output", { id: "child-state" }, layer.id ?? "none"),
  );
}

function ParentDemo({
  stack,
  onParentDismiss,
  onChildDismiss,
}: ParentDemoProps) {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [reference, setReference] = useState<HTMLButtonElement | null>(null);
  const parent = useLayer({
    element,
    reference,
    stack,
    onDismiss: onParentDismiss,
  });

  return createElement(
    "div",
    null,
    createElement("button", {
      ref: setReference,
      id: "parent-trigger",
      type: "button",
    }),
    createElement("div", { ref: setElement, id: "parent-panel" }),
    createElement("output", { id: "parent-state" }, parent.id ?? "none"),
    parent.handle
      ? createElement(ChildLayer, {
          stack,
          parent: parent.handle,
          onDismiss: onChildDismiss,
        })
      : null,
  );
}

test("registers a layer, tracks topmost state, and removes it on unmount", async () => {
  const stack = createLayerStack({ document });
  const view = render(createElement(LayerDemo, { stack, id: "a" }));

  await waitFor(() => {
    assert.equal(stack.size, 1);
  });
  assert.ok(stack.getTopmost());
  await waitFor(() => {
    assert.match(
      document.getElementById("a-state")?.textContent ?? "",
      /^layer-\d+:true$/,
    );
  });

  view.unmount();
  assert.equal(stack.size, 0);
  stack.dispose();
});

test("Strict Mode does not duplicate registrations", async () => {
  const stack = createLayerStack({ document });
  const view = render(
    createElement(
      StrictMode,
      null,
      createElement(LayerDemo, { stack, id: "a" }),
    ),
  );

  await waitFor(() => {
    assert.equal(stack.size, 1);
  });

  view.unmount();
  assert.equal(stack.size, 0);
  stack.dispose();
});

test("supports nested layers and routes Escape to the child", async () => {
  const stack = createLayerStack({ document });
  const parentCalls: DismissReason[] = [];
  const childCalls: DismissReason[] = [];

  const view = render(
    createElement(ParentDemo, {
      stack,
      onParentDismiss: (reason) => parentCalls.push(reason),
      onChildDismiss: (reason) => childCalls.push(reason),
    }),
  );

  await waitFor(() => {
    assert.equal(stack.size, 2);
  });
  await waitFor(() => {
    assert.equal(
      document.getElementById("child-state")?.textContent,
      stack.getTopmost()?.id,
    );
  });

  dispatchEscape();
  assert.deepEqual(childCalls, ["escape-key"]);
  assert.deepEqual(parentCalls, []);

  view.unmount();
  assert.equal(stack.size, 0);
  stack.dispose();
});

test("honours Escape and outside-press opt-outs", async () => {
  const stack = createLayerStack({ document });
  const calls: DismissReason[] = [];
  const view = render(
    createElement(LayerDemo, {
      stack,
      id: "a",
      dismissOnEscape: false,
      dismissOnOutsidePress: false,
      onDismiss: (reason) => calls.push(reason),
    }),
  );

  await waitFor(() => {
    assert.equal(stack.size, 1);
  });

  const outside = document.createElement("p");
  document.body.append(outside);

  dispatchEscape();
  dispatchPointer(outside);
  assert.equal(calls.length, 0);

  view.rerender(
    createElement(LayerDemo, {
      stack,
      id: "a",
      onDismiss: (reason: DismissReason) => calls.push(reason),
    }),
  );

  await waitFor(() => {
    assert.equal(stack.size, 1);
  });

  dispatchEscape();
  assert.deepEqual(calls, ["escape-key"]);

  dispatchPointer(outside);
  assert.deepEqual(calls, ["escape-key", "outside-press"]);

  view.unmount();
  stack.dispose();
});

test("outside presses ignore the reference and secondary buttons", async () => {
  const stack = createLayerStack({ document });
  const calls: DismissReason[] = [];
  render(
    createElement(LayerDemo, {
      stack,
      id: "a",
      onDismiss: (reason) => calls.push(reason),
    }),
  );

  await waitFor(() => {
    assert.equal(stack.size, 1);
  });

  const trigger = document.getElementById("a-trigger");
  const outside = document.createElement("p");
  document.body.append(outside);
  assert.ok(trigger);

  dispatchPointer(trigger);
  dispatchPointer(outside, { button: 2 });
  assert.equal(calls.length, 0);

  dispatchPointer(outside);
  assert.deepEqual(calls, ["outside-press"]);

  stack.dispose();
});

test("disabled layers do not register until enabled", async () => {
  const stack = createLayerStack({ document });
  const view = render(
    createElement(LayerDemo, { stack, id: "a", disabled: true }),
  );

  assert.equal(stack.size, 0);

  view.rerender(createElement(LayerDemo, { stack, id: "a" }));

  await waitFor(() => {
    assert.equal(stack.size, 1);
  });

  stack.dispose();
});

test("layers without a stack share one document listener set", async (t) => {
  const tracker = trackDocumentListeners();
  t.after(() => tracker.restore());

  const calls: DismissReason[] = [];
  const view = render(
    createElement(
      "div",
      null,
      createElement(LayerDemo, {
        id: "a",
        onDismiss: (reason) => calls.push(reason),
      }),
      createElement(LayerDemo, {
        id: "b",
        onDismiss: (reason) => calls.push(reason),
      }),
    ),
  );

  await waitFor(() => {
    assert.equal(tracker.counts.keydownAdds, 1);
    assert.equal(tracker.counts.pointerdownAdds, 1);
  });

  dispatchEscape();
  assert.equal(calls.length, 1);

  view.unmount();
  assert.equal(tracker.counts.keydownRemoves, 1);
  assert.equal(tracker.counts.pointerdownRemoves, 1);
});
