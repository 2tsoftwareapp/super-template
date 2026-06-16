// Identity
export {
  organizationMemberRoleEnum,
  userStatusEnum,
} from './identity/enums';
export { users } from './identity/users';
export {
  organizationMembers,
  organizations,
} from './identity/organizations';
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
export { userPreferences } from './identity/preferences';

// Platform
export {
  importExportJobStatusEnum,
  jobStatusEnum,
  mailDeliveryStatusEnum,
} from './platform/enums';
export { auditLogs } from './platform/audit';
export { files } from './platform/files';
export { attachments } from './platform/attachments';
export { mailDeliveries } from './platform/mail';
export { applicationSettings } from './platform/settings';
export { jobs } from './platform/jobs';
export { exportJobs, importJobs } from './platform/import-export';

// Workspace
export {
  activityVisibilityEnum,
  invitationStatusEnum,
  notificationAudienceEnum,
  notificationDevicePlatformEnum,
  notificationJobStatusEnum,
  projectStatusEnum,
} from './workspace/enums';
export { projects } from './workspace/projects';
export {
  notificationDeviceTokens,
  notificationJobs,
  notifications,
} from './workspace/notifications';
export { invitations } from './workspace/invitations';
export { comments } from './workspace/comments';
export { activities } from './workspace/activities';

import { activities } from './workspace/activities';
import { comments } from './workspace/comments';
import { invitations } from './workspace/invitations';
import {
  notificationDeviceTokens,
  notificationJobs,
  notifications,
} from './workspace/notifications';
import { projects } from './workspace/projects';
import { auditLogs } from './platform/audit';
import { attachments } from './platform/attachments';
import { exportJobs, importJobs } from './platform/import-export';
import { files } from './platform/files';
import { jobs } from './platform/jobs';
import { mailDeliveries } from './platform/mail';
import { applicationSettings } from './platform/settings';
import {
  authSessions,
  emailVerificationTokens,
  passwordResetTokens,
} from './identity/auth';
import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from './identity/access-control';
import {
  organizationMembers,
  organizations,
} from './identity/organizations';
import { userPreferences } from './identity/preferences';
import { users } from './identity/users';

export const schema = {
  activities,
  applicationSettings,
  attachments,
  authSessions,
  auditLogs,
  comments,
  emailVerificationTokens,
  exportJobs,
  files,
  importJobs,
  invitations,
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
  userPreferences,
  userRoles,
  users,
};
