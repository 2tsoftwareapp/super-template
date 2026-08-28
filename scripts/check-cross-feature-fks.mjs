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
    sourceTableExport: "organizationMembers",
    physicalColumnName: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
  },
  {
    sourceFile:
      "packages/feature-organizations/src/infrastructure/persistence/organization-members.ts",
    propertyName: "organizationId",
    sourceTableExport: "organizationMembers",
    physicalColumnName: "organization_id",
    targetFile: "packages/feature-organizations/src/infrastructure/persistence/organizations.ts",
    targetTableExport: "organizations",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
  },

  // user_roles
  {
    sourceFile: "packages/feature-access-control/src/infrastructure/persistence/user-roles.ts",
    propertyName: "userId",
    sourceTableExport: "userRoles",
    physicalColumnName: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
  },
  {
    sourceFile: "packages/feature-access-control/src/infrastructure/persistence/user-roles.ts",
    propertyName: "organizationId",
    sourceTableExport: "userRoles",
    physicalColumnName: "organization_id",
    targetFile: "packages/feature-organizations/src/infrastructure/persistence/organizations.ts",
    targetTableExport: "organizations",
    targetPropertyName: "id",
    nullable: true,
    onDelete: "cascade",
  },
  {
    sourceFile: "packages/feature-access-control/src/infrastructure/persistence/user-roles.ts",
    propertyName: "roleId",
    sourceTableExport: "userRoles",
    physicalColumnName: "role_id",
    targetFile: "packages/feature-access-control/src/infrastructure/persistence/access-control.ts",
    targetTableExport: "roles",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
  },

  // access-control
  {
    sourceFile: "packages/feature-access-control/src/infrastructure/persistence/access-control.ts",
    propertyName: "organizationId",
    sourceTableExport: "roles",
    physicalColumnName: "organization_id",
    targetFile: "packages/feature-organizations/src/infrastructure/persistence/organizations.ts",
    targetTableExport: "organizations",
    targetPropertyName: "id",
    nullable: true,
    onDelete: "cascade",
  },
  {
    sourceFile: "packages/feature-access-control/src/infrastructure/persistence/access-control.ts",
    propertyName: "roleId",
    sourceTableExport: "rolePermissions",
    physicalColumnName: "role_id",
    targetFile: "packages/feature-access-control/src/infrastructure/persistence/access-control.ts",
    targetTableExport: "roles",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
  },
  {
    sourceFile: "packages/feature-access-control/src/infrastructure/persistence/access-control.ts",
    propertyName: "permissionId",
    sourceTableExport: "rolePermissions",
    physicalColumnName: "permission_id",
    targetFile: "packages/feature-access-control/src/infrastructure/persistence/access-control.ts",
    targetTableExport: "permissions",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
  },

  // upload
  {
    sourceFile: "packages/feature-upload/src/infrastructure/persistence/files.ts",
    propertyName: "organizationId",
    sourceTableExport: "files",
    physicalColumnName: "organization_id",
    targetFile: "packages/feature-organizations/src/infrastructure/persistence/organizations.ts",
    targetTableExport: "organizations",
    targetPropertyName: "id",
    nullable: true,
    onDelete: "restrict",
  },
  {
    sourceFile: "packages/feature-upload/src/infrastructure/persistence/files.ts",
    propertyName: "uploadedById",
    sourceTableExport: "files",
    physicalColumnName: "uploaded_by_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetPropertyName: "id",
    nullable: true,
    onDelete: "set null",
  },

  // auth
  {
    sourceFile: "packages/feature-auth/src/infrastructure/persistence/auth.ts",
    propertyName: "userId",
    sourceTableExport: "authSessions",
    physicalColumnName: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
  },

  // mfa
  {
    sourceFile: "packages/feature-mfa/src/infrastructure/persistence/two-factor.ts",
    propertyName: "userId",
    sourceTableExport: "userTwoFactorSecrets",
    physicalColumnName: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
  },

  // sso
  {
    sourceFile: "packages/feature-sso/src/infrastructure/persistence/sso.ts",
    propertyName: "userId",
    sourceTableExport: "externalIdentities",
    physicalColumnName: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
  },

  // user-preferences
  {
    sourceFile: "packages/feature-user-preferences/src/infrastructure/persistence/preferences.ts",
    propertyName: "userId",
    sourceTableExport: "userPreferences",
    physicalColumnName: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
  },

  // notifications
  {
    sourceFile: "packages/feature-notifications/src/infrastructure/persistence/notifications.ts",
    propertyName: "userId",
    sourceTableExport: "notifications",
    physicalColumnName: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
  },
  {
    sourceFile: "packages/feature-notifications/src/infrastructure/persistence/notifications.ts",
    propertyName: "organizationId",
    sourceTableExport: "notifications",
    physicalColumnName: "organization_id",
    targetFile: "packages/feature-organizations/src/infrastructure/persistence/organizations.ts",
    targetTableExport: "organizations",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
  },
  {
    sourceFile: "packages/feature-notifications/src/infrastructure/persistence/notifications.ts",
    propertyName: "organizationId",
    sourceTableExport: "notificationJobs",
    physicalColumnName: "organization_id",
    targetFile: "packages/feature-organizations/src/infrastructure/persistence/organizations.ts",
    targetTableExport: "organizations",
    targetPropertyName: "id",
    nullable: true,
    onDelete: "set null",
  },
  {
    sourceFile: "packages/feature-notifications/src/infrastructure/persistence/notifications.ts",
    propertyName: "sourceBackgroundJobId",
    sourceTableExport: "notifications",
    physicalColumnName: "source_background_job_id",
    targetFile: "packages/feature-jobs/src/infrastructure/persistence/jobs.ts",
    targetTableExport: "jobs",
    targetPropertyName: "id",
    nullable: true,
    onDelete: "set null",
  },
  {
    sourceFile: "packages/feature-notifications/src/infrastructure/persistence/notifications.ts",
    propertyName: "actorId",
    sourceTableExport: "notificationJobs",
    physicalColumnName: "actor_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetPropertyName: "id",
    nullable: true,
    onDelete: "set null",
  },
  {
    sourceFile: "packages/feature-notifications/src/infrastructure/persistence/notifications.ts",
    propertyName: "targetUserId",
    sourceTableExport: "notificationJobs",
    physicalColumnName: "target_user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetPropertyName: "id",
    nullable: true,
    onDelete: "set null",
  },
  // additional auth tables
  {
    sourceFile: "packages/feature-auth/src/infrastructure/persistence/auth.ts",
    sourceTableExport: "emailVerificationTokens",
    propertyName: "userId",
    physicalColumnName: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
  },
  {
    sourceFile: "packages/feature-auth/src/infrastructure/persistence/auth.ts",
    sourceTableExport: "passwordResetTokens",
    propertyName: "userId",
    physicalColumnName: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
  },
  // additional MFA tables
  {
    sourceFile: "packages/feature-mfa/src/infrastructure/persistence/two-factor.ts",
    sourceTableExport: "userRecoveryCodes",
    propertyName: "userId",
    physicalColumnName: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
  },
  {
    sourceFile: "packages/feature-mfa/src/infrastructure/persistence/two-factor.ts",
    sourceTableExport: "mfaChallenges",
    propertyName: "userId",
    physicalColumnName: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
  },
  // notification device tokens
  {
    sourceFile: "packages/feature-notifications/src/infrastructure/persistence/notifications.ts",
    sourceTableExport: "notificationDeviceTokens",
    propertyName: "userId",
    physicalColumnName: "user_id",
    targetFile: "packages/feature-users/src/infrastructure/persistence/users.ts",
    targetTableExport: "users",
    targetPropertyName: "id",
    nullable: false,
    onDelete: "cascade",
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
