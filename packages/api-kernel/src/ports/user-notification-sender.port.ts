import type { JsonObject } from "../types/json-value";
import type { AuthenticatedRequestUser, RequestContext } from "../types/request-context";
import type { TransactionExecutor } from "../types/transaction-executor";

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
