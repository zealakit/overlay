import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { type LayerHandle, createLayerStack } from "../dist/index.js";
import {
  dispatchEscape,
  dispatchPointer,
  resetDom,
  trackDocumentListeners,
} from "./support/dom.ts";

beforeEach(resetDom);

function element(): HTMLElement {
  const node = document.createElement("div");
  document.body.append(node);
  return node;
}

function fakeHandle(id: string): LayerHandle {
  return {
    id,
    parentId: null,
    isRegistered: true,
    isTopmost: false,
    dispose() {},
  };
}

test("registers layers in order and resolves the topmost layer", () => {
  const stack = createLayerStack({ document });
  const first = stack.register({ element: element() });
  const second = stack.register({ element: element() });

  assert.equal(stack.size, 2);
  assert.deepEqual([first.id, second.id], ["layer-1", "layer-2"]);
  assert.equal(stack.getTopmost()?.id, second.id);
  assert.equal(second.isTopmost, true);
  assert.equal(first.isTopmost, false);
  assert.equal(stack.isTopmost(first.id), false);

  first.dispose();
  assert.equal(stack.size, 1);
  assert.equal(first.isRegistered, false);
  assert.equal(stack.getTopmost()?.id, second.id);

  stack.dispose();
});

test("supports parent-child layers and removes descendants", () => {
  const stack = createLayerStack({ document });
  const parent = stack.register({ element: element() });
  const child = stack.register({ element: element(), parent });
  const grandchild = stack.register({ element: element(), parent: child });

  assert.equal(stack.size, 3);
  assert.equal(child.parentId, parent.id);

  parent.dispose();

  assert.equal(stack.size, 0);
  assert.equal(child.isRegistered, false);
  assert.equal(grandchild.isRegistered, false);
  assert.equal(stack.getTopmost(), null);

  stack.dispose();
});

test("rejects unknown parent handles", () => {
  const stack = createLayerStack({ document });
  assert.throws(
    () => stack.register({ parent: fakeHandle("missing") }),
    /Unknown parent layer/,
  );
  stack.dispose();
});

test("rejects parent handles from another stack", () => {
  const firstStack = createLayerStack({ document });
  const secondStack = createLayerStack({ document });

  const foreign = firstStack.register({ element: element() });
  const local = secondStack.register({ element: element() });
  assert.equal(foreign.id, local.id);

  assert.throws(
    () => secondStack.register({ element: element(), parent: foreign }),
    /different stack/,
  );

  firstStack.dispose();
  secondStack.dispose();
});

test("routes Escape to the topmost layer only", () => {
  const stack = createLayerStack({ document });
  const calls: string[] = [];

  const first = stack.register({
    element: element(),
    onDismiss: (reason) => calls.push(`first:${reason}`),
  });
  const second = stack.register({
    element: element(),
    onDismiss: (reason) => calls.push(`second:${reason}`),
  });

  dispatchEscape();
  assert.deepEqual(calls, ["second:escape-key"]);

  second.dispose();
  dispatchEscape();
  assert.deepEqual(calls, ["second:escape-key", "first:escape-key"]);

  first.dispose();
  stack.dispose();
});

test("respects per-layer Escape and outside-press opt-outs", () => {
  const stack = createLayerStack({ document });
  const calls: string[] = [];

  stack.register({
    element: element(),
    dismissOnEscape: false,
    dismissOnOutsidePress: false,
    onDismiss: (reason) => calls.push(reason),
  });

  dispatchEscape();
  dispatchPointer(document.body);
  assert.deepEqual(calls, []);

  stack.dispose();
});

test("detects outside presses and ignores the reference and inner clicks", () => {
  const stack = createLayerStack({ document });
  const calls: string[] = [];

  const panel = document.createElement("div");
  const inside = document.createElement("span");
  panel.append(inside);
  const reference = document.createElement("button");
  const outside = document.createElement("p");
  document.body.append(panel, reference, outside);

  stack.register({
    element: () => panel,
    reference: () => reference,
    onDismiss: (reason) => calls.push(reason),
  });

  dispatchPointer(inside);
  assert.deepEqual(calls, []);

  dispatchPointer(reference);
  assert.deepEqual(calls, []);

  dispatchPointer(outside, { button: 2 });
  assert.deepEqual(calls, []);

  dispatchPointer(outside);
  assert.deepEqual(calls, ["outside-press"]);

  stack.dispose();
});

test("layers without elements never dismiss on outside presses", () => {
  const stack = createLayerStack({ document });
  const calls: string[] = [];

  stack.register({
    onDismiss: (reason) => calls.push(reason),
  });

  dispatchPointer(document.body);
  assert.deepEqual(calls, []);

  stack.dispose();
});

test("shares a single set of document listeners across layers", (t) => {
  const tracker = trackDocumentListeners();
  t.after(() => tracker.restore());

  const stack = createLayerStack({ document });
  const first = stack.register({ element: element() });
  assert.equal(tracker.counts.keydownAdds, 1);
  assert.equal(tracker.counts.pointerdownAdds, 1);

  stack.register({ element: element() });
  assert.equal(tracker.counts.keydownAdds, 1);
  assert.equal(tracker.counts.pointerdownAdds, 1);

  first.dispose();
  assert.equal(tracker.counts.keydownRemoves, 0);
  assert.equal(tracker.counts.pointerdownRemoves, 0);

  stack.dispose();
  assert.equal(tracker.counts.keydownRemoves, 1);
  assert.equal(tracker.counts.pointerdownRemoves, 1);
});

test("does not attach listeners when every layer opts out", (t) => {
  const tracker = trackDocumentListeners();
  t.after(() => tracker.restore());

  const stack = createLayerStack({ document });
  stack.register({
    element: element(),
    dismissOnEscape: false,
    dismissOnOutsidePress: false,
  });

  assert.equal(tracker.counts.keydownAdds, 0);
  assert.equal(tracker.counts.pointerdownAdds, 0);

  stack.dispose();
  assert.equal(tracker.counts.keydownRemoves, 0);
  assert.equal(tracker.counts.pointerdownRemoves, 0);
});

test("disposal removes listeners and rejects further registration", (t) => {
  const tracker = trackDocumentListeners();
  t.after(() => tracker.restore());

  const stack = createLayerStack({ document });
  const handle = stack.register({ element: element() });

  stack.dispose();
  stack.dispose();

  assert.equal(stack.size, 0);
  assert.equal(handle.isRegistered, false);
  assert.equal(tracker.counts.keydownRemoves, 1);
  assert.equal(tracker.counts.pointerdownRemoves, 1);
  assert.throws(() => stack.register(), /disposed/);

  dispatchEscape();
});
