import type {
  Align,
  NormalizedPlacement,
  Placement,
  Rect,
  Side,
  Size,
} from "./geometry.js";

export type PlacementOptions = {
  placement?: Placement;
  /** Gap between the reference and the floating element, in pixels. */
  offset?: number;
  /** Shift along the alignment axis, in pixels. */
  alignOffset?: number;
};

export type PlacementCoordinatesInput = PlacementOptions & {
  reference: Rect;
  floating: Size;
};

export type PlacementCoordinates = {
  x: number;
  y: number;
  /** The normalized placement that was resolved. */
  placement: NormalizedPlacement;
};

export type ParsedPlacement = {
  placement: NormalizedPlacement;
  side: Side;
  align: Align;
};
