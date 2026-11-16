import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { createFloating } from "../dist/index.js";
import { resetDom, setBox } from "./support/dom.ts";

beforeEach(resetDom);

function createPair(
  referenceBox: { x: number; y: number; width: number; height: number },
  floatingBox: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: 200,
    height: 80,
  },
) {
  const reference = document.createElement("button");
  const floating = document.createElement("div");
  document.body.append(reference, floating);
  setBox(reference, referenceBox);
  setBox(floating, floatingBox);
  return { reference, floating };
}

test("applies position styles and data-placement", async () => {
  const { reference, floating } = createPair({
    x: 10,
    y: 20,
    width: 100,
    height: 40,
  });
  const controller = createFloating({
    reference,
    floating,
    autoUpdate: false,
    placement: "bottom-start",
    offset: 8,
  });

  const result = await controller.update();

  assert.ok(result);
  assert.deepEqual(controller.result, result);
  assert.equal(floating.style.position, "absolute");
  assert.equal(floating.style.left, "10px");
  assert.equal(floating.style.top, "68px");
  assert.equal(floating.dataset.placement, "bottom-start");

  controller.dispose();
});

test("can opt out of style writes while still publishing results", async () => {
  const { reference, floating } = createPair({
    x: 10,
    y: 20,
    width: 100,
    height: 40,
  });
  const controller = createFloating({
    reference,
    floating,
    autoUpdate: false,
    applyStyles: false,
    placement: "bottom-start",
  });

  const results = [];
  controller.subscribe((result) => results.push(result));

  await controller.update();

  assert.equal(results.length, 1);
  assert.equal(floating.style.position, "");
  assert.equal(floating.style.left, "");

  controller.dispose();
});

test("updates options dynamically", async () => {
  const { reference, floating } = createPair({
    x: 10,
    y: 20,
    width: 100,
    height: 40,
  });
  const controller = createFloating({
    reference,
    floating,
    autoUpdate: false,
    placement: "bottom-start",
  });

  await controller.update();
  assert.equal(floating.dataset.placement, "bottom-start");

  controller.setOptions({ placement: "right-start", offset: 4, flip: false });
  const result = await controller.update();

  assert.ok(result);
  assert.equal(result.placement, "right-start");
  assert.equal(floating.style.left, "114px");
  assert.equal(floating.dataset.placement, "right-start");

  controller.dispose();
});

test("supports reference updates and nullable elements", async () => {
  const { reference, floating } = createPair({
    x: 10,
    y: 20,
    width: 100,
    height: 40,
  });
  const otherReference = document.createElement("button");
  document.body.append(otherReference);
  setBox(otherReference, { x: 400, y: 100, width: 50, height: 20 });

  const controller = createFloating({
    reference,
    floating,
    autoUpdate: false,
    placement: "bottom-start",
    flip: false,
    shift: false,
  });

  controller.setReference(otherReference);
  const result = await controller.update();
  assert.ok(result);
  assert.equal(result.x, 400);

  controller.setReference(null);
  assert.equal(await controller.update(), null);

  controller.setFloating(null);
  assert.equal(await controller.update(), null);

  controller.setFloating(floating);
  controller.setReference(otherReference);
  assert.ok(await controller.update());

  controller.dispose();
});

test("detached elements resolve null without throwing", async () => {
  const { reference, floating } = createPair({
    x: 10,
    y: 20,
    width: 100,
    height: 40,
  });
  const controller = createFloating({
    reference,
    floating,
    autoUpdate: false,
  });

  floating.remove();
  assert.equal(await controller.update(), null);

  controller.setFloating(floating);
  reference.remove();
  assert.equal(await controller.update(), null);

  controller.dispose();
});

test("supports virtual references", async () => {
  const floating = document.createElement("div");
  document.body.append(floating);
  setBox(floating, { x: 0, y: 0, width: 200, height: 80 });

  const controller = createFloating({
    reference: {
      getBoundingClientRect: () => ({
        x: 50,
        y: 60,
        width: 10,
        height: 10,
      }),
    },
    floating,
    autoUpdate: false,
    placement: "bottom-start",
    offset: 4,
    flip: false,
    shift: false,
  });

  const result = await controller.update();
  assert.ok(result);
  assert.equal(result.x, 50);
  assert.equal(result.y, 74);
  assert.equal(floating.style.left, "50px");
  assert.equal(floating.style.top, "74px");

  controller.dispose();
});

test("dispose is idempotent and stops updates and style writes", async () => {
  const { reference, floating } = createPair({
    x: 10,
    y: 20,
    width: 100,
    height: 40,
  });
  const controller = createFloating({
    reference,
    floating,
    autoUpdate: false,
  });

  const results = [];
  controller.subscribe((result) => results.push(result));

  controller.dispose();
  controller.dispose();

  assert.equal(controller.isDisposed, true);
  assert.equal(await controller.update(), null);
  assert.equal(results.length, 0);
  assert.equal(floating.style.left, "");
});
