import assert from "node:assert/strict";
import { test } from "node:test";
import { listen } from "../dist/index.js";

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
