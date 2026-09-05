import path from "node:path";
import { fileURLToPath } from "node:url";

// Single source of truth for vitest aliases across the monorepo. The shared
// implementation is imported by every package's vitest.config.ts. Anchored
// regex `find` values are required: vite treats string finds as prefix matches
// and would mangle subpath imports like @repo/database-runtime/schema/timestamps.

// Per-package subpath mappings, mirroring each package's `exports` map.
// Keep this list narrow: only subpaths that are actually consumed by
// vitest-loaded source. Bare specifiers are handled by pnpm symlinks.
const subpathExports = {
  "feature-access-control": {
    contracts: "public/contracts.ts",
    tokens: "public/tokens.ts",
    testing: "testing/index.ts",
    schema: "infrastructure/persistence/index.ts",
    module: "access-control.module.ts",
  },
  "feature-activities": {
    contracts: "public/contracts.ts",
    testing: "testing/index.ts",
    schema: "infrastructure/persistence/index.ts",
  },
  "feature-audit": {
    contracts: "public/contracts.ts",
    testing: "testing/index.ts",
    schema: "infrastructure/persistence/index.ts",
  },
  "feature-audit-export": {
    contracts: "public/contracts.ts",
    module: "audit-export.module.ts",
    testing: "testing/index.ts",
  },
  "feature-auth": {
    contracts: "public/contracts.ts",
    testing: "testing/index.ts",
    schema: "infrastructure/persistence/index.ts",
    module: "auth.module.ts",
  },
  "feature-health": {
    contracts: "public/contracts.ts",
    testing: "testing/index.ts",
  },
  "feature-import-export": {
    contracts: "public/contracts.ts",
    testing: "testing/index.ts",
    schema: "infrastructure/persistence/index.ts",
    module: "import-export-feature.module.ts",
  },
  "feature-jobs": {
    contracts: "public/contracts.ts",
    testing: "testing/index.ts",
    schema: "infrastructure/persistence/index.ts",
  },
  "feature-mail": {
    contracts: "public/contracts.ts",
    testing: "testing/index.ts",
    schema: "infrastructure/persistence/index.ts",
  },
  "feature-mfa": {
    contracts: "public/contracts.ts",
    testing: "testing/index.ts",
    schema: "infrastructure/persistence/index.ts",
  },
  "feature-notifications": {
    contracts: "public/contracts.ts",
    testing: "testing/index.ts",
    schema: "infrastructure/persistence/index.ts",
  },
  "feature-organizations": {
    contracts: "public/contracts.ts",
    testing: "testing/index.ts",
    schema: "infrastructure/persistence/index.ts",
    module: "organizations.module.ts",
  },
  "feature-outbox": {
    contracts: "public/contracts.ts",
    module: "outbox.module.ts",
    schema: "infrastructure/persistence/outbox-messages.ts",
    testing: "testing/index.ts",
  },
  "feature-settings": {
    contracts: "public/contracts.ts",
    testing: "testing/index.ts",
  },
  "feature-sso": {
    contracts: "public/contracts.ts",
    testing: "testing/index.ts",
    schema: "infrastructure/persistence/index.ts",
  },
  "feature-upload": {
    contracts: "public/contracts.ts",
    testing: "testing/index.ts",
    schema: "infrastructure/persistence/index.ts",
    module: "upload.module.ts",
  },
  "feature-user-preferences": {
    contracts: "public/contracts.ts",
    testing: "testing/index.ts",
    schema: "infrastructure/persistence/index.ts",
    module: "preferences.module.ts",
  },
  "feature-users": {
    contracts: "public/contracts.ts",
    testing: "testing/index.ts",
    schema: "infrastructure/persistence/index.ts",
    module: "users.module.ts",
  },
  "feature-user-management": {
    module: "user-management.module.ts",
  },
  "feature-organization-management": {
    contracts: "public/contracts.ts",
    module: "organization-management.module.ts",
  },
};

const sharedSubpathExports = {
  "database-runtime": {
    schema: "schema.ts",
    "schema/timestamps": "persistence/timestamps.ts",
  },
};

function featureEntry(pkg) {
  const id = pkg.replace(/^feature-/, "");
  if (pkg === "feature-audit-export") return "index.ts";
  if (pkg === "feature-outbox") return "index.ts";
  if (pkg === "feature-user-preferences") return "user-preferences.feature.ts";
  if (pkg === "feature-import-export") return "import-export.feature.ts";
  if (pkg === "feature-user-management") return "user-management.feature.ts";
  if (pkg === "feature-organization-management") return "organization-management.feature.ts";
  return `${id}.feature.ts`;
}

export function buildFeatureAliases(packagesDir) {
  const aliases = [];

  for (const pkg of Object.keys(subpathExports)) {
    const src = path.join(packagesDir, pkg, "src");
    const entry = featureEntry(pkg);
    for (const [sub, rel] of Object.entries(subpathExports[pkg])) {
      aliases.push({
        find: new RegExp(`^@repo/${pkg}/${sub}$`),
        replacement: path.join(src, rel),
      });
    }
    aliases.push({
      find: new RegExp(`^@repo/${pkg}$`),
      replacement: path.join(src, entry),
    });
  }

  for (const [pkg, subpaths] of Object.entries(sharedSubpathExports)) {
    const src = path.join(packagesDir, pkg, "src");
    for (const [sub, rel] of Object.entries(subpaths)) {
      aliases.push({
        find: new RegExp(`^@repo/${pkg}/${sub}$`),
        replacement: path.join(src, rel),
      });
    }
    aliases.push({
      find: new RegExp(`^@repo/${pkg}$`),
      replacement: path.join(src, "index.ts"),
    });
  }

  return aliases;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const defaultPackagesDir = path.resolve(here, "..", "..");

export const featureAliases = () => buildFeatureAliases(defaultPackagesDir);
