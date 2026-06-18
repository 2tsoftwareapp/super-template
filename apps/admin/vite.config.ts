import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Bundle budget: route-level code splitting keeps the initial chunk well
    // under this limit. Lowering it from Vite's 500 kB default surfaces
    // regressions early.
    chunkSizeWarningLimit: 350,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
