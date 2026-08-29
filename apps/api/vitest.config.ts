import { buildFeatureAliases } from "@repo/test-config/feature-aliases";
import path from "node:path";
import { defineConfig } from "vitest/config";

const packagesDir = path.resolve(__dirname, "../../packages");

const packageAlias = (name: string, srcEntry = "src/index.ts") => ({
  find: new RegExp(`^@repo/${name}$`),
  replacement: path.join(packagesDir, name, srcEntry),
});

const packageSubpathAlias = (name: string) => ({
  find: new RegExp(`^@repo/${name}/(.+)$`),
  replacement: path.join(packagesDir, name, "src/$1"),
});

export default defineConfig({
  test: {
    maxWorkers: 1,
    testTimeout: 30000,
    include: ["test/**/*.{test,spec}.ts", "src/cli/seeds/**/*.spec.ts"],
  },
  resolve: {
    alias: [
      packageAlias("api-contract"),
      packageSubpathAlias("api-contract"),
      packageAlias("api-kernel"),
      packageSubpathAlias("api-kernel"),
      packageAlias("api-plugin-kit"),
      packageSubpathAlias("api-plugin-kit"),
      packageAlias("api-runtime"),
      packageSubpathAlias("api-runtime"),
      packageAlias("database-runtime"),
      {
        find: /^@repo\/database-runtime\/schema\/timestamps$/,
        replacement: path.join(packagesDir, "database-runtime/src/persistence/timestamps.ts"),
      },
      {
        find: /^@repo\/database-runtime\/schema$/,
        replacement: path.join(packagesDir, "database-runtime/src/schema.ts"),
      },
      packageAlias("config"),
      {
        find: /^@repo\/config\/environment$/,
        replacement: path.join(packagesDir, "config/src/environment/index.ts"),
      },
      packageSubpathAlias("config"),
      packageAlias("observability"),
      packageSubpathAlias("observability"),
      packageAlias("api-sort"),
      packageSubpathAlias("api-sort"),
      packageAlias("env-loader"),
      packageSubpathAlias("env-loader"),
      ...buildFeatureAliases(packagesDir),
    ],
  },
});
