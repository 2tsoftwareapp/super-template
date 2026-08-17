import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      exclude: [
        "src/**/*.spec.ts",
        "src/**/__tests__/**",
        "src/index.ts",
        "src/**/index.ts",
        "src/**/*.d.ts",
        "src/ports/**",
        "src/common/types/**",
        "src/common/constants/**",
      ],
      // Regression gate, not a target — raise as coverage improves.
      thresholds: {
        statements: 65,
        branches: 60,
        functions: 58,
        lines: 65,
      },
    },
  },
});
