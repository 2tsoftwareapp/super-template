import { pgEnum } from 'drizzle-orm/pg-core';

export const mailDeliveryStatusEnum = pgEnum('mail_delivery_status', [
  'SENT',
  'FAILED',
]);

export const jobStatusEnum = pgEnum('job_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
  'BLOCKED',
]);

export const importExportJobStatusEnum = pgEnum('import_export_job_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
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

export const notificationDeliveryStatusEnum = pgEnum('notification_delivery_status', [
  'PENDING',
  'PROCESSING',
  'SENT',
  'FAILED',
]);

export const activityVisibilityEnum = pgEnum('activity_visibility', [
  'PUBLIC',
  'PRIVATE',
  'INTERNAL',
]);
