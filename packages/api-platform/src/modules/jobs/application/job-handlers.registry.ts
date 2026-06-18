import { Inject, Injectable } from '@nestjs/common';
import {
  AUTH_TOKEN_CLEANUP,
  type AuthTokenCleanup,
  USER_NOTIFICATION_SENDER,
  type UserNotificationSender,
} from '@repo/api-core';

import type { JobHandler } from './jobs.types';

import { MailService } from '../../mail/application/mail.service';

@Injectable()
export class JobHandlersRegistry {
  private readonly handlers = new Map<string, JobHandler>();

  constructor(
    private readonly mailService: MailService,
    @Inject(AUTH_TOKEN_CLEANUP)
    private readonly authTokenCleanup: AuthTokenCleanup,
    @Inject(USER_NOTIFICATION_SENDER)
    private readonly notificationSender: UserNotificationSender,
  ) {
    this.registerHandler('mail.send', async ({ payload }) => {
      const templateKey =
        typeof payload.templateKey === 'string' ? payload.templateKey : '';
      const to = typeof payload.to === 'string' ? payload.to : '';
      const variables =
        (payload.variables as Record<string, string> | undefined) ?? {};

      if (!templateKey || !to) {
        throw new Error('mail.send requires templateKey and to');
      }

      await this.mailService.sendTemplate({
        templateKey,
        to,
        variables,
        metadata:
          (payload.metadata as Record<string, unknown> | undefined) ?? null,
      });
    });

    this.registerHandler('files.cleanup', async () => {
      // Stub: reserved for orphaned file cleanup.
    });

    this.registerHandler('auth.cleanup-tokens', async () => {
      await this.authTokenCleanup.cleanupExpiredTokens();
    });

    this.registerHandler('notification.send', async ({ payload, organizationId }) => {
      const userId = typeof payload.userId === 'string' ? payload.userId : '';
      const type = typeof payload.type === 'string' ? payload.type : '';
      const title = typeof payload.title === 'string' ? payload.title : '';
      const body = typeof payload.body === 'string' ? payload.body : '';

      if (!userId || !type || !title || !body) {
        throw new Error(
          'notification.send requires userId, type, title, and body',
        );
      }

      await this.notificationSender.sendToUser(null, {
        ...(organizationId ? { organizationId } : {}),
        userId,
        type,
        title,
        body,
        ...(payload.data
          ? { data: payload.data as Record<string, unknown> }
          : {}),
      });
    });
  }

  registerHandler(type: string, handler: JobHandler) {
    this.handlers.set(type, handler);
  }

  getHandler(type: string): JobHandler | undefined {
    return this.handlers.get(type);
  }
}
