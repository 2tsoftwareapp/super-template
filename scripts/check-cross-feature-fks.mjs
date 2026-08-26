#!/usr/bin/env node
/**
 * Ensures critical cross-feature FK columns keep a `.references(` in owning schemas.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const required = [
  ["packages/feature-users/src/infrastructure/persistence/organization-members.ts", ["userId", "organizationId"]],
  ["packages/feature-users/src/infrastructure/persistence/user-roles.ts", ["userId", "roleId"]],
  ["packages/feature-upload/src/infrastructure/persistence/files.ts", ["organizationId", "uploadedById"]],
  ["packages/feature-auth/src/infrastructure/persistence/auth.ts", ["userId"]],
  ["packages/feature-user-preferences/src/infrastructure/persistence/preferences.ts", ["userId"]],
];

let failed = false;
for (const [file, columns] of required) {
  const text = readFileSync(resolve(file), "utf8");
  const refs = (text.match(/\.references\(/g) || []).length;
  if (refs < columns.length) {
    console.error(`FK guard failed: ${file} expected >= ${columns.length} .references(, found ${refs}`);
    failed = true;
  }
}
if (failed) process.exit(1);
console.log("Cross-feature FK guard passed.");
