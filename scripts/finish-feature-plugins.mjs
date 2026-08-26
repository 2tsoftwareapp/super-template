#!/usr/bin/env node
/**
 * Finish Clean Architecture feature plugins: feature manifests, schema indexes,
 * contracts, cross-package imports, and composition modules.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const write = (rel, content) => {
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content.endsWith("\n") ? content : `${content}\n`);
  console.log("write", rel);
};
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));
const rewrite = (rel, fn) => {
  if (!exists(rel)) {
    console.warn("missing", rel);
    return;
  }
  const before = read(rel);
  const after = fn(before);
  if (after !== before) {
    write(rel, after);
  }
};

// --- Enum ownership ---
write(
  "packages/feature-jobs/src/infrastructure/persistence/enums.ts",
  `import { pgEnum } from "drizzle-orm/pg-core";

export const jobStatusEnum = pgEnum("job_status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
  "BLOCKED",
]);
`,
);

write(
  "packages/feature-mail/src/infrastructure/persistence/enums.ts",
  `import { pgEnum } from "drizzle-orm/pg-core";

export const mailDeliveryStatusEnum = pgEnum("mail_delivery_status", [
  "PENDING",
  "PROCESSING",
  "PROVIDER_ACCEPTED",
  "SENT",
  "FAILED",
]);
`,
);

write(
  "packages/feature-notifications/src/infrastructure/persistence/enums.ts",
  `import { pgEnum } from "drizzle-orm/pg-core";

export const notificationDevicePlatformEnum = pgEnum("notification_device_platform", [
  "IOS",
  "ANDROID",
]);

export const notificationAudienceEnum = pgEnum("notification_audience", ["USER", "USERS", "ALL"]);

export const notificationJobStatusEnum = pgEnum("notification_job_status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "CANCELLED",
  "FAILED",
]);

export const notificationDeliveryStatusEnum = pgEnum("notification_delivery_status", [
  "PENDING",
  "PROCESSING",
  "SENT",
  "FAILED",
]);
`,
);

write(
  "packages/feature-activities/src/infrastructure/persistence/enums.ts",
  `import { pgEnum } from "drizzle-orm/pg-core";

export const activityVisibilityEnum = pgEnum("activity_visibility", [
  "PUBLIC",
  "PRIVATE",
  "INTERNAL",
]);
`,
);

write(
  "packages/feature-import-export/src/infrastructure/persistence/enums.ts",
  `import { pgEnum } from "drizzle-orm/pg-core";

export const importExportJobStatusEnum = pgEnum("import_export_job_status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);
`,
);

write(
  "packages/feature-organizations/src/infrastructure/persistence/enums.ts",
  `import { pgEnum } from "drizzle-orm/pg-core";

export const organizationMemberRoleEnum = pgEnum("organization_member_role", [
  "OWNER",
  "ADMIN",
  "MEMBER",
]);
`,
);

write(
  "packages/feature-users/src/infrastructure/persistence/enums.ts",
  `import { pgEnum } from "drizzle-orm/pg-core";

export const userStatusEnum = pgEnum("user_status", ["PENDING", "ACTIVE", "BLOCKED"]);
`,
);

// Remove shared platform-enums once split
const platformEnums = "packages/feature-jobs/src/infrastructure/persistence/platform-enums.ts";
if (exists(platformEnums)) {
  fs.unlinkSync(path.join(root, platformEnums));
  console.log("rm", platformEnums);
}

// --- Schema FK / enum import fixes ---
const schemaFixes = [
  [
    "packages/feature-auth/src/infrastructure/persistence/auth.ts",
    (s) =>
      s
        .replace(
          /import \{ users \} from "\.\/users";/,
          'import { users } from "@repo/feature-users/schema";',
        )
        .replace(
          /import \{ users \} from "@repo\/feature-users\/schema";\nimport \{ users \} from "@repo\/feature-users\/schema";/,
          'import { users } from "@repo/feature-users/schema";',
        ),
  ],
  [
    "packages/feature-mfa/src/infrastructure/persistence/two-factor.ts",
    (s) =>
      s.replace(
        /import \{ users \} from "\.\/users";/,
        'import { users } from "@repo/feature-users/schema";',
      ),
  ],
  [
    "packages/feature-sso/src/infrastructure/persistence/sso.ts",
    (s) =>
      s.replace(
        /import \{ users \} from "\.\/users";/,
        'import { users } from "@repo/feature-users/schema";',
      ),
  ],
  [
    "packages/feature-user-preferences/src/infrastructure/persistence/preferences.ts",
    (s) =>
      s.replace(
        /import \{ users \} from "\.\/users";/,
        'import { users } from "@repo/feature-users/schema";',
      ),
  ],
  [
    "packages/feature-organizations/src/infrastructure/persistence/organizations.ts",
    (s) =>
      s
        .replace(
          /import \{ organizationMemberRoleEnum \} from "\.\/enums";/,
          'import { organizationMemberRoleEnum } from "./enums";',
        )
        .replace(
          /import \{ users \} from "\.\/users";/,
          'import { users } from "@repo/feature-users/schema";',
        ),
  ],
  [
    "packages/feature-access-control/src/infrastructure/persistence/access-control.ts",
    (s) =>
      s
        .replace(
          /import \{ organizations \} from "\.\/organizations";/,
          'import { organizations } from "@repo/feature-organizations/schema";',
        )
        .replace(
          /import \{ users \} from "\.\/users";/,
          'import { users } from "@repo/feature-users/schema";',
        ),
  ],
  [
    "packages/feature-mail/src/infrastructure/persistence/mail.ts",
    (s) =>
      s.replace(
        /import \{ jobs \} from "\.\/jobs";/,
        'import { jobs } from "@repo/feature-jobs/schema";',
      ),
  ],
  [
    "packages/feature-notifications/src/infrastructure/persistence/notifications.ts",
    (s) =>
      s.replace(
        /import \{ jobs \} from "\.\/jobs";/,
        'import { jobs } from "@repo/feature-jobs/schema";',
      ),
  ],
  [
    "packages/feature-import-export/src/infrastructure/persistence/import-export.ts",
    (s) =>
      s.replace(
        /import \{ files \} from "\.\/files";/,
        'import { files } from "@repo/feature-upload/schema";',
      ),
  ],
];

for (const [rel, fn] of schemaFixes) {
  rewrite(rel, fn);
}

// Point any leftover platform-enums imports at local enums after the split.
for (const rel of [
  "packages/feature-jobs/src/infrastructure/persistence/jobs.ts",
  "packages/feature-jobs/src/infrastructure/persistence/job-attempts.ts",
  "packages/feature-jobs/src/infrastructure/persistence/job-dependencies.ts",
  "packages/feature-jobs/src/infrastructure/persistence/job-events.ts",
]) {
  rewrite(rel, (s) => s.replace(/from "\.\/platform-enums"/g, 'from "./enums"'));
}

// Same-package table refs must be relative (never @repo/feature-X/schema).
rewrite("packages/feature-jobs/src/infrastructure/persistence/job-attempts.ts", (s) =>
  s.replace(/import \{ jobs \} from "@repo\/feature-jobs\/schema";/, 'import { jobs } from "./jobs";'),
);
rewrite("packages/feature-jobs/src/infrastructure/persistence/job-dependencies.ts", (s) =>
  s.replace(/import \{ jobs \} from "@repo\/feature-jobs\/schema";/, 'import { jobs } from "./jobs";'),
);
rewrite("packages/feature-jobs/src/infrastructure/persistence/job-events.ts", (s) =>
  s.replace(/import \{ jobs \} from "@repo\/feature-jobs\/schema";/, 'import { jobs } from "./jobs";'),
);
rewrite("packages/feature-upload/src/infrastructure/persistence/attachments.ts", (s) =>
  s.replace(/import \{ files \} from "@repo\/feature-upload\/schema";/, 'import { files } from "./files";'),
);
rewrite("packages/feature-upload/src/infrastructure/persistence/file-versions.ts", (s) =>
  s.replace(/import \{ files \} from "@repo\/feature-upload\/schema";/, 'import { files } from "./files";'),
);

// --- Persistence index files ---
const schemaExports = {
  auth: `export { authSessions, emailVerificationTokens, passwordResetTokens } from "./auth";
export { outboxMessages } from "./outbox-messages";
`,
  users: `export { userStatusEnum } from "./enums";
export { users } from "./users";
`,
  organizations: `export { organizationMemberRoleEnum } from "./enums";
export { organizationMembers, organizations } from "./organizations";
`,
  "access-control": `export { permissions, rolePermissions, roles, userRoles } from "./access-control";
`,
  mfa: `export { mfaChallenges, userRecoveryCodes, userTwoFactorSecrets } from "./two-factor";
`,
  sso: `export { externalIdentities, ssoLoginStates, ssoSessionExchanges } from "./sso";
`,
  "user-preferences": `export { userPreferences } from "./preferences";
`,
  upload: `export { attachments } from "./attachments";
export { fileBatchOperations } from "./file-batch-operations";
export { fileVersions } from "./file-versions";
export { files } from "./files";
export { storageDeleteOutbox, storageObjects } from "./storage-objects";
`,
  jobs: `export { jobStatusEnum } from "./enums";
export { jobAttempts } from "./job-attempts";
export { jobDependencies } from "./job-dependencies";
export { jobEvents } from "./job-events";
export { jobs } from "./jobs";
`,
  mail: `export { mailDeliveryStatusEnum } from "./enums";
export { mailDeliveries } from "./mail";
`,
  notifications: `export {
  notificationAudienceEnum,
  notificationDeliveryStatusEnum,
  notificationDevicePlatformEnum,
  notificationJobStatusEnum,
} from "./enums";
export {
  notificationDeliveries,
  notificationDeviceTokens,
  notificationJobs,
  notifications,
} from "./notifications";
`,
  audit: `export { auditLogs } from "./audit";
`,
  settings: `export { applicationSettings } from "./settings";
`,
  "import-export": `export { importExportJobStatusEnum } from "./enums";
export { exportJobs, importJobs } from "./import-export";
`,
  activities: `export { activityVisibilityEnum } from "./enums";
export { activities } from "./activities";
`,
};

for (const [id, content] of Object.entries(schemaExports)) {
  write(`packages/feature-${id}/src/infrastructure/persistence/index.ts`, content);
}

// --- Contracts ---
write(
  "packages/feature-auth/src/public/contracts.ts",
  `export { hashPassword, verifyPassword, verifyPasswordWithTimingPadding } from "../application/auth.helpers";
export { AuthService } from "../application/auth.service";
export { AUTH_SESSION_REPOSITORY } from "../application/ports/auth-session.repository.port";
export type * from "../application/ports/auth-session.repository.port";
export { AUTH_TOKEN_PROVIDER } from "../application/ports/auth-token.provider.port";
export type * from "../application/ports/auth-token.provider.port";
export { OUTBOX_REPOSITORY } from "../application/ports/outbox.repository.port";
export type * from "../application/ports/outbox.repository.port";
export { IssueSessionUseCase } from "../application/use-cases/issue-session.use-case";
export { AuthDataModule } from "../auth-data.module";
export { AuthModule } from "../auth.module";
`,
);

write(
  "packages/feature-users/src/public/contracts.ts",
  `export { USERS_REPOSITORY } from "../application/ports/users.repository.port";
export type * from "../application/ports/users.repository.port";
export { UsersModule } from "../users.module";
`,
);

write(
  "packages/feature-organizations/src/public/contracts.ts",
  `export { OrganizationsService } from "../application/organizations.service";
export { ORGANIZATIONS_REPOSITORY } from "../application/ports/organizations.repository.port";
export type * from "../application/ports/organizations.repository.port";
export { OrganizationsModule } from "../organizations.module";
`,
);

write(
  "packages/feature-access-control/src/public/contracts.ts",
  `export { AccessControlModule } from "../access-control.module";
export { AccessControlService } from "../application/access-control.service";
export { ACCESS_CONTROL_REPOSITORY } from "../application/ports/access-control.repository.port";
export type * from "../application/ports/access-control.repository.port";
`,
);

write(
  "packages/feature-mfa/src/public/contracts.ts",
  `export { MfaService } from "../application/mfa.service";
export { MFA_REPOSITORY } from "../application/ports/mfa.repository.port";
export type * from "../application/ports/mfa.repository.port";
export { decryptTotpSecret, encryptTotpSecret } from "../domain/totp-encryption";
export { MfaModule } from "../mfa.module";
`,
);

write(
  "packages/feature-sso/src/public/contracts.ts",
  `export { SSO_REPOSITORY } from "../application/ports/sso.repository.port";
export type * from "../application/ports/sso.repository.port";
export { SsoModule } from "../sso.module";
`,
);

write(
  "packages/feature-user-preferences/src/public/contracts.ts",
  `export { PREFERENCES_REPOSITORY } from "../application/ports/preferences.repository.port";
export type * from "../application/ports/preferences.repository.port";
export { PreferencesModule as UserPreferencesModule } from "../preferences.module";
export { PreferencesModule } from "../preferences.module";
`,
);

write(
  "packages/feature-upload/src/public/contracts.ts",
  `export { FILES_REPOSITORY } from "../files/files/application/ports/files.repository.port";
export type * from "../files/files/application/ports/files.repository.port";
export { FilesModule } from "../files/files/files.module";
export { StorageModule } from "../storage/storage/storage.module";
export { AttachmentsModule } from "../attachments/attachments/attachments.module";
export { UploadModule } from "../upload.module";
`,
);

write(
  "packages/feature-jobs/src/public/contracts.ts",
  `export { JOBS_REPOSITORY } from "../application/ports/jobs.repository.port";
export type * from "../application/ports/jobs.repository.port";
export { JobsModule } from "../jobs.module";
`,
);

write(
  "packages/feature-mail/src/public/contracts.ts",
  `export { MailModule } from "../mail.module";
`,
);

write(
  "packages/feature-notifications/src/public/contracts.ts",
  `export { NotificationsModule } from "../notifications.module";
`,
);

write(
  "packages/feature-audit/src/public/contracts.ts",
  `export { AuditModule } from "../audit.module";
`,
);

write(
  "packages/feature-settings/src/public/contracts.ts",
  `export { SettingsModule } from "../settings.module";
`,
);

write(
  "packages/feature-import-export/src/public/contracts.ts",
  `export { ImportExportFeatureModule } from "../import-export.module";
export { ImportsModule } from "../imports/imports/imports.module";
export { ExportsModule } from "../exports/exports/exports.module";
`,
);

write(
  "packages/feature-activities/src/public/contracts.ts",
  `export { ActivitiesModule } from "../activities.module";
`,
);

write(
  "packages/feature-health/src/public/contracts.ts",
  `export { HealthModule } from "../health.module";
export { HealthWarningsService } from "../application/health-warnings.service";
`,
);

// Ensure testing stubs
for (const id of Object.keys(schemaExports).concat(["health"])) {
  const rel = `packages/feature-${id}/src/testing/index.ts`;
  if (!exists(rel)) {
    write(rel, `/** Testing helpers for @repo/feature-${id}. */\nexport {};\n`);
  }
}

// --- Feature manifests ---
const manifests = {
  auth: {
    id: "auth",
    dependsOn: [],
    module: "AuthModule",
    modulePath: "./auth.module",
    schema: `{
    authSessions,
    emailVerificationTokens,
    passwordResetTokens,
    outboxMessages,
  }`,
    schemaImports: `import {
  authSessions,
  emailVerificationTokens,
  outboxMessages,
  passwordResetTokens,
} from "./infrastructure/persistence";`,
  },
  users: {
    id: "users",
    dependsOn: ["auth", "access-control", "organizations"],
    module: "UsersModule",
    modulePath: "./users.module",
    schema: `{ users, userStatusEnum }`,
    schemaImports: `import { userStatusEnum, users } from "./infrastructure/persistence";`,
  },
  organizations: {
    id: "organizations",
    dependsOn: ["access-control"],
    module: "OrganizationsModule",
    modulePath: "./organizations.module",
    schema: `{ organizations, organizationMembers, organizationMemberRoleEnum }`,
    schemaImports: `import {
  organizationMemberRoleEnum,
  organizationMembers,
  organizations,
} from "./infrastructure/persistence";`,
  },
  "access-control": {
    id: "access-control",
    dependsOn: [],
    module: "AccessControlModule",
    modulePath: "./access-control.module",
    schema: `{ roles, permissions, userRoles, rolePermissions }`,
    schemaImports: `import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from "./infrastructure/persistence";`,
  },
  mfa: {
    id: "mfa",
    dependsOn: ["auth"],
    module: "MfaModule",
    modulePath: "./mfa.module",
    schema: `{ userTwoFactorSecrets, userRecoveryCodes, mfaChallenges }`,
    schemaImports: `import {
  mfaChallenges,
  userRecoveryCodes,
  userTwoFactorSecrets,
} from "./infrastructure/persistence";`,
  },
  sso: {
    id: "sso",
    dependsOn: ["auth", "users", "organizations", "access-control", "mfa"],
    module: "SsoModule",
    modulePath: "./sso.module",
    schema: `{ externalIdentities, ssoLoginStates, ssoSessionExchanges }`,
    schemaImports: `import {
  externalIdentities,
  ssoLoginStates,
  ssoSessionExchanges,
} from "./infrastructure/persistence";`,
  },
  "user-preferences": {
    id: "user-preferences",
    dependsOn: ["users"],
    module: "PreferencesModule",
    modulePath: "./preferences.module",
    schema: `{ userPreferences }`,
    schemaImports: `import { userPreferences } from "./infrastructure/persistence";`,
  },
  upload: {
    id: "upload",
    dependsOn: ["auth"],
    module: "UploadModule",
    modulePath: "./upload.module",
    schema: `{
    files,
    fileVersions,
    fileBatchOperations,
    attachments,
    storageObjects,
    storageDeleteOutbox,
  }`,
    schemaImports: `import {
  attachments,
  fileBatchOperations,
  fileVersions,
  files,
  storageDeleteOutbox,
  storageObjects,
} from "./infrastructure/persistence";`,
  },
  jobs: {
    id: "jobs",
    dependsOn: [],
    module: "JobsModule",
    modulePath: "./jobs.module",
    schema: `{ jobs, jobAttempts, jobDependencies, jobEvents, jobStatusEnum }`,
    schemaImports: `import {
  jobAttempts,
  jobDependencies,
  jobEvents,
  jobs,
  jobStatusEnum,
} from "./infrastructure/persistence";`,
  },
  mail: {
    id: "mail",
    dependsOn: ["jobs"],
    module: "MailModule",
    modulePath: "./mail.module",
    schema: `{ mailDeliveries, mailDeliveryStatusEnum }`,
    schemaImports: `import { mailDeliveries, mailDeliveryStatusEnum } from "./infrastructure/persistence";`,
  },
  notifications: {
    id: "notifications",
    dependsOn: ["jobs"],
    module: "NotificationsModule",
    modulePath: "./notifications.module",
    schema: `{
    notifications,
    notificationDeviceTokens,
    notificationJobs,
    notificationDeliveries,
    notificationAudienceEnum,
    notificationDeliveryStatusEnum,
    notificationDevicePlatformEnum,
    notificationJobStatusEnum,
  }`,
    schemaImports: `import {
  notificationAudienceEnum,
  notificationDeliveries,
  notificationDeliveryStatusEnum,
  notificationDevicePlatformEnum,
  notificationDeviceTokens,
  notificationJobs,
  notificationJobStatusEnum,
  notifications,
} from "./infrastructure/persistence";`,
  },
  audit: {
    id: "audit",
    dependsOn: ["upload"],
    module: "AuditModule",
    modulePath: "./audit.module",
    schema: `{ auditLogs }`,
    schemaImports: `import { auditLogs } from "./infrastructure/persistence";`,
  },
  settings: {
    id: "settings",
    dependsOn: ["audit"],
    module: "SettingsModule",
    modulePath: "./settings.module",
    schema: `{ applicationSettings }`,
    schemaImports: `import { applicationSettings } from "./infrastructure/persistence";`,
  },
  "import-export": {
    id: "import-export",
    dependsOn: ["upload", "audit", "users", "organizations", "access-control"],
    module: "ImportExportFeatureModule",
    modulePath: "./import-export.module",
    schema: `{ importJobs, exportJobs, importExportJobStatusEnum }`,
    schemaImports: `import {
  exportJobs,
  importExportJobStatusEnum,
  importJobs,
} from "./infrastructure/persistence";`,
  },
  activities: {
    id: "activities",
    dependsOn: [],
    module: "ActivitiesModule",
    modulePath: "./activities.module",
    schema: `{ activities, activityVisibilityEnum }`,
    schemaImports: `import { activities, activityVisibilityEnum } from "./infrastructure/persistence";`,
  },
};

for (const [pkgId, m] of Object.entries(manifests)) {
  const depends = m.dependsOn.map((d) => `"${d}"`).join(", ");
  const exportName = `${pkgId.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Feature`;
  write(
    `packages/feature-${pkgId}/src/${pkgId}.feature.ts`,
    `import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { ${m.module} } from "${m.modulePath}";
${m.schemaImports}

export const ${exportName}: FeatureManifest = defineFeature({
  id: "${m.id}",
  dependsOn: [${depends}],
  nestModule: ${m.module},
  schema: ${m.schema},
});
`,
  );
}

write(
  "packages/feature-health/src/health.feature.ts",
  `import { defineFeature, type FeatureManifest } from "@repo/api-plugin-kit";

import { HealthModule } from "./health.module";

export const healthFeature: FeatureManifest = defineFeature({
  id: "health",
  dependsOn: [],
  nestModule: HealthModule,
});
`,
);

// --- Composition modules ---
write(
  "packages/feature-upload/src/upload.module.ts",
  `import { Module } from "@nestjs/common";

import { AttachmentsModule } from "./attachments/attachments/attachments.module";
import { FilesModule } from "./files/files/files.module";
import { StorageModule } from "./storage/storage/storage.module";

@Module({
  imports: [StorageModule, FilesModule, AttachmentsModule],
  exports: [StorageModule, FilesModule, AttachmentsModule],
})
export class UploadModule {}
`,
);

write(
  "packages/feature-import-export/src/import-export.module.ts",
  `import { Module } from "@nestjs/common";

import { ExportsModule } from "./exports/exports/exports.module";
import { ImportExportModule } from "./import-export/import-export.module";
import { ImportsModule } from "./imports/imports/imports.module";

@Module({
  imports: [ImportExportModule, ImportsModule, ExportsModule],
  exports: [ImportExportModule, ImportsModule, ExportsModule],
})
export class ImportExportFeatureModule {}
`,
);

// Rename PreferencesModule class usage stays; ensure user-preferences.module re-export
write(
  "packages/feature-user-preferences/src/user-preferences.module.ts",
  `export { PreferencesModule as UserPreferencesModule, PreferencesModule } from "./preferences.module";
`,
);

// --- Fix Nest module cross-feature imports ---
const moduleImportFixes = [
  [
    "packages/feature-auth/src/auth.module.ts",
    (s) =>
      s
        .replace(
          /import \{ AccessControlModule \} from "\.\.\/access-control";/,
          'import { AccessControlModule } from "@repo/feature-access-control/contracts";',
        )
        .replace(
          /import \{ MfaModule \} from "\.\.\/mfa\/mfa\.module";/,
          'import { MfaModule } from "@repo/feature-mfa/contracts";',
        )
        .replace(
          /import \{ OrganizationsModule \} from "\.\.\/organizations\/organizations\.module";/,
          'import { OrganizationsModule } from "@repo/feature-organizations/contracts";',
        )
        .replace(
          /import \{ UsersModule \} from "\.\.\/users\/users\.module";/,
          'import { UsersModule } from "@repo/feature-users/contracts";',
        ),
  ],
  [
    "packages/feature-users/src/users.module.ts",
    (s) =>
      s
        .replace(
          /import \{ AccessControlModule \} from "\.\.\/access-control";/,
          'import { AccessControlModule } from "@repo/feature-access-control/contracts";',
        )
        .replace(
          /import \{ AuthDataModule \} from "\.\.\/auth";/,
          'import { AuthDataModule } from "@repo/feature-auth/contracts";',
        )
        .replace(
          /import \{ OrganizationsModule \} from "\.\.\/organizations\/organizations\.module";/,
          'import { OrganizationsModule } from "@repo/feature-organizations/contracts";',
        ),
  ],
  [
    "packages/feature-organizations/src/organizations.module.ts",
    (s) =>
      s.replace(
        /import \{ AccessControlModule \} from "\.\.\/access-control";/,
        'import { AccessControlModule } from "@repo/feature-access-control/contracts";',
      ),
  ],
  [
    "packages/feature-sso/src/sso.module.ts",
    (s) =>
      s
        .replace(
          /import \{ AccessControlModule \} from "\.\.\/access-control";/,
          'import { AccessControlModule } from "@repo/feature-access-control/contracts";',
        )
        .replace(
          /import \{ AuthModule \} from "\.\.\/auth\/auth\.module";/,
          'import { AuthModule } from "@repo/feature-auth/contracts";',
        )
        .replace(
          /import \{ OrganizationsModule \} from "\.\.\/organizations\/organizations\.module";/,
          'import { OrganizationsModule } from "@repo/feature-organizations/contracts";',
        )
        .replace(
          /import \{ UsersModule \} from "\.\.\/users\/users\.module";/,
          'import { UsersModule } from "@repo/feature-users/contracts";',
        ),
  ],
  [
    "packages/feature-user-preferences/src/preferences.module.ts",
    (s) =>
      s.replace(
        /import \{ UsersModule \} from "\.\.\/users\/users\.module";/,
        'import { UsersModule } from "@repo/feature-users/contracts";',
      ),
  ],
  [
    "packages/feature-jobs/src/jobs.module.ts",
    (s) =>
      s.replace(
        /import \{ MailModule \} from "\.\.\/mail";/,
        'import { MailModule } from "@repo/feature-mail/contracts";',
      ),
  ],
  [
    "packages/feature-upload/src/files/files/files.module.ts",
    (s) =>
      s
        .replace(
          /import \{ AuditModule \} from "\.\.\/audit";/,
          'import { AuditModule } from "@repo/feature-audit/contracts";',
        )
        .replace(
          /import \{ StorageModule \} from "\.\.\/storage";/,
          'import { StorageModule } from "../../storage/storage/storage.module";',
        ),
  ],
  [
    "packages/feature-upload/src/attachments/attachments/attachments.module.ts",
    (s) => {
      let out = s;
      if (out.includes('../files')) {
        out = out.replace(
          /import \{ FilesModule \} from "\.\.\/files[^"]*";/,
          'import { FilesModule } from "../../files/files/files.module";',
        );
      }
      if (out.includes('../audit')) {
        out = out.replace(
          /import \{ AuditModule \} from "\.\.\/audit";/,
          'import { AuditModule } from "@repo/feature-audit/contracts";',
        );
      }
      return out;
    },
  ],
  [
    "packages/feature-import-export/src/imports/imports/imports.module.ts",
    (s) =>
      s
        .replace(
          /import \{ AuditModule \} from "\.\.\/audit";/,
          'import { AuditModule } from "@repo/feature-audit/contracts";',
        )
        .replace(
          /import \{ FilesModule \} from "\.\.\/files";/,
          'import { FilesModule } from "@repo/feature-upload/contracts";',
        )
        .replace(
          /import \{ StorageModule \} from "\.\.\/storage";/,
          'import { StorageModule } from "@repo/feature-upload/contracts";',
        ),
  ],
  [
    "packages/feature-import-export/src/exports/exports/exports.module.ts",
    (s) =>
      s
        .replace(
          /import \{ AuditModule \} from "\.\.\/audit";/,
          'import { AuditModule } from "@repo/feature-audit/contracts";',
        )
        .replace(
          /import \{ FilesModule \} from "\.\.\/files";/,
          'import { FilesModule } from "@repo/feature-upload/contracts";',
        )
        .replace(
          /import \{ StorageModule \} from "\.\.\/storage";/,
          'import { StorageModule } from "@repo/feature-upload/contracts";',
        ),
  ],
  [
    "packages/feature-import-export/src/imports/imports/infrastructure/users-import-export.adapter.ts",
    (s) =>
      s.replace(
        /from "@repo\/feature-auth";/,
        `from "@repo/feature-access-control/contracts";
import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepositoryPort,
} from "@repo/feature-organizations/contracts";
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from "@repo/feature-users/contracts";
// keep access-control symbols from first import block below
void 0; // placeholder`,
      ),
  ],
];

for (const [rel, fn] of moduleImportFixes) {
  rewrite(rel, fn);
}

// Fix users-import-export adapter properly (previous replace is messy) —
rewrite(
  "packages/feature-import-export/src/imports/imports/infrastructure/users-import-export.adapter.ts",
  (s) => {
    if (!s.includes("@repo/feature-auth") && s.includes("@repo/feature-users/contracts")) {
      // Clean up placeholder if previous pass mangled it
      return s
        .replace(/\n\/\/ keep access-control symbols from first import block below\nvoid 0; \/\/ placeholder\n/g, "\n")
        .replace(
          /import \{\n  ACCESS_CONTROL_REPOSITORY,\n  type AccessControlRepositoryPort,\n  ORGANIZATIONS_REPOSITORY,\n  type OrganizationsRepositoryPort,\n  USERS_REPOSITORY,\n  type UsersRepositoryPort,\n\} from "@repo\/feature-access-control\/contracts";\nimport \{\n  ORGANIZATIONS_REPOSITORY,\n  type OrganizationsRepositoryPort,\n\} from "@repo\/feature-organizations\/contracts";\nimport \{\n  USERS_REPOSITORY,\n  type UsersRepositoryPort,\n\} from "@repo\/feature-users\/contracts";/,
          `import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from "@repo/feature-access-control/contracts";
import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepositoryPort,
} from "@repo/feature-organizations/contracts";
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from "@repo/feature-users/contracts";`,
        );
    }
    return s.replace(
      /import \{\n  ACCESS_CONTROL_REPOSITORY,\n  type AccessControlRepositoryPort,\n  ORGANIZATIONS_REPOSITORY,\n  type OrganizationsRepositoryPort,\n  USERS_REPOSITORY,\n  type UsersRepositoryPort,\n\} from "@repo\/feature-auth";/,
      `import {
  ACCESS_CONTROL_REPOSITORY,
  type AccessControlRepositoryPort,
} from "@repo/feature-access-control/contracts";
import {
  ORGANIZATIONS_REPOSITORY,
  type OrganizationsRepositoryPort,
} from "@repo/feature-organizations/contracts";
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from "@repo/feature-users/contracts";`,
    );
  },
);

// Additional cross-feature Nest imports
const moreModuleFixes = [
  [
    "packages/feature-settings/src/settings.module.ts",
    (s) =>
      s.replace(
        /import \{ AuditModule \} from "\.\.\/audit";/,
        'import { AuditModule } from "@repo/feature-audit/contracts";',
      ),
  ],
  [
    "packages/feature-mail/src/mail.module.ts",
    (s) =>
      s.replace(
        /import \{ JobsModule \} from "\.\.\/jobs";/,
        'import { JobsModule } from "@repo/feature-jobs/contracts";',
      ),
  ],
  [
    "packages/feature-notifications/src/notifications.module.ts",
    (s) =>
      s
        .replace(
          /import \{ JobsModule \} from "\.\.\/jobs";/,
          'import { JobsModule } from "@repo/feature-jobs/contracts";',
        )
        .replace(
          /import \{ AuditModule \} from "\.\.\/audit";/,
          'import { AuditModule } from "@repo/feature-audit/contracts";',
        ),
  ],
  [
    "packages/feature-audit/src/audit.module.ts",
    (s) =>
      s
        .replace(
          /import \{ FILES_REPOSITORY \} from "\.\.\/files\/application\/ports\/files\.repository\.port";/,
          'import { FILES_REPOSITORY } from "@repo/feature-upload/contracts";',
        )
        .replace(
          /import \{ FilesRepository \} from "\.\.\/files\/infrastructure\/files\.repository";/,
          'import { FilesRepository } from "../files/files/infrastructure/files.repository";',
        )
        .replace(
          /import \{ StorageModule \} from "\.\.\/storage";/,
          'import { StorageModule } from "@repo/feature-upload/contracts";',
        ),
  ],
  [
    "packages/feature-upload/src/attachments/attachments/attachments.module.ts",
    (s) =>
      s
        .replace(
          /import \{ AuditModule \} from "\.\.\/audit";/,
          'import { AuditModule } from "@repo/feature-audit/contracts";',
        )
        .replace(
          /import \{ FilesModule \} from "\.\.\/files";/,
          'import { FilesModule } from "../../files/files/files.module";',
        ),
  ],
  [
    "packages/feature-upload/src/files/files/files.module.ts",
    (s) =>
      s
        .replace(
          /import \{ AuditModule \} from "\.\.\/audit";/,
          'import { AuditModule } from "@repo/feature-audit/contracts";',
        )
        .replace(
          /import \{ StorageModule \} from "\.\.\/storage";/,
          'import { StorageModule } from "../../storage/storage/storage.module";',
        ),
  ],
];

for (const [rel, fn] of moreModuleFixes) {
  rewrite(rel, fn);
}

// Audit is in its own package — FilesRepository must come from upload contracts/package,
// not a relative path into feature-upload. Prefer injecting FILES_REPOSITORY only.
rewrite("packages/feature-audit/src/audit.module.ts", (s) => {
  // If we still have a broken relative FilesRepository import, switch to upload package path.
  return s
    .replace(
      /import \{ FilesRepository \} from "\.\.\/files\/files\/infrastructure\/files\.repository";/,
      'import { FilesRepository } from "@repo/feature-upload/src/files/files/infrastructure/files.repository";',
    )
    .replace(
      /from "@repo\/feature-upload\/src\/files\/files\/infrastructure\/files\.repository";/,
      'from "../../../feature-upload/src/files/files/infrastructure/files.repository";',
    );
});

// Better: provide FilesRepository via a public export. Add to upload contracts later.
// For now export FilesRepository from upload contracts and import that.
rewrite("packages/feature-upload/src/public/contracts.ts", (s) => {
  if (s.includes("FilesRepository")) return s;
  return `export { FilesRepository } from "../files/files/infrastructure/files.repository";\n${s}`;
});

rewrite("packages/feature-audit/src/audit.module.ts", (s) =>
  s
    .replace(
      /import \{ FilesRepository \} from "[^"]+";/,
      'import { FilesRepository } from "@repo/feature-upload/contracts";',
    )
    .replace(
      /import \{ FILES_REPOSITORY \} from "@repo\/feature-upload\/contracts";\nimport \{ FilesRepository \} from "@repo\/feature-upload\/contracts";/,
      `import { FILES_REPOSITORY, FilesRepository } from "@repo/feature-upload/contracts";`,
    ),
);

// --- Repository table imports: map @repo/database-runtime table symbols to local/peer schema ---
const repoTableMap = [
  {
    file: "packages/feature-auth/src/infrastructure/auth.repository.ts",
    tables: {
      authSessions: "../infrastructure/persistence/auth",
      emailVerificationTokens: "../infrastructure/persistence/auth",
      passwordResetTokens: "../infrastructure/persistence/auth",
    },
    localFrom: "./persistence",
  },
  {
    file: "packages/feature-auth/src/infrastructure/outbox.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ DATABASE, outboxMessages \} from "@repo\/database-runtime";/,
        `import { DATABASE } from "@repo/database-runtime";
import { outboxMessages } from "./persistence";`,
      ),
  },
  {
    file: "packages/feature-users/src/infrastructure/users.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ organizationMembers, roles, userRoles, users \} from "@repo\/database-runtime";/,
        `import { roles, userRoles } from "@repo/feature-access-control/schema";
import { organizationMembers } from "@repo/feature-organizations/schema";
import { users } from "./persistence";`,
      ),
  },
  {
    file: "packages/feature-organizations/src/infrastructure/organizations.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ organizationMembers, organizations, roles, userRoles, users \} from "@repo\/database-runtime";/,
        `import { roles, userRoles } from "@repo/feature-access-control/schema";
import { users } from "@repo/feature-users/schema";
import { organizationMembers, organizations } from "./persistence";`,
      ),
  },
  {
    file: "packages/feature-access-control/src/infrastructure/access-control-permission.persistence.ts",
    replace: (s) =>
      s.replace(
        /import \{ permissions, rolePermissions \} from "@repo\/database-runtime";/,
        `import { permissions, rolePermissions } from "./persistence";`,
      ),
  },
  {
    file: "packages/feature-access-control/src/infrastructure/access-control-role.persistence.ts",
    replace: (s) =>
      s.replace(/import \{ roles \} from "@repo\/database-runtime";/, `import { roles } from "./persistence";`),
  },
  {
    file: "packages/feature-access-control/src/infrastructure/access-control-assignment.persistence.ts",
    replace: (s) =>
      s.replace(
        /import \{ organizations, permissions, rolePermissions, roles, userRoles \} from "@repo\/database-runtime";/,
        `import { organizations } from "@repo/feature-organizations/schema";
import { permissions, rolePermissions, roles, userRoles } from "./persistence";`,
      ),
  },
  {
    file: "packages/feature-mfa/src/infrastructure/mfa.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{\n  DATABASE,\n  type DatabaseClient,\n  mfaChallenges,\n  userRecoveryCodes,\n  userTwoFactorSecrets,\n\} from "@repo\/database-runtime";/,
        `import { DATABASE, type DatabaseClient } from "@repo/database-runtime";
import { mfaChallenges, userRecoveryCodes, userTwoFactorSecrets } from "./persistence";`,
      ),
  },
  {
    file: "packages/feature-sso/src/infrastructure/sso.repository.ts",
    replace: (s) =>
      s
        .replace(
          /import \{\n  DATABASE,\n  type DatabaseClient,\n  externalIdentities,\n  ssoLoginStates,\n  ssoSessionExchanges,\n\} from "@repo\/database-runtime";/,
          `import { DATABASE, type DatabaseClient } from "@repo/database-runtime";
import { externalIdentities, ssoLoginStates, ssoSessionExchanges } from "./persistence";`,
        )
        .replace(
          /import \{ decryptTotpSecret, encryptTotpSecret \} from "\.\.\/\.\.\/mfa";/,
          'import { decryptTotpSecret, encryptTotpSecret } from "@repo/feature-mfa/contracts";',
        ),
  },
  {
    file: "packages/feature-user-preferences/src/infrastructure/preferences.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ userPreferences \} from "@repo\/database-runtime";/,
        `import { userPreferences } from "./persistence";`,
      ),
  },
  {
    file: "packages/feature-jobs/src/infrastructure/jobs.repository.ts",
    replace: (s) =>
      s.replace(/import \{ jobs \} from "@repo\/database-runtime";/, `import { jobs } from "./persistence";`),
  },
  {
    file: "packages/feature-jobs/src/infrastructure/job-observability.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ jobAttempts, jobDependencies, jobEvents, jobs \} from "@repo\/database-runtime";/,
        `import { jobAttempts, jobDependencies, jobEvents, jobs } from "./persistence";`,
      ),
  },
  {
    file: "packages/feature-mail/src/infrastructure/mail-deliveries.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ mailDeliveries \} from "@repo\/database-runtime";/,
        `import { mailDeliveries } from "./persistence";`,
      ),
  },
  {
    file: "packages/feature-notifications/src/infrastructure/notifications.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ notifications \} from "@repo\/database-runtime";/,
        `import { notifications } from "./persistence";`,
      ),
  },
  {
    file: "packages/feature-notifications/src/infrastructure/deliveries.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ DATABASE, notificationDeliveries \} from "@repo\/database-runtime";/,
        `import { DATABASE } from "@repo/database-runtime";
import { notificationDeliveries } from "./persistence";`,
      ),
  },
  {
    file: "packages/feature-notifications/src/infrastructure/device-tokens.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ notificationDeliveries, notificationDeviceTokens \} from "@repo\/database-runtime";/,
        `import { notificationDeliveries, notificationDeviceTokens } from "./persistence";`,
      ),
  },
  {
    file: "packages/feature-notifications/src/infrastructure/notification-jobs.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ notificationJobs \} from "@repo\/database-runtime";/,
        `import { notificationJobs } from "./persistence";`,
      ),
  },
  {
    file: "packages/feature-audit/src/infrastructure/audit.repository.ts",
    replace: (s) =>
      s.replace(/import \{ auditLogs \} from "@repo\/database-runtime";/, `import { auditLogs } from "./persistence";`),
  },
  {
    file: "packages/feature-settings/src/infrastructure/settings.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ applicationSettings \} from "@repo\/database-runtime";/,
        `import { applicationSettings } from "./persistence";`,
      ),
  },
  {
    file: "packages/feature-activities/src/infrastructure/activities.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ activities \} from "@repo\/database-runtime";/,
        `import { activities } from "./persistence";`,
      ),
  },
  {
    file: "packages/feature-upload/src/files/files/infrastructure/files.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ fileBatchOperations, files, fileVersions \} from "@repo\/database-runtime";/,
        `import { fileBatchOperations, files, fileVersions } from "../../../infrastructure/persistence";`,
      ),
  },
  {
    file: "packages/feature-upload/src/attachments/attachments/infrastructure/attachments.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ attachments \} from "@repo\/database-runtime";/,
        `import { attachments } from "../../../infrastructure/persistence";`,
      ),
  },
  {
    file: "packages/feature-upload/src/storage/storage/infrastructure/storage-tracking.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ storageDeleteOutbox, storageObjects \} from "@repo\/database-runtime";/,
        `import { storageDeleteOutbox, storageObjects } from "../../../infrastructure/persistence";`,
      ),
  },
  {
    file: "packages/feature-import-export/src/imports/imports/infrastructure/import-jobs.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ importJobs \} from "@repo\/database-runtime";/,
        `import { importJobs } from "../../../infrastructure/persistence";`,
      ),
  },
  {
    file: "packages/feature-import-export/src/exports/exports/infrastructure/export-jobs.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ exportJobs \} from "@repo\/database-runtime";/,
        `import { exportJobs } from "../../../infrastructure/persistence";`,
      ),
  },
  {
    file: "packages/feature-auth/src/infrastructure/auth.repository.ts",
    replace: (s) =>
      s.replace(
        /import \{ authSessions, emailVerificationTokens, passwordResetTokens \} from "@repo\/database-runtime";/,
        `import { authSessions, emailVerificationTokens, passwordResetTokens } from "./persistence";`,
      ),
  },
];

for (const item of repoTableMap) {
  if (item.replace) {
    rewrite(item.file, item.replace);
  }
}

// --- package.json exports cleanup + deps ---
function updatePkgJson(id, extraDeps = {}) {
  const rel = `packages/feature-${id}/package.json`;
  if (!exists(rel)) return;
  const pkg = JSON.parse(read(rel));
  pkg.name = `@repo/feature-${id}`;
  pkg.exports = {
    ".": `./src/${id}.feature.ts`,
    "./contracts": "./src/public/contracts.ts",
    "./testing": "./src/testing/index.ts",
    "./schema": "./src/infrastructure/persistence/index.ts",
  };
  if (id === "health") {
    delete pkg.exports["./schema"];
  }
  pkg.scripts = {
    build: "tsc -p tsconfig.json --noEmit",
    lint: "eslint .",
    typecheck: "tsc -p tsconfig.json --noEmit",
    test: "vitest run --passWithNoTests",
    format: "prettier --write .",
  };
  pkg.dependencies = {
    ...pkg.dependencies,
    ...extraDeps,
  };
  // Drop wildcards
  if (pkg.exports["./*"]) delete pkg.exports["./*"];
  if (pkg.exports["./module"]) delete pkg.exports["./module"];
  write(rel, JSON.stringify(pkg, null, 2));
}

updatePkgJson("auth", {
  "@nestjs/jwt": "11.0.2",
  argon2: "0.44.0",
  "@repo/feature-access-control": "workspace:*",
  "@repo/feature-mfa": "workspace:*",
  "@repo/feature-organizations": "workspace:*",
  "@repo/feature-users": "workspace:*",
});
updatePkgJson("users", {
  "@repo/feature-access-control": "workspace:*",
  "@repo/feature-auth": "workspace:*",
  "@repo/feature-organizations": "workspace:*",
});
updatePkgJson("organizations", {
  "@repo/feature-access-control": "workspace:*",
  "@repo/feature-users": "workspace:*",
});
updatePkgJson("access-control", {
  "@repo/feature-organizations": "workspace:*",
  "@repo/feature-users": "workspace:*",
});
updatePkgJson("mfa", {
  "@repo/feature-auth": "workspace:*",
  "@repo/feature-users": "workspace:*",
});
updatePkgJson("sso", {
  "@repo/feature-access-control": "workspace:*",
  "@repo/feature-auth": "workspace:*",
  "@repo/feature-mfa": "workspace:*",
  "@repo/feature-organizations": "workspace:*",
  "@repo/feature-users": "workspace:*",
});
updatePkgJson("user-preferences", {
  "@repo/feature-users": "workspace:*",
});
updatePkgJson("upload", {
  "@aws-sdk/client-s3": "^3.1068.0",
  "@aws-sdk/s3-request-presigner": "^3.1068.0",
  "@nestjs/platform-express": "11.1.27",
  "@repo/feature-audit": "workspace:*",
  "@repo/feature-organizations": "workspace:*",
  "@repo/feature-users": "workspace:*",
});
updatePkgJson("jobs", {
  "@nestjs/schedule": "6.1.1",
  "@repo/feature-mail": "workspace:*",
  "@repo/feature-organizations": "workspace:*",
  "@repo/feature-users": "workspace:*",
});
updatePkgJson("mail", {
  nodemailer: "9.0.0",
  "@repo/feature-jobs": "workspace:*",
  "@types/nodemailer": "7.0.4",
});
updatePkgJson("notifications", {
  "firebase-admin": "13.6.0",
  "@repo/feature-jobs": "workspace:*",
  "@repo/feature-organizations": "workspace:*",
  "@repo/feature-users": "workspace:*",
});
updatePkgJson("audit", {
  "@repo/feature-upload": "workspace:*",
  "@repo/feature-organizations": "workspace:*",
  "@repo/feature-users": "workspace:*",
});
updatePkgJson("settings", {
  "@repo/feature-audit": "workspace:*",
  "@repo/feature-users": "workspace:*",
});
updatePkgJson("import-export", {
  argon2: "0.44.0",
  "@repo/feature-access-control": "workspace:*",
  "@repo/feature-audit": "workspace:*",
  "@repo/feature-organizations": "workspace:*",
  "@repo/feature-upload": "workspace:*",
  "@repo/feature-users": "workspace:*",
});
updatePkgJson("activities", {
  "@repo/feature-organizations": "workspace:*",
  "@repo/feature-users": "workspace:*",
});

// health package
{
  const rel = "packages/feature-health/package.json";
  const pkg = JSON.parse(read(rel));
  pkg.name = "@repo/feature-health";
  pkg.exports = {
    ".": "./src/health.feature.ts",
    "./contracts": "./src/public/contracts.ts",
    "./testing": "./src/testing/index.ts",
  };
  pkg.scripts = {
    build: "tsc -p tsconfig.json --noEmit",
    lint: "eslint .",
    typecheck: "tsc -p tsconfig.json --noEmit",
    test: "vitest run --passWithNoTests",
    format: "prettier --write .",
  };
  pkg.dependencies = {
    "@nestjs/common": "11.1.27",
    "@nestjs/swagger": "11.4.4",
    "@nestjs/terminus": "^11.1.1",
    "@repo/api-kernel": "workspace:*",
    "@repo/api-plugin-kit": "workspace:*",
    "@repo/api-runtime": "workspace:*",
    "@repo/database-runtime": "workspace:*",
    "drizzle-orm": "0.45.2",
  };
  delete pkg.dependencies["@repo/api-core"];
  delete pkg.dependencies["@repo/api-database"];
  write(rel, JSON.stringify(pkg, null, 2));
}

// Fix health feature imports / index
rewrite("packages/feature-health/src/index.ts", () =>
  `export { HealthWarningsService } from "./application/health-warnings.service";
export { AppHealthIndicator, DatabaseHealthIndicator } from "./application/health.indicators";
export { healthFeature } from "./health.feature";
export { HealthModule } from "./health.module";
`,
);

rewrite("packages/feature-health/src/application/health.indicators.ts", (s) =>
  s
    .replace(/from "@repo\/api-core"/g, 'from "@repo/api-runtime"')
    .replace(/from "@repo\/api-database"/g, 'from "@repo/database-runtime"'),
);

write(
  "apps/api/src/composition/feature-registry.ts",
  `import type { FeatureManifest } from "@repo/api-plugin-kit";
import { accessControlFeature } from "@repo/feature-access-control";
import { activitiesFeature } from "@repo/feature-activities";
import { auditFeature } from "@repo/feature-audit";
import { authFeature } from "@repo/feature-auth";
import { healthFeature } from "@repo/feature-health";
import { importExportFeature } from "@repo/feature-import-export";
import { jobsFeature } from "@repo/feature-jobs";
import { mailFeature } from "@repo/feature-mail";
import { mfaFeature } from "@repo/feature-mfa";
import { notificationsFeature } from "@repo/feature-notifications";
import { organizationsFeature } from "@repo/feature-organizations";
import { settingsFeature } from "@repo/feature-settings";
import { ssoFeature } from "@repo/feature-sso";
import { uploadFeature } from "@repo/feature-upload";
import { userPreferencesFeature } from "@repo/feature-user-preferences";
import { usersFeature } from "@repo/feature-users";

/**
 * Explicit compile-time feature list. Add/remove a feature here and in
 * apps/api/package.json workspace dependencies.
 */
export const enabledFeatures: readonly FeatureManifest[] = [
  accessControlFeature,
  authFeature,
  organizationsFeature,
  usersFeature,
  mfaFeature,
  ssoFeature,
  userPreferencesFeature,
  jobsFeature,
  mailFeature,
  uploadFeature,
  auditFeature,
  settingsFeature,
  notificationsFeature,
  importExportFeature,
  activitiesFeature,
  healthFeature,
];
`,
);

console.log("phase2 done");
