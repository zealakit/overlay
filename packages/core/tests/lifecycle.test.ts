import assert from "node:assert/strict";
import { test } from "node:test";
import { createDisposer, listen } from "../dist/index.js";

test("disposer runs cleanups in reverse order and is idempotent", () => {
  const calls: string[] = [];
  const disposer = createDisposer();

  disposer.add(() => calls.push("first"));
  disposer.add(() => calls.push("second"));

  disposer.dispose();
  disposer.dispose();

  assert.deepEqual(calls, ["second", "first"]);
  assert.equal(disposer.isDisposed, true);
});

test("cleanup returned by add() is idempotent", () => {
  const calls: string[] = [];
  const disposer = createDisposer();
  const cleanup = disposer.add(() => calls.push("cleanup"));

  cleanup();
  cleanup();
  disposer.dispose();

  assert.deepEqual(calls, ["cleanup"]);
});

test("adding a cleanup after disposal runs it immediately", () => {
  const calls: string[] = [];
  const disposer = createDisposer();
  disposer.dispose();

  const cleanup = disposer.add(() => calls.push("late"));
  cleanup();

  assert.deepEqual(calls, ["late"]);
});

test("listen detaches exactly once", () => {
  const target = document.createElement("div");
  let count = 0;
  const cleanup = listen(target, "click", () => {
    count += 1;
  });

  target.dispatchEvent(new window.Event("click"));
  cleanup();
  cleanup();
  target.dispatchEvent(new window.Event("click"));

  assert.equal(count, 1);
});

test("listen tolerates a missing target", () => {
  const cleanup = listen(null, "click", () => {
    throw new Error("should not run");
  });
  cleanup();
});
