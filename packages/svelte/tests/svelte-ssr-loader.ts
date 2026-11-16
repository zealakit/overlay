import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import { compile } from "svelte/compiler";

/** Compile `.svelte` files for plain-Node SSR imports without installing a DOM. */
registerHooks({
  load(url, context, nextLoad) {
    if (url.endsWith(".svelte")) {
      const filename = fileURLToPath(url);
      const { js } = compile(readFileSync(filename, "utf8"), {
        generate: "server",
        filename,
      });
      return { format: "module", source: js.code, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
