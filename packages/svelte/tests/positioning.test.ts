import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { get } from "svelte/store";
import type { PositionerResult } from "@zealakit/overlay-core";
import {
  type FloatingActionParams,
  createPositioner,
  floating,
} from "../dist/index.js";
import { resetDom, setBox, waitFor } from "./support/dom.ts";

beforeEach(() => {
  resetDom();
});

afterEach(() => {
  resetDom();
});

type ActionResult = {
  update?: (params: FloatingActionParams | undefined) => void;
  destroy?: () => void;
};

function createPair() {
  const reference = document.createElement("button");
  const floatingElement = document.createElement("div");
  document.body.append(reference, floatingElement);
  setBox(reference, { x: 10, y: 20, width: 100, height: 40 });
  setBox(floatingElement, { x: 0, y: 0, width: 200, height: 80 });
  return { reference, floatingElement };
}

test("createPositioner positions, updates options, and disposes", async () => {
  const { reference, floatingElement } = createPair();
  const controller = createPositioner({
    reference,
    floating: floatingElement,
    autoUpdate: false,
    placement: "bottom-start",
    offset: 8,
    flip: false,
    shift: false,
  });

  const values: Array<PositionerResult | null> = [];
  const unsubscribe = controller.subscribe((value) => values.push(value));

  const result = await controller.update();
  assert.ok(result);
  assert.equal(floatingElement.style.position, "absolute");
  assert.equal(floatingElement.style.left, "10px");
  assert.equal(floatingElement.style.top, "68px");
  assert.equal(floatingElement.dataset.placement, "bottom-start");
  assert.deepEqual(get(controller), result);
  assert.equal(values.at(-1), result);

  controller.setOptions({ placement: "right-start", offset: 4 });
  const next = await controller.update();
  assert.ok(next);
  assert.equal(next.placement, "right-start");
  assert.equal(floatingElement.style.left, "114px");

  controller.setReference(null);
  assert.equal(await controller.update(), null);
  assert.equal(values.at(-1), null);

  unsubscribe();
  controller.dispose();
  controller.dispose();
  assert.equal(await controller.update(), null);
});

test("createPositioner supports element replacement and opt-out styles", async () => {
  const { reference, floatingElement } = createPair();
  const replacement = document.createElement("button");
  document.body.append(replacement);
  setBox(replacement, { x: 300, y: 100, width: 50, height: 20 });

  const controller = createPositioner({
    reference,
    floating: floatingElement,
    autoUpdate: false,
    applyStyles: false,
    placement: "bottom-start",
    flip: false,
    shift: false,
  });

  controller.setReference(replacement);
  const result = await controller.update();
  assert.ok(result);
  assert.equal(result.x, 300);
  assert.equal(floatingElement.style.left, "");

  controller.setApplyStyles(true);
  controller.setOptions({ placement: "bottom-start" });
  controller.setReference(reference);
  await controller.update();
  assert.equal(floatingElement.style.left, "10px");

  controller.dispose();
});

test("floating action applies styles and reacts to parameter updates", async () => {
  const { reference, floatingElement } = createPair();
  const updates: PositionerResult[] = [];

  const action = floating(floatingElement, {
    reference,
    placement: "bottom-start",
    offset: 8,
  }) as ActionResult;
  action.update?.({
    reference,
    placement: "bottom-start",
    offset: 8,
    onUpdate: (result) => updates.push(result),
  });

  const replacement = document.createElement("button");
  document.body.append(replacement);
  setBox(replacement, { x: 300, y: 100, width: 50, height: 20 });

  action.update?.({
    reference: replacement,
    placement: "right-start",
    offset: 4,
    onUpdate: (result) => updates.push(result),
  });

  await waitFor(() => {
    assert.equal(floatingElement.style.left, "354px");
    assert.equal(floatingElement.dataset.placement, "right-start");
    assert.ok(updates.length > 0);
  });

  action.destroy?.();
});

test("floating action pauses while disabled", async () => {
  const { reference, floatingElement } = createPair();

  const action = floating(floatingElement, {
    reference,
    enabled: false,
    placement: "bottom-start",
  }) as ActionResult;

  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(floatingElement.style.left, "");

  action.update?.({
    reference,
    enabled: true,
    placement: "bottom-start",
    offset: 8,
  });

  await waitFor(() => {
    assert.equal(floatingElement.style.left, "10px");
    assert.equal(floatingElement.style.top, "68px");
  });

  action.destroy?.();
});
