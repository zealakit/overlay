import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { LayerStackHandle } from "@zealakit/overlay-core";
import { compile } from "svelte/compiler";
import { flushSync, mount, unmount } from "svelte";
import { resetDom, trackDocumentListeners } from "./support/dom.ts";

const packageRoot = fileURLToPath(new URL("..", import.meta.url));

test("action cleanup runs when a Svelte component is destroyed", async () => {
  resetDom();
  const tracker = trackDocumentListeners();
  const directory = mkdtempSync(join(packageRoot, "tests", "tmp-"));
  const fixture = join(directory, "fixture.mjs");

  try {
    const source = `
      <script>
        import { layer } from "${pathToFileURL(join(packageRoot, "dist", "index.js")).href}";
        let { onRegistered } = $props();
      </script>
      <div use:layer={{ onRegistered }}>panel</div>
    `;

    const compiled = compile(source, {
      generate: "client",
      dev: true,
      filename: "fixture.svelte",
    });
    writeFileSync(fixture, compiled.js.code, "utf8");

    const module = (await import(pathToFileURL(fixture).href)) as {
      default: Parameters<typeof mount>[0];
    };

    const handleRef: { current: LayerStackHandle | null } = {
      current: null,
    };
    const target = document.createElement("div");
    document.body.append(target);

    const app = mount(module.default, {
      target,
      props: {
        onRegistered: (next: LayerStackHandle | null) => {
          if (next) {
            handleRef.current = next;
          }
        },
      },
    });
    flushSync();

    const registeredHandle = handleRef.current;
    assert.ok(registeredHandle);
    assert.equal(registeredHandle.isRegistered, true);
    assert.equal(tracker.counts.keydownAdds, 1);

    unmount(app);
    flushSync();

    assert.equal(registeredHandle.isRegistered, false);
    assert.equal(tracker.counts.keydownRemoves, 1);
  } finally {
    tracker.restore();
    rmSync(directory, { recursive: true, force: true });
  }
});
