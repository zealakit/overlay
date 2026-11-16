import type { ReferenceElement, FloatingElement } from "./element.js";
import type { NormalizedPlacement, Placement } from "./geometry.js";
import type { Cleanup } from "./lifecycle.js";

export type Strategy = "absolute" | "fixed";

/** Collision boundary for flipping and shifting. */
export type PositionerBoundary = Element | "clippingAncestors" | "viewport";

/** Floating UI-compatible arrow element and boundary padding. */
export type ArrowOptions = {
  element: Element;
  /** Space kept between the arrow and the floating element edges. Defaults to 0. */
  padding?: number;
};

export type ArrowData = {
  /** Arrow offset relative to the floating element on its alignment axis. */
  x?: number;
  y?: number;
  /** Offset from the floating element center; useful for custom arrow shapes. */
  centerOffset: number;
};

export type PositionerOptions = {
  /** Preferred placement; may be flipped by collision handling. */
  placement?: Placement;
  /** Gap between reference and floating element on the main axis. */
  offset?: number;
  /** Shift along the alignment axis. */
  alignOffset?: number;
  /** Flip to the opposite side when the preferred side overflows. */
  flip?: boolean;
  /** Shift along the cross axis to keep the floating element in view. */
  shift?: boolean;
  /** Padding from the collision boundary edges, in pixels. */
  padding?: number;
  boundary?: PositionerBoundary;
  /**
   * CSS positioning strategy. Omit for automatic: `absolute` (moves with the page
   * in the same frame while scrolling) unless the anchor sits in a fixed/sticky
   * ancestor or is a bare viewport point, which use `fixed`.
   */
  strategy?: Strategy;
  /** Keep the result updated on scroll, resize, and layout changes. */
  autoUpdate?: boolean;
  /** Optional arrow element measured by the positioning engine. */
  arrow?: ArrowOptions | null;
};

export type CreatePositionerOptions = PositionerOptions & {
  reference?: ReferenceElement | null;
  floating?: FloatingElement | null;
};

export type PositionerResult = {
  x: number;
  y: number;
  /** The placement actually used after collision handling. */
  placement: NormalizedPlacement;
  strategy: Strategy;
  /** Present only when an arrow element is configured and measured. */
  arrow?: ArrowData;
};

export type PositionerListener = (result: PositionerResult) => void;

/**
 * Stateful, framework-independent positioning session.
 *
 * The instance owns no DOM of its own; it measures the supplied elements and
 * reports results. `dispose()` stops observers and drops subscribers.
 */
export type Positioner = {
  readonly isDisposed: boolean;
  setReference(reference: ReferenceElement | null): void;
  setFloating(floating: FloatingElement | null): void;
  setOptions(options: Partial<PositionerOptions>): void;
  /** Measure now. Resolves `null` when elements are missing or detached. */
  update(): Promise<PositionerResult | null>;
  subscribe(listener: PositionerListener): Cleanup;
  dispose(): void;
};
