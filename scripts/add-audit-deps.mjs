#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const featuresNeedingAudit = [
  "feature-access-control",
  "feature-auth",
  "feature-import-export",
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

for (const dir of featuresNeedingAudit) {
  const pkgPath = resolve("packages", dir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

  if (pkg.dependencies && !pkg.dependencies["@repo/feature-audit"]) {
    pkg.dependencies["@repo/feature-audit"] = "workspace:*";
    // Sort dependencies for consistency
    const sorted = Object.fromEntries(
      Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b))
    );
    pkg.dependencies = sorted;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    console.log(`Added @repo/feature-audit to ${dir}`);
  } else {
    console.log(`Already has @repo/feature-audit: ${dir}`);
  }
}
