#!/usr/bin/env node
/**
 * Scaffolds a new feature plugin package under `packages/feature-<id>/`.
 *
 * A feature plugin owns a vertical slice and exports a single typed
 * `FeatureManifest` from `@repo/api-plugin-kit`. The app composes features
 * explicitly in `packages/app-composition/src/feature-registry.ts`; there is no
 * kernel edit to add or remove one. See ADR 0002 and the generated README.
 *
 * The generated layout mirrors the existing feature packages (for example
 * `packages/feature-activities`) rather than inventing a new shape, because the
 * repo's policy gates enforce that shape:
 *   - `scripts/check-source-policy.sh` rejects wildcard `"./*"` exports.
 *   - `scripts/generate-feature-indexes.mjs --check` verifies every declared
 *     export target exists.
 *   - `scripts/check-feature-manifest-deps.mjs` verifies every `dependsOn` entry
 *     has a matching workspace dependency.
 *
 * Usage:
 *   node scripts/scaffold-feature.mjs billing
 *   node scripts/scaffold-feature.mjs import-export
 *   pnpm scaffold:feature billing
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, relative, dirname } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");

const stdout = (msg) => process.stdout.write(msg);
const stderr = (msg) => process.stderr.write(`${msg}\n`);

const die = (msg) => {
  stderr(`\nerror: ${msg}\n`);
  process.exit(1);
};

const HELP = `Scaffold a new feature plugin package.

Usage:
  node scripts/scaffold-feature.mjs <feature-id>

Arguments:
  <feature-id>   kebab-case id, e.g. "billing" or "import-export".

The id must match /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/ and becomes:
  - package name   @repo/feature-<id>
  - Nest module    <Pascal>Module
  - manifest const <camel>Feature

The generated package matches the layout used by the existing feature packages
so it passes the repo policy gates without further edits.
`;

// kebab-case ids are the only valid input; everything else is derived from them.
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** Split a kebab-case id into its word tokens. */
const words = (id) => id.split("-").filter(Boolean);

/** `import-export` -> `ImportExport` (class names). */
const toPascal = (id) =>
  words(id)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");

/** `import-export` -> `importExport` (valid JS identifier for the manifest const). */
const toCamel = (id) => {
  const pascal = toPascal(id);
  return pascal[0].toLowerCase() + pascal.slice(1);
};

/**
 * Build the full set of files for the package as a flat map of
 * relative-path -> contents.
 *
 * Every directory below matches where the existing feature packages put the
 * same kind of code: `application/` for use cases and ports,
 * `infrastructure/persistence/` for Drizzle tables, `presentation/` for
 * controllers and DTOs, `public/` for the contracts other features may import,
 * and `testing/` for test helpers.
 */
const buildFiles = ({ id, pascal, camel }) => {
  const pkgName = `@repo/feature-${id}`;
  const moduleClass = `${pascal}Module`;
  const manifestConst = `${camel}Feature`;
  const moduleFile = `${id}.module.ts`;
  const featureFile = `${id}.feature.ts`;
  // Import specifiers omit the extension; filenames keep it.
  const moduleBase = `${id}.module`;
  const featureBase = `${id}.feature`;

  // JSON files are hand-formatted (not JSON.stringify) to byte-match the repo's
  // prettier style — short arrays stay inline, as in packages/feature-health.
  //
  // The export map is explicit on purpose: `check-source-policy.sh` forbids the
  // `"./*"` wildcard, and `generate-feature-indexes.mjs` verifies each target
  // exists. Add `"./schema"` only while this feature actually owns tables.
  const packageJson = `{
  "name": "${pkgName}",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "exports": {
    ".": "./src/index.ts",
    "./contracts": "./src/public/contracts.ts",
    "./testing": "./src/testing/index.ts",
    "./schema": "./src/infrastructure/persistence/index.ts"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint .",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "format": "prettier --write ."
  },
  "dependencies": {
    "@nestjs/common": "11.1.27",
    "@repo/api-plugin-kit": "workspace:*",
    "@repo/database-runtime": "workspace:*",
    "drizzle-orm": "0.45.2"
  },
  "devDependencies": {
    "@repo/tsconfig": "workspace:*",
    "@types/node": "24.10.1",
    "typescript": "5.9.3",
    "vitest": "4.1.9"
  }
}
`;

  // Per-package turbo config: the `layer:feature` boundary tag is what turbo's
  // `boundaries` rules in the root turbo.json use to constrain dependencies.
  const turboJson = `{
  "$schema": "https://v2-9-18.turborepo.dev/schema.json",
  "extends": ["//"],
  "tags": ["layer:feature"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
`;

  const tsconfigJson = `{
  "extends": "@repo/tsconfig/nest.json",
  "compilerOptions": {
    "outDir": "dist",
    "strictPropertyInitialization": false
  },
  "include": ["src/**/*.ts"],
  "exclude": []
}
`;

  // The manifest lives in its own file, matching every existing feature package.
  const featureTs = `import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { ${moduleClass} } from "./${moduleBase}";

export const ${manifestConst}: FeatureManifest = defineFeature({
  id: "${id}",
  dependsOn: [],
  nestModule: ${moduleClass},
  // schema: { exampleTable },   // Drizzle tables this feature owns
  // Every id listed in dependsOn must also be a workspace dependency in
  // package.json — scripts/check-feature-manifest-deps.mjs enforces this.
});
`;

  const indexTs = `export { ${manifestConst} } from "./${featureBase}";
export { ${moduleClass} } from "./${moduleBase}";
export * from "./public/contracts";
`;

  const moduleTs = `import { Module } from "@nestjs/common";

/**
 * Backend surface for the \`${id}\` feature. This is the single public NestJS
 * module the app wires into \`imports[]\` via the manifest in \`./${featureFile}\`.
 *
 * Register this feature's controllers, application services, and infrastructure
 * providers here as it grows. Cross-feature needs go through kernel ports
 * (e.g. \`USER_LOOKUP\`, \`AUDIT_WRITER\`), never another plugin's internals.
 */
@Module({})
export class ${moduleClass} {}
`;

  // Owned by the `./schema` entry point. Empty until this feature has tables;
  // delete the file and its export entry if the feature never owns one.
  const persistenceIndexTs = `/**
 * Drizzle tables owned by the \`${id}\` feature.
 *
 * This feature owns its tables here — the built-in \`@repo/database-runtime\` schema
 * must never define them. Declare the tables in this folder, re-export them from
 * this barrel, then reference them from the manifest's \`schema\` field in
 * \`../../../${featureFile}\`. The app merges every feature's schema via
 * \`composeFeatureSchemas\` in \`packages/app-composition/src/feature-registry.ts\`,
 * which throws on duplicate table names, so keep table names unique across all
 * composed features.
 */
export {};
`;

  const contractsTs = `/** Public contracts for ${pkgName}. */
export { ${moduleClass} } from "../${moduleBase}";
`;

  const testingTs = `/** Testing helpers for ${pkgName}. */
export {};
`;

  const readme = `# ${pkgName}

The \`${id}\` feature as a **compile-time plugin package** (see ADR 0002). It owns a
vertical slice and exports one typed \`FeatureManifest\` from
\`@repo/api-plugin-kit\`.

## The contract

\`\`\`ts
export const ${manifestConst} = defineFeature({
  id: "${id}",
  nestModule: ${moduleClass}, // backend HTTP/application/domain slice
  schema,                     // Drizzle tables this feature owns (optional)
  permissions,                // RBAC keys this feature defines (optional)
});
\`\`\`

## Layout

Matches the existing feature packages (see \`packages/feature-activities\`):

| Path                                  | Role                                                    |
| ------------------------------------- | ------------------------------------------------------- |
| \`src/${featureFile}\`                  | The manifest — the single typed contract.               |
| \`src/index.ts\`                        | Re-exports the manifest, module and public contracts.    |
| \`src/${moduleFile}\`                   | The single public NestJS module surface.                 |
| \`src/application/\`                    | Use cases, application services and ports.               |
| \`src/infrastructure/persistence/\`     | Feature-owned Drizzle tables (\`./schema\` entry point).   |
| \`src/presentation/\`                   | Controllers and DTOs.                                    |
| \`src/public/contracts.ts\`             | What other features may import (\`./contracts\`).          |
| \`src/testing/index.ts\`                | Test helpers (\`./testing\`).                              |

## How the app composes this feature

1. **Add the workspace dependency** to \`packages/app-composition/package.json\`:
   \`"${pkgName}": "workspace:*"\`.
2. **Register the manifest** in \`packages/app-composition/src/feature-registry.ts\`:
   \`\`\`ts
   import { ${manifestConst} } from "${pkgName}";
   export const enabledFeatures: readonly FeatureManifest[] = [..., ${manifestConst}];
   \`\`\`
   This wires the Nest module into \`AppModule\` and merges \`schema\` into
   \`DatabaseModule.forRoot({ schema })\`.
3. **Install so pnpm links the new package:** \`pnpm install\`.
4. **Generate a migration** if the feature owns tables: \`make db-generate\`.
5. As the feature grows, add the admin resource, web slice, and mobile package.

Disabling the feature is the reverse: remove the workspace dependency and the one
composition line. Note that removing a plugin does **not** drop its tables — that
is a deliberate, separate data migration.

## Gates this package must keep passing

\`\`\`bash
sh scripts/check-source-policy.sh
node scripts/check-feature-manifest-deps.mjs
node scripts/generate-feature-indexes.mjs --check
node scripts/check-cross-feature-fks.mjs
\`\`\`
`;

  return {
    "package.json": packageJson,
    "turbo.json": turboJson,
    "tsconfig.json": tsconfigJson,
    "README.md": readme,
    [`src/${featureFile}`]: featureTs,
    "src/index.ts": indexTs,
    [`src/${moduleFile}`]: moduleTs,
    "src/infrastructure/persistence/index.ts": persistenceIndexTs,
    "src/public/contracts.ts": contractsTs,
    "src/testing/index.ts": testingTs,
  };
};

const main = () => {
  const argv = process.argv.slice(2);
  if (argv.includes("-h") || argv.includes("--help")) {
    stdout(HELP);
    return;
  }

  const id = argv[0];
  if (!id) {
    die(`missing <feature-id>.\n\n${HELP}`);
  }
  if (!KEBAB.test(id)) {
    die(
      `invalid feature id "${id}". Use kebab-case: lowercase letters, digits, single hyphens (e.g. "billing", "import-export").`,
    );
  }

  const pascal = toPascal(id);
  const camel = toCamel(id);

  const targetDir = resolve(repoRoot, `packages/feature-${id}`);
  const targetRel = relative(repoRoot, targetDir);

  if (existsSync(targetDir)) {
    die(
      `target directory already exists: ${targetRel}\nRefusing to overwrite. Delete it first or choose a different id.`,
    );
  }

  const files = buildFiles({ id, pascal, camel });

  stdout(`\nScaffolding feature plugin -> ${targetRel}\n`);
  stdout(`  package: @repo/feature-${id}\n`);
  stdout(`  module:  ${pascal}Module\n`);
  stdout(`  manifest: ${camel}Feature\n\n`);

  const written = Object.keys(files).sort();
  for (const rel of written) {
    const abs = resolve(targetDir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, files[rel]);
    stdout(`  created  ${relative(repoRoot, abs)}\n`);
  }

  stdout(`\nDone — created ${written.length} file(s) under ${targetRel}.\n`);

  stdout(
    `\nNext steps — wire it into the app:\n` +
      `  1. Add the workspace dependency to packages/app-composition/package.json:\n` +
      `       "@repo/feature-${id}": "workspace:*"\n` +
      `  2. Register the manifest in packages/app-composition/src/feature-registry.ts:\n` +
      `       import { ${camel}Feature } from "@repo/feature-${id}";\n` +
      `       export const enabledFeatures: readonly FeatureManifest[] = [..., ${camel}Feature];\n` +
      `  3. Install so pnpm links the new package:\n` +
      `       pnpm install\n` +
      `  4. Verify the policy gates before committing:\n` +
      `       sh scripts/check-source-policy.sh && node scripts/check-feature-manifest-deps.mjs\n` +
      `  5. If the feature owns no tables, delete src/infrastructure/persistence/\n` +
      `     and the "./schema" export from its package.json.\n`,
  );
};

main();
