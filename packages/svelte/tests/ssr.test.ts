import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

test("Svelte adapter imports and constructs controllers without browser globals", () => {
  const script = `
    const svelte = await import("./dist/index.js");
    const positioner = svelte.createPositioner();
    const layer = svelte.createLayer();
    let layerState;
    const unsubscribe = layer.subscribe((value) => {
      layerState = value;
    });
    const result = await positioner.update();
    console.log(JSON.stringify({
      window: typeof window,
      document: typeof document,
      result,
      layerId: layerState.id,
      exports: Object.keys(svelte).length,
    }));
    unsubscribe();
    positioner.dispose();
    layer.dispose();
  `;

  const output = execFileSync(
    process.execPath,
    ["--input-type=module", "--eval", script],
    { cwd: packageRoot, encoding: "utf8" },
  );

  const result = JSON.parse(output.trim()) as {
    window: string;
    document: string;
    result: unknown;
    layerId: string | null;
    exports: number;
  };

  assert.equal(result.window, "undefined");
  assert.equal(result.document, "undefined");
  assert.equal(result.result, null);
  assert.equal(result.layerId, null);
  assert.ok(result.exports > 0);
});
