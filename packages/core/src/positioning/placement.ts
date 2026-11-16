import type {
  Align,
  NormalizedPlacement,
  Placement,
  Side,
} from "../types/geometry.js";
import type { ParsedPlacement } from "../types/positioning.js";

export const DEFAULT_PLACEMENT: Placement = "bottom";

const SIDES: readonly Side[] = ["top", "right", "bottom", "left"];
const ALIGNS: readonly Align[] = ["start", "center", "end"];

function isSide(value: string): value is Side {
  return (SIDES as readonly string[]).includes(value);
}

function isAlign(value: string): value is Align {
  return (ALIGNS as readonly string[]).includes(value);
}

/**
 * Split a placement into its side and alignment and normalize `center`
 * aliases (`"top"` and `"top-center"` are the same placement).
 */
export function parsePlacement(
  placement: Placement = DEFAULT_PLACEMENT,
): ParsedPlacement {
  const [rawSide = "", rawAlign] = placement.split("-");
  if (!isSide(rawSide)) {
    throw new Error(`[overlay-core] Unknown placement side: "${rawSide}"`);
  }

  const align = rawAlign ?? "center";
  if (!isAlign(align)) {
    throw new Error(`[overlay-core] Unknown placement alignment: "${align}"`);
  }

  return {
    placement:
      align === "center"
        ? rawSide
        : (`${rawSide}-${align}` as NormalizedPlacement),
    side: rawSide,
    align,
  };
}
