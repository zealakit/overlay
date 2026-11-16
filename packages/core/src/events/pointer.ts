import { isOutsidePress } from "./outside.js";

/**
 * True for the primary button of the primary pointer.
 *
 * `isPrimary` is treated as true when absent so synthetic events behave like
 * left clicks.
 */
export function isPrimaryPointer(event: PointerEvent): boolean {
  return event.isPrimary !== false && event.button === 0;
}

/**
 * A left-button press outside every supplied element.
 *
 * Secondary buttons (right/middle) deliberately do not dismiss overlays.
 */
export function isPointerOutside(
  event: PointerEvent,
  elements: readonly (Element | null | undefined)[],
): boolean {
  return isPrimaryPointer(event) && isOutsidePress(event, elements);
}
