#!/usr/bin/env node
/**
 * Scaffolds a new feature plugin package under `packages/feature-<id>/`.
 *
 * A feature plugin owns a vertical slice across all four surfaces (API, database,
 * admin, web) and exports a single typed `FeatureManifest` from `@repo/api-plugin-kit`.
 * The app composes features explicitly in `apps/api/src/composition/feature-registry.ts`;
 * there is no kernel edit to add or remove one. See ADR 0002 and the generated README.
 *
 * The generated package mirrors the `@repo/feature-health` add-on exemplar (package
 * shape, tsconfig, turbo boundary tag) but is richer: it lays out the schema,
 * migrations, and per-surface folders so the four-surface contract is visible.
 *
 * Usage:
 *   node scripts/scaffold-feature.mjs billing
 *   node scripts/scaffold-feature.mjs import-export
 *   pnpm scaffold:feature billing
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');

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
`;

// kebab-case ids are the only valid input; everything else is derived from them.
const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** Split a kebab-case id into its word tokens. */
const words = (id) => id.split('-').filter(Boolean);

/** `import-export` -> `ImportExport` (class names). */
const toPascal = (id) => words(id).map((w) => w[0].toUpperCase() + w.slice(1)).join('');

/** `import-export` -> `importExport` (valid JS identifier for the manifest const). */
const toCamel = (id) => {
  const pascal = toPascal(id);
  return pascal[0].toLowerCase() + pascal.slice(1);
};

/**
 * Build the full set of files for the package as a flat map of
 * relative-path -> contents. `.gitkeep` markers keep otherwise-empty,
 * mandatory folders (migrations) tracked by git.
 */
const buildFiles = ({ id, pascal, camel }) => {
  const pkgName = `@repo/feature-${id}`;
  const moduleClass = `${pascal}Module`;
  const manifestConst = `${camel}Feature`;
  const moduleFile = `${id}.module.ts`;

  // JSON files are hand-formatted (not JSON.stringify) to byte-match the repo's
  // prettier style — short arrays stay inline, as in packages/feature-health.
  const packageJson = `{
  "name": "${pkgName}",
  "version": "1.0.0",
  "private": true,
  "type": "commonjs",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json --noEmit",
    "lint": "eslint .",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "format": "prettier --write ."
  },
  "dependencies": {
    "@nestjs/common": "11.1.27",
    "@repo/api-runtime": "workspace:*",
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

  const indexTs = `import { defineFeature } from "@repo/api-runtime";

import { ${moduleClass} } from "./${id}.module";

export { ${moduleClass} } from "./${id}.module";

/**
 * The \`${id}\` feature manifest — the single typed contract the app composes.
 * Enable the feature by adding \`${manifestConst}\` to \`featureManifests\` in
 * \`apps/api/src/features.ts\`; disable it by removing that one line (and the
 * workspace dependency). No kernel code changes either way.
 */
export const ${manifestConst} = defineFeature({
  id: "${id}",
  nestModule: ${moduleClass},
  // schema: ${camel}Schema,        // uncomment once this feature owns Drizzle tables
  // permissions: ["${id}:read"],   // RBAC permission keys this feature defines
});
`;

  const moduleTs = `import { Module } from "@nestjs/common";

/**
 * Backend surface for the \`${id}\` feature. This is the single public NestJS
 * module the app wires into \`imports[]\` via the manifest in \`./index.ts\`.
 *
 * Register this feature's controllers, application services, and infrastructure
 * providers here as it grows. Cross-feature needs go through kernel ports
 * (e.g. \`USER_LOOKUP\`, \`AUDIT_WRITER\`), never another plugin's internals.
 */
@Module({})
export class ${moduleClass} {}
`;

  const schemaTs = `/**
 * Drizzle tables owned by the \`${id}\` feature.
 *
 * This feature owns its tables here — the built-in \`@repo/database-runtime\` schema
 * must never define them. Declare the tables in this file, export them, then
 * reference them from the manifest's \`schema\` field in \`../index.ts\`. The app
 * merges every feature's schema via \`composeFeatureSchemas\` in
 * \`apps/api/src/features.ts\`, which throws on duplicate table names, so keep
 * table names unique across all composed features. Co-locate the SQL migrations
 * that create these tables under \`./migrations/\`.
 */
export {};
`;

  const apiReadme = `# ${id} — API surface

NestJS controllers, application services, and infrastructure for the \`${id}\`
feature, exposed through the \`${moduleClass}\` in \`../index.ts\` and composed into
the app via \`apps/api/src/features.ts\`.
`;

  const adminReadme = `# ${id} — Admin surface

Admin console slice (\`resource.ts\` + feature components) for the \`${id}\` feature,
concatenated into \`apps/admin/src/lib/admin-resources.ts\` and rendered by a thin
\`page.tsx\` route.
`;

  const webReadme = `# ${id} — Web surface

Web BFF slice (routes + components) for the \`${id}\` feature, wired through a thin
\`page.tsx\` route in \`apps/web\`.
`;

  const readme = `# ${pkgName}

The \`${id}\` feature as a **compile-time plugin package** (see ADR 0002). It owns a
vertical slice across all four surfaces and exports one typed \`FeatureManifest\`
from \`@repo/api-runtime\` for the backend surface.

## The contract

\`\`\`ts
export const ${manifestConst} = defineFeature({
  id: "${id}",
  nestModule: ${moduleClass}, // backend HTTP/application/domain slice
  schema,                     // Drizzle tables this feature owns (optional)
  permissions,                // RBAC keys this feature defines (optional)
});
\`\`\`

Frontend surfaces are exposed through per-surface entrypoints in this package
(\`./admin\`, \`./web\`) rather than the backend-only manifest, so \`@repo/api-runtime\`
never depends on React or Flutter.

## Layout

| Path                 | Surface  | Role                                                        |
| -------------------- | -------- | ----------------------------------------------------------- |
| \`src/index.ts\`       | —        | Exports \`${moduleClass}\` and the \`${manifestConst}\` manifest.      |
| \`src/${moduleFile}\`  | API      | The single public NestJS module surface.                    |
| \`src/database/\`      | Database | Feature-owned Drizzle \`schema.ts\` + SQL \`migrations/\`.       |
| \`src/api/\`           | API      | Controllers, application services, infrastructure.          |
| \`src/admin/\`         | Admin    | Admin console \`resource.ts\` + feature components.            |
| \`src/web/\`           | Web      | Web BFF routes + components.                                 |

## How the app composes this feature

1. **Add the workspace dependency** to \`apps/api/package.json\`:
   \`"${pkgName}": "workspace:*"\`.
2. **Register the manifest** in \`apps/api/src/features.ts\`:
   \`\`\`ts
   import { ${manifestConst} } from "${pkgName}";
   export const featureManifests = [${manifestConst}];
   \`\`\`
   This wires the Nest module into \`AppModule\` and merges \`schema\` into
   \`DatabaseModule.forRoot({ schema })\`.
3. **Add the admin resource** by concatenating this feature's \`resource.ts\` into
   \`apps/admin/src/lib/admin-resources.ts\` (plus a thin \`page.tsx\`).
4. **Add the mobile package** by listing the Flutter sub-package in
   \`apps/mobile/pubspec.yaml\` and registering its routes.

Disabling the feature is the reverse: remove the workspace dependency and the one
composition line. Note that removing a plugin does **not** drop its tables — that
is a deliberate, separate data migration.
`;

  return {
    'package.json': packageJson,
    'turbo.json': turboJson,
    'tsconfig.json': tsconfigJson,
    'README.md': readme,
    'src/index.ts': indexTs,
    [`src/${moduleFile}`]: moduleTs,
    'src/database/schema.ts': schemaTs,
    'src/database/migrations/.gitkeep': '',
    'src/api/README.md': apiReadme,
    'src/admin/README.md': adminReadme,
    'src/web/README.md': webReadme,
  };
};

const main = () => {
  const argv = process.argv.slice(2);
  if (argv.includes('-h') || argv.includes('--help')) {
    stdout(HELP);
    return;
  }

  const id = argv[0];
  if (!id) {
    die(`missing <feature-id>.\n\n${HELP}`);
  }
  if (!KEBAB.test(id)) {
    die(`invalid feature id "${id}". Use kebab-case: lowercase letters, digits, single hyphens (e.g. "billing", "import-export").`);
  }

  const pascal = toPascal(id);
  const camel = toCamel(id);

  const targetDir = resolve(repoRoot, `packages/feature-${id}`);
  const targetRel = relative(repoRoot, targetDir);

  if (existsSync(targetDir)) {
    die(`target directory already exists: ${targetRel}\nRefusing to overwrite. Delete it first or choose a different id.`);
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
      `  1. Add the workspace dependency to apps/api/package.json:\n` +
      `       "@repo/feature-${id}": "workspace:*"\n` +
      `  2. Register the manifest in apps/api/src/composition/feature-registry.ts:\n` +
      `       import { ${camel}Feature } from "@repo/feature-${id}";\n` +
      `       export const enabledFeatures: readonly FeatureManifest[] = [..., ${camel}Feature];\n` +
      `  3. Install so pnpm links the new package:\n` +
      `       pnpm install\n` +
      `  4. As the feature grows, add the admin resource, web slice, and mobile package\n` +
      `     (see packages/feature-${id}/README.md).\n`,
  );
};

main();
