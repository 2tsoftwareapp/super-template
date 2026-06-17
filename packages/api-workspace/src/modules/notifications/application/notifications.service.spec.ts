import { describe, expect, it, vi } from 'vitest';
import { AUDIT_WRITER, USER_LOOKUP } from '@repo/api-core';
import { NotificationsService } from '../application/notifications.service';
import { PUSH_NOTIFIER } from '../application/push.interface';
import { DeviceTokensRepository } from '../infrastructure/device-tokens.repository';
import { NotificationJobsRepository } from '../infrastructure/notification-jobs.repository';
import { NotificationStreamService } from '../infrastructure/notification-stream.service';
import { NotificationsRepository } from '../infrastructure/notifications.repository';

describe('NotificationsService delivery jobs', () => {
  it('resolves recipients for USER, USERS, and ALL audiences', async () => {
    const userLookup = {
      findById: vi.fn(async (userId: string) =>
        userId === 'active-user'
          ? { id: 'active-user', status: 'ACTIVE' }
          : null,
      ),
      filterExistingUserIds: vi.fn(async (userIds: string[]) =>
        userIds.filter((id) => id !== 'blocked-user'),
      ),
      listDeliverableUserIds: vi.fn(async () => ['user-a', 'user-b']),
    };

    const service = new NotificationsService(
      {} as NotificationsRepository,
      {} as NotificationJobsRepository,
      userLookup,
      {} as DeviceTokensRepository,
      {} as NotificationStreamService,
      { sendToUser: vi.fn() },
      { log: vi.fn() },
    );

    await expect(
      service['resolveRecipientIds']({
        audience: 'USER',
        targetUserId: 'active-user',
      } as never),
    ).resolves.toEqual(['active-user']);

    await expect(
      service['resolveRecipientIds']({
        audience: 'USERS',
        userIds: ['active-user', 'blocked-user'],
      } as never),
    ).resolves.toEqual(['active-user']);

    await expect(
      service['resolveRecipientIds']({
        audience: 'ALL',
      } as never),
    ).resolves.toEqual(['user-a', 'user-b']);
  });
});
