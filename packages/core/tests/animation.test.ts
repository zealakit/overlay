import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createExpandKeyframes,
  createFadeKeyframes,
  getTransformOrigin,
  resolveExpandPlan,
  normalizeAnimationConfig,
  resolveAnimationDirection,
  runOverlayAnimation,
} from "../dist/index.js";

test("animation is disabled unless requested", () => {
  assert.equal(normalizeAnimationConfig(undefined).enabled, false);
  assert.equal(normalizeAnimationConfig(false).enabled, false);
  const on = normalizeAnimationConfig(true);
  assert.equal(on.enabled, true);
  assert.equal(on.type, "fade");
  assert.equal(on.duration, 160);
  assert.equal(on.delay, 0);
  assert.equal(on.easing, "ease-in-out");
  assert.equal(normalizeAnimationConfig({}).enabled, true);
});

test("accepts duration, delay, and timing presets", () => {
  const config = normalizeAnimationConfig({
    duration: 300,
    delay: 50,
    easing: "linear",
    direction: "left",
  });
  assert.equal(config.duration, 300);
  assert.equal(config.delay, 50);
  assert.equal(config.easing, "linear");
  assert.equal(config.direction, "left");
});

test("rejects invalid numbers and incomplete custom animations", () => {
  assert.throws(() => normalizeAnimationConfig({ duration: -1 }), RangeError);
  assert.throws(
    () => normalizeAnimationConfig({ delay: Number.NaN }),
    RangeError,
  );
  assert.throws(() => normalizeAnimationConfig({ type: "custom" }));
  const custom = normalizeAnimationConfig({
    custom: { enter: "in", exit: "out" },
  });
  assert.equal(custom.type, "custom");
});

test("auto direction follows the final placement", () => {
  assert.equal(resolveAnimationDirection("auto", "top-start"), "down");
  assert.equal(resolveAnimationDirection("auto", "bottom"), "up");
  assert.equal(resolveAnimationDirection("auto", "left-end"), "right");
  assert.equal(resolveAnimationDirection("auto", "right"), "left");
  assert.equal(resolveAnimationDirection("up", "top"), "up");
});

test("exit keyframes reverse the enter keyframes", () => {
  const enter = createFadeKeyframes("enter", "up");
  const exit = createFadeKeyframes("exit", "up");
  assert.deepEqual(enter[0], { opacity: 0, translate: "0px 4px" });
  assert.deepEqual(enter[1], { opacity: 1, translate: "0px 0px" });
  assert.deepEqual(exit, [...enter].reverse());
  assert.deepEqual(createFadeKeyframes("enter", "left")[0], {
    opacity: 0,
    translate: "4px 0px",
  });
});

test("reduced motion keeps opacity only", () => {
  assert.deepEqual(createFadeKeyframes("enter", "down", 0)[0], {
    opacity: 0,
    translate: "0px 0px",
  });
});

test("runner resolves immediately when disabled or WAAPI is missing", async () => {
  const element = document.createElement("div");
  await runOverlayAnimation(element, {
    phase: "enter",
    config: normalizeAnimationConfig(false),
  }).finished;
  Object.defineProperty(element, "animate", { value: undefined });
  await runOverlayAnimation(element, {
    phase: "exit",
    config: normalizeAnimationConfig(true),
  }).finished;
});

test("runner passes timing options to WAAPI and honors cancel", async () => {
  const element = document.createElement("div");
  let options: KeyframeAnimationOptions | undefined;
  let cancelled = false;
  let finish: () => void = () => {};
  (element as unknown as { animate: unknown }).animate = (
    _keyframes: Keyframe[],
    opts: KeyframeAnimationOptions,
  ) => {
    options = opts;
    return {
      finished: new Promise<void>((resolve) => {
        finish = resolve;
      }),
      cancel() {
        cancelled = true;
      },
    };
  };
  const handle = runOverlayAnimation(element, {
    phase: "enter",
    config: normalizeAnimationConfig({
      duration: 200,
      delay: 10,
      easing: "linear",
    }),
  });
  assert.equal(options?.duration, 200);
  assert.equal(options?.delay, 10);
  assert.equal(options?.easing, "linear");
  let resolved = false;
  void handle.finished.then(() => {
    resolved = true;
  });
  handle.cancel();
  finish();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(cancelled, true);
  assert.equal(resolved, false);
});

test("custom animation resolves without CSS and cleans up its class", async () => {
  const element = document.createElement("div");
  const handle = runOverlayAnimation(element, {
    phase: "enter",
    config: normalizeAnimationConfig({ custom: { enter: "in", exit: "out" } }),
  });
  await handle.finished;
  assert.equal(element.classList.contains("in"), false);
});

test("normalizes expand and custom keyframes", () => {
  assert.equal(normalizeAnimationConfig({ type: "expand" }).type, "expand");
  const arrays = normalizeAnimationConfig({
    custom: { enter: [{ opacity: 0 }, { opacity: 1 }] },
  });
  assert.equal(arrays.type, "custom");
  const fn = normalizeAnimationConfig({
    type: "custom",
    custom: {
      enter: () => [{ opacity: 0 }, { opacity: 1 }],
      exit: [{ opacity: 1 }, { opacity: 0 }],
    },
  });
  assert.equal(fn.type, "custom");
  assert.throws(() =>
    normalizeAnimationConfig({ type: "custom", custom: { enter: [] } }),
  );
});

test("transform origin points at the anchor edge and respects RTL", () => {
  assert.equal(getTransformOrigin("bottom", "start"), "left top");
  assert.equal(getTransformOrigin("bottom", "end"), "right top");
  assert.equal(getTransformOrigin("bottom", "start", true), "right top");
  assert.equal(getTransformOrigin("bottom", "center"), "center top");
  assert.equal(getTransformOrigin("top", "start"), "left bottom");
  assert.equal(getTransformOrigin("right", "start"), "left top");
  assert.equal(getTransformOrigin("left", "end"), "right bottom");
  assert.equal(getTransformOrigin(null, null), "center");
});

test("expand grows away from the anchor and follows the placement", () => {
  assert.deepEqual(resolveExpandPlan({ placement: "bottom-start" }), {
    axis: "y",
    side: "bottom",
    align: "start",
    transformOrigin: "left top",
  });
  assert.equal(
    resolveExpandPlan({ placement: "top" }).transformOrigin,
    "center bottom",
  );
  assert.equal(resolveExpandPlan({ placement: "left-end" }).axis, "x");
  // Explicit direction overrides the side.
  assert.equal(
    resolveExpandPlan({ placement: "bottom", direction: "up" }).transformOrigin,
    "center bottom",
  );
  // No anchor (Dialog): zoom from the centre.
  assert.deepEqual(resolveExpandPlan({}), {
    axis: "both",
    side: null,
    align: null,
    transformOrigin: "center",
  });
});

test("expand fades in with the scale and collapse reverses to opacity 0", () => {
  const plan = resolveExpandPlan({ placement: "bottom" });
  const enter = createExpandKeyframes("enter", plan);
  const exit = createExpandKeyframes("exit", plan);
  assert.equal(enter[0]?.opacity, 0);
  assert.equal(enter[0]?.scale, "1 0");
  assert.equal(enter[1]?.opacity, 1);
  assert.equal(enter[1]?.scale, "1 1");
  assert.deepEqual(exit, [...enter].reverse());
  assert.equal(exit.at(-1)?.opacity, 0);
  assert.equal(
    createExpandKeyframes("enter", resolveExpandPlan({ placement: "right" }))[0]
      ?.scale,
    "0 1",
  );
  const reduced = createExpandKeyframes("enter", plan, true);
  assert.equal(reduced[0]?.scale, undefined);
  assert.equal(reduced[0]?.opacity, 0);
});

function mockWaapi(element: HTMLElement) {
  const calls: Array<{
    keyframes: Keyframe[];
    options: KeyframeAnimationOptions;
  }> = [];
  (element as unknown as { animate: unknown }).animate = (
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
  ) => {
    calls.push({ keyframes, options });
    return { finished: new Promise<void>(() => {}), cancel() {} };
  };
  return calls;
}

test("runner plays expand and exposes the transform origin variable", () => {
  const element = document.createElement("div");
  const calls = mockWaapi(element);
  const handle = runOverlayAnimation(element, {
    phase: "enter",
    config: normalizeAnimationConfig({ type: "expand", duration: 180 }),
    placement: "bottom-start",
  });
  assert.equal(calls[0]?.keyframes[0]?.transformOrigin, "left top");
  assert.equal(calls[0]?.options.duration, 180);
  assert.equal(
    element.style.getPropertyValue("--overlay-transform-origin"),
    "left top",
  );
  handle.cancel();
  assert.equal(
    element.style.getPropertyValue("--overlay-transform-origin"),
    "",
  );
});

test("custom keyframes receive context; exit defaults to reverse enter", () => {
  const element = document.createElement("div");
  const calls = mockWaapi(element);
  const contexts: unknown[] = [];
  const config = normalizeAnimationConfig({
    custom: {
      enter: (context) => {
        contexts.push(context);
        return [{ opacity: 0 }, { opacity: 0.5 }, { opacity: 1 }];
      },
    },
  });
  runOverlayAnimation(element, {
    phase: "enter",
    config,
    placement: "top-end",
  });
  runOverlayAnimation(element, { phase: "exit", config, placement: "top-end" });
  assert.deepEqual(contexts[0], {
    phase: "enter",
    placement: "top-end",
    side: "top",
    align: "end",
    transformOrigin: "right bottom",
  });
  assert.deepEqual(calls[1]?.keyframes, [
    { opacity: 1 },
    { opacity: 0.5 },
    { opacity: 0 },
  ]);
});
