import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { effectScope, nextTick, ref } from "vue";
import { useEscapeKey } from "../dist/index.js";
import { dispatchEscape, resetDom } from "./support/dom.ts";

afterEach(() => {
  resetDom();
});

test("calls the handler on Escape and respects enabled", async () => {
  const enabled = ref(true);
  let calls = 0;
  const scope = effectScope();

  scope.run(() => {
    useEscapeKey(
      () => {
        calls += 1;
      },
      { enabled },
    );
  });

  await nextTick();
  dispatchEscape();
  assert.equal(calls, 1);

  enabled.value = false;
  await nextTick();
  dispatchEscape();
  assert.equal(calls, 1);

  enabled.value = true;
  await nextTick();
  dispatchEscape();
  assert.equal(calls, 2);

  scope.stop();
  dispatchEscape();
  assert.equal(calls, 2);
});

test("supports a custom event target", async () => {
  const target = document.createElement("div");
  document.body.append(target);
  let calls = 0;
  const scope = effectScope();

  scope.run(() => {
    useEscapeKey(
      () => {
        calls += 1;
      },
      { target },
    );
  });

  await nextTick();
  dispatchEscape(document);
  assert.equal(calls, 0);

  dispatchEscape(target);
  assert.equal(calls, 1);
  scope.stop();
});
