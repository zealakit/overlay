import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

test("vanilla adapter imports and constructs controllers without browser globals", () => {
  const script = `
    const vanilla = await import("./dist/index.js");
    const floating = vanilla.createFloating();
    const stack = vanilla.createLayerStack();
    const result = await floating.update();
    console.log(JSON.stringify({
      window: typeof window,
      document: typeof document,
      result,
      stackSize: stack.size,
      exports: Object.keys(vanilla).length,
    }));
    floating.dispose();
    stack.dispose();
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
    stackSize: number;
    exports: number;
  };

  assert.equal(result.window, "undefined");
  assert.equal(result.document, "undefined");
  assert.equal(result.result, null);
  assert.equal(result.stackSize, 0);
  assert.ok(result.exports > 0);
});
