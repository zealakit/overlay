import type { FloatingElement, ReferenceElement } from "../types/element.js";
import type {
  PlacementCoordinates,
  PlacementOptions,
} from "../types/positioning.js";
import { getRect } from "../utils/dom.js";
import { resolvePlacementCoordinates } from "./coordinates.js";

/**
 * Measure a reference/floating pair and resolve its viewport coordinates.
 *
 * The elements must already be in the DOM; callers run this from effects or
 * actions, never from SSR render paths.
 */
export function computePosition(
  reference: ReferenceElement,
  floating: FloatingElement,
  options: PlacementOptions = {},
): PlacementCoordinates {
  const referenceRect = getRect(reference);
  const floatingRect = getRect(floating);

  return resolvePlacementCoordinates({
    reference: referenceRect,
    floating: {
      width: floatingRect.width,
      height: floatingRect.height,
    },
    placement: options.placement,
    offset: options.offset,
    alignOffset: options.alignOffset,
  });
}
