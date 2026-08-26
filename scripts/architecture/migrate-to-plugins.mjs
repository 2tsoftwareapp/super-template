#!/usr/bin/env node
/**
 * One-shot structural migration: umbrella features → capability plugins + kernel split.
 * Safe: uses git mv; no destructive git resets.
 */
import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const sh = (cmd) => execSync(cmd, { cwd: root, stdio: "inherit", shell: "/bin/bash" });
const shOut = (cmd) => execSync(cmd, { cwd: root, encoding: "utf8", shell: "/bin/bash" }).trim();

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function gitMv(from, to) {
  ensureDir(dirname(to));
  if (!existsSync(from)) {
    console.warn(`skip missing: ${from}`);
    return;
  }
  ensureDir(dirname(join(root, to)));
  sh(`git mv "${from}" "${to}"`);
}

function writeJson(path, obj) {
  writeFileSync(join(root, path), JSON.stringify(obj, null, 2) + "\n");
}

function write(path, content) {
  ensureDir(dirname(join(root, path)));
  writeFileSync(join(root, path), content);
}

const nestTsconfig = `{
  "extends": "@repo/tsconfig/nest.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "strictPropertyInitialization": false
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.spec.ts", "test"]
}
`;

const featureTurbo = `{
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

const coreTurbo = (tag) => `{
  "$schema": "https://v2-9-18.turborepo.dev/schema.json",
  "extends": ["//"],
  "tags": ["${tag}"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
`;

function featurePkg({ name, deps = {}, devDeps = {}, exportsExtra = {} }) {
  return {
    name: `@repo/${name}`,
    version: "1.0.0",
    private: true,
    type: "commonjs",
    exports: {
      ".": `./src/${name.replace("feature-", "")}.feature.ts`,
      "./contracts": "./src/public/contracts.ts",
      "./testing": "./src/testing/index.ts",
      ...exportsExtra,
    },
    scripts: {
      build: "tsc -p tsconfig.json --noEmit",
      lint: "eslint .",
      typecheck: "tsc -p tsconfig.json --noEmit",
      test: "vitest run --passWithNoTests",
      format: "prettier --write .",
    },
    dependencies: deps,
    devDependencies: {
      "@repo/tsconfig": "workspace:*",
      "@types/node": "24.10.1",
      typescript: "5.9.3",
      vitest: "4.1.9",
      ...devDeps,
    },
  };
}

const commonFeatureDeps = {
  "@nestjs/common": "11.1.27",
  "@nestjs/swagger": "11.4.4",
  "@repo/api-kernel": "workspace:*",
  "@repo/api-plugin-kit": "workspace:*",
  "@repo/api-runtime": "workspace:*",
  "@repo/database-runtime": "workspace:*",
  "@repo/config": "workspace:*",
  "class-transformer": "0.5.1",
  "class-validator": "0.15.1",
  "drizzle-orm": "0.45.2",
  zod: "4.4.3",
};

console.log("=== 1. Create kernel packages scaffolding ===");

// --- api-kernel ---
ensureDir(join(root, "packages/api-kernel/src"));
write("packages/api-kernel/package.json", JSON.stringify({
  name: "@repo/api-kernel",
  version: "1.0.0",
  private: true,
  type: "commonjs",
  exports: { ".": "./src/index.ts" },
  scripts: {
    build: "tsc -p tsconfig.json --noEmit",
    lint: "eslint .",
    typecheck: "tsc -p tsconfig.json --noEmit",
    test: "vitest run --passWithNoTests",
    format: "prettier --write .",
  },
  dependencies: {
    "@repo/api-sort": "workspace:*",
    "@repo/utils": "workspace:*",
    zod: "4.4.3",
  },
  devDependencies: {
    "@repo/tsconfig": "workspace:*",
    "@types/node": "24.10.1",
    typescript: "5.9.3",
    vitest: "4.1.9",
  },
}, null, 2) + "\n");
write("packages/api-kernel/tsconfig.json", `{
  "extends": "@repo/tsconfig/base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src/**/*.ts"]
}
`);
write("packages/api-kernel/turbo.json", coreTurbo("layer:core"));
write("packages/api-kernel/vitest.config.ts", `import { defineConfig } from "vitest/config";\nexport default defineConfig({ test: { environment: "node", include: ["src/**/*.spec.ts"] } });\n`);

// --- api-plugin-kit ---
ensureDir(join(root, "packages/api-plugin-kit/src"));
write("packages/api-plugin-kit/package.json", JSON.stringify({
  name: "@repo/api-plugin-kit",
  version: "1.0.0",
  private: true,
  type: "commonjs",
  exports: { ".": "./src/index.ts" },
  scripts: {
    build: "tsc -p tsconfig.json --noEmit",
    lint: "eslint .",
    typecheck: "tsc -p tsconfig.json --noEmit",
    test: "vitest run",
    format: "prettier --write .",
  },
  dependencies: {
    "@nestjs/common": "11.1.27",
  },
  devDependencies: {
    "@repo/tsconfig": "workspace:*",
    "@types/node": "24.10.1",
    typescript: "5.9.3",
    vitest: "4.1.9",
  },
}, null, 2) + "\n");
write("packages/api-plugin-kit/tsconfig.json", nestTsconfig);
write("packages/api-plugin-kit/turbo.json", coreTurbo("layer:core"));
write("packages/api-plugin-kit/vitest.config.ts", `import { defineConfig } from "vitest/config";\nexport default defineConfig({ test: { environment: "node", include: ["src/**/*.spec.ts"] } });\n`);

// --- api-runtime ---
ensureDir(join(root, "packages/api-runtime/src"));
write("packages/api-runtime/package.json", JSON.stringify({
  name: "@repo/api-runtime",
  version: "1.0.0",
  private: true,
  type: "commonjs",
  exports: {
    ".": "./src/index.ts",
  },
  scripts: {
    build: "tsc -p tsconfig.json --noEmit",
    lint: "eslint .",
    typecheck: "tsc -p tsconfig.json --noEmit",
    test: "vitest run --passWithNoTests",
    format: "prettier --write .",
  },
  dependencies: {
    "@nestjs/common": "11.1.27",
    "@nestjs/core": "11.1.27",
    "@nestjs/swagger": "11.4.4",
    "@nestjs/throttler": "6.5.0",
    "@repo/api-kernel": "workspace:*",
    "@repo/api-plugin-kit": "workspace:*",
    "@repo/api-sort": "workspace:*",
    "@repo/config": "workspace:*",
    "@repo/observability": "workspace:*",
    "@repo/utils": "workspace:*",
    "class-transformer": "0.5.1",
    "class-validator": "0.15.1",
    express: "5.2.1",
    redis: "^5.10.0",
    rxjs: "7.8.2",
    zod: "4.4.3",
  },
  devDependencies: {
    "@repo/tsconfig": "workspace:*",
    "@types/express": "5.0.4",
    "@types/node": "24.10.1",
    typescript: "5.9.3",
    vitest: "4.1.9",
  },
}, null, 2) + "\n");
write("packages/api-runtime/tsconfig.json", `{
  "extends": "@repo/tsconfig/nest.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "strictPropertyInitialization": false
  },
  "include": ["src/**/*.ts", "src/types/express.d.ts"],
  "exclude": []
}
`);
write("packages/api-runtime/turbo.json", coreTurbo("layer:core"));
write("packages/api-runtime/vitest.config.ts", `import { defineConfig } from "vitest/config";\nexport default defineConfig({ test: { environment: "node", include: ["src/**/*.spec.ts"] } });\n`);

// --- observability ---
ensureDir(join(root, "packages/observability/src"));
write("packages/observability/package.json", JSON.stringify({
  name: "@repo/observability",
  version: "1.0.0",
  private: true,
  type: "commonjs",
  exports: { ".": "./src/index.ts" },
  scripts: {
    build: "tsc -p tsconfig.json --noEmit",
    lint: "eslint .",
    typecheck: "tsc -p tsconfig.json --noEmit",
    test: "vitest run --passWithNoTests",
    format: "prettier --write .",
  },
  dependencies: {
    "@nestjs/common": "11.1.27",
    "@repo/api-kernel": "workspace:*",
    "@repo/config": "workspace:*",
    "@sentry/node": "10.58.0",
  },
  devDependencies: {
    "@repo/tsconfig": "workspace:*",
    "@types/node": "24.10.1",
    typescript: "5.9.3",
    vitest: "4.1.9",
  },
}, null, 2) + "\n");
write("packages/observability/tsconfig.json", nestTsconfig);
write("packages/observability/turbo.json", coreTurbo("layer:core"));

console.log("=== 2. Move api-core contents into new packages ===");

const core = "packages/api-core/src";

// kernel moves
const kernelMoves = [
  ["common/errors", "packages/api-kernel/src/errors"],
  ["common/constants/error-codes.ts", "packages/api-kernel/src/constants/error-codes.ts"],
  ["common/constants/system.constants.ts", "packages/api-kernel/src/constants/system.constants.ts"],
  ["common/types/json-value.ts", "packages/api-kernel/src/types/json-value.ts"],
  ["common/types/request-context.ts", "packages/api-kernel/src/types/request-context.ts"],
  ["common/types/transaction-executor.ts", "packages/api-kernel/src/types/transaction-executor.ts"],
  ["common/utils/csv.ts", "packages/api-kernel/src/utils/csv.ts"],
  ["common/utils/duration.ts", "packages/api-kernel/src/utils/duration.ts"],
  ["common/utils/normalize-email.ts", "packages/api-kernel/src/utils/normalize-email.ts"],
  ["common/utils/opaque-token.ts", "packages/api-kernel/src/utils/opaque-token.ts"],
  ["common/utils/redact.ts", "packages/api-kernel/src/utils/redact.ts"],
  ["common/utils/require-organization.ts", "packages/api-kernel/src/utils/require-organization.ts"],
  ["common/sort/multi-sort.ts", "packages/api-kernel/src/sort/multi-sort.ts"],
  ["common/logging/logger.interface.ts", "packages/api-kernel/src/logging/logger.interface.ts"],
  ["ports", "packages/api-kernel/src/ports"],
];

for (const [from, to] of kernelMoves) {
  gitMv(`${core}/${from}`, to);
}

// Move rbac helpers that are generic; keep catalogs with features later — move all rbac to kernel for now then thin
gitMv(`${core}/common/rbac`, "packages/api-kernel/src/rbac");
gitMv(`${core}/common/constants/organization-role.ts`, "packages/api-kernel/src/constants/organization-role.ts");
gitMv(`${core}/common/constants/file.constants.ts`, "packages/api-kernel/src/constants/file.constants.ts");
gitMv(`${core}/common/constants/mandatory-mail-templates.ts`, "packages/api-kernel/src/constants/mandatory-mail-templates.ts");

// plugin-kit
gitMv(`${core}/plugin/feature-manifest.ts`, "packages/api-plugin-kit/src/feature-manifest.ts");
if (existsSync(join(root, `${core}/plugin/__tests__`))) {
  gitMv(`${core}/plugin/__tests__`, "packages/api-plugin-kit/src/__tests__");
}

// observability
gitMv(`${core}/common/observability`, "packages/observability/src/observability");

// config — nest env into existing packages/config
ensureDir(join(root, "packages/config/src/environment"));
gitMv(`${core}/config`, "packages/config/src/environment");

// runtime — remaining common pieces
gitMv(`${core}/common/decorators`, "packages/api-runtime/src/decorators");
gitMv(`${core}/common/filters`, "packages/api-runtime/src/filters");
gitMv(`${core}/common/guards`, "packages/api-runtime/src/guards");
gitMv(`${core}/common/interceptors`, "packages/api-runtime/src/interceptors");
gitMv(`${core}/common/middleware`, "packages/api-runtime/src/middleware");
gitMv(`${core}/common/logging`, "packages/api-runtime/src/logging");
gitMv(`${core}/common/redis`, "packages/api-runtime/src/redis");
gitMv(`${core}/common/throttling`, "packages/api-runtime/src/throttling");
gitMv(`${core}/common/services`, "packages/api-runtime/src/services");
gitMv(`${core}/common/cache`, "packages/api-runtime/src/cache");
gitMv(`${core}/common/pagination`, "packages/api-runtime/src/pagination");
gitMv(`${core}/common/types/express.d.ts`, "packages/api-runtime/src/types/express.d.ts");
gitMv(`${core}/common/import-export`, "packages/api-runtime/src/import-export");

// leftover utils under common/utils
if (existsSync(join(root, `${core}/common/utils`))) {
  const utils = readdirSync(join(root, `${core}/common/utils`));
  for (const u of utils) {
    gitMv(`${core}/common/utils/${u}`, `packages/api-runtime/src/utils/${u}`);
  }
}

console.log("=== 3. Rename api-database → database-runtime ===");
sh("git mv packages/api-database packages/database-runtime");
// update package name later; move migrations to apps/api
ensureDir(join(root, "apps/api/migrations"));
if (existsSync(join(root, "packages/database-runtime/drizzle"))) {
  // move migration SQL into apps/api/migrations (keep meta)
  sh("git mv packages/database-runtime/drizzle apps/api/migrations-tmp");
  sh("mkdir -p apps/api/migrations && git mv apps/api/migrations-tmp/* apps/api/migrations/ && rmdir apps/api/migrations-tmp");
}

console.log("=== 4. Create feature packages and move modules ===");

const identityFeatures = [
  { pkg: "feature-auth", module: "auth", id: "auth", schemaFiles: ["auth.ts", "outbox-messages.ts"] },
  { pkg: "feature-users", module: "users", id: "users", schemaFiles: ["users.ts"] },
  { pkg: "feature-organizations", module: "organizations", id: "organizations", schemaFiles: ["organizations.ts"] },
  { pkg: "feature-access-control", module: "access-control", id: "access-control", schemaFiles: ["access-control.ts"] },
  { pkg: "feature-mfa", module: "mfa", id: "mfa", schemaFiles: ["two-factor.ts"] },
  { pkg: "feature-sso", module: "sso", id: "sso", schemaFiles: ["sso.ts"] },
  { pkg: "feature-user-preferences", module: "preferences", id: "user-preferences", schemaFiles: ["preferences.ts"] },
];

const platformFeatures = [
  { pkg: "feature-upload", modules: ["files", "storage", "attachments"], id: "upload",
    schemaFiles: ["files.ts", "file-versions.ts", "file-batch-operations.ts", "storage-objects.ts", "attachments.ts"] },
  { pkg: "feature-jobs", modules: ["jobs"], id: "jobs",
    schemaFiles: ["jobs.ts", "job-attempts.ts", "job-dependencies.ts", "job-events.ts"] },
  { pkg: "feature-mail", modules: ["mail"], id: "mail", schemaFiles: ["mail.ts"] },
  { pkg: "feature-notifications", modules: ["notifications"], id: "notifications",
    schemaFiles: ["notifications.ts"] },
  { pkg: "feature-audit", modules: ["audit"], id: "audit", schemaFiles: ["audit.ts"] },
  { pkg: "feature-settings", modules: ["settings"], id: "settings", schemaFiles: ["settings.ts"] },
  { pkg: "feature-import-export", modules: ["imports", "exports"], id: "import-export",
    schemaFiles: ["import-export.ts"], extra: ["import-export"] },
  { pkg: "feature-activities", modules: ["activities"], id: "activities", schemaFiles: ["activities.ts"] },
];

function scaffoldFeature(pkgName, featureId) {
  const base = `packages/${pkgName}`;
  ensureDir(join(root, `${base}/src/public`));
  ensureDir(join(root, `${base}/src/testing`));
  ensureDir(join(root, `${base}/test/unit`));
  const short = pkgName.replace("feature-", "");
  writeJson(`${base}/package.json`, featurePkg({
    name: pkgName,
    deps: { ...commonFeatureDeps },
    exportsExtra: {
      "./schema": "./src/infrastructure/persistence/index.ts",
      "./module": `./src/${short}.module.ts`,
    },
  }));
  // fix export for multi-word
  const pkg = JSON.parse(readFileSync(join(root, `${base}/package.json`), "utf8"));
  pkg.exports["."] = `./src/${featureId.replace(/-/g, "-")}.feature.ts`;
  // use featureId for file names
  pkg.exports["."] = `./src/${featureId}.feature.ts`;
  pkg.exports["./module"] = `./src/${featureId}.module.ts`;
  writeJson(`${base}/package.json`, pkg);
  write(`${base}/tsconfig.json`, nestTsconfig);
  write(`${base}/turbo.json`, featureTurbo);
  write(`${base}/vitest.config.ts`, `import { defineConfig } from "vitest/config";\nexport default defineConfig({ test: { environment: "node", include: ["src/**/*.spec.ts", "test/**/*.spec.ts"] } });\n`);
  write(`${base}/src/testing/index.ts`, `/** Testing helpers for @repo/${pkgName}. */\nexport {};\n`);
}

for (const f of identityFeatures) {
  scaffoldFeature(f.pkg, f.id);
  const dest = `packages/${f.pkg}/src`;
  const src = `packages/features/identity/src/modules/${f.module}`;
  // Move layer folders
  for (const layer of ["domain", "application", "infrastructure", "presentation"]) {
    if (existsSync(join(root, `${src}/${layer}`))) {
      gitMv(`${src}/${layer}`, `${dest}/${layer}`);
    }
  }
  // Move module files
  for (const file of readdirSync(join(root, src))) {
    const full = join(root, src, file);
    if (statSync(full).isFile()) {
      const targetName = file.replace(/^preferences\./, "user-preferences.").replace(new RegExp(`^${f.module}\\.`), `${f.id}.`);
      // Keep original module file names then rename key ones
      gitMv(`${src}/${file}`, `${dest}/${file}`);
    }
  }
}

for (const f of platformFeatures) {
  scaffoldFeature(f.pkg, f.id);
  const dest = `packages/${f.pkg}/src`;
  for (const mod of f.modules) {
    const src = `packages/features/platform/src/modules/${mod}`;
    if (!existsSync(join(root, src))) continue;
    if (f.modules.length === 1) {
      for (const layer of ["domain", "application", "infrastructure", "presentation"]) {
        if (existsSync(join(root, `${src}/${layer}`))) {
          gitMv(`${src}/${layer}`, `${dest}/${layer}`);
        }
      }
      for (const file of readdirSync(join(root, src))) {
        const full = join(root, src, file);
        if (statSync(full).isFile()) {
          gitMv(`${src}/${file}`, `${dest}/${file}`);
        }
      }
    } else {
      // multi-module: nest under capability subfolders temporarily then flatten later
      ensureDir(join(root, `${dest}/${mod}`));
      gitMv(src, `${dest}/${mod}`);
    }
  }
  if (f.extra) {
    for (const extra of f.extra) {
      const src = `packages/features/platform/src/${extra}`;
      if (existsSync(join(root, src))) {
        gitMv(src, `${dest}/${extra}`);
      }
    }
  }
}

// Move enums + timestamps helper
ensureDir(join(root, "packages/database-runtime/src/persistence"));
gitMv(
  "packages/database-runtime/src/schema/shared/timestamps.ts",
  "packages/database-runtime/src/persistence/timestamps.ts",
);

// Move schemas into features
function moveSchemas(featurePkg, files, fromDir) {
  const destDir = `packages/${featurePkg}/src/infrastructure/persistence`;
  ensureDir(join(root, destDir));
  for (const file of files) {
    const from = `packages/database-runtime/src/schema/${fromDir}/${file}`;
    if (existsSync(join(root, from))) {
      gitMv(from, `${destDir}/${file}`);
    }
  }
}

for (const f of identityFeatures) {
  moveSchemas(f.pkg, f.schemaFiles, "identity");
}
// identity enums → feature-users (owns user_status) and feature-organizations
if (existsSync(join(root, "packages/database-runtime/src/schema/identity/enums.ts"))) {
  gitMv(
    "packages/database-runtime/src/schema/identity/enums.ts",
    "packages/feature-users/src/infrastructure/persistence/enums.ts",
  );
}

for (const f of platformFeatures) {
  moveSchemas(f.pkg, f.schemaFiles, "platform");
}
if (existsSync(join(root, "packages/database-runtime/src/schema/platform/enums.ts"))) {
  gitMv(
    "packages/database-runtime/src/schema/platform/enums.ts",
    "packages/feature-jobs/src/infrastructure/persistence/platform-enums.ts",
  );
}

// health rename
sh("git mv packages/api-health packages/feature-health");

console.log("=== 5. Move frontend surfaces into apps ===");
// identity admin/web → apps
if (existsSync(join(root, "packages/features/identity/src/admin"))) {
  ensureDir(join(root, "apps/admin/src/features/_plugin-resources"));
  gitMv(
    "packages/features/identity/src/admin",
    "apps/admin/src/features/_plugin-resources/identity-admin",
  );
}
if (existsSync(join(root, "packages/features/identity/src/web"))) {
  ensureDir(join(root, "apps/web/src/features"));
  gitMv(
    "packages/features/identity/src/web",
    "apps/web/src/features/identity-web",
  );
}
if (existsSync(join(root, "packages/features/platform/src/admin"))) {
  gitMv(
    "packages/features/platform/src/admin",
    "apps/admin/src/features/_plugin-resources/platform-admin",
  );
}

// mobile dart packages — relocate without Nest coupling
if (existsSync(join(root, "packages/features/identity/mobile"))) {
  ensureDir(join(root, "packages/feature_identity_mobile"));
  sh("git mv packages/features/identity/mobile/* packages/feature_identity_mobile/ 2>/dev/null || true");
}
if (existsSync(join(root, "packages/features/platform/mobile"))) {
  ensureDir(join(root, "packages/feature_platform_mobile"));
  sh("git mv packages/features/platform/mobile/* packages/feature_platform_mobile/ 2>/dev/null || true");
}

console.log("=== Structural moves done ===");
