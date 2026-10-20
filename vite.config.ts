import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === "single" ? [viteSingleFile()] : [])],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  // Relative base so the build also works from a sub-path (GitHub Pages).
  base: "./",
  build: { assetsInlineLimit: mode === "single" ? 10_000_000 : 4096 },
}));
