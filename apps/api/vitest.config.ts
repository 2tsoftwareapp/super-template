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
    // e2e `beforeAll` hooks drop the schema, replay every migration, boot a Nest app and
    // seed it: ~1.1s when nothing competes for the database, but the schema drop takes
    // ACCESS EXCLUSIVE locks, so a hook measured 33.7s while another session held a table
    // lock, and it also queues behind the test-database advisory lock whenever a second
    // e2e process is mid-file. Vitest's implicit 10s default cut that setup short, which
    // is what the intermittent "Hook timed out in 10000ms" failures were. 120s is what the
    // three hooks that currently ask for it by hand are using, so every other hook in the
    // suite now gets that same budget instead of the implicit 10s.
    hookTimeout: 120_000,
    // Left alone deliberately: a stuck request is a real failure and individual requests
    // are fast. Only the setup work above is slow enough to need a bigger budget.
    testTimeout: 30000,
    include: ["test/**/*.{test,spec}.ts", "src/cli/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
    },
  },
  resolve: {
    dedupe: ["@nestjs/common", "@nestjs/core", "@nestjs/schedule"],
    alias: [
      packageAlias("api-contract"),
      packageSubpathAlias("api-contract"),
      packageAlias("api-kernel"),
      packageSubpathAlias("api-kernel"),
      packageAlias("api-plugin-kit"),
      packageSubpathAlias("api-plugin-kit"),
      packageAlias("app-composition"),
      packageSubpathAlias("app-composition"),
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
      // Packages the API composition never imports, so pnpm does not link them into
      // apps/api/node_modules and a bare specifier cannot resolve. The
      // public-api-exports spec still loads every `exports` subpath of every workspace
      // package, so point those bare specifiers at their sources here.
      packageAlias("feature-database-read-replica"),
      packageAlias("feature-org-model-optional"),
      packageAlias("feature-org-model-personal-orgs"),
      packageAlias("feature-tenant-schema"),
      packageAlias("feature-tenant-shared-schema"),
      packageAlias("utils"),
      packageSubpathAlias("utils"),
      packageAlias("web-utils"),
      packageSubpathAlias("web-utils"),
      ...buildFeatureAliases(packagesDir),
    ],
  },
});
