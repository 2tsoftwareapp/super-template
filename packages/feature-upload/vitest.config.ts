import { featureAliases } from "@repo/test-config/feature-aliases";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts", "test/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      thresholds: { lines: 50, statements: 50, functions: 30, branches: 40 },
    },
  },
  resolve: {
    alias: featureAliases(),
  },
});
