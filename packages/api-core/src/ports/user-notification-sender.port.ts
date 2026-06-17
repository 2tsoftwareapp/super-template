import type { AuthenticatedRequestUser, RequestContext } from '../common/types/request-context';

export interface SendUserNotificationInput {
  organizationId?: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotificationMessage {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface UserNotificationSender {
  sendToUser(
    actor: AuthenticatedRequestUser | null,
    input: SendUserNotificationInput,
    requestContext?: RequestContext,
    executor?: unknown,
    options?: { deferDispatch?: boolean },
  ): Promise<NotificationMessage | null>;
  dispatch(notification: NotificationMessage): Promise<void>;
}

export const USER_NOTIFICATION_SENDER = Symbol('USER_NOTIFICATION_SENDER');
