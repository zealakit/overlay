import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { createElement, useState } from "react";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { useEscapeKey } from "../dist/index.js";
import { resetDom } from "./support/dom.ts";

afterEach(() => {
  cleanup();
  resetDom();
});

function EscapeDemo({
  onEscape,
  enabled = true,
  target,
}: {
  onEscape: () => void;
  enabled?: boolean;
  target?: HTMLElement | null;
}) {
  const [count, setCount] = useState(0);
  useEscapeKey(
    () => {
      setCount((current) => current + 1);
      onEscape();
    },
    { enabled, target },
  );
  return createElement("output", { id: "count" }, String(count));
}

test("calls the handler on Escape only", () => {
  let calls = 0;
  render(createElement(EscapeDemo, { onEscape: () => (calls += 1) }));

  fireEvent.keyDown(document, { key: "Enter" });
  assert.equal(calls, 0);

  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(calls, 1);
  assert.equal(document.getElementById("count")?.textContent, "1");
});

test("respects enabled and cleans up on unmount", () => {
  let calls = 0;
  const view = render(
    createElement(EscapeDemo, { onEscape: () => (calls += 1), enabled: false }),
  );

  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(calls, 0);

  view.rerender(
    createElement(EscapeDemo, { onEscape: () => (calls += 1), enabled: true }),
  );
  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(calls, 1);

  view.unmount();
  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(calls, 1);
});

test("supports a custom event target", () => {
  const target = document.createElement("div");
  document.body.append(target);
  let calls = 0;

  render(
    createElement(EscapeDemo, {
      onEscape: () => (calls += 1),
      target,
    }),
  );

  fireEvent.keyDown(document, { key: "Escape" });
  assert.equal(calls, 0);

  fireEvent.keyDown(target, { key: "Escape" });
  assert.equal(calls, 1);
});
