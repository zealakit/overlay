import assert from "node:assert/strict";
import { test } from "node:test";
import { createPositioner } from "../dist/index.js";
import type { Placement, PositionerResult } from "../dist/index.js";
import { setBox, setViewport } from "./support/dom.ts";

setViewport(1280, 720);

type Pair = {
  reference: HTMLElement;
  floating: HTMLElement;
};

function createPair(
  referenceBox: { x: number; y: number; width: number; height: number },
  floatingBox: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: 200,
    height: 80,
  },
): Pair {
  const reference = document.createElement("button");
  const floating = document.createElement("div");
  document.body.append(reference, floating);
  setBox(reference, referenceBox);
  setBox(floating, floatingBox);
  return { reference, floating };
}

function nextResult(positioner: ReturnType<typeof createPositioner>) {
  return new Promise<PositionerResult>((resolve) => {
    positioner.subscribe(resolve);
  });
}

test("positions with placement, offset, and align offset", async () => {
  const { reference, floating } = createPair({
    x: 10,
    y: 20,
    width: 100,
    height: 40,
  });
  const positioner = createPositioner({
    reference,
    floating,
    autoUpdate: false,
    placement: "bottom-start",
    offset: 8,
    alignOffset: 5,
  });

  const result = await positioner.update();

  assert.ok(result);
  assert.deepEqual(result, {
    x: 15,
    y: 68,
    placement: "bottom-start",
    strategy: "absolute",
  });

  positioner.dispose();
});

test("normalizes a centered placement", async () => {
  const { reference, floating } = createPair({
    x: 100,
    y: 100,
    width: 100,
    height: 40,
  });
  const positioner = createPositioner({
    reference,
    floating,
    autoUpdate: false,
    placement: "bottom-center",
  });

  const result = await positioner.update();
  assert.ok(result);
  assert.equal(result.placement, "bottom");

  positioner.dispose();
});

test("flips when the preferred side overflows", async () => {
  const { reference, floating } = createPair({
    x: 10,
    y: 680,
    width: 100,
    height: 30,
  });
  const positioner = createPositioner({
    reference,
    floating,
    autoUpdate: false,
    placement: "bottom-start",
    offset: 8,
  });

  const result = await positioner.update();
  assert.ok(result);
  assert.equal(result.placement, "top-start");
  assert.equal(result.x, 10);
  assert.equal(result.y, 592);

  positioner.dispose();
});

test("keeps the floating element inside the viewport", async () => {
  const { reference, floating } = createPair({
    x: 1200,
    y: 20,
    width: 60,
    height: 30,
  });
  const positioner = createPositioner({
    reference,
    floating,
    autoUpdate: false,
    placement: "bottom-start",
    padding: 8,
  });

  const result = await positioner.update();
  assert.ok(result);
  assert.equal(result.placement, "bottom-end");
  assert.ok(result.x <= 1280 - 200);

  positioner.dispose();
});

test("flip and shift can be disabled", async () => {
  const { reference, floating } = createPair({
    x: 10,
    y: 680,
    width: 100,
    height: 30,
  });
  const positioner = createPositioner({
    reference,
    floating,
    autoUpdate: false,
    placement: "bottom-start",
    offset: 8,
    flip: false,
    shift: false,
  });

  const result = await positioner.update();
  assert.ok(result);
  assert.equal(result.placement, "bottom-start");
  assert.equal(result.y, 718);

  positioner.dispose();
});

test("subscribers receive updates and options can change", async () => {
  const { reference, floating } = createPair({
    x: 10,
    y: 20,
    width: 100,
    height: 40,
  });
  const positioner = createPositioner({
    reference,
    floating,
    autoUpdate: false,
    placement: "bottom-start",
    flip: false,
    shift: false,
  });

  const results: PositionerResult[] = [];
  const unsubscribe = positioner.subscribe((result) => results.push(result));

  await positioner.update();
  positioner.setOptions({ placement: "top" });
  await positioner.update();

  assert.equal(results.length, 2);
  assert.equal(results[0]?.placement, "bottom-start");
  assert.equal(results[1]?.placement, "top");

  unsubscribe();
  positioner.dispose();
});

test("setReference moves the floating element", async () => {
  const { reference, floating } = createPair({
    x: 10,
    y: 20,
    width: 100,
    height: 40,
  });
  const otherReference = document.createElement("button");
  document.body.append(otherReference);
  setBox(otherReference, { x: 400, y: 100, width: 50, height: 20 });

  const positioner = createPositioner({
    reference,
    floating,
    autoUpdate: false,
    placement: "bottom-start",
    offset: 4,
    flip: false,
    shift: false,
  });

  positioner.setReference(otherReference);
  const result = await positioner.update();

  assert.ok(result);
  assert.equal(result.x, 400);
  assert.equal(result.y, 124);

  positioner.dispose();
});

test("virtual references are supported", async () => {
  const floating = document.createElement("div");
  document.body.append(floating);
  setBox(floating, { x: 0, y: 0, width: 200, height: 80 });

  const positioner = createPositioner({
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

  const result = await positioner.update();
  assert.ok(result);
  assert.equal(result.x, 50);
  assert.equal(result.y, 74);

  positioner.dispose();
});

test("missing or detached elements resolve null", async () => {
  const empty = createPositioner({ autoUpdate: false });
  assert.equal(await empty.update(), null);
  empty.dispose();

  const { reference, floating } = createPair({
    x: 10,
    y: 20,
    width: 100,
    height: 40,
  });
  const positioner = createPositioner({
    reference,
    floating,
    autoUpdate: false,
  });

  floating.remove();
  assert.equal(await positioner.update(), null);

  positioner.setFloating(floating);
  reference.remove();
  assert.equal(await positioner.update(), null);

  positioner.dispose();
});

test("autoUpdate sessions deliver an initial result and dispose cleanly", async () => {
  const { reference, floating } = createPair({
    x: 10,
    y: 20,
    width: 100,
    height: 40,
  });
  const positioner = createPositioner({
    reference,
    floating,
    placement: "bottom-start",
    autoUpdate: true,
  });

  const result = await nextResult(positioner);
  assert.equal(result.placement, "bottom-start");

  positioner.dispose();
  assert.equal(positioner.isDisposed, true);
  assert.equal(await positioner.update(), null);
});

test("invalid placements resolve null instead of throwing", async () => {
  const { reference, floating } = createPair({
    x: 10,
    y: 20,
    width: 100,
    height: 40,
  });
  const positioner = createPositioner({
    reference,
    floating,
    autoUpdate: false,
  });

  positioner.setOptions({ placement: "sideways" as unknown as Placement });
  assert.equal(await positioner.update(), null);

  positioner.setOptions({ placement: "bottom" });
  const recovered = await positioner.update();
  assert.ok(recovered);
  assert.equal(recovered.placement, "bottom");

  positioner.dispose();
});

test("dispose is idempotent and stops notifications", async () => {
  const { reference, floating } = createPair({
    x: 10,
    y: 20,
    width: 100,
    height: 40,
  });
  const positioner = createPositioner({
    reference,
    floating,
    autoUpdate: false,
  });
  const results: PositionerResult[] = [];
  positioner.subscribe((result) => results.push(result));

  positioner.dispose();
  positioner.dispose();

  assert.equal(positioner.isDisposed, true);
  assert.equal(await positioner.update(), null);
  assert.equal(results.length, 0);
});

test("positioning updates do not move keyboard focus", async () => {
  const { reference, floating } = createPair({
    x: 10,
    y: 20,
    width: 100,
    height: 40,
  });
  reference.focus();
  assert.equal(document.activeElement, reference);

  const positioner = createPositioner({
    reference,
    floating,
    autoUpdate: false,
    placement: "bottom-start",
  });
  await positioner.update();
  positioner.setOptions({ placement: "right-start" });
  await positioner.update();

  assert.equal(document.activeElement, reference);
  positioner.dispose();
});
