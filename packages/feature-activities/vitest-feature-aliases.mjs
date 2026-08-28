import path from "node:path";
import { fileURLToPath } from "node:url";

// This file lives in packages/<feature>/ so packages root is one level up.
const packagesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
  },
  "feature-users": {
    contracts: "public/contracts.ts",
    testing: "testing/index.ts",
    schema: "infrastructure/persistence/index.ts",
    module: "users.module.ts",
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
  return `${id}.feature.ts`;
}

export function featureAliases() {
  const features = Object.keys(subpathExports);
  const aliases = [];

  for (const pkg of features) {
    const src = path.join(packagesDir, pkg, "src");
    const entry = featureEntry(pkg);
    // Subpath aliases (regex-anchored) must come BEFORE the bare-specifier
    // alias so the more specific regex wins. Vite resolves aliases by first
    // match; an unanchored string find would treat "@repo/<pkg>/foo" as a
    // prefix and append "/foo" to the bare replacement.
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
