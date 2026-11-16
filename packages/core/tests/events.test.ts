import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isActivationKey,
  isEscapeKey,
  isFocusInside,
  isFocusOutside,
  isOutsidePress,
  isPointerOutside,
  isPrimaryPointer,
} from "../dist/index.js";
import { dispatchFocusOut, dispatchPointer } from "./support/dom.ts";

function keyboardEvent(key: string): KeyboardEvent {
  return { key } as KeyboardEvent;
}

test("primary pointer detection ignores secondary buttons", () => {
  assert.equal(
    isPrimaryPointer({ button: 0, isPrimary: true } as PointerEvent),
    true,
  );
  assert.equal(isPrimaryPointer({ button: 0 } as PointerEvent), true);
  assert.equal(
    isPrimaryPointer({ button: 2, isPrimary: true } as PointerEvent),
    false,
  );
  assert.equal(
    isPrimaryPointer({ button: 0, isPrimary: false } as PointerEvent),
    false,
  );
});

test("pointer outside only dismisses on the primary button", () => {
  const container = document.createElement("div");
  document.body.append(container);

  const outsideTarget = document.createElement("p");
  const outsideEvent = dispatchPointer(outsideTarget);
  assert.equal(
    isPointerOutside(outsideEvent as PointerEvent, [container]),
    true,
  );

  const secondary = dispatchPointer(outsideTarget, { button: 2 });
  assert.equal(isPointerOutside(secondary as PointerEvent, [container]), false);

  const inside = document.createElement("span");
  container.append(inside);
  const insideEvent = dispatchPointer(inside);
  assert.equal(
    isPointerOutside(insideEvent as PointerEvent, [container]),
    false,
  );
});

test("outside press treats a missing target as outside", () => {
  assert.equal(isOutsidePress({ target: null } as unknown as Event, []), true);
});

test("outside press follows shadow DOM composed paths", () => {
  const container = document.createElement("div");
  const host = document.createElement("div");
  const shadow = host.attachShadow({ mode: "open" });
  const inside = document.createElement("button");
  shadow.append(inside);
  container.append(host);
  document.body.append(container);

  const insideEvent = dispatchPointer(inside);
  // happy-dom does not retarget path segments across shadow roots, so model
  // the browser's composed path explicitly.
  Object.defineProperty(insideEvent, "composedPath", {
    configurable: true,
    value: () => [inside, host, container],
  });
  assert.equal(isOutsidePress(insideEvent, [container]), false);

  const outside = document.createElement("p");
  const outsideEvent = dispatchPointer(outside);
  assert.equal(isOutsidePress(outsideEvent, [container]), true);
});

test("focus helpers follow relatedTarget", () => {
  const container = document.createElement("div");
  const inside = document.createElement("button");
  const outside = document.createElement("button");
  container.append(inside);
  document.body.append(container, outside);

  const leaveEvent = dispatchFocusOut(container, outside);
  assert.equal(isFocusOutside(leaveEvent, [container]), true);

  const stayEvent = dispatchFocusOut(container, inside);
  assert.equal(isFocusOutside(stayEvent, [container]), false);
  assert.equal(isFocusInside(container, inside), true);
  assert.equal(isFocusInside(null, inside), false);
});

test("keyboard helpers recognise escape and activation keys", () => {
  assert.equal(isEscapeKey(keyboardEvent("Escape")), true);
  assert.equal(isEscapeKey(keyboardEvent("Esc")), true);
  assert.equal(isEscapeKey(keyboardEvent("Enter")), false);
  assert.equal(
    isEscapeKey({ key: "Escape", isComposing: true } as KeyboardEvent),
    false,
  );

  assert.equal(isActivationKey(keyboardEvent("Enter")), true);
  assert.equal(isActivationKey(keyboardEvent(" ")), true);
  assert.equal(isActivationKey(keyboardEvent("a")), false);
});
