import { describe, expect, it, vi } from 'vitest';

import { NotificationDeliveryUseCase } from '../use-cases/notification-delivery.use-case';

describe('NotificationDeliveryUseCase', () => {
  it('resolves recipients for USER, USERS, and ALL audiences', async () => {
    const userLookup = {
      findActiveUserInOrganization: vi.fn(
        async (userId: string, _organizationId: string) =>
          userId === 'active-user'
            ? { id: 'active-user', status: 'ACTIVE', email: 'test@example.com', displayName: 'Test User' }
            : null,
      ),
      filterActiveUserIdsInOrganization: vi.fn(
        async (userIds: string[], _organizationId: string) =>
          userIds.filter((id) => id !== 'blocked-user'),
      ),
      listDeliverableUserIdsInOrganization: vi.fn(
        async (_organizationId: string) => ['user-a', 'user-b'],
      ),
    };

    const delivery = new NotificationDeliveryUseCase(
      {} as never,
      {} as never,
      {} as never,
      userLookup,
      {} as never,
      {} as never,
    );

    await expect(
      delivery.resolveRecipientIds({
        audience: 'USER',
        targetUserId: 'active-user',
        organizationId: 'org-a',
      } as never),
    ).resolves.toEqual(['active-user']);

    await expect(
      delivery.resolveRecipientIds({
        audience: 'USERS',
        userIds: ['active-user', 'blocked-user'],
        organizationId: 'org-a',
      } as never),
    ).resolves.toEqual(['active-user']);

    await expect(
      delivery.resolveRecipientIds({
        audience: 'ALL',
        organizationId: 'org-a',
      } as never),
    ).resolves.toEqual(['user-a', 'user-b']);
  });
});
