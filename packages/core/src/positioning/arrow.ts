import type { Placement, Side } from "../types/geometry.js";
import type { ArrowData } from "../types/positioner.js";
import { parsePlacement } from "./placement.js";

export const DEFAULT_ARROW_SIZE = 8;

/** Edge of the floating element the arrow sits on (opposite the reference). */
export function arrowStaticSide(side: Side): Side {
  switch (side) {
    case "top":
      return "bottom";
    case "right":
      return "left";
    case "bottom":
      return "top";
    default:
      return "right";
  }
}

export type ArrowStyles = {
  side: Side;
  /** Inline style properties as plain camelCase values. */
  style: Record<string, string | number>;
};

/** Outline drawn on one edge of the rotated square. */
const ARROW_BORDER =
  "var(--overlay-arrow-border-width, 0px) solid var(--overlay-arrow-border-color, transparent)";

/**
 * Per placement side: which two edges of the (unrotated) square become the
 * outer, visible edges after the 45deg rotation, plus the triangle that keeps
 * only the half pointing at the anchor. `clip-path` runs in the square's own
 * coordinates, so these polygons are given before rotation.
 */
const ARROW_OUTWARD: Record<
  Side,
  {
    edges: readonly [
      "Top" | "Right" | "Bottom" | "Left",
      "Top" | "Right" | "Bottom" | "Left",
    ];
    clip: string;
  }
> = {
  // Popup above the anchor: arrow on the bottom edge, tip pointing down.
  top: {
    edges: ["Bottom", "Right"],
    clip: "polygon(0 100%, 100% 100%, 100% 0)",
  },
  // Popup below the anchor: tip pointing up.
  bottom: { edges: ["Top", "Left"], clip: "polygon(0 100%, 0 0, 100% 0)" },
  // Popup left of the anchor: arrow on the right edge, tip pointing right.
  left: { edges: ["Top", "Right"], clip: "polygon(0 0, 100% 0, 100% 100%)" },
  // Popup right of the anchor: tip pointing left.
  right: { edges: ["Left", "Bottom"], clip: "polygon(0 0, 0 100%, 100% 100%)" },
};

/**
 * Compute arrow geometry for a resolved placement. The arrow is a rotated
 * square clipped to the half that points at the anchor, so it never covers
 * popup content. Only its two outer edges are outlined, which lets the outline
 * continue the popup's own border. The popup controls the look through CSS
 * variables: `--overlay-arrow-background`, `--overlay-arrow-border-width`
 * and `--overlay-arrow-border-color`.
 * Returns `null` while the positioner has no arrow measurement yet.
 */
export function getArrowStyles({
  placement,
  arrow,
  size = DEFAULT_ARROW_SIZE,
}: {
  placement: Placement;
  arrow: ArrowData | undefined;
  size?: number;
}): ArrowStyles | null {
  if (!arrow) {
    return null;
  }
  const side = parsePlacement(placement).side;
  const outward = ARROW_OUTWARD[side];
  const style: Record<string, string | number> = {
    position: "absolute",
    boxSizing: "border-box",
    width: `${size}px`,
    height: `${size}px`,
    pointerEvents: "none",
    backgroundColor: "var(--overlay-arrow-background, inherit)",
    borderTop: "0",
    borderRight: "0",
    borderBottom: "0",
    borderLeft: "0",
    clipPath: outward.clip,
    transform: "rotate(45deg)",
    [arrowStaticSide(side)]: `${-size / 2}px`,
  };
  for (const edge of outward.edges) {
    style[`border${edge}`] = ARROW_BORDER;
  }
  if (arrow.x !== undefined) {
    style.left = `${arrow.x}px`;
  }
  if (arrow.y !== undefined) {
    style.top = `${arrow.y}px`;
  }
  return { side, style };
}

const ARROW_PROPERTIES = [
  "position",
  "width",
  "height",
  "pointer-events",
  "background-color",
  "box-sizing",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "clip-path",
  "transform",
  "top",
  "right",
  "bottom",
  "left",
  "visibility",
] as const;

export type ArrowSnapshot = Record<
  (typeof ARROW_PROPERTIES)[number],
  string
> & {
  side: string | null;
};

function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

/** Capture inline styles so a controller can restore the element later. */
export function snapshotArrowStyles(element: HTMLElement): ArrowSnapshot {
  const snapshot = { side: element.getAttribute("data-side") } as ArrowSnapshot;
  for (const name of ARROW_PROPERTIES) {
    snapshot[name] = element.style.getPropertyValue(name);
  }
  return snapshot;
}

/** Write computed arrow styles and `data-side` to a consumer-owned element. */
export function applyArrowStyles(
  element: HTMLElement,
  styles: ArrowStyles | null,
): void {
  if (!styles) {
    element.style.visibility = "hidden";
    return;
  }
  // Reset the alignment-axis coordinates so a flip never keeps stale values.
  for (const name of ["top", "right", "bottom", "left"]) {
    element.style.removeProperty(name);
  }
  for (const [name, value] of Object.entries(styles.style)) {
    element.style.setProperty(kebab(name), String(value));
  }
  element.style.visibility = "visible";
  element.setAttribute("data-side", styles.side);
  element.setAttribute("aria-hidden", "true");
  element.setAttribute("data-arrow", "");
}

export function resetArrowStyles(
  element: HTMLElement,
  snapshot: ArrowSnapshot,
): void {
  for (const name of ARROW_PROPERTIES) {
    if (snapshot[name]) {
      element.style.setProperty(name, snapshot[name]);
    } else {
      element.style.removeProperty(name);
    }
  }
  if (snapshot.side === null) {
    element.removeAttribute("data-side");
  } else {
    element.setAttribute("data-side", snapshot.side);
  }
  element.removeAttribute("data-arrow");
}
