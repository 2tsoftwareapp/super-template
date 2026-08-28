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

const featureNames = [
  "feature-access-control",
  "feature-activities",
  "feature-audit",
  "feature-auth",
  "feature-health",
  "feature-import-export",
  "feature-jobs",
  "feature-mail",
  "feature-mfa",
  "feature-notifications",
  "feature-organizations",
  "feature-settings",
  "feature-sso",
  "feature-upload",
  "feature-user-preferences",
  "feature-users",
];

export default defineConfig({
  test: {
    maxWorkers: 1,
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
      packageSubpathAlias("config"),
      packageAlias("observability"),
      packageSubpathAlias("observability"),
      packageAlias("api-sort"),
      packageSubpathAlias("api-sort"),
      packageAlias("env-loader"),
      packageSubpathAlias("env-loader"),
      ...featureNames.flatMap((name) => {
        const id = name.replace(/^feature-/, "");
        return [
          {
            find: new RegExp(`^@repo/${name}$`),
            replacement: path.join(packagesDir, name, `src/${id}.feature.ts`),
          },
          {
            find: new RegExp(`^@repo/${name}/contracts$`),
            replacement: path.join(packagesDir, name, "src/public/contracts.ts"),
          },
          {
            find: new RegExp(`^@repo/${name}/schema$`),
            replacement: path.join(packagesDir, name, "src/infrastructure/persistence/index.ts"),
          },
          {
            find: new RegExp(`^@repo/${name}/module$`),
            replacement: path.join(packagesDir, name, `src/${id}.module.ts`),
          },
          packageSubpathAlias(name),
        ];
      }),
      // Preferences module file keeps legacy name
      {
        find: /^@repo\/feature-user-preferences\/module$/,
        replacement: path.join(packagesDir, "feature-user-preferences/src/preferences.module.ts"),
      },
      {
        find: /^@repo\/feature-import-export\/module$/,
        replacement: path.join(
          packagesDir,
          "feature-import-export/src/import-export-feature.module.ts",
        ),
      },
      {
        find: /^@repo\/config\/environment$/,
        replacement: path.join(packagesDir, "config/src/environment/index.ts"),
      },
    ],
  },
});
