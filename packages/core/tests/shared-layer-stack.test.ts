import assert from "node:assert/strict";
import { test } from "node:test";
import { acquireSharedLayerStack } from "../dist/index.js";

test("adapters acquire the same per-document layer stack", () => {
  const first = acquireSharedLayerStack(document);
  const second = acquireSharedLayerStack(document);
  assert.equal(first.stack, second.stack);

  const lower = first.stack.register();
  const upper = second.stack.register();
  assert.equal(first.stack.getTopmost()?.id, upper.id);

  lower.dispose();
  upper.dispose();
  first.release();
  second.release();
});
