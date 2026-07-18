import { describe, expect, it, vi } from 'vitest';

const seedAccessControl = vi.fn();
const seedSettings = vi.fn();
const seedUsers = vi.fn();
const seedNotifications = vi.fn();

vi.mock('../seeds/access-control/seed', () => ({
  seedAccessControl,
}));
vi.mock('../seeds/settings/seed', () => ({
  seedSettings,
}));
vi.mock('../seeds/users/seed', () => ({
  seedUsers,
}));
vi.mock('../seeds/notifications/seed', () => ({
  seedNotifications,
}));

describe('seedDatabase', () => {
  it('runs the seed pipeline inside the worker tenant context and one transaction', async () => {
    const calls: string[] = [];
    const transaction = { id: 'tx-1' };
    const seededUsers = {
      adminUserId: 'admin-user',
      regularUserId: 'regular-user',
    };

    seedAccessControl.mockImplementation(async () => {
      calls.push('access-control');
    });
    seedSettings.mockImplementation(async () => {
      calls.push('settings');
    });
    seedUsers.mockImplementation(async () => {
      calls.push('users');
      return seededUsers;
    });
    seedNotifications.mockImplementation(async () => {
      calls.push('notifications');
    });

    const authRepository = {
      revokeAllSessionsForUser: vi.fn(async (userId: string) => {
        calls.push(`revoke:${userId}`);
      }),
    };
    const usersRepository = { id: 'users-repository' };
    const database = {
      transaction: vi.fn((callback: (value: unknown) => Promise<unknown>) =>
        callback(transaction),
      ),
    };
    const tenantContextService = {
      runAsync: vi.fn((context: unknown, callback: () => Promise<unknown>) =>
        callback(),
      ),
    };
    const app = {
      get: vi
        .fn()
        .mockReturnValueOnce({ id: 'access-control-service' })
        .mockReturnValueOnce(authRepository)
        .mockReturnValueOnce({ id: 'notifications-repository' })
        .mockReturnValueOnce({ id: 'organizations-service' })
        .mockReturnValueOnce({ id: 'settings-service' })
        .mockReturnValueOnce(usersRepository)
        .mockReturnValueOnce(database)
        .mockReturnValueOnce({ id: 'environment-service' })
        .mockReturnValueOnce(tenantContextService),
    };

    const { seedDatabase } = await import('../seed-data.js');

    await seedDatabase(app as never);

    expect(tenantContextService.runAsync).toHaveBeenCalledTimes(1);
    expect(database.transaction).toHaveBeenCalledTimes(1);
    expect(seedAccessControl).toHaveBeenCalledWith(
      { id: 'access-control-service' },
      transaction,
    );
    expect(seedSettings).toHaveBeenCalledWith(
      { id: 'settings-service' },
      transaction,
    );
    expect(seedUsers).toHaveBeenCalledWith(
      {
        accessControlService: { id: 'access-control-service' },
        environmentService: { id: 'environment-service' },
        organizationsService: { id: 'organizations-service' },
        usersRepository,
      },
      transaction,
    );
    expect(seedNotifications).toHaveBeenCalledWith(
      { id: 'notifications-repository' },
      seededUsers,
      transaction,
    );
    expect(authRepository.revokeAllSessionsForUser).toHaveBeenNthCalledWith(
      1,
      seededUsers.adminUserId,
      transaction,
    );
    expect(authRepository.revokeAllSessionsForUser).toHaveBeenNthCalledWith(
      2,
      seededUsers.regularUserId,
      transaction,
    );
    expect(calls).toEqual([
      'access-control',
      'settings',
      'users',
      'notifications',
      'revoke:admin-user',
      'revoke:regular-user',
    ]);
  });
});
