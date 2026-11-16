import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

test("React adapter imports and renders on the server without browser globals", () => {
  const script = `
    const React = await import("react");
    const { renderToString } = await import("react-dom/server");
    const { useLayer, useOverlay, usePositioner } = await import("./dist/index.js");

    function App() {
      const overlay = useOverlay({ defaultOpen: true });
      const positioner = usePositioner();
      const layer = useLayer();
      return React.createElement(
        "div",
        null,
        String(overlay.isOpen),
        "|",
        overlay.placement,
        "|",
        String(layer.id),
        "|",
        String(positioner.result),
      );
    }

    const html = renderToString(React.createElement(App));
    console.log(JSON.stringify({ window: typeof window, document: typeof document, html }));
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
    result.html.replaceAll("<!-- -->", ""),
    /true\|bottom\|null\|null/,
  );
});
