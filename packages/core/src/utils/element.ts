import type { ElementSource } from "../types/element.js";

/**
 * Resolve a nullable element or an element getter to the current element.
 *
 * Never touches the DOM itself, so it is safe to call during SSR as long as the
 * getter is safe (adapters only pass getters that read their own refs).
 */
export function resolveElement<T extends Element>(
  source: ElementSource<T> | null | undefined,
): T | null {
  if (!source) {
    return null;
  }
  return typeof source === "function" ? source() : source;
}

/**
 * True when the element is currently attached to its document.
 *
 * Detached elements still render a zero rect but cannot be positioned
 * meaningfully, so positioning skips them.
 */
export function isConnected(element: Element | null | undefined): boolean {
  return element?.isConnected === true;
}
