import assert from "node:assert/strict";
import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as primary from "../dist/index.js";

/**
 * Each public adapter bundles its own copy of Core. Load a second, physically
 * separate copy of the build (as two adapters on one page would) and check
 * that page-global state is still shared between the copies.
 */
const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
// Inside the package so the copy still resolves `@floating-ui/dom`.
const copyDir = mkdtempSync(join(packageDir, ".tmp-core-copy-"));
cpSync(join(packageDir, "dist"), copyDir, { recursive: true });
const secondary = (await import(
  pathToFileURL(join(copyDir, "index.js")).href
)) as typeof primary;

after(() => {
  rmSync(copyDir, { recursive: true, force: true });
});

test("the second copy is a separate module instance", () => {
  assert.notEqual(primary.lockBodyScroll, secondary.lockBodyScroll);
});

test("copies share one layer stack per document", () => {
  const first = primary.acquireSharedLayerStack(document);
  const second = secondary.acquireSharedLayerStack(document);
  try {
    assert.equal(first.stack, second.stack);
  } finally {
    first.release();
    second.release();
  }
});

test("copies share the reference-counted scroll lock", () => {
  const unlockPrimary = primary.lockBodyScroll(document);
  const unlockSecondary = secondary.lockBodyScroll(document);
  unlockPrimary();
  assert.equal(document.body.style.overflow, "hidden");
  unlockSecondary();
  assert.equal(document.body.style.overflow, "");
});
