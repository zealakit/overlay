import assert from "node:assert/strict";
import { test } from "node:test";
import {
  acquireModalBackground,
  createTypeaheadBuffer,
  focusMenuTypeahead,
  getMenuItems,
  isSamePositionerResult,
  moveMenuFocus,
  moveToPortal,
  restorePortal,
} from "../dist/index.js";

function menu(markup: string): HTMLElement {
  const container = document.createElement("div");
  container.innerHTML = markup;
  document.body.append(container);
  return container.firstElementChild as HTMLElement;
}

test("getMenuItems skips disabled, hidden, and nested-menu items", () => {
  const root = menu(`
    <div role="menu" id="root">
      <button role="menuitem" id="a">Alpha</button>
      <button role="menuitem" aria-disabled="true">Off</button>
      <button role="menuitem" hidden>Hidden</button>
      <div role="menu"><button role="menuitem">Nested</button></div>
      <button role="menuitemcheckbox" id="b">Beta</button>
    </div>`);

  assert.deepEqual(
    getMenuItems(root).map((item) => item.id),
    ["a", "b"],
  );
  root.parentElement?.remove();
});

test("moveMenuFocus wraps and typeahead cycles through matches", () => {
  const root = menu(`
    <div role="menu" tabindex="-1">
      <button role="menuitem" id="a">Apple</button>
      <button role="menuitem" id="b">Banana</button>
      <button role="menuitem" id="c">Avocado</button>
    </div>`);

  moveMenuFocus(root, 1);
  assert.equal(document.activeElement?.id, "a");
  moveMenuFocus(root, -1);
  assert.equal(document.activeElement?.id, "c");
  moveMenuFocus(root, 1);
  assert.equal(document.activeElement?.id, "a");

  focusMenuTypeahead(root, "a", document.activeElement);
  assert.equal(document.activeElement?.id, "c");
  focusMenuTypeahead(root, "b", document.activeElement);
  assert.equal(document.activeElement?.id, "b");
  root.parentElement?.remove();
});

test("typeahead buffer accumulates and clears", async () => {
  const buffer = createTypeaheadBuffer(10);
  assert.equal(buffer.push("a"), "a");
  assert.equal(buffer.push("b"), "ab");
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(buffer.push("c"), "c");
  buffer.clear();
  assert.equal(buffer.push("d"), "d");
  buffer.clear();
});

test("portal helpers move an element and restore its position", () => {
  const host = document.createElement("div");
  const first = document.createElement("span");
  const moved = document.createElement("span");
  const last = document.createElement("span");
  host.append(first, moved, last);
  const target = document.createElement("div");
  document.body.append(host, target);

  const state = moveToPortal(moved, target);
  assert.equal(moved.parentNode, target);
  restorePortal(state);
  assert.deepEqual([...host.children], [first, moved, last]);

  assert.equal(moveToPortal(document.createElement("i"), target), null);
  restorePortal(null);
  host.remove();
  target.remove();
});

test("modal background stacks per document and restores attributes", () => {
  const siblingA = document.createElement("div");
  const siblingB = document.createElement("div");
  siblingB.setAttribute("aria-hidden", "false");
  const modalA = document.createElement("div");
  const modalB = document.createElement("div");
  document.body.append(siblingA, siblingB, modalA, modalB);

  const releaseA = acquireModalBackground(document, [modalA]);
  assert.equal(siblingA.hasAttribute("inert"), true);
  assert.equal(modalA.hasAttribute("inert"), false);
  assert.equal(modalB.hasAttribute("inert"), true);

  const releaseB = acquireModalBackground(document, [modalB]);
  assert.equal(modalA.hasAttribute("inert"), true);
  assert.equal(modalB.hasAttribute("inert"), false);

  releaseB();
  releaseB();
  assert.equal(modalA.hasAttribute("inert"), false);
  assert.equal(modalB.hasAttribute("inert"), true);

  releaseA();
  for (const element of [siblingA, siblingB, modalA, modalB]) {
    assert.equal(element.hasAttribute("inert"), false);
  }
  assert.equal(siblingA.hasAttribute("aria-hidden"), false);
  assert.equal(siblingB.getAttribute("aria-hidden"), "false");
  for (const element of [siblingA, siblingB, modalA, modalB]) {
    element.remove();
  }
});

test("isSamePositionerResult compares position, placement, and strategy", () => {
  const result = {
    x: 1,
    y: 2,
    placement: "bottom",
    strategy: "absolute",
  } as const;
  assert.equal(isSamePositionerResult(null, result), false);
  assert.equal(isSamePositionerResult(result, { ...result }), true);
  assert.equal(isSamePositionerResult(result, { ...result, x: 2 }), false);
  assert.equal(
    isSamePositionerResult(result, { ...result, placement: "top" }),
    false,
  );
});
