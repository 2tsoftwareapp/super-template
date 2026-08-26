import type { JsonObject } from "@repo/api-kernel";
import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-kernel";
import type { TransactionExecutor } from "@repo/api-kernel";

export interface SendUserNotificationInput {
  organizationId?: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: JsonObject;
  sourceBackgroundJobId?: string | null;
}

export interface NotificationMessage {
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

export interface UserNotificationSender {
  sendToUser(
    actor: AuthenticatedRequestUser | null,
    input: SendUserNotificationInput,
    requestContext?: RequestContext,
    executor?: TransactionExecutor,
    options?: { deferDispatch?: boolean },
  ): Promise<NotificationMessage | null>;
  dispatch(notification: NotificationMessage, organizationId: string): Promise<void>;
}

export const USER_NOTIFICATION_SENDER = Symbol("USER_NOTIFICATION_SENDER");
