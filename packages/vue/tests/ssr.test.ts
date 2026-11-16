import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

test("Vue adapter imports and renders on the server without browser globals", () => {
  const script = `
    const { createSSRApp, h } = await import("vue");
    const { renderToString } = await import("vue/server-renderer");
    const { useLayer, useOverlay, usePositioner } = await import("./dist/index.js");

    const App = {
      setup() {
        const overlay = useOverlay({ defaultOpen: true });
        const layer = useLayer();
        const positioner = usePositioner();
        return () =>
          h("div", null, [
            String(overlay.isOpen.value),
            "|",
            overlay.placement.value,
            "|",
            String(layer.id.value),
            "|",
            String(positioner.result.value),
          ]);
      },
    };

    const html = await renderToString(createSSRApp(App));
    console.log(JSON.stringify({
      window: typeof window,
      document: typeof document,
      html,
    }));
  `;

  const output = execFileSync(
    process.execPath,
    ["--input-type=module", "--eval", script],
    { cwd: packageRoot, encoding: "utf8" },
  );

  const result = JSON.parse(output.trim()) as {
    window: string;
    document: string;
    html: string;
  };

  assert.equal(result.window, "undefined");
  assert.equal(result.document, "undefined");
  assert.match(
    result.html.replace(/<!--[^>]*-->/g, ""),
    /true\|bottom\|null\|null/,
  );
});
