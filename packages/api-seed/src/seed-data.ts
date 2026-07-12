import type { INestApplicationContext } from '@nestjs/common';
import type { DatabaseClient } from '@repo/api-database';

import { EnvironmentService } from '@repo/api-core';
import { DATABASE, TenantContextService, WORKER_DISPATCH_CONTEXT } from '@repo/api-database';
import { AccessControlService } from '@repo/api-identity/modules/access-control/application/access-control.service';
import { AuthRepository } from '@repo/api-identity/modules/auth/infrastructure/auth.repository';
import { OrganizationsService } from '@repo/api-identity/modules/organizations/application/organizations.service';
import { UsersRepository } from '@repo/api-identity/modules/users/infrastructure/users.repository';
import { NotificationsRepository } from '@repo/api-platform/modules/notifications/infrastructure/notifications.repository';
import { EnsureSettingsSeedDataUseCase } from '@repo/api-platform/modules/settings/application/use-cases/ensure-settings-seed-data.use-case';

import { seedAccessControl } from './seeds/access-control/seed';
import { seedNotifications } from './seeds/notifications/seed';
import { seedSettings } from './seeds/settings/seed';
import { seedUsers } from './seeds/users/seed';

export const seedDatabase = async (
  app: INestApplicationContext,
): Promise<void> => {
  const accessControlService = app.get(AccessControlService);
  const authRepository = app.get(AuthRepository);
  const notificationsRepository = app.get(NotificationsRepository);
  const organizationsService = app.get(OrganizationsService);
  const ensureSettingsSeedData = app.get(EnsureSettingsSeedDataUseCase);
  const usersRepository = app.get(UsersRepository);
  const database = app.get<DatabaseClient>(DATABASE);
  const environmentService = app.get(EnvironmentService);
  const tenantContextService = app.get(TenantContextService);

  await tenantContextService.runAsync(WORKER_DISPATCH_CONTEXT, () =>
    database.transaction(async (transaction) => {
      await seedAccessControl(accessControlService, transaction);
      await seedSettings(ensureSettingsSeedData, transaction);

      const seededUsers = await seedUsers(
        {
          accessControlService,
          environmentService,
          organizationsService,
          usersRepository,
        },
        transaction,
      );

      await seedNotifications(notificationsRepository, seededUsers, transaction);

      await authRepository.revokeAllSessionsForUser(
        seededUsers.adminUserId,
        transaction,
      );
      await authRepository.revokeAllSessionsForUser(
        seededUsers.regularUserId,
        transaction,
      );
    }),
  );
};
