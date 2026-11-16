import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import type { DismissReason, PositionerResult } from "@zealakit/overlay-core";
import { createLayerStack } from "@zealakit/overlay-core";
import { overlay, portal } from "../dist/index.js";
import {
  dispatchEscape,
  dispatchPointer,
  resetDom,
  setBox,
  waitFor,
} from "./support/dom.ts";

beforeEach(() => {
  resetDom();
});

afterEach(() => {
  resetDom();
});

type OverlayActionResult = {
  update?: (params: Parameters<typeof overlay>[1]) => void;
  destroy?: () => void;
};

function createFixture() {
  const wrapper = document.createElement("div");
  const reference = document.createElement("button");
  const floatingElement = document.createElement("div");
  wrapper.append(floatingElement);
  document.body.append(wrapper, reference);
  setBox(reference, { x: 10, y: 20, width: 100, height: 40 });
  setBox(floatingElement, { x: 0, y: 0, width: 200, height: 80 });
  const stack = createLayerStack({ document });
  return { wrapper, reference, floatingElement, stack };
}

test("overlay action opens, positions, registers, and closes", async () => {
  const { reference, floatingElement, stack } = createFixture();
  const calls: DismissReason[] = [];
  const updates: PositionerResult[] = [];

  const action = overlay(floatingElement, {
    reference,
    open: false,
    stack,
    placement: "bottom-start",
    offset: 8,
    onDismiss: (reason) => calls.push(reason),
    onUpdate: (result) => updates.push(result),
  }) as OverlayActionResult;

  assert.equal(floatingElement.dataset.state, "closed");
  assert.equal(stack.size, 0);

  action.update?.({
    reference,
    open: true,
    stack,
    placement: "bottom-start",
    offset: 8,
    onDismiss: (reason) => calls.push(reason),
    onUpdate: (result) => updates.push(result),
  });

  await waitFor(() => {
    assert.equal(floatingElement.dataset.state, "open");
    assert.equal(floatingElement.style.left, "10px");
    assert.equal(floatingElement.style.top, "68px");
    assert.equal(stack.size, 1);
    assert.ok(updates.length > 0);
  });

  dispatchEscape();
  assert.deepEqual(calls, ["escape-key"]);

  action.update?.({
    reference,
    open: false,
    stack,
  });
  assert.equal(floatingElement.dataset.state, "closed");
  assert.equal(stack.size, 0);

  action.update?.({
    reference,
    open: true,
    stack,
    placement: "bottom-start",
    offset: 8,
  });
  await waitFor(() => {
    assert.equal(stack.size, 1);
  });

  const outside = document.createElement("p");
  document.body.append(outside);
  dispatchPointer(outside);
  assert.deepEqual(calls, ["escape-key"]);

  action.destroy?.();
  assert.equal(stack.size, 0);
  stack.dispose();
});

test("overlay action can be combined with portal", () => {
  const { wrapper, reference, floatingElement, stack } = createFixture();

  const portalAction = portal(floatingElement, {
    target: document.body,
  }) as OverlayActionResult;
  assert.equal(floatingElement.parentElement, document.body);

  const action = overlay(floatingElement, {
    reference,
    open: true,
    stack,
    placement: "bottom-start",
  }) as OverlayActionResult;

  assert.equal(floatingElement.parentElement, document.body);

  action.destroy?.();
  portalAction.destroy?.();
  assert.equal(floatingElement.parentElement, wrapper);
  stack.dispose();
});
