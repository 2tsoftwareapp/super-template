import type { INestApplicationContext } from '@nestjs/common';
import type { DatabaseClient } from '@repo/api-database';

import { EnvironmentService } from '@repo/api-core';
import { TenantContextService, WORKER_DISPATCH_CONTEXT } from '@repo/api-core';
import { DATABASE } from '@repo/api-database';
import { AccessControlService } from '@repo/api-identity/modules/access-control/application/access-control.service';
import { AUTH_SESSION_REPOSITORY, type AuthSessionRepositoryPort } from '@repo/api-identity/modules/auth/application/ports/auth-session.repository.port';
import { OrganizationsService } from '@repo/api-identity/modules/organizations/application/organizations.service';
import { USERS_REPOSITORY, type UsersRepositoryPort } from '@repo/api-identity/modules/users/application/ports/users.repository.port';
import { NOTIFICATIONS_REPOSITORY, type NotificationsRepositoryPort } from '@repo/api-platform/modules/notifications/application/ports/notifications.repository.port';
import { EnsureSettingsSeedDataUseCase } from '@repo/api-platform/modules/settings/application/use-cases/ensure-settings-seed-data.use-case';

import { seedAccessControl } from './seeds/access-control/seed';
import { seedNotifications } from './seeds/notifications/seed';
import { seedSettings } from './seeds/settings/seed';
import { seedUsers } from './seeds/users/seed';

export const seedDatabase = async (
  app: INestApplicationContext,
): Promise<void> => {
  console.log('[DEBUG] seedDatabase: inside seedDatabase function');
  const accessControlService = app.get(AccessControlService);
  const authRepository = app.get<AuthSessionRepositoryPort>(AUTH_SESSION_REPOSITORY);
  const notificationsRepository = app.get<NotificationsRepositoryPort>(NOTIFICATIONS_REPOSITORY);
  const organizationsService = app.get(OrganizationsService);
  const ensureSettingsSeedData = app.get(EnsureSettingsSeedDataUseCase);
  const usersRepository = app.get<UsersRepositoryPort>(USERS_REPOSITORY);
  const database = app.get<DatabaseClient>(DATABASE);
  const environmentService = app.get(EnvironmentService);
  const tenantContextService = app.get(TenantContextService);

  console.log('[DEBUG] seedDatabase: starting tenant transaction');
  await tenantContextService.runAsync(WORKER_DISPATCH_CONTEXT, () =>
    database.transaction(async (transaction) => {
      console.log('[DEBUG] seedDatabase: seedAccessControl');
      await seedAccessControl(accessControlService, transaction);
      console.log('[DEBUG] seedDatabase: seedSettings');
      await seedSettings(ensureSettingsSeedData, transaction);

      console.log('[DEBUG] seedDatabase: seedUsers');
      const seededUsers = await seedUsers(
        {
          accessControlService,
          environmentService,
          organizationsService,
          usersRepository,
        },
        transaction,
      );

      console.log('[DEBUG] seedDatabase: seedNotifications');
      await seedNotifications(notificationsRepository, seededUsers, transaction);

      console.log('[DEBUG] seedDatabase: revoke sessions');
      await authRepository.revokeAllSessionsForUser(
        seededUsers.adminUserId,
        transaction,
      );
      await authRepository.revokeAllSessionsForUser(
        seededUsers.regularUserId,
        transaction,
      );
      console.log('[DEBUG] seedDatabase: transaction done');
    }),
  );
  console.log('[DEBUG] seedDatabase: done');
};
