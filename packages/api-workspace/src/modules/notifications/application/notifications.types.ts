export type NotificationAudience = 'USER' | 'USERS' | 'ALL';

export type NotificationJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

export type NotificationDevicePlatform = 'IOS' | 'ANDROID';

export interface NotificationView {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
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
  data: Record<string, unknown> | null;
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
  data?: Record<string, unknown>;
  organizationId?: string;
}

export interface SendNotificationRequestCommand {
  audience: NotificationAudience;
  userId?: string;
  userIds?: string[];
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
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
}

export interface RegisterDeviceCommand {
  token: string;
  platform: NotificationDevicePlatform;
}
