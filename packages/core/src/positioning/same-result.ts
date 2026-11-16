import type { PositionerResult } from "../types/positioner.js";

/**
 * True when `next` places the floating element exactly where `previous` did.
 *
 * Adapters use it to skip redundant state updates. `previous` is typically the
 * adapter's own last-applied result, so it may be `null`.
 */
export function isSamePositionerResult(
  previous: PositionerResult | null,
  next: PositionerResult,
): boolean {
  return (
    previous !== null &&
    previous.x === next.x &&
    previous.y === next.y &&
    previous.placement === next.placement &&
    previous.strategy === next.strategy
  );
}
