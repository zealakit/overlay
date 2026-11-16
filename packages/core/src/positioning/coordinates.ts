import type {
  PlacementCoordinates,
  PlacementCoordinatesInput,
} from "../types/positioning.js";
import { DEFAULT_PLACEMENT, parsePlacement } from "./placement.js";

export const DEFAULT_OFFSET = 0;

/**
 * Resolve viewport coordinates for a floating element.
 *
 * This is deliberately a single-placement calculation: there is no collision
 * detection, flipping, shifting, or arrow placement yet. Callers that need
 * collision handling must add it above this contract rather than assuming it
 * lives here.
 */
export function resolvePlacementCoordinates(
  input: PlacementCoordinatesInput,
): PlacementCoordinates {
  const {
    reference,
    floating,
    offset = DEFAULT_OFFSET,
    alignOffset = DEFAULT_OFFSET,
  } = input;
  const { placement, side, align } = parsePlacement(
    input.placement ?? DEFAULT_PLACEMENT,
  );

  let x = 0;
  let y = 0;

  if (side === "top" || side === "bottom") {
    x = reference.x + (reference.width - floating.width) / 2;
    if (align === "start") {
      x = reference.x;
    } else if (align === "end") {
      x = reference.x + reference.width - floating.width;
    }
    x += alignOffset;

    y =
      side === "bottom"
        ? reference.y + reference.height + offset
        : reference.y - floating.height - offset;
  } else {
    y = reference.y + (reference.height - floating.height) / 2;
    if (align === "start") {
      y = reference.y;
    } else if (align === "end") {
      y = reference.y + reference.height - floating.height;
    }
    y += alignOffset;

    x =
      side === "right"
        ? reference.x + reference.width + offset
        : reference.x - floating.width - offset;
  }

  return { x, y, placement };
}
