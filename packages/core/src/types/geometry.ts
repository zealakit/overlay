/**
 * Placement primitives shared by every adapter.
 *
 * A placement is a side plus an optional alignment. A bare side (`"top"`) is
 * equivalent to `"top-center"`.
 */
export type Side = "top" | "right" | "bottom" | "left";

export type Align = "start" | "center" | "end";

export type Placement = Side | `${Side}-${Align}`;

/** A placement after normalization: center alignment collapses to the bare side. */
export type NormalizedPlacement = Side | `${Side}-start` | `${Side}-end`;

/** A point in viewport coordinates. */
export type Point = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

/** A viewport-relative rectangle, structurally compatible with `DOMRect`. */
export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
