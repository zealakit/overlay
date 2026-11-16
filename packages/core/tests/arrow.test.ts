import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyArrowStyles,
  arrowStaticSide,
  getArrowStyles,
  resetArrowStyles,
  snapshotArrowStyles,
} from "../dist/index.js";

test("arrow sits on the edge opposite the reference", () => {
  assert.equal(arrowStaticSide("top"), "bottom");
  assert.equal(arrowStaticSide("bottom"), "top");
  assert.equal(arrowStaticSide("left"), "right");
  assert.equal(arrowStaticSide("right"), "left");
});

test("no styles until the positioner measured the arrow", () => {
  assert.equal(getArrowStyles({ placement: "top", arrow: undefined }), null);
});

test("styles follow placement and use styling variables", () => {
  const top = getArrowStyles({
    placement: "top-start",
    arrow: { x: 12, centerOffset: 0 },
    size: 10,
  });
  assert.equal(top?.side, "top");
  assert.equal(top?.style.bottom, "-5px");
  assert.equal(top?.style.left, "12px");
  assert.match(
    String(top?.style.backgroundColor),
    /--overlay-arrow-background/,
  );
  const right = getArrowStyles({
    placement: "right",
    arrow: { y: 4, centerOffset: 0 },
  });
  assert.equal(right?.style.left, "-4px");
  assert.equal(right?.style.top, "4px");
});

test("only the outward edges are outlined and the inner half is clipped", () => {
  const expected = {
    top: ["borderBottom", "borderRight"],
    bottom: ["borderTop", "borderLeft"],
    left: ["borderTop", "borderRight"],
    right: ["borderLeft", "borderBottom"],
  } as const;
  for (const [side, edges] of Object.entries(expected)) {
    const result = getArrowStyles({
      placement: side as "top",
      arrow: { x: 0, y: 0, centerOffset: 0 },
    });
    const all = ["borderTop", "borderRight", "borderBottom", "borderLeft"];
    for (const edge of all) {
      const value = String(result?.style[edge]);
      assert.equal(
        value.includes("--overlay-arrow-border-width"),
        (edges as readonly string[]).includes(edge),
        `${side} ${edge}`,
      );
    }
    assert.match(String(result?.style.clipPath), /^polygon\(/);
    assert.equal(result?.style.boxSizing, "border-box");
  }
});

test("apply and reset restore the consumer element", () => {
  const element = document.createElement("div");
  element.style.backgroundColor = "red";
  const snapshot = snapshotArrowStyles(element);
  applyArrowStyles(
    element,
    getArrowStyles({ placement: "bottom", arrow: { x: 3, centerOffset: 0 } }),
  );
  assert.equal(element.getAttribute("data-side"), "bottom");
  assert.equal(element.style.top, "-4px");
  assert.equal(element.style.left, "3px");
  // A flip must not keep the previous edge.
  applyArrowStyles(
    element,
    getArrowStyles({ placement: "top", arrow: { x: 3, centerOffset: 0 } }),
  );
  assert.equal(element.style.top, "");
  assert.equal(element.style.bottom, "-4px");
  resetArrowStyles(element, snapshot);
  assert.equal(element.hasAttribute("data-side"), false);
  assert.equal(element.style.backgroundColor, "red");
  assert.equal(element.style.bottom, "");
});
