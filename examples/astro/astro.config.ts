import react from "@astrojs/react";
import svelte from "@astrojs/svelte";
import vue from "@astrojs/vue";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [react(), svelte(), vue()],
  vite: {
    plugins: [
      {
        // Dev only: with several JSX/SFC frameworks the React refresh transform
        // also touches Vue modules, and `$RefreshSig$` is not defined while
        // server-rendering them. A no-op stub keeps SSR working; the browser
        // still gets the real React preamble.
        name: "overlay-example-refresh-ssr-stubs",
        apply: "serve",
        transform(_code, _id, options) {
          if (options?.ssr) {
            Object.assign(globalThis, {
              $RefreshSig$: () => (type: unknown) => type,
              $RefreshReg$: () => {},
            });
          }
          return null;
        },
      },
    ],
  },
});
