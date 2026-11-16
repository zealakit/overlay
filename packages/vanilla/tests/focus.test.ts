import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  focusElement,
  focusFirst,
  getFocusableElements,
  restoreFocus,
} from "../dist/index.js";
import { resetDom } from "./support/dom.ts";

beforeEach(resetDom);

function createContainer(): HTMLDivElement {
  const container = document.createElement("div");
  container.innerHTML = `
    <button id="ok" type="button">ok</button>
    <button id="disabled" type="button" disabled>disabled</button>
    <button id="negative-button" type="button" tabindex="-1">negative button</button>
    <a id="link" href="#target">link</a>
    <input id="input" />
    <div id="hidden-wrap" hidden>
      <button id="hidden-button" type="button">hidden</button>
    </div>
    <span id="negative" tabindex="-1">negative</span>
    <span id="positive" tabindex="0">positive</span>
  `;
  document.body.append(container);
  return container;
}

test("collects focusable elements in DOM order and skips hidden ones", () => {
  const container = createContainer();
  const ids = getFocusableElements(container).map((element) => element.id);
  assert.deepEqual(ids, ["ok", "link", "input", "positive"]);
});

test("focuses the first focusable element", () => {
  const container = createContainer();
  const focused = focusFirst(container);

  assert.ok(focused);
  assert.equal(focused.id, "ok");
  assert.equal(document.activeElement, focused);
});

test("focusElement handles missing and detached elements", () => {
  assert.equal(focusElement(null), false);

  const detached = document.createElement("button");
  assert.equal(focusElement(detached), false);
});

test("restores focus to a previously focused element", () => {
  const container = createContainer();
  const first = container.querySelector<HTMLButtonElement>("#ok");
  const link = container.querySelector<HTMLElement>("#link");
  assert.ok(first);
  assert.ok(link);

  assert.equal(focusElement(first), true);
  assert.equal(focusElement(link), true);
  assert.equal(document.activeElement, link);

  assert.equal(restoreFocus(first), true);
  assert.equal(document.activeElement, first);
});
