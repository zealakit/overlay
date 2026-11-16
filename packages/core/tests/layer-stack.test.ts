import assert from "node:assert/strict";
import { test } from "node:test";
import { createLayerStack, createLayerStackRegistry } from "../dist/index.js";
import { dispatchKey, dispatchPointer } from "./support/dom.ts";

test("layer stack registers, orders, and notifies subscribers", () => {
  const stack = createLayerStack({ document });
  const snapshots: string[][] = [];
  const unsubscribe = stack.subscribe((entries) => {
    snapshots.push(entries.map((entry) => entry.id));
  });

  const first = stack.register({ element: document.createElement("div") });
  const second = stack.register({ element: document.createElement("div") });

  assert.equal(stack.size, 2);
  assert.equal(stack.getTopmost()?.id, second.id);
  assert.equal(stack.isTopmost(second.id), true);
  assert.deepEqual(snapshots, [["layer-1"], ["layer-1", "layer-2"]]);

  unsubscribe();
  first.dispose();
  assert.equal(stack.size, 1);
  stack.dispose();
});

test("layer stack routes outside presses to the topmost layer", () => {
  const stack = createLayerStack({ document });
  const panel = document.createElement("div");
  const outside = document.createElement("p");
  document.body.append(panel, outside);

  let dismissals = 0;
  stack.register({
    element: panel,
    onDismiss: () => {
      dismissals += 1;
    },
  });

  dispatchPointer(panel);
  assert.equal(dismissals, 0);

  dispatchPointer(outside);
  assert.equal(dismissals, 1);

  stack.dispose();
});

test("layer stack registry reuses and disposes stacks per document", () => {
  const registry = createLayerStackRegistry();
  const first = registry.acquire(document);
  const second = registry.acquire(document);

  assert.equal(first.stack, second.stack);

  first.release();
  assert.equal(second.stack.size, 0);

  second.release();
  const third = registry.acquire(document);
  assert.notEqual(third.stack, first.stack);
  third.release();
});

test("nested layers route outside and Escape to the child only", () => {
  const stack = createLayerStack({ document });
  const parentPanel = document.createElement("div");
  const parentTrigger = document.createElement("button");
  const childPanel = document.createElement("div");
  const outside = document.createElement("p");
  document.body.append(parentPanel, parentTrigger, childPanel, outside);

  const parentCalls: string[] = [];
  const childCalls: string[] = [];
  const parent = stack.register({
    element: parentPanel,
    reference: parentTrigger,
    onDismiss: (reason) => parentCalls.push(reason),
  });
  const child = stack.register({
    element: childPanel,
    parent,
    onDismiss: (reason) => childCalls.push(reason),
  });

  dispatchPointer(childPanel);
  assert.equal(parentCalls.length, 0);
  assert.equal(childCalls.length, 0);

  dispatchPointer(outside);
  assert.deepEqual(childCalls, ["outside-press"]);
  assert.equal(parentCalls.length, 0);

  dispatchKey(document);
  assert.deepEqual(childCalls, ["outside-press", "escape-key"]);
  assert.equal(parentCalls.length, 0);

  child.dispose();
  assert.equal(stack.isTopmost(parent.id), true);

  dispatchKey(document);
  assert.deepEqual(parentCalls, ["escape-key"]);

  stack.dispose();
});

test("removing a parent layer removes its descendants", () => {
  const stack = createLayerStack({ document });
  const parent = stack.register({ element: document.createElement("div") });
  const child = stack.register({
    element: document.createElement("div"),
    parent,
  });

  assert.equal(stack.size, 2);
  parent.dispose();
  assert.equal(stack.size, 0);
  assert.equal(child.isRegistered, false);

  stack.dispose();
});

test("layer boundaries include extra elements and the reference", () => {
  const stack = createLayerStack({ document });
  const panel = document.createElement("div");
  const reference = document.createElement("button");
  const extra = document.createElement("button");
  const outside = document.createElement("p");
  document.body.append(panel, reference, extra, outside);

  let dismissals = 0;
  stack.register({
    element: panel,
    reference,
    boundaries: [extra],
    onDismiss: () => {
      dismissals += 1;
    },
  });

  dispatchPointer(panel);
  dispatchPointer(reference);
  dispatchPointer(extra);
  assert.equal(dismissals, 0);

  dispatchPointer(outside);
  assert.equal(dismissals, 1);

  stack.dispose();
});

test("secondary, composed, and prevented events do not dismiss", () => {
  const stack = createLayerStack({ document });
  const panel = document.createElement("div");
  const outside = document.createElement("p");
  document.body.append(panel, outside);

  let dismissals = 0;
  stack.register({
    element: panel,
    onDismiss: () => {
      dismissals += 1;
    },
  });

  dispatchPointer(outside, { button: 2 });
  assert.equal(dismissals, 0);

  dispatchKey(document, { key: "Escape", composing: true });
  assert.equal(dismissals, 0);

  const prevented = new window.KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  });
  prevented.preventDefault();
  document.dispatchEvent(prevented);
  assert.equal(dismissals, 0);

  dispatchKey(document);
  assert.equal(dismissals, 1);

  stack.dispose();
});
