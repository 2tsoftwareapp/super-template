import { pgEnum } from "drizzle-orm/pg-core";

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
