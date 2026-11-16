import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { initOverlays } from "../dist/index.js";
import { dispatchEscape, dispatchPointer, resetDom } from "./support/dom.ts";

afterEach(() => {
  resetDom();
});

function append(markup: string): void {
  document.body.insertAdjacentHTML("beforeend", markup);
}

function click(element: Element): void {
  element.dispatchEvent(
    new window.MouseEvent("click", { bubbles: true, cancelable: true }),
  );
}

function byId(id: string): HTMLElement {
  const element = document.getElementById(id);
  assert.ok(element, `#${id} should exist`);
  return element;
}

test("initOverlays wires popover markup, close buttons, and change events", () => {
  append(`
    <div id="host" data-overlay="popover" data-placement="bottom-start" data-portal="inline">
      <button id="trigger" data-trigger>Edit profile</button>
      <div id="content" data-content hidden>
        <h2 id="title" data-title>Edit profile</h2>
        <p data-description>Update your profile information.</p>
        <button id="close" data-close>Close</button>
      </div>
    </div>
  `);
  const changes: boolean[] = [];
  document.addEventListener("overlay-change", (event) => {
    changes.push((event as CustomEvent<{ open: boolean }>).detail.open);
  });
  const overlays = initOverlays();
  assert.equal(overlays.size, 1);
  const content = byId("content");
  assert.equal(content.hidden, true);
  assert.equal(content.getAttribute("aria-labelledby"), "title");
  assert.ok(content.getAttribute("aria-describedby"));

  click(byId("trigger"));
  assert.equal(content.hidden, false);
  assert.equal(overlays.get("host")?.isOpen, true);

  click(byId("close"));
  assert.equal(content.hidden, true);
  assert.deepEqual(changes, [true, false]);

  click(byId("trigger"));
  dispatchEscape(document);
  assert.equal(content.hidden, true);

  click(byId("trigger"));
  dispatchPointer(document.body);
  assert.equal(content.hidden, true);
  overlays.destroy();
});

test("initOverlays skips hosts that are already initialized and refreshes new ones", () => {
  append(`
    <div data-overlay="popover" data-portal="inline">
      <button id="one" data-trigger>One</button><div id="one-content" data-content hidden>One</div>
    </div>
  `);
  const first = initOverlays();
  const second = initOverlays();
  assert.equal(first.size, 1);
  assert.equal(second.size, 0);

  append(`
    <div id="late" data-overlay="tooltip" data-portal="inline" data-delay="0" data-close-delay="0">
      <button data-trigger>Two</button><div data-content hidden>Two</div>
    </div>
  `);
  first.refresh();
  assert.equal(first.size, 2);
  assert.ok(first.get("late"));

  byId("late").remove();
  first.refresh();
  assert.equal(first.size, 1);

  first.destroy();
  first.destroy();
  assert.equal(first.size, 0);
});

test("initOverlays supports dialogs and context menu items", () => {
  append(`
    <div data-overlay="dialog" data-portal="inline">
      <button id="open" data-trigger>Edit profile</button>
      <div id="backdrop" data-backdrop hidden></div>
      <div id="dialog" data-content hidden>
        <h2 data-title id="dialog-title">Edit profile</h2>
        <button id="cancel" data-close>Cancel</button>
      </div>
    </div>
    <div data-overlay="context-menu" data-portal="inline">
      <div id="area" data-trigger>Right-click</div>
      <div id="menu" data-content hidden>
        <div id="edit" data-item>Edit</div>
        <div id="off" data-item data-disabled>Delete</div>
      </div>
    </div>
  `);
  const selected: string[] = [];
  document.addEventListener("overlay-select", (event) => {
    selected.push((event as CustomEvent<{ item: HTMLElement }>).detail.item.id);
  });
  const overlays = initOverlays();
  assert.equal(overlays.size, 2);

  click(byId("open"));
  assert.equal(byId("dialog").getAttribute("role"), "dialog");
  assert.equal(byId("dialog").getAttribute("aria-labelledby"), "dialog-title");
  assert.equal(byId("backdrop").hidden, false);
  click(byId("cancel"));
  assert.equal(byId("dialog").hidden, true);
  assert.equal(byId("backdrop").hidden, true);

  byId("area").dispatchEvent(
    new window.MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 4,
      clientY: 8,
    }),
  );
  assert.equal(byId("menu").hidden, false);
  assert.equal(byId("edit").getAttribute("role"), "menuitem");
  click(byId("off"));
  assert.deepEqual(selected, []);
  click(byId("edit"));
  assert.deepEqual(selected, ["edit"]);
  assert.equal(byId("menu").hidden, true);
  overlays.destroy();
});
