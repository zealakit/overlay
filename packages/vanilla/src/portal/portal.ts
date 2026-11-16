export type PortalState = {
  parent: Node;
  nextSibling: Node | null;
} | null;

/** Move an element into a portal target, remembering where it came from. */
export function moveToPortal(
  element: HTMLElement,
  target: Element,
): PortalState {
  const parent = element.parentNode;
  if (!parent) {
    return null;
  }

  const nextSibling = element.nextSibling;
  target.appendChild(element);

  return { parent, nextSibling };
}

/** Put an element back where it was portaled from. */
export function restoreFromPortal(
  element: HTMLElement,
  state: PortalState,
): void {
  if (!state) {
    return;
  }

  const { parent, nextSibling } = state;
  if (nextSibling?.parentNode === parent) {
    parent.insertBefore(element, nextSibling);
  } else {
    parent.appendChild(element);
  }
}
