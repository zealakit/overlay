/** Where a portaled element came from, so it can be put back. */
export type PortalState = {
  parent: Node;
  nextSibling: Node | null;
  element: HTMLElement;
};

/**
 * Move `element` into `target`, remembering its original position.
 * Returns `null` when the element has no parent to return to.
 */
export function moveToPortal(
  element: HTMLElement,
  target: Element,
): PortalState | null {
  const parent = element.parentNode;
  if (!parent) {
    return null;
  }
  const state = { parent, nextSibling: element.nextSibling, element };
  target.appendChild(element);
  return state;
}

/** Put a portaled element back where it came from. Safe with `null`. */
export function restorePortal(state: PortalState | null): void {
  if (!state) {
    return;
  }
  if (state.nextSibling?.parentNode === state.parent) {
    state.parent.insertBefore(state.element, state.nextSibling);
  } else {
    state.parent.appendChild(state.element);
  }
}
