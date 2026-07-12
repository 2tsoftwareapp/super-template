import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "server-only": new URL("./src/test/server-only-stub.ts", import.meta.url)
        .pathname,
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: [
        "src/**/*.test.*",
        "src/test/**",
        "src/api-types.ts",
        "src/types.ts",
        "src/**/index.ts",
      ],
      // Regression gate, not a target: set just below measured coverage so
      // new untested code fails CI. Raise as coverage improves.
      thresholds: {
        statements: 30,
        branches: 25,
        functions: 26,
        lines: 31,
      },
    },
  },
});
