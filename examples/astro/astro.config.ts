import react from "@astrojs/react";
import svelte from "@astrojs/svelte";
import vue from "@astrojs/vue";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [react(), svelte(), vue()],
});
