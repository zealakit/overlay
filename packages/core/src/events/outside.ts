/**
 * True when the event target is outside every supplied element.
 *
 * Uses `composedPath()` when available so shadow-DOM targets are handled, and
 * falls back to `contains()` for synthetic events. `EventTarget` is checked
 * structurally to stay safe across documents, iframes, and non-Node targets.
 */
export function isOutsidePress(
  event: Event,
  elements: readonly (Element | null | undefined)[],
): boolean {
  const target = event.target;
  if (target === null) {
    return true;
  }

  const path = getComposedPath(event);
  if (path.length > 0) {
    return !elements.some(
      (element) =>
        element !== null && element !== undefined && path.includes(element),
    );
  }

  const node = target as Node;
  if (typeof node.nodeType !== "number") {
    return true;
  }

  return !elements.some((element) => element?.contains(node) === true);
}

function getComposedPath(event: Event): readonly EventTarget[] {
  if (typeof event.composedPath !== "function") {
    return [];
  }

  try {
    return event.composedPath();
  } catch {
    return [];
  }
}
