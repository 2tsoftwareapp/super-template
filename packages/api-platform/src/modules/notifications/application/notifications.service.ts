import type {
  AuthenticatedRequestUser,
  NotificationMessage,
  RequestContext,
  SendUserNotificationInput,
  UserNotificationSender,
} from "@repo/api-core";
import type { TransactionExecutor } from "@repo/api-core";

import { Injectable } from "@nestjs/common";

import type { NotificationView } from "./notifications.types";

import { NotificationDispatchService } from "./services/notification-dispatch.service";
import { NotificationDeliveryUseCase } from "./use-cases/notification-delivery.use-case";
import { SendNotificationUseCase } from "./use-cases/send-notification.use-case";

export type {
  NotificationView as NotificationDto,
  NotificationJobView as NotificationJobDto,
} from "./notifications.types";

/**
 * Adapter implementing the USER_NOTIFICATION_SENDER port for cross-module
 * notification sending/dispatch, plus the scheduled delivery-job processor entry
 * point. Inbox, device, delivery-admin, and SSE endpoints inject the
 * notification use cases directly instead of this facade.
 */
@Injectable()
export class NotificationsService implements UserNotificationSender {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly deliveryUseCase: NotificationDeliveryUseCase,
    private readonly dispatchService: NotificationDispatchService,
  ) {}

  async sendToUser(
    actor: AuthenticatedRequestUser | null,
    input: SendUserNotificationInput,
    requestContext?: RequestContext,
    executor?: TransactionExecutor,
    options?: { deferDispatch?: boolean },
  ): Promise<NotificationMessage> {
    return this.sendNotificationUseCase.execute(actor, input, requestContext, executor, options);
  }

  dispatch(notification: NotificationView, organizationId: string): Promise<void> {
    this.dispatchService.dispatch(notification, organizationId);
    return Promise.resolve();
  }

  processDueJobs() {
    return this.deliveryUseCase.processDueJobs();
  }
}
