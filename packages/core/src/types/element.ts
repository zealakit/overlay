import type { Rect } from "./geometry.js";

/**
 * Anything that can act as the anchor of a floating element.
 *
 * `VirtualElement` lets pointer coordinates, canvas hits, or synthetic rects be
 * used without a real DOM node. `contextElement` allows dismissal logic to
 * treat clicks inside a larger surface as "inside" the reference.
 */
export type VirtualElement = {
  getBoundingClientRect: () => Rect;
  contextElement?: Element;
};

export type ReferenceElement = Element | VirtualElement;

export type FloatingElement = Element;

/** A nullable DOM reference, suitable for framework refs. */
export type ElementRef<T extends Element = Element> = T | null;

/** A lazily resolved element reference, for refs that change over time. */
export type ElementGetter<T extends Element = Element> = () => T | null;

/** An element or a getter that resolves the current element. */
export type ElementSource<T extends Element = Element> =
  | ElementRef<T>
  | ElementGetter<T>;
