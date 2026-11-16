import assert from "node:assert/strict";
import { test } from "node:test";
import { lockBodyScroll } from "../dist/index.js";

test("locks and restores body/html overflow", () => {
  document.body.style.overflow = "scroll";
  document.documentElement.style.overflow = "auto";
  const unlock = lockBodyScroll(document);
  assert.equal(document.body.style.overflow, "hidden");
  assert.equal(document.documentElement.style.overflow, "hidden");
  unlock();
  assert.equal(document.body.style.overflow, "scroll");
  assert.equal(document.documentElement.style.overflow, "auto");
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
});

test("nested locks keep scrolling locked until the last release", () => {
  const first = lockBodyScroll(document);
  const second = lockBodyScroll(document);
  assert.equal(document.body.style.overflow, "hidden");
  first();
  assert.equal(document.body.style.overflow, "hidden");
  second();
  assert.equal(document.body.style.overflow, "");
});

test("release is idempotent", () => {
  const unlock = lockBodyScroll(document);
  unlock();
  unlock();
  assert.equal(document.body.style.overflow, "");
});
