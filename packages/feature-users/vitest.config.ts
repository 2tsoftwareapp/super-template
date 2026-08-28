import { featureAliases } from "@repo/test-config/feature-aliases";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts", "test/**/*.spec.ts"],
  },
  resolve: {
    alias: featureAliases(),
  },
});
