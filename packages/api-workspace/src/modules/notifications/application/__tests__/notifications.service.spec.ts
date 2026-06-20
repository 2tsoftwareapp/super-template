import { describe, expect, it, vi } from 'vitest';

import { NotificationDeliveryUseCase } from '../use-cases/notification-delivery.use-case';

describe('NotificationDeliveryUseCase', () => {
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

    const delivery = new NotificationDeliveryUseCase(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      userLookup,
      {} as never,
      { log: vi.fn() },
    );

    await expect(
      delivery.resolveRecipientIds({
        audience: 'USER',
        targetUserId: 'active-user',
      } as never),
    ).resolves.toEqual(['active-user']);

    await expect(
      delivery.resolveRecipientIds({
        audience: 'USERS',
        userIds: ['active-user', 'blocked-user'],
      } as never),
    ).resolves.toEqual(['active-user']);

    await expect(
      delivery.resolveRecipientIds({
        audience: 'ALL',
      } as never),
    ).resolves.toEqual(['user-a', 'user-b']);
  });
});
