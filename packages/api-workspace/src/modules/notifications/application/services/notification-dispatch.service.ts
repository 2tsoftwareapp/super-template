import type { MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';

import { Inject, Injectable } from '@nestjs/common';

import type { NotificationView } from '../notifications.types';

import { NotificationStreamService } from '../../infrastructure/notification-stream.service';
import { PUSH_NOTIFIER, type PushNotifier } from '../push.interface';

@Injectable()
export class NotificationDispatchService {
  constructor(
    private readonly notificationStreamService: NotificationStreamService,
    @Inject(PUSH_NOTIFIER) private readonly pushNotifier: PushNotifier,
  ) {}

  dispatch(notification: NotificationView) {
    this.notificationStreamService.emit(notification.userId, notification);

    void this.pushNotifier
      .sendToUser(notification.userId, {
        notificationId: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
      })
      .catch(() => {
        // Push delivery is best-effort; inbox state remains the source of truth.
      });
  }

  streamForUser(userId: string): Observable<MessageEvent> {
    return this.notificationStreamService.stream(userId);
  }
}
