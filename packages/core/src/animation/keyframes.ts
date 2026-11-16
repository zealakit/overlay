import type { AnimationDirection } from "../types/animation.js";
import type { Align, Side } from "../types/geometry.js";

export type AnimationPhase = "enter" | "exit";

/** Distance in pixels the built-in fade travels. */
export const FADE_MOVE_DISTANCE = 4;

/** Starting offset of the enter animation for a direction. */
export function fadeOffset(
  direction: AnimationDirection,
  distance: number = FADE_MOVE_DISTANCE,
): { x: number; y: number } {
  switch (direction) {
    case "down":
      return { x: 0, y: -distance };
    case "left":
      return { x: distance, y: 0 };
    case "right":
      return { x: -distance, y: 0 };
    default:
      return { x: 0, y: distance };
  }
}

/**
 * Keyframes for the built-in fade. The exit animation is the exact reverse of
 * the enter animation, so it moves back in the opposite direction.
 */
export function createFadeKeyframes(
  phase: AnimationPhase,
  direction: AnimationDirection,
  distance: number = FADE_MOVE_DISTANCE,
): Keyframe[] {
  const offset = fadeOffset(direction, distance);
  const hidden = { opacity: 0, translate: `${offset.x}px ${offset.y}px` };
  const shown = { opacity: 1, translate: "0px 0px" };
  return phase === "enter" ? [hidden, shown] : [shown, hidden];
}

export type ExpandAxis = "x" | "y" | "both";

/** Where an expanding popup grows from and which axis it scales. */
export type ExpandPlan = {
  axis: ExpandAxis;
  /** CSS `transform-origin` pointing at the anchor. */
  transformOrigin: string;
  /** Side of the anchor the popup sits on; null without an anchor (Dialog). */
  side: Side | null;
  align: Align | null;
};

const SIDES: readonly string[] = ["top", "right", "bottom", "left"];

function splitPlacement(placement: string | undefined): {
  side: Side | null;
  align: Align | null;
} {
  const [rawSide = "", rawAlign] = (placement ?? "").split("-");
  const side = SIDES.includes(rawSide) ? (rawSide as Side) : null;
  const align: Align | null =
    side === null
      ? null
      : rawAlign === "start" || rawAlign === "end"
        ? rawAlign
        : "center";
  return { side, align };
}

/** The side a growth direction implies: it grows away from the anchor edge. */
const DIRECTION_SIDE: Record<AnimationDirection, Side> = {
  down: "bottom",
  up: "top",
  right: "right",
  left: "left",
};

/** CSS `transform-origin` on the edge facing the anchor (RTL aware). */
export function getTransformOrigin(
  side: Side | null,
  align: Align | null,
  rtl = false,
): string {
  if (side === null) {
    return "center";
  }
  const alignment = align ?? "center";
  if (side === "top" || side === "bottom") {
    const horizontal =
      alignment === "center"
        ? "center"
        : (alignment === "start") !== rtl
          ? "left"
          : "right";
    return `${horizontal} ${side === "bottom" ? "top" : "bottom"}`;
  }
  const vertical =
    alignment === "center"
      ? "center"
      : alignment === "start"
        ? "top"
        : "bottom";
  return `${side === "right" ? "left" : "right"} ${vertical}`;
}

/**
 * Decide how an expand animation grows. `direction` is the growth direction:
 * `auto` follows the final placement; an explicit value overrides the side.
 */
export function resolveExpandPlan({
  placement,
  direction = "auto",
  rtl = false,
}: {
  placement?: string;
  direction?: AnimationDirection | "auto";
  rtl?: boolean;
}): ExpandPlan {
  const parsed = splitPlacement(placement);
  const side = direction !== "auto" ? DIRECTION_SIDE[direction] : parsed.side;
  const align = side === null ? null : (parsed.align ?? "center");
  const axis: ExpandAxis =
    side === null ? "both" : side === "top" || side === "bottom" ? "y" : "x";
  return {
    axis,
    side,
    align,
    transformOrigin: getTransformOrigin(side, align, rtl),
  };
}

/**
 * Keyframes for expand/collapse: the popup scales out of the anchor edge while
 * it fades in (opacity 0 to 1), and collapse is the exact reverse (opacity 1
 * to 0). Reduced motion keeps only the fade.
 */
export function createExpandKeyframes(
  phase: AnimationPhase,
  plan: ExpandPlan,
  reducedMotion = false,
): Keyframe[] {
  const from = reducedMotion
    ? {}
    : {
        scale:
          plan.axis === "y" ? "1 0" : plan.axis === "x" ? "0 1" : "0.95 0.95",
      };
  const to = reducedMotion ? {} : { scale: "1 1" };
  const hidden: Keyframe = {
    opacity: 0,
    transformOrigin: plan.transformOrigin,
    ...from,
  };
  const shown: Keyframe = {
    opacity: 1,
    transformOrigin: plan.transformOrigin,
    ...to,
  };
  return phase === "enter" ? [hidden, shown] : [shown, hidden];
}

export { splitPlacement };
