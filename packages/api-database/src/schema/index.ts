export {
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from './identity/access-control';
export {
  authSessions,
  emailVerificationTokens,
  passwordResetTokens,
} from './identity/auth';
// Identity
export {
  organizationMemberRoleEnum,
  userStatusEnum,
} from './identity/enums';
export {
  organizationMembers,
  organizations,
} from './identity/organizations';
export { outboxMessages } from './identity/outbox-messages';
export { userPreferences } from './identity/preferences';
export { externalIdentities, ssoLoginStates, ssoSessionExchanges } from './identity/sso';
export {
  mfaChallenges,
  userRecoveryCodes,
  userTwoFactorSecrets,
} from './identity/two-factor';
export { users } from './identity/users';

export { activities } from './platform/activities';
export { attachments } from './platform/attachments';
export { auditLogs } from './platform/audit';
// Platform
export {
  activityVisibilityEnum,
  importExportJobStatusEnum,
  jobStatusEnum,
  mailDeliveryStatusEnum,
  notificationAudienceEnum,
  notificationDeliveryStatusEnum,
  notificationDevicePlatformEnum,
  notificationJobStatusEnum,
} from './platform/enums';
export { fileBatchOperations } from './platform/file-batch-operations';
export { fileVersions } from './platform/file-versions';
export { files } from './platform/files';
export { exportJobs, importJobs } from './platform/import-export';
export { jobAttempts } from './platform/job-attempts';
export { jobDependencies } from './platform/job-dependencies';
export { jobEvents } from './platform/job-events';
export { jobs } from './platform/jobs';
export { mailDeliveries } from './platform/mail';
export {
  notificationDeliveries,
  notificationDeviceTokens,
  notificationJobs,
  notifications,
} from './platform/notifications';
export { applicationSettings } from './platform/settings';
export {
  storageDeleteOutbox,
  storageObjects,
} from './platform/storage-objects';

import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from './identity/access-control';
import {
  authSessions,
  emailVerificationTokens,
  passwordResetTokens,
} from './identity/auth';
import {
  organizationMembers,
  organizations,
} from './identity/organizations';
import { outboxMessages } from './identity/outbox-messages';
import { userPreferences } from './identity/preferences';
import { externalIdentities, ssoLoginStates, ssoSessionExchanges } from './identity/sso';
import {
  mfaChallenges,
  userRecoveryCodes,
  userTwoFactorSecrets,
} from './identity/two-factor';
import { users } from './identity/users';
import { activities } from './platform/activities';
import { attachments } from './platform/attachments';
import { auditLogs } from './platform/audit';
import { fileBatchOperations } from './platform/file-batch-operations';
import { fileVersions } from './platform/file-versions';
import { files } from './platform/files';
import { exportJobs, importJobs } from './platform/import-export';
import { jobAttempts } from './platform/job-attempts';
import { jobDependencies } from './platform/job-dependencies';
import { jobEvents } from './platform/job-events';
import { jobs } from './platform/jobs';
import { mailDeliveries } from './platform/mail';
import {
  notificationDeliveries,
  notificationDeviceTokens,
  notificationJobs,
  notifications,
} from './platform/notifications';
import { applicationSettings } from './platform/settings';
import {
  storageDeleteOutbox,
  storageObjects,
} from './platform/storage-objects';

export const schema = {
  activities,
  applicationSettings,
  attachments,
  authSessions,
  auditLogs,
  emailVerificationTokens,
  exportJobs,
  externalIdentities,
  fileBatchOperations,
  fileVersions,
  files,
  importJobs,
  jobAttempts,
  jobDependencies,
  jobEvents,
  jobs,
  mailDeliveries,
  notificationDeliveries,
  notificationDeviceTokens,
  notificationJobs,
  notifications,
  organizationMembers,
  organizations,
  passwordResetTokens,
  permissions,
  rolePermissions,
  roles,
  mfaChallenges,
  ssoLoginStates,
  ssoSessionExchanges,
  storageDeleteOutbox,
  storageObjects,
  userPreferences,
  userRecoveryCodes,
  userRoles,
  outboxMessages,
  users,
  userTwoFactorSecrets,
};
