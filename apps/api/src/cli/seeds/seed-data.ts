import type { INestApplicationContext } from "@nestjs/common";
import type { DatabaseClient } from "@repo/database-runtime";

import { EnvironmentService } from "@repo/api-runtime";
import { TenantContextService, WORKER_DISPATCH_CONTEXT } from "@repo/api-runtime";
import { DATABASE } from "@repo/database-runtime";
import { AccessControlService } from "@repo/feature-access-control/contracts";
import { AUTH_SESSION_REPOSITORY, type AuthSessionRepositoryPort } from "@repo/feature-auth/contracts";
import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepositoryPort,
} from "@repo/feature-notifications/contracts";
import { OrganizationsService } from "@repo/feature-organizations/contracts";
import { EnsureSettingsSeedDataUseCase } from "@repo/feature-settings/contracts";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "@repo/feature-users/contracts";

import { seedAccessControl } from "./seeds/access-control/seed";
import { seedNotifications } from "./seeds/notifications/seed";
import { seedSettings } from "./seeds/settings/seed";
import { seedUsers } from "./seeds/users/seed";

export const seedDatabase = async (app: INestApplicationContext): Promise<void> => {
  const accessControlService = app.get(AccessControlService);
  const authRepository = app.get<AuthSessionRepositoryPort>(AUTH_SESSION_REPOSITORY);
  const notificationsRepository = app.get<NotificationsRepositoryPort>(NOTIFICATIONS_REPOSITORY);
  const organizationsService = app.get(OrganizationsService);
  const ensureSettingsSeedData = app.get(EnsureSettingsSeedDataUseCase);
  const usersRepository = app.get<UsersRepositoryPort>(USERS_REPOSITORY);
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
      await authRepository.revokeAllSessionsForUser(seededUsers.adminUserId, transaction);
      await authRepository.revokeAllSessionsForUser(seededUsers.regularUserId, transaction);
    }),
  );
};
