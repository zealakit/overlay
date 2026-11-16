import type { Align, Side } from "./geometry.js";

/**
 * Direction of built-in movement. For `fade` it is the direction the popup
 * travels (exit reverses it); for `expand` it is the direction it grows.
 */
export type AnimationDirection = "up" | "down" | "left" | "right";

/** Auto resolves from the final placement; explicit values take precedence. */
export type AnimationDirectionSetting = AnimationDirection | "auto";

/** Built-in timing presets. */
export type AnimationTimingFunction = "ease-in-out" | "linear";

/** Presets plus any valid CSS timing function (for example `cubic-bezier(...)`). */
export type AnimationEasing =
  | AnimationTimingFunction
  | "ease"
  | "ease-in"
  | "ease-out"
  | (string & {});

/** Built-in presets plus consumer-defined animation. */
export type AnimationType = "fade" | "expand" | "custom";

/** CSS classes added for the enter/exit phase; your CSS owns the animation. */
export type CustomAnimationClasses = {
  enter: string;
  exit: string;
};

/** Information a custom keyframes function can use. */
export type AnimationContext = {
  phase: "enter" | "exit";
  /** Final placement after collision handling; undefined for Dialog. */
  placement: string | undefined;
  /** Side of the anchor the popup is on; null when there is no anchor. */
  side: Side | null;
  align: Align | null;
  /** CSS `transform-origin` that points at the anchor (RTL aware). */
  transformOrigin: string;
};

export type CustomKeyframes =
  | Keyframe[]
  | ((context: AnimationContext) => Keyframe[]);

/**
 * Web Animations keyframes. Omit `exit` to play `enter` in reverse.
 * `duration`, `delay` and `easing` from the animation config still apply.
 */
export type CustomAnimationKeyframes = {
  enter: CustomKeyframes;
  exit?: CustomKeyframes;
};

export type CustomAnimation = CustomAnimationClasses | CustomAnimationKeyframes;

export function isCustomClasses(
  custom: CustomAnimation,
): custom is CustomAnimationClasses {
  return typeof custom.enter === "string";
}

export type AnimationConfig = {
  /** Defaults to true when a config object is passed. */
  enabled?: boolean;
  /** `fade` (default), `expand` (grow from the anchor edge), or `custom`. */
  type?: AnimationType;
  /** Explicit direction; defaults to "auto" based on resolved placement. */
  direction?: AnimationDirectionSetting;
  /** Milliseconds. Defaults to 160. */
  duration?: number;
  /** Milliseconds. Defaults to 0. */
  delay?: number;
  /** CSS timing function. Defaults to "ease-in-out". */
  easing?: AnimationEasing;
  /** Required when type is "custom": CSS classes or Web Animations keyframes. */
  custom?: CustomAnimation;
};

/** Animation is disabled unless `true` or a config object is passed. */
export type AnimationSetting = boolean | AnimationConfig;

export type ResolvedAnimationConfig = {
  enabled: boolean;
  type: AnimationType;
  direction: AnimationDirectionSetting;
  duration: number;
  delay: number;
  easing: AnimationEasing;
  custom: CustomAnimation | null;
};

export const DEFAULT_ANIMATION_DURATION = 160;
export const DEFAULT_ANIMATION_DELAY = 0;
export const DEFAULT_ANIMATION_EASING: AnimationEasing = "ease-in-out";

function finiteNonNegative(value: number, name: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(
      `[overlay-core] animation.${name} must be a finite non-negative number.`,
    );
  }
  return value;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function validKeyframes(value: unknown): boolean {
  return (
    typeof value === "function" || (Array.isArray(value) && value.length > 0)
  );
}

function validCustom(
  custom: CustomAnimation | undefined,
): CustomAnimation | null {
  if (!custom) {
    return null;
  }
  if (typeof custom.enter === "string") {
    return nonEmptyString(custom.enter) &&
      nonEmptyString((custom as CustomAnimationClasses).exit)
      ? custom
      : null;
  }
  const exit = (custom as CustomAnimationKeyframes).exit;
  return validKeyframes(custom.enter) &&
    (exit === undefined || validKeyframes(exit))
    ? custom
    : null;
}

/**
 * Normalize an animation setting into the contract adapters implement.
 * Invalid numeric values and incomplete custom configurations throw early.
 */
export function normalizeAnimationConfig(
  setting: AnimationSetting | undefined,
): ResolvedAnimationConfig {
  const config: AnimationConfig =
    setting === undefined || setting === false
      ? { enabled: false }
      : setting === true
        ? {}
        : setting;
  const enabled = config.enabled ?? true;
  const custom = validCustom(config.custom);
  const type = config.type ?? (custom ? "custom" : "fade");

  if (!enabled) {
    return {
      enabled: false,
      type: "fade",
      direction: config.direction ?? "auto",
      duration: 0,
      delay: 0,
      easing: config.easing ?? DEFAULT_ANIMATION_EASING,
      custom: null,
    };
  }
  if (type === "custom" && !custom) {
    throw new Error(
      "[overlay-core] animation.custom is required for custom animation: pass { enter, exit } CSS classes or { enter } keyframes.",
    );
  }
  if (typeof config.easing === "string" && !config.easing.trim()) {
    throw new Error(
      "[overlay-core] animation.easing must be a non-empty CSS timing function.",
    );
  }

  return {
    enabled: true,
    type,
    direction: config.direction ?? "auto",
    duration: finiteNonNegative(
      config.duration ?? DEFAULT_ANIMATION_DURATION,
      "duration",
    ),
    delay: finiteNonNegative(config.delay ?? DEFAULT_ANIMATION_DELAY, "delay"),
    easing: config.easing ?? DEFAULT_ANIMATION_EASING,
    custom,
  };
}

/**
 * Resolve automatic direction from the final (collision-adjusted) placement.
 * Explicit directions always win.
 */
export function resolveAnimationDirection(
  direction: AnimationDirectionSetting | undefined,
  placement: string | undefined,
): AnimationDirection {
  if (direction && direction !== "auto") {
    return direction;
  }
  switch (placement?.split("-")[0]) {
    case "top":
      return "down";
    case "right":
      return "left";
    case "left":
      return "right";
    default:
      return "up";
  }
}
