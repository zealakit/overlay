import assert from "node:assert/strict";
import { test } from "node:test";
import type {
  AnimationConfig,
  AnimationDirection,
  AnimationDirectionSetting,
  AnimationEasing,
  AnimationSetting,
  CustomAnimationClasses,
  ResolvedAnimationConfig,
} from "../dist/index.js";

// Type-level test: this file only compiles when the adapter re-exports the
// animation types, so `pnpm typecheck` is the real assertion.
test("animation types are exported and accept the documented shapes", () => {
  const enabled: AnimationSetting = true;
  const disabled: AnimationSetting = false;
  const direction: AnimationDirection = "up";
  const directionSetting: AnimationDirectionSetting = "auto";
  const easing: AnimationEasing = "cubic-bezier(0.4, 0, 0.2, 1)";
  const classes: CustomAnimationClasses = { enter: "in", exit: "out" };
  const config: AnimationConfig = {
    type: "custom",
    direction,
    duration: 200,
    delay: 10,
    easing,
    custom: classes,
  };
  const objectForm: AnimationSetting = config;
  const resolved: ResolvedAnimationConfig = {
    enabled: true,
    type: "fade",
    direction: directionSetting,
    duration: 160,
    delay: 0,
    easing: "ease-in-out",
    custom: null,
  };

  assert.equal(enabled, true);
  assert.equal(disabled, false);
  assert.equal(typeof objectForm, "object");
  assert.equal(resolved.enabled, true);
});
