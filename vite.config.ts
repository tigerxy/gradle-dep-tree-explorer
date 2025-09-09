import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [
    svelte(),
    // Inline all JS/CSS/assets into a single HTML output
    viteSingleFile(),
  ],
  build: {
    // Ensure assets like fonts/images are inlined as data URIs
    assetsInlineLimit: 100000000, // ~100MB
    cssCodeSplit: false,
    target: "es2020",
  },
  test: {
    environment: "happy-dom",
    include: ["tests/**/*.spec.ts"],
    setupFiles: ["tests/setup.ts"],
  },
});
