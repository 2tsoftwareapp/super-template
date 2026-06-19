import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: "../../icons/*", dest: "icons" },
        { src: "../../manifest.json", dest: "." },
      ],
    }),
  ],
  root: resolve(__dirname, "src/ui"),
  builder: {},
  environments: {
    client: {
      build: {
        outDir: resolve(__dirname, "dist/"),
        emptyOutDir: false,
        minify: false,
        rollupOptions: {
          input: ["src/ui/connect.html", "src/ui/status.html"],
          output: {
            manualChunks: undefined,
            entryFileNames: "lib/ui/[name].js",
            chunkFileNames: "lib/ui/[name].js",
            assetFileNames: "lib/ui/[name].[ext]",
          },
        },
      },
    },
    sw: {
      consumer: "client",
      build: {
        outDir: resolve(__dirname, "dist/"),
        emptyOutDir: false,
        minify: false,
        lib: {
          entry: resolve(__dirname, "src/background.ts"),
          fileName: "lib/background",
          formats: ["es"],
        },
      },
    },
  },
});
