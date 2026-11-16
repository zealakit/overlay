import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createFocusContainment,
  focusElement,
  focusFirst,
  getActiveElement,
  getFocusableElements,
  isFocusable,
  restoreFocus,
} from "../dist/index.js";
import { dispatchKey } from "./support/dom.ts";

function createContainer(): HTMLDivElement {
  const container = document.createElement("div");
  container.innerHTML = `
    <button id="ok" type="button">ok</button>
    <button id="disabled" type="button" disabled>disabled</button>
    <a id="link" href="#target">link</a>
    <div hidden><button id="hidden" type="button">hidden</button></div>
    <div aria-hidden="true"><button id="aria-hidden" type="button">aria</button></div>
    <div inert><button id="inert" type="button">inert</button></div>
    <button id="style-hidden" type="button" style="display: none">none</button>
    <span id="negative" tabindex="-1">negative</span>
    <span id="positive" tabindex="0">positive</span>
  `;
  document.body.append(container);
  return container;
}

test("core focus helpers find and focus focusable elements", () => {
  const container = createContainer();
  const ids = getFocusableElements(container).map((element) => element.id);
  assert.deepEqual(ids, ["ok", "link", "positive"]);

  const first = focusFirst(container);
  assert.ok(first);
  assert.equal(first.id, "ok");
  assert.equal(document.activeElement, first);

  const link = container.querySelector<HTMLElement>("#link");
  assert.ok(link);
  assert.equal(focusElement(link), true);
  assert.equal(restoreFocus(first), true);
  assert.equal(document.activeElement, first);
});

test("core focus helpers reject hidden, disabled, and detached elements", () => {
  const container = createContainer();
  assert.equal(isFocusable(null), false);
  assert.equal(focusElement(document.createElement("button")), false);

  for (const id of [
    "disabled",
    "hidden",
    "aria-hidden",
    "inert",
    "style-hidden",
    "negative",
  ]) {
    const element = container.querySelector<HTMLElement>(`#${id}`);
    assert.ok(element);
    assert.equal(isFocusable(element), false, id);
  }
});

test("focusFirst skips candidates that cannot take focus", () => {
  const container = document.createElement("div");
  container.innerHTML = `
    <button id="first" type="button" style="visibility: hidden">first</button>
    <button id="second" type="button">second</button>
  `;
  document.body.append(container);

  const focused = focusFirst(container);
  assert.ok(focused);
  assert.equal(focused.id, "second");
});

test("getActiveElement resolves open shadow roots", () => {
  const host = document.createElement("div");
  const shadow = host.attachShadow({ mode: "open" });
  const button = document.createElement("button");
  button.textContent = "shadow";
  shadow.append(button);
  document.body.append(host);

  button.focus();
  assert.equal(getActiveElement(document), button);
  assert.equal(focusElement(button), true);
});

test("focus containment wraps Tab, redirects focus, and restores", () => {
  const trigger = document.createElement("button");
  trigger.textContent = "trigger";
  const outside = document.createElement("button");
  outside.textContent = "outside";
  const container = document.createElement("div");
  container.innerHTML = `
    <button id="a" type="button">a</button>
    <button id="b" type="button">b</button>
  `;
  document.body.append(trigger, outside, container);

  trigger.focus();
  let escapes = 0;
  const containment = createFocusContainment({
    container,
    initialFocus: "first",
    restoreFocus: true,
    onEscape: () => {
      escapes += 1;
    },
  });

  const a = container.querySelector<HTMLElement>("#a");
  const b = container.querySelector<HTMLElement>("#b");
  assert.ok(a);
  assert.ok(b);
  assert.equal(document.activeElement, a);

  b.focus();
  const forward = dispatchKey(b, { key: "Tab" });
  assert.equal(forward.defaultPrevented, true);
  assert.equal(document.activeElement, a);

  a.focus();
  const backward = dispatchKey(a, { key: "Tab", shiftKey: true });
  assert.equal(backward.defaultPrevented, true);
  assert.equal(document.activeElement, b);

  const added = document.createElement("button");
  added.id = "c";
  container.append(added);
  added.focus();
  assert.equal(document.activeElement, added);
  dispatchKey(added, { key: "Tab" });
  assert.equal(document.activeElement, a);

  outside.focus();
  assert.equal(document.activeElement, a);

  dispatchKey(a, { key: "Escape" });
  assert.equal(escapes, 1);

  containment.setEnabled(false);
  assert.equal(document.activeElement, trigger);
  outside.focus();
  assert.equal(document.activeElement, outside);

  containment.dispose();
  containment.dispose();
  assert.equal(escapes, 1);
});

test("focus containment suspend/resume yields without stealing focus", () => {
  const trigger = document.createElement("button");
  const parent = document.createElement("div");
  parent.innerHTML = `<button id="parent-button" type="button">parent</button>`;
  const child = document.createElement("div");
  child.innerHTML = `<button id="child-button" type="button">child</button>`;
  document.body.append(trigger, parent, child);

  trigger.focus();
  const containment = createFocusContainment({
    container: parent,
    initialFocus: "first",
    restoreFocus: true,
  });

  const childButton = child.querySelector<HTMLElement>("#child-button");
  assert.ok(childButton);

  containment.suspend();
  childButton.focus();
  assert.equal(document.activeElement, childButton);

  containment.resume();
  assert.equal(document.activeElement, childButton);

  containment.dispose();
  assert.equal(document.activeElement, trigger);
});

test("focus containment can yield to a nested container", () => {
  const parent = document.createElement("div");
  parent.innerHTML = `<button id="parent-button" type="button">parent</button>`;
  const child = document.createElement("div");
  child.innerHTML = `<button id="child-button" type="button">child</button>`;
  document.body.append(parent, child);

  const childButton = child.querySelector<HTMLElement>("#child-button");
  assert.ok(childButton);

  const containment = createFocusContainment({
    container: parent,
    shouldContain: (event) =>
      !(event.target instanceof Node && child.contains(event.target)),
  });

  childButton.focus();
  assert.equal(document.activeElement, childButton);

  containment.dispose();
});
