import path from "node:path";
import { fileURLToPath } from "node:url";

const packagesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

function moduleFile(pkg, id) {
  if (pkg === "feature-user-preferences") return "preferences.module.ts";
  if (pkg === "feature-import-export") return "import-export-feature.module.ts";
  if (pkg === "feature-upload") return "upload.module.ts";
  return `${id}.module.ts`;
}

export function featureAliases() {
  const features = [
    "feature-access-control",
    "feature-activities",
    "feature-audit",
    "feature-audit-export",
    "feature-outbox",
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
  const aliases = [];
  for (const pkg of features) {
    const id = pkg.replace(/^feature-/, "");
    const src = path.join(packagesDir, pkg, "src");
    aliases.push(
      { find: `@repo/${pkg}/contracts`, replacement: path.join(src, "public/contracts.ts") },
      {
        find: `@repo/${pkg}/schema`,
        replacement: path.join(src, "infrastructure/persistence/index.ts"),
      },
      { find: `@repo/${pkg}/module`, replacement: path.join(src, moduleFile(pkg, id)) },
      { find: `@repo/${pkg}/testing`, replacement: path.join(src, "testing/index.ts") },
      { find: `@repo/${pkg}`, replacement: path.join(src, `${id}.feature.ts`) },
    );
  }
  aliases.push(
    { find: "@repo/api-runtime", replacement: path.join(packagesDir, "api-runtime/src/index.ts") },
    { find: "@repo/api-kernel", replacement: path.join(packagesDir, "api-kernel/src/index.ts") },
    {
      find: "@repo/api-plugin-kit",
      replacement: path.join(packagesDir, "api-plugin-kit/src/index.ts"),
    },
    {
      find: "@repo/database-runtime",
      replacement: path.join(packagesDir, "database-runtime/src/index.ts"),
    },
    {
      find: "@repo/observability",
      replacement: path.join(packagesDir, "observability/src/index.ts"),
    },
  );
  return aliases;
}
