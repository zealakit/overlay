/** Direction of built-in fade movement. Enter and exit use opposite movement. */
export type AnimationDirection = "up" | "down" | "left" | "right";

/** Auto resolves from the final placement; explicit values take precedence. */
export type AnimationDirectionSetting = AnimationDirection | "auto";

export type AnimationEasing =
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "linear"
  | (string & {});

export type CustomAnimationClasses = {
  enter: string;
  exit: string;
};

export type AnimationConfig = {
  /** Defaults to true. */
  enabled?: boolean;
  /** Built-in preset or consumer CSS animation classes. */
  type?: "fade" | "custom";
  /** Explicit direction; defaults to "auto" based on resolved placement. */
  direction?: AnimationDirectionSetting;
  /** Milliseconds. Defaults to 160. */
  duration?: number;
  /** Milliseconds. Defaults to 0. */
  delay?: number;
  /** CSS timing function. Defaults to "ease-out". */
  easing?: AnimationEasing;
  /** Required when type is "custom"; custom overrides the built-in fade. */
  custom?: CustomAnimationClasses;
};

export type AnimationSetting = boolean | AnimationConfig;

export type ResolvedAnimationConfig = {
  enabled: boolean;
  type: "fade" | "custom";
  direction: AnimationDirectionSetting;
  duration: number;
  delay: number;
  easing: AnimationEasing;
  custom: CustomAnimationClasses | null;
};

export const DEFAULT_ANIMATION_DURATION = 160;
export const DEFAULT_ANIMATION_DELAY = 0;
export const DEFAULT_ANIMATION_EASING: AnimationEasing = "ease-out";

function finiteNonNegative(
  value: number,
  name: string,
): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(
      `[overlay-core] animation.${name} must be a finite non-negative number.`,
    );
  }
  return value;
}

/**
 * Normalize an animation setting into the contract adapters implement.
 * Invalid numeric values and incomplete custom configurations throw early.
 */
export function normalizeAnimationConfig(
  setting: AnimationSetting | undefined,
): ResolvedAnimationConfig {
  const config: AnimationConfig =
    setting === false ? { enabled: false } : setting === true || setting === undefined ? {} : setting;
  const enabled = config.enabled ?? true;
  const custom =
    config.custom &&
    typeof config.custom.enter === "string" &&
    config.custom.enter.trim() &&
    typeof config.custom.exit === "string" &&
    config.custom.exit.trim()
      ? config.custom
      : null;
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
      "[overlay-core] animation.custom.enter and animation.custom.exit are required for custom animation.",
    );
  }
  if (typeof config.easing === "string" && !config.easing.trim()) {
    throw new Error("[overlay-core] animation.easing must be a non-empty CSS timing function.");
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
    case "bottom":
    default:
      return "up";
  }
}
