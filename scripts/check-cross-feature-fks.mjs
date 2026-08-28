#!/usr/bin/env node
/**
 * Cross-feature foreign-key structural guard.
 *
 * For every protected cross-feature column we verify, in the owning schema
 * file, that the Drizzle declaration is *exactly* the expected one:
 *
 *   - Drizzle property name.
 *   - Physical column name.
 *   - Presence of `.references(() => targetExport.targetProperty, { onDelete })`.
 *   - Referenced table is imported from the expected target file.
 *   - Required nullability (presence of .notNull() or .primaryKey()).
 *   - Exact onDelete action.
 *   - Exact number of column declarations matching the spec.
 *
 * The TypeScript feature schema is the canonical source of truth for future
 * Drizzle generation. Bare `uuid("...").notNull()` declarations without a
 * `.references()` chain are rejected.
 *
 * The validation logic is exposed as a pure function in
 * `scripts/lib/cross-feature-fk-validator.mjs` so that regression tests can
 * exercise it against synthetic source text without mutating tracked files.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildImportResolver, validateForeignKeys } from "./lib/cross-feature-fk-validator.mjs";

const repoRoot = process.cwd();

/** @type {import("./lib/cross-feature-fk-validator.mjs").FkCheck[]} */
const checks = [
  // organization_members
  {
    sourceFile:
      "packages/feature-organizations/src/infrastructure/persistence/organization-members.ts",
    propertyName: "userId",
    physicalColumn: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetProperty: "id",
    nullable: false,
    onDelete: "cascade",
  },
  {
    sourceFile:
      "packages/feature-organizations/src/infrastructure/persistence/organization-members.ts",
    propertyName: "organizationId",
    physicalColumn: "organization_id",
    targetFile: "packages/feature-organizations/src/infrastructure/persistence/organizations.ts",
    targetTableExport: "organizations",
    targetProperty: "id",
    nullable: false,
    onDelete: "cascade",
  },

  // user_roles
  {
    sourceFile: "packages/feature-access-control/src/infrastructure/persistence/user-roles.ts",
    propertyName: "userId",
    physicalColumn: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetProperty: "id",
    nullable: false,
    onDelete: "cascade",
  },
  {
    sourceFile: "packages/feature-access-control/src/infrastructure/persistence/user-roles.ts",
    propertyName: "organizationId",
    physicalColumn: "organization_id",
    targetFile: "packages/feature-organizations/src/infrastructure/persistence/organizations.ts",
    targetTableExport: "organizations",
    targetProperty: "id",
    nullable: true,
    onDelete: "cascade",
  },
  {
    sourceFile: "packages/feature-access-control/src/infrastructure/persistence/user-roles.ts",
    propertyName: "roleId",
    physicalColumn: "role_id",
    targetFile: "packages/feature-access-control/src/infrastructure/persistence/access-control.ts",
    targetTableExport: "roles",
    targetProperty: "id",
    nullable: false,
    onDelete: "cascade",
  },

  // access-control
  {
    sourceFile: "packages/feature-access-control/src/infrastructure/persistence/access-control.ts",
    propertyName: "organizationId",
    physicalColumn: "organization_id",
    targetFile: "packages/feature-organizations/src/infrastructure/persistence/organizations.ts",
    targetTableExport: "organizations",
    targetProperty: "id",
    nullable: true,
    onDelete: "cascade",
  },
  {
    sourceFile: "packages/feature-access-control/src/infrastructure/persistence/access-control.ts",
    propertyName: "roleId",
    physicalColumn: "role_id",
    targetFile: "packages/feature-access-control/src/infrastructure/persistence/access-control.ts",
    targetTableExport: "roles",
    targetProperty: "id",
    nullable: false,
    onDelete: "cascade",
  },
  {
    sourceFile: "packages/feature-access-control/src/infrastructure/persistence/access-control.ts",
    propertyName: "permissionId",
    physicalColumn: "permission_id",
    targetFile: "packages/feature-access-control/src/infrastructure/persistence/access-control.ts",
    targetTableExport: "permissions",
    targetProperty: "id",
    nullable: false,
    onDelete: "cascade",
  },

  // upload
  {
    sourceFile: "packages/feature-upload/src/infrastructure/persistence/files.ts",
    propertyName: "organizationId",
    physicalColumn: "organization_id",
    targetFile: "packages/feature-organizations/src/infrastructure/persistence/organizations.ts",
    targetTableExport: "organizations",
    targetProperty: "id",
    nullable: true,
    onDelete: "restrict",
  },
  {
    sourceFile: "packages/feature-upload/src/infrastructure/persistence/files.ts",
    propertyName: "uploadedById",
    physicalColumn: "uploaded_by_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetProperty: "id",
    nullable: true,
    onDelete: "set null",
  },

  // auth
  {
    sourceFile: "packages/feature-auth/src/infrastructure/persistence/auth.ts",
    propertyName: "userId",
    physicalColumn: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetProperty: "id",
    nullable: false,
    onDelete: "cascade",
  },

  // mfa
  {
    sourceFile: "packages/feature-mfa/src/infrastructure/persistence/two-factor.ts",
    propertyName: "userId",
    physicalColumn: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetProperty: "id",
    nullable: false,
    onDelete: "cascade",
  },

  // sso
  {
    sourceFile: "packages/feature-sso/src/infrastructure/persistence/sso.ts",
    propertyName: "userId",
    physicalColumn: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetProperty: "id",
    nullable: false,
    onDelete: "cascade",
  },

  // user-preferences
  {
    sourceFile: "packages/feature-user-preferences/src/infrastructure/persistence/preferences.ts",
    propertyName: "userId",
    physicalColumn: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetProperty: "id",
    nullable: false,
    onDelete: "cascade",
  },

  // notifications
  {
    sourceFile: "packages/feature-notifications/src/infrastructure/persistence/notifications.ts",
    propertyName: "userId",
    physicalColumn: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetProperty: "id",
    nullable: false,
    onDelete: "cascade",
  },
  {
    sourceFile: "packages/feature-notifications/src/infrastructure/persistence/notifications.ts",
    propertyName: "organizationId",
    physicalColumn: "organization_id",
    targetFile: "packages/feature-organizations/src/infrastructure/persistence/organizations.ts",
    targetTableExport: "organizations",
    targetProperty: "id",
    nullable: false,
    onDelete: "cascade",
  },
  {
    sourceFile: "packages/feature-notifications/src/infrastructure/persistence/notifications.ts",
    propertyName: "organizationId",
    physicalColumn: "organization_id",
    targetFile: "packages/feature-organizations/src/infrastructure/persistence/organizations.ts",
    targetTableExport: "organizations",
    targetProperty: "id",
    nullable: true,
    onDelete: "set null",
  },
  {
    sourceFile: "packages/feature-notifications/src/infrastructure/persistence/notifications.ts",
    propertyName: "sourceBackgroundJobId",
    physicalColumn: "source_background_job_id",
    targetFile: "packages/feature-jobs/src/infrastructure/persistence/jobs.ts",
    targetTableExport: "jobs",
    targetProperty: "id",
    nullable: true,
    onDelete: "set null",
  },
  {
    sourceFile: "packages/feature-notifications/src/infrastructure/persistence/notifications.ts",
    propertyName: "actorId",
    physicalColumn: "actor_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetProperty: "id",
    nullable: true,
    onDelete: "set null",
  },
  {
    sourceFile: "packages/feature-notifications/src/infrastructure/persistence/notifications.ts",
    propertyName: "targetUserId",
    physicalColumn: "target_user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetProperty: "id",
    nullable: true,
    onDelete: "set null",
  },
];

/** @type {Map<string, { text: string, resolver: (n: string) => string | undefined }>} */
const cache = new Map();
const loadFile = (rel) => {
  const abs = resolve(repoRoot, rel);
  if (!cache.has(abs)) {
    const text = readFileSync(abs, "utf8");
    cache.set(abs, { text, resolver: buildImportResolver(abs, text) });
  }
  return cache.get(abs);
};

/** @type {Map<string, FkCheck[]>} */
const checksByFile = new Map();
for (const check of checks) {
  const list = checksByFile.get(check.sourceFile) ?? [];
  list.push(check);
  checksByFile.set(check.sourceFile, list);
}

let failed = false;
for (const [sourceFile, fileChecks] of checksByFile) {
  const file = loadFile(sourceFile);
  const failures = validateForeignKeys(sourceFile, file.text, fileChecks, file.resolver);
  for (const failure of failures) {
    console.error(`FK guard failed: ${failure.reason}`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}
console.log("Cross-feature FK guard passed.");
