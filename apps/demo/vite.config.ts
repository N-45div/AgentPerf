import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      input: {
        landing: resolve(__dirname, "index.html"),
        demo: resolve(__dirname, "demo/index.html"),
        catalog: resolve(__dirname, "catalog/index.html")
      }
    }
  }
});
