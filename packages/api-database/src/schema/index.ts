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
export { userPreferences } from './identity/preferences';
export { externalIdentities, ssoLoginStates } from './identity/sso';
export {
  mfaChallenges,
  userRecoveryCodes,
  userTwoFactorSecrets,
} from './identity/two-factor';
export { users } from './identity/users';

export { attachments } from './platform/attachments';
export { auditLogs } from './platform/audit';
// Platform
export {
  importExportJobStatusEnum,
  jobStatusEnum,
  mailDeliveryStatusEnum,
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
export { applicationSettings } from './platform/settings';

export { activities } from './workspace/activities';
export { comments } from './workspace/comments';
// Workspace
export {
  activityVisibilityEnum,
  invitationStatusEnum,
  notificationAudienceEnum,
  notificationDevicePlatformEnum,
  notificationJobStatusEnum,
  projectStatusEnum,
} from './workspace/enums';
export { invitations } from './workspace/invitations';
export {
  notificationDeviceTokens,
  notificationJobs,
  notifications,
} from './workspace/notifications';
export { projects } from './workspace/projects';

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
import { userPreferences } from './identity/preferences';
import { externalIdentities, ssoLoginStates } from './identity/sso';
import {
  mfaChallenges,
  userRecoveryCodes,
  userTwoFactorSecrets,
} from './identity/two-factor';
import { users } from './identity/users';
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
import { applicationSettings } from './platform/settings';
import { activities } from './workspace/activities';
import { comments } from './workspace/comments';
import { invitations } from './workspace/invitations';
import {
  notificationDeviceTokens,
  notificationJobs,
  notifications,
} from './workspace/notifications';
import { projects } from './workspace/projects';

export const schema = {
  activities,
  applicationSettings,
  attachments,
  authSessions,
  auditLogs,
  comments,
  emailVerificationTokens,
  exportJobs,
  externalIdentities,
  fileBatchOperations,
  fileVersions,
  files,
  importJobs,
  invitations,
  jobAttempts,
  jobDependencies,
  jobEvents,
  jobs,
  mailDeliveries,
  notificationDeviceTokens,
  notificationJobs,
  notifications,
  organizationMembers,
  organizations,
  passwordResetTokens,
  permissions,
  projects,
  rolePermissions,
  roles,
  mfaChallenges,
  ssoLoginStates,
  userPreferences,
  userRecoveryCodes,
  userRoles,
  users,
  userTwoFactorSecrets,
};
