import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { escapeKey } from "../dist/index.js";
import { dispatchEscape, resetDom } from "./support/dom.ts";

beforeEach(() => {
  resetDom();
});

afterEach(() => {
  resetDom();
});

type ActionResult = {
  update?: (params: Parameters<typeof escapeKey>[1]) => void;
  destroy?: () => void;
};

test("escapeKey action calls the handler and respects enabled", () => {
  const node = document.createElement("div");
  document.body.append(node);
  let calls = 0;

  const action = escapeKey(node, {
    handler: () => {
      calls += 1;
    },
  }) as ActionResult;

  dispatchEscape();
  assert.equal(calls, 1);

  action.update?.({
    enabled: false,
    handler: () => {
      calls += 1;
    },
  });
  dispatchEscape();
  assert.equal(calls, 1);

  action.update?.({
    handler: () => {
      calls += 1;
    },
  });
  dispatchEscape();
  assert.equal(calls, 2);

  action.destroy?.();
  dispatchEscape();
  assert.equal(calls, 2);
});

test("escapeKey action supports a custom target", () => {
  const node = document.createElement("div");
  const target = document.createElement("div");
  document.body.append(node, target);
  let calls = 0;

  const action = escapeKey(node, {
    target,
    handler: () => {
      calls += 1;
    },
  }) as ActionResult;

  dispatchEscape(document);
  assert.equal(calls, 0);

  dispatchEscape(target);
  assert.equal(calls, 1);

  action.destroy?.();
});
