import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { outsideInteraction } from "../dist/index.js";
import { dispatchPointer, resetDom } from "./support/dom.ts";

beforeEach(() => {
  resetDom();
});

afterEach(() => {
  resetDom();
});

type ActionResult = {
  update?: (params: Parameters<typeof outsideInteraction>[1]) => void;
  destroy?: () => void;
};

test("calls the handler only for primary presses outside node, elements, and reference", () => {
  const node = document.createElement("div");
  const extra = document.createElement("span");
  const reference = document.createElement("button");
  const outside = document.createElement("p");
  document.body.append(node, extra, reference, outside);

  let calls = 0;
  const action = outsideInteraction(node, {
    handler: () => {
      calls += 1;
    },
    elements: [extra],
    reference,
  }) as ActionResult;

  dispatchPointer(node);
  dispatchPointer(extra);
  dispatchPointer(reference);
  dispatchPointer(outside, { button: 2 });
  assert.equal(calls, 0);

  dispatchPointer(outside);
  assert.equal(calls, 1);

  action.update?.({
    handler: () => {
      calls += 1;
    },
    elements: [extra],
    reference,
    enabled: false,
  });
  dispatchPointer(outside);
  assert.equal(calls, 1);

  action.destroy?.();
  dispatchPointer(outside);
  assert.equal(calls, 1);
});

test("supports configurable event type and target", () => {
  const node = document.createElement("div");
  const target = document.createElement("div");
  document.body.append(node, target);

  let calls = 0;
  const action = outsideInteraction(node, {
    handler: () => {
      calls += 1;
    },
    target,
    eventType: "mousedown",
  }) as ActionResult;

  dispatchPointer(target);
  assert.equal(calls, 0);

  target.dispatchEvent(
    new window.MouseEvent("mousedown", { bubbles: true, button: 0 }),
  );
  assert.equal(calls, 1);

  action.update?.({
    handler: () => {
      calls += 1;
    },
    target,
    eventType: ["mousedown", "mouseup"],
  });

  target.dispatchEvent(
    new window.MouseEvent("mouseup", { bubbles: true, button: 0 }),
  );
  assert.equal(calls, 2);

  action.destroy?.();
});
