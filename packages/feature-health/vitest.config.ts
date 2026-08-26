import { defineConfig } from "vitest/config";
import { featureAliases } from "./vitest-feature-aliases.mjs";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts", "test/**/*.spec.ts"],
  },
  resolve: {
    alias: featureAliases(),
  },
});
