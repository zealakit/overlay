import type { ReferenceElement } from "../types/element.js";
import type { Strategy } from "../types/index.js";
import { isElement } from "../utils/dom.js";

/** True when an ancestor is `position: fixed` or `position: sticky`. */
function hasFixedOrStickyAncestor(element: Element): boolean {
  const view: Window | null = element.ownerDocument?.defaultView ?? null;
  if (!view) {
    return false;
  }
  let node: Element | null = element;
  while (node) {
    const position = view.getComputedStyle(node).position;
    if (position === "fixed" || position === "sticky") {
      return true;
    }
    if (node.parentElement) {
      node = node.parentElement;
      continue;
    }
    // Cross shadow-root boundaries.
    const root: Node = node.getRootNode();
    node = "host" in root ? (root as ShadowRoot).host : null;
  }
  return false;
}

/**
 * Pick the CSS strategy when the caller did not choose one.
 *
 * `absolute` is page-relative, so the browser moves the popup with its anchor
 * in the same frame while the page scrolls. `fixed` is viewport-relative and
 * would be painted at its old position until a scroll handler re-measures.
 * `fixed` is still right when the anchor itself does not scroll with the page
 * (fixed/sticky ancestors) or when the anchor is a bare viewport point.
 */
export function resolveStrategy(
  reference: ReferenceElement | null,
  explicit: Strategy | undefined,
): Strategy {
  if (explicit) {
    return explicit;
  }
  const anchor = reference
    ? isElement(reference)
      ? reference
      : (reference.contextElement ?? null)
    : null;
  if (!anchor?.isConnected) {
    return "fixed";
  }
  return hasFixedOrStickyAncestor(anchor) ? "fixed" : "absolute";
}
