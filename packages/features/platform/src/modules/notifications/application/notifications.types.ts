import type { JsonObject } from "@repo/api-core";
export type NotificationAudience = "USER" | "USERS" | "ALL";

export type NotificationJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "FAILED";

export type NotificationDevicePlatform = "IOS" | "ANDROID";

export interface NotificationView {
  id: string;
  userId: string;
  organizationId: string | null;
  type: string;
  title: string;
  body: string;
  data: JsonObject | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationJobView {
  id: string;
  actorId: string | null;
  audience: NotificationAudience;
  targetUserId: string | null;
  userIds: string[] | null;
  type: string;
  title: string;
  body: string;
  data: JsonObject | null;
  scheduledAt: string;
  status: NotificationJobStatus;
  recipientCount: number | null;
  processedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SendNotificationCommand {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: JsonObject;
  organizationId?: string;
  sourceBackgroundJobId?: string | null;
}

export interface SendNotificationRequestCommand {
  audience: NotificationAudience;
  userId?: string;
  userIds?: string[];
  type: string;
  title: string;
  body: string;
  data?: JsonObject;
  scheduledAt?: string;
  idempotencyKey?: string;
}

export interface ListNotificationsQuery {
  page: number;
  limit: number;
  unread?: boolean;
  type?: string;
}

export interface ListNotificationJobsQuery {
  page: number;
  limit: number;
  status?: NotificationJobStatus;
  organizationId?: string;
}

export interface RegisterDeviceCommand {
  token: string;
  platform: NotificationDevicePlatform;
}
