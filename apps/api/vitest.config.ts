import path from "node:path";
import { defineConfig } from "vitest/config";

const packagesDir = path.resolve(__dirname, "../../packages");

const packageAlias = (name: string) => ({
  find: new RegExp(`^@repo/${name}$`),
  replacement: path.join(packagesDir, name, "src/index.ts"),
});

const packageSubpathAlias = (name: string) => ({
  find: new RegExp(`^@repo/${name}/(.+)$`),
  replacement: path.join(packagesDir, name, "src/$1"),
});

export default defineConfig({
  test: {
    maxWorkers: 1,
    // oxc: false,
    include: [
      "test/**/*.{test,spec}.ts",
      "src/identity/**/*.spec.ts",
      "src/platform/**/*.spec.ts",
      "src/cli/seeds/**/*.spec.ts",
      "../../packages/api-contract/src/**/*.{test,spec}.ts",
      "../../packages/api-core/src/**/*.{test,spec}.ts",
      "../../packages/api-sort/src/**/*.{test,spec}.ts",
      "../../packages/api-database/src/**/*.{test,spec}.ts",
      "../../packages/api-health/src/**/*.{test,spec}.ts",
      "../../packages/env-loader/src/**/*.{test,spec}.ts",
    ],
  },
  resolve: {
    alias: [
      packageAlias("api-contract"),
      packageSubpathAlias("api-contract"),
      packageAlias("api-core"),
      packageSubpathAlias("api-core"),
      packageAlias("api-database"),
      packageSubpathAlias("api-database"),
      packageAlias("api-sort"),
      packageSubpathAlias("api-sort"),
      { find: /^@identity\/(.+)$/, replacement: path.resolve(__dirname, "src/identity/$1") },
      { find: /^@identity$/, replacement: path.resolve(__dirname, "src/identity/index.ts") },
      { find: /^@platform\/(.+)$/, replacement: path.resolve(__dirname, "src/platform/$1") },
      { find: /^@platform$/, replacement: path.resolve(__dirname, "src/platform/index.ts") },
    ],
  },
});
