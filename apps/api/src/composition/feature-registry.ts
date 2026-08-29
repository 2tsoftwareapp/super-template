import type { FeatureManifest } from "@repo/api-plugin-kit";

import { accessControlFeature } from "@repo/feature-access-control";
import { activitiesFeature } from "@repo/feature-activities";
import { auditFeature } from "@repo/feature-audit";
import { auditExportFeature } from "@repo/feature-audit-export";
import { authFeature } from "@repo/feature-auth";
import { healthFeature } from "@repo/feature-health";
import { importExportFeature } from "@repo/feature-import-export";
import { jobsFeature } from "@repo/feature-jobs";
import { mailFeature } from "@repo/feature-mail";
import { mfaFeature } from "@repo/feature-mfa";
import { notificationsFeature } from "@repo/feature-notifications";
import { organizationManagementFeature } from "@repo/feature-organization-management";
import { organizationsFeature } from "@repo/feature-organizations";
import { outboxFeature } from "@repo/feature-outbox";
import { settingsFeature } from "@repo/feature-settings";
import { ssoFeature } from "@repo/feature-sso";
import { uploadFeature } from "@repo/feature-upload";
import { userManagementFeature } from "@repo/feature-user-management";
import { userPreferencesFeature } from "@repo/feature-user-preferences";
import { usersFeature } from "@repo/feature-users";

/**
 * Explicit compile-time feature registry for the API host.
 * Disable a feature by removing it here and from apps/api/package.json.
 */
export const enabledFeatures: readonly FeatureManifest[] = [
  accessControlFeature,
  authFeature,
  organizationsFeature,
  organizationManagementFeature,
  usersFeature,
  userManagementFeature,
  mfaFeature,
  ssoFeature,
  userPreferencesFeature,
  jobsFeature,
  mailFeature,
  uploadFeature,
  auditFeature,
  auditExportFeature,
  activitiesFeature,
  notificationsFeature,
  outboxFeature,
  settingsFeature,
  importExportFeature,
  healthFeature,
];
