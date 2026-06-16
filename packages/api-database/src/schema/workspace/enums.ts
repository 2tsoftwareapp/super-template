import { pgEnum } from 'drizzle-orm/pg-core';

export const projectStatusEnum = pgEnum('project_status', [
  'DRAFT',
  'ACTIVE',
  'ARCHIVED',
]);

export const notificationDevicePlatformEnum = pgEnum(
  'notification_device_platform',
  ['IOS', 'ANDROID'],
);

export const notificationAudienceEnum = pgEnum('notification_audience', [
  'USER',
  'USERS',
  'ALL',
]);

export const notificationJobStatusEnum = pgEnum('notification_job_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
]);

export const invitationStatusEnum = pgEnum('invitation_status', [
  'PENDING',
  'ACCEPTED',
  'EXPIRED',
  'REVOKED',
]);

export const activityVisibilityEnum = pgEnum('activity_visibility', [
  'PUBLIC',
  'PRIVATE',
  'INTERNAL',
]);
