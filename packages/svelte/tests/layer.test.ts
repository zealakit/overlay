import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { get } from "svelte/store";
import type { DismissReason, LayerStackHandle } from "@zealakit/overlay-core";
import { createLayerStack } from "@zealakit/overlay-core";
import { createLayer, layer } from "../dist/index.js";
import {
  dispatchEscape,
  dispatchPointer,
  resetDom,
  trackDocumentListeners,
  waitFor,
} from "./support/dom.ts";

beforeEach(() => {
  resetDom();
});

afterEach(() => {
  resetDom();
});

type LayerActionResult = {
  update?: (params: Parameters<typeof layer>[1]) => void;
  destroy?: () => void;
};

function createPanel(): HTMLDivElement {
  const panel = document.createElement("div");
  document.body.append(panel);
  return panel;
}

test("createLayer registers, updates options, and disposes", () => {
  const stack = createLayerStack({ document });
  const element = createPanel();
  const controller = createLayer({ element, stack });

  const states: Array<{ id: string | null }> = [];
  const unsubscribe = controller.subscribe((state) => states.push(state));

  assert.equal(stack.size, 1);
  assert.match(get(controller).id ?? "", /^layer-\d+$/);
  assert.equal(get(controller).isTopmost, true);

  controller.setOptions({ disabled: true });
  assert.equal(stack.size, 0);
  assert.equal(get(controller).id, null);

  controller.setOptions({ disabled: false });
  assert.equal(stack.size, 1);

  unsubscribe();
  controller.dispose();
  controller.dispose();
  assert.equal(stack.size, 0);
  stack.dispose();
});

test("layer action registers and removes its layer on destroy", () => {
  const stack = createLayerStack({ document });
  const panel = createPanel();
  const reference = document.createElement("button");
  document.body.append(reference);
  const calls: DismissReason[] = [];
  const handles: Array<LayerStackHandle | null> = [];

  const action = layer(panel, {
    stack,
    reference,
    onDismiss: (reason) => calls.push(reason),
    onRegistered: (handle) => handles.push(handle),
  }) as LayerActionResult;

  assert.equal(stack.size, 1);
  assert.equal(handles.at(-1)?.id, stack.getTopmost()?.id);

  const outside = document.createElement("p");
  document.body.append(outside);
  dispatchPointer(reference);
  assert.equal(calls.length, 0);

  dispatchPointer(outside);
  assert.deepEqual(calls, ["outside-press"]);

  dispatchEscape();
  assert.deepEqual(calls, ["outside-press", "escape-key"]);

  action.destroy?.();
  assert.equal(stack.size, 0);
  assert.equal(handles.at(-1), null);
  stack.dispose();
});

test("layer action honours reactive Escape and outside opt-outs", () => {
  const stack = createLayerStack({ document });
  const panel = createPanel();
  const calls: DismissReason[] = [];

  const action = layer(panel, {
    stack,
    dismissOnEscape: false,
    dismissOnOutsidePress: false,
    onDismiss: (reason) => calls.push(reason),
  }) as LayerActionResult;

  const outside = document.createElement("p");
  document.body.append(outside);
  dispatchEscape();
  dispatchPointer(outside);
  assert.equal(calls.length, 0);

  action.update?.({
    stack,
    onDismiss: (reason) => calls.push(reason),
  });

  assert.equal(stack.size, 1);
  dispatchEscape();
  dispatchPointer(outside);
  assert.deepEqual(calls, ["escape-key", "outside-press"]);

  action.destroy?.();
  stack.dispose();
});

test("nested layer actions route Escape to the child", () => {
  const stack = createLayerStack({ document });
  const parent = createPanel();
  const child = createPanel();
  const parentCalls: DismissReason[] = [];
  const childCalls: DismissReason[] = [];
  let parentHandle: LayerStackHandle | null = null;
  const childHandleRef: { current: LayerStackHandle | null } = {
    current: null,
  };
  let parentTopmost: boolean | null = null;

  const parentAction = layer(parent, {
    stack,
    onDismiss: (reason) => parentCalls.push(reason),
    onRegistered: (handle) => {
      parentHandle = handle;
    },
    onTopmostChange: (isTopmost) => {
      parentTopmost = isTopmost;
    },
  }) as LayerActionResult;

  assert.ok(parentHandle);
  assert.equal(parentTopmost, true);

  const childAction = layer(child, {
    stack,
    parent: parentHandle,
    onDismiss: (reason) => childCalls.push(reason),
    onRegistered: (handle) => {
      childHandleRef.current = handle;
    },
  }) as LayerActionResult;

  assert.equal(stack.size, 2);
  assert.equal(stack.getTopmost()?.id, childHandleRef.current?.id);
  assert.equal(parentTopmost, false);

  dispatchEscape();
  assert.deepEqual(childCalls, ["escape-key"]);
  assert.equal(parentCalls.length, 0);

  childAction.destroy?.();
  parentAction.destroy?.();
  assert.equal(stack.size, 0);
  stack.dispose();
});

test("layers without a stack share document listeners", async (t) => {
  const tracker = trackDocumentListeners();
  t.after(() => tracker.restore());
  const calls: DismissReason[] = [];

  const first = layer(createPanel(), {
    onDismiss: (reason) => calls.push(reason),
  }) as LayerActionResult;
  const second = layer(createPanel(), {
    onDismiss: (reason) => calls.push(reason),
  }) as LayerActionResult;

  await waitFor(() => {
    assert.equal(tracker.counts.keydownAdds, 1);
    assert.equal(tracker.counts.pointerdownAdds, 1);
  });

  dispatchEscape();
  assert.equal(calls.length, 1);

  first.destroy?.();
  second.destroy?.();
  assert.equal(tracker.counts.keydownRemoves, 1);
  assert.equal(tracker.counts.pointerdownRemoves, 1);
});

test("layer action protects configured boundary elements", () => {
  const stack = createLayerStack({ document });
  const panel = createPanel();
  const extra = document.createElement("button");
  const outside = document.createElement("p");
  document.body.append(extra, outside);
  const calls: DismissReason[] = [];

  const action = layer(panel, {
    stack,
    boundaries: [extra],
    onDismiss: (reason) => calls.push(reason),
  }) as LayerActionResult;

  dispatchPointer(extra);
  assert.deepEqual(calls, []);

  dispatchPointer(outside);
  assert.deepEqual(calls, ["outside-press"]);

  action.destroy?.();
  stack.dispose();
});
