import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { compile } from "svelte/compiler";
import { render } from "svelte/server";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

test("a compiled Svelte component renders on the server with adapter imports", async () => {
  const directory = mkdtempSync(join(packageRoot, "tests", "ssr-"));
  const fixture = join(directory, "fixture.mjs");

  try {
    const adapterUrl = pathToFileURL(
      join(packageRoot, "dist", "index.js"),
    ).href;
    const source = `
      <script>
        import { createLayer, createPositioner } from "${adapterUrl}";
        const positioner = createPositioner();
        const layer = createLayer();
      </script>
      <div>overlay:ssr</div>
    `;

    const compiled = compile(source, {
      generate: "server",
      filename: "fixture.svelte",
    });
    writeFileSync(fixture, compiled.js.code, "utf8");

    const module = (await import(pathToFileURL(fixture).href)) as {
      default: Parameters<typeof render>[0];
    };
    const result = render(module.default, { props: {} });

    assert.match(result.body, /overlay:ssr/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
