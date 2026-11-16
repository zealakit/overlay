import type { ReferenceElement } from "../types/element.js";
import type { Rect } from "../types/geometry.js";

/** True only when a usable browser DOM is present. Safe to call during SSR. */
export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/** Read a reference element's viewport rectangle as a plain object. */
export function getRect(element: ReferenceElement): Rect {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Duck-typed `Element` check. Avoids relying on cross-realm globals such as
 * `instanceof Element`, which differ between an iframe and the parent document.
 */
export function isElement(
  value: ReferenceElement | null | undefined,
): value is Element {
  return typeof (value as Element | null | undefined)?.nodeType === "number";
}
