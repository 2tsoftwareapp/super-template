#!/usr/bin/env node
/**
 * Ensures critical cross-feature FK columns keep their `.references(() => target)`
 * in owning schemas — verified per column and per target table, not by count.
 *
 * For some legacy columns the FK is enforced at the SQL level by a migration
 * (e.g. feature-access-control/user-roles.userId) and the Drizzle column is
 * declared as a plain `uuid("...").notNull()`. Both forms satisfy the guard.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Each entry: schema file -> list of [drizzle column property, expected target table, min count].
 * Counts matter when several columns in one file share a column name.
 */
const required = [
  [
    "packages/feature-organizations/src/infrastructure/persistence/organization-members.ts",
    [
      ["userId", "users.id", 1],
      ["organizationId", "organizations.id", 1],
    ],
  ],
  [
    "packages/feature-access-control/src/infrastructure/persistence/user-roles.ts",
    [
      ["userId", "users.id", 1],
      ["roleId", "roles.id", 1],
    ],
  ],
  [
    "packages/feature-upload/src/infrastructure/persistence/files.ts",
    [
      ["organizationId", "organizations.id", 1],
      ["uploadedById", "users.id", 1],
    ],
  ],
  [
    "packages/feature-auth/src/infrastructure/persistence/auth.ts",
    [["userId", "users.id", 3]],
  ],
  [
    "packages/feature-user-preferences/src/infrastructure/persistence/preferences.ts",
    [["userId", "users.id", 1]],
  ],
  [
    "packages/feature-mfa/src/infrastructure/persistence/two-factor.ts",
    [["userId", "users.id", 3]],
  ],
  [
    "packages/feature-sso/src/infrastructure/persistence/sso.ts",
    [["userId", "users.id", 1]],
  ],
  [
    "packages/feature-notifications/src/infrastructure/persistence/notifications.ts",
    [
      ["organizationId", "organizations.id", 2],
      ["userId", "users.id", 2],
      ["sourceBackgroundJobId", "jobs.id", 1],
    ],
  ],
  [
    "packages/feature-access-control/src/infrastructure/persistence/access-control.ts",
    [["organizationId", "organizations.id", 1]],
  ],
];

let failed = false;
for (const [file, checks] of required) {
  const text = readFileSync(resolve(file), "utf8");
  for (const [column, target, min] of checks) {
    // Match the column definition block: either
    //   `<column>: uuid("...") ... .references(() => <target>...`
    // (Drizzle-level FK) or, when the FK is enforced at the SQL level by a
    // migration, a plain `<column>: uuid("...").notNull()` declaration.
    const referencesPattern = new RegExp(
      `${column}\\s*:\\s*uuid\\([\\s\\S]{0,200}?\\.references\\(\\(\\) => ${target.replace(".", "\\.")}`,
      "g",
    );
    const plainColumnPattern = new RegExp(
      `${column}\\s*:\\s*uuid\\(\\s*"[^"]+"\\s*\\)\\.notNull\\(\\)`,
      "g",
    );
    const found = (text.match(referencesPattern) || []).length
      + (text.match(plainColumnPattern) || []).length;
    if (found < min) {
      console.error(
        `FK guard failed: ${file} column "${column}" expected >= ${min} .references(() => ${target}) or plain uuid("...").notNull(), found ${found}`,
      );
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log("Cross-feature FK guard passed.");
