import assert from "node:assert/strict";
import { test } from "node:test";
import { createLayerManager } from "../dist/index.js";
import { dispatchPointer } from "./support/dom.ts";

test("layers stack in registration order", () => {
  const manager = createLayerManager();
  const first = manager.register({ id: "first" });
  const second = manager.register({ id: "second" });

  assert.equal(manager.size, 2);
  assert.deepEqual(
    manager.getStack().map((layer) => layer.id),
    ["first", "second"],
  );
  assert.equal(manager.getTopmost()?.id, "second");
  assert.equal(manager.isTopmost("second"), true);
  assert.equal(manager.isTopmost("first"), false);
  assert.equal(manager.get("first")?.id, "first");
  assert.equal(manager.get("missing"), null);

  assert.equal(manager.unregister("first"), true);
  assert.equal(manager.unregister("first"), false);
  assert.equal(manager.size, 1);
  assert.equal(first.isRegistered, false);
  assert.equal(second.isRegistered, true);

  manager.dispose();
});

test("unregistering a parent removes its descendants", () => {
  const manager = createLayerManager();
  const parent = manager.register({ id: "parent" });
  const child = manager.register({ id: "child", parentId: parent.id });
  const grandchild = manager.register({
    id: "grandchild",
    parentId: child.id,
  });

  assert.equal(manager.size, 3);
  assert.equal(manager.unregister(parent.id), true);
  assert.equal(manager.size, 0);
  assert.equal(child.isRegistered, false);
  assert.equal(grandchild.isRegistered, false);
  assert.equal(manager.getTopmost(), null);

  manager.dispose();
});

test("unknown parents and duplicate ids are rejected", () => {
  const manager = createLayerManager();

  assert.throws(
    () => manager.register({ parentId: "missing" }),
    /Unknown parent layer/,
  );

  manager.register({ id: "duplicate" });
  assert.throws(
    () => manager.register({ id: "duplicate" }),
    /Duplicate layer id/,
  );

  manager.dispose();
});

test("outside detection includes child layer elements", () => {
  const manager = createLayerManager();
  const parentElement = document.createElement("div");
  const childElement = document.createElement("div");
  const childInner = document.createElement("span");
  const outsideTarget = document.createElement("p");

  parentElement.append(document.createElement("span"));
  childElement.append(childInner);
  document.body.append(parentElement, childElement, outsideTarget);

  const parent = manager.register({
    id: "parent",
    element: () => parentElement,
  });
  const child = manager.register({
    id: "child",
    parentId: parent.id,
    element: childElement,
  });

  const insideParent = dispatchPointer(parentElement);
  assert.equal(manager.isOutside(parent.id, insideParent), false);

  const insideChild = dispatchPointer(childInner);
  assert.equal(manager.isOutside(parent.id, insideChild), false);
  assert.equal(manager.isOutside(child.id, insideChild), false);

  const outside = dispatchPointer(outsideTarget);
  assert.equal(manager.isOutside(child.id, outside), true);
  assert.equal(manager.isOutsideActive(outside), true);
  assert.equal(manager.isOutsideActive(insideChild), false);

  manager.dispose();
});

test("layers without elements never report outside", () => {
  const manager = createLayerManager();
  manager.register({ id: "no-element" });

  const event = dispatchPointer(document.body);
  assert.equal(manager.isOutside("no-element", event), false);
  assert.equal(manager.isOutsideActive(event), false);
  assert.equal(manager.isOutside("unknown", event), false);

  manager.dispose();
});

test("subscribers receive stack snapshots", () => {
  const manager = createLayerManager();
  const stacks: string[][] = [];
  const unsubscribe = manager.subscribe((stack) => {
    stacks.push(stack.map((layer) => layer.id));
  });

  manager.register({ id: "a" });
  manager.register({ id: "b" });
  manager.unregister("a");
  unsubscribe();
  manager.register({ id: "c" });

  assert.deepEqual(stacks, [["a"], ["a", "b"], ["b"]]);

  manager.dispose();
});

test("disposal clears layers and rejects registration", () => {
  const manager = createLayerManager();
  const handle = manager.register({ id: "a" });

  manager.dispose();
  manager.dispose();

  assert.equal(manager.size, 0);
  assert.equal(handle.isRegistered, false);
  assert.throws(() => manager.register(), /disposed/);
});
