function isNode(value: EventTarget | null): value is Node {
  return value !== null && typeof (value as Node).nodeType === "number";
}

/** True when the focus target is inside the supplied element. */
export function isFocusInside(
  element: Element | null | undefined,
  target: EventTarget | null,
): boolean {
  if (!element || !isNode(target)) {
    return false;
  }
  return element.contains(target);
}

/**
 * True when focus moved outside every supplied element.
 *
 * `relatedTarget === null` means focus left the document (for example the
 * window lost focus), which counts as outside.
 */
export function isFocusOutside(
  event: FocusEvent,
  elements: readonly (Element | null | undefined)[],
): boolean {
  const next = event.relatedTarget;
  if (next === null) {
    return true;
  }
  return !elements.some((element) => isFocusInside(element, next));
}
