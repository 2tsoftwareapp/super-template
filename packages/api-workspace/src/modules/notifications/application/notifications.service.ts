import type { MessageEvent } from '@nestjs/common';
import type {
  AuthenticatedRequestUser,
  NotificationMessage,
  RequestContext,
  SendUserNotificationInput,
} from '@repo/api-core';
import type { DatabaseExecutor } from '@repo/api-database';
import type { Observable } from 'rxjs';

import { Injectable } from '@nestjs/common';

import type {
  ListNotificationJobsQuery,
  ListNotificationsQuery,
  NotificationJobView,
  NotificationView,
  RegisterDeviceCommand,
  SendNotificationRequestCommand,
} from './notifications.types';

import { NotificationDispatchService } from './services/notification-dispatch.service';
import { NotificationDeliveryUseCase } from './use-cases/notification-delivery.use-case';
import { NotificationDeviceUseCase } from './use-cases/notification-device.use-case';
import { NotificationInboxUseCase } from './use-cases/notification-inbox.use-case';
import { SendNotificationUseCase } from './use-cases/send-notification.use-case';

export type {
  NotificationView as NotificationDto,
  NotificationJobView as NotificationJobDto,
} from './notifications.types';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase,
    private readonly deliveryUseCase: NotificationDeliveryUseCase,
    private readonly inboxUseCase: NotificationInboxUseCase,
    private readonly deviceUseCase: NotificationDeviceUseCase,
    private readonly dispatchService: NotificationDispatchService,
  ) {}

  async sendToUser(
    actor: AuthenticatedRequestUser | null,
    input: SendUserNotificationInput,
    requestContext?: RequestContext,
    executor?: DatabaseExecutor,
    options?: { deferDispatch?: boolean },
  ): Promise<NotificationMessage> {
    return this.sendNotificationUseCase.execute(
      actor,
      input,
      requestContext,
      executor,
      options,
    );
  }

  createDeliveryJob(
    actor: AuthenticatedRequestUser,
    input: SendNotificationRequestCommand,
    requestContext?: RequestContext,
  ): Promise<NotificationJobView> {
    return this.deliveryUseCase.createDeliveryJob(
      actor,
      input,
      requestContext,
    );
  }

  listJobs(query: ListNotificationJobsQuery) {
    return this.deliveryUseCase.listJobs(query);
  }

  getJob(jobId: string) {
    return this.deliveryUseCase.getJob(jobId);
  }

  cancelJob(actor: AuthenticatedRequestUser, jobId: string) {
    return this.deliveryUseCase.cancelJob(actor, jobId);
  }

  processDueJobs() {
    return this.deliveryUseCase.processDueJobs();
  }

  processJob(jobId: string) {
    return this.deliveryUseCase.processJob(jobId);
  }

  dispatch(notification: NotificationView): Promise<void> {
    this.dispatchService.dispatch(notification);
    return Promise.resolve();
  }

  streamForUser(userId: string): Observable<MessageEvent> {
    return this.dispatchService.streamForUser(userId);
  }

  registerDevice(
    user: AuthenticatedRequestUser,
    input: RegisterDeviceCommand,
  ) {
    return this.deviceUseCase.registerDevice(user, input);
  }

  unregisterDevice(user: AuthenticatedRequestUser, token: string) {
    return this.deviceUseCase.unregisterDevice(user, token);
  }

  listForUser(user: AuthenticatedRequestUser, query: ListNotificationsQuery) {
    return this.inboxUseCase.listForUser(user, query);
  }

  unreadCount(user: AuthenticatedRequestUser) {
    return this.inboxUseCase.unreadCount(user);
  }

  markRead(user: AuthenticatedRequestUser, notificationId: string) {
    return this.inboxUseCase.markRead(user, notificationId);
  }

  markAllRead(user: AuthenticatedRequestUser) {
    return this.inboxUseCase.markAllRead(user);
  }

  delete(user: AuthenticatedRequestUser, notificationId: string) {
    return this.inboxUseCase.delete(user, notificationId);
  }
}
