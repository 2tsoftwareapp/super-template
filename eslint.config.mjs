import { defineConfig, globalIgnores } from "eslint/config";

import { baseConfig } from "./packages/eslint-config/base.mjs";
import { webPackageBoundaryConfig } from "./packages/eslint-config/web-packages.mjs";

export default defineConfig([
  ...baseConfig,
  ...webPackageBoundaryConfig,
  globalIgnores([
    "**/dist/**",
    "**/coverage/**",
    "**/node_modules/**",
    "packages/api-contract/src/generated/**",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/vitest.config.ts",
    "**/vitest.*.config.ts",
    "**/vitest-feature-aliases.mjs",
    "apps/api/webpack.config.js",
    "eslint.config.mjs",
  ]),
]);
