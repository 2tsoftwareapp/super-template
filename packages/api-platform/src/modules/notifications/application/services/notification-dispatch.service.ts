import { Inject, Injectable } from '@nestjs/common';
import {
  USER_PREFERENCES_LOOKUP,
  type UserPreferencesLookup,
} from '@repo/api-core';

import type { NotificationView } from '../notifications.types';

import { NotificationStreamService } from '../../infrastructure/notification-stream.service';
import { PUSH_NOTIFIER, type PushNotifier } from '../push.interface';

@Injectable()
export class NotificationDispatchService {
  constructor(
    private readonly notificationStreamService: NotificationStreamService,
    @Inject(PUSH_NOTIFIER) private readonly pushNotifier: PushNotifier,
    @Inject(USER_PREFERENCES_LOOKUP)
    private readonly userPreferencesLookup: UserPreferencesLookup,
  ) {}

  dispatch(notification: NotificationView) {
    this.notificationStreamService.emit(notification.userId, notification);

    void this.userPreferencesLookup
      .findNotificationPreferencesByUserId(notification.userId)
      .then((preferences) => {
        if (!preferences.push) {
          return;
        }

        return this.pushNotifier.sendToUser(notification.userId, {
          notificationId: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          data: notification.data,
        });
      })
      .catch(() => {
        // Push delivery is best-effort; inbox state remains the source of truth.
      });
  }

  streamForUser(userId: string) {
    return this.notificationStreamService.stream(userId);
  }
}
