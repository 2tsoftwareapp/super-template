import type { INestApplicationContext } from '@nestjs/common';

import { EnvironmentService } from '@repo/api-core';
import { TenantContextService, WORKER_DISPATCH_CONTEXT } from '@repo/api-database';
import { AccessControlService } from '@repo/api-identity/modules/access-control/application/access-control.service';
import { AuthRepository } from '@repo/api-identity/modules/auth/infrastructure/auth.repository';
import { OrganizationsService } from '@repo/api-identity/modules/organizations/application/organizations.service';
import { UsersRepository } from '@repo/api-identity/modules/users/infrastructure/users.repository';
import { SettingsService } from '@repo/api-platform/modules/settings/application/settings.service';
import { NotificationsRepository } from '@repo/api-workspace/modules/notifications/infrastructure/notifications.repository';
import { ProjectsRepository } from '@repo/api-workspace/modules/projects/infrastructure/projects.repository';

import { seedAccessControl } from './seeds/access-control/seed';
import { seedNotifications } from './seeds/notifications/seed';
import { seedProjects } from './seeds/projects/seed';
import { seedSettings } from './seeds/settings/seed';
import { seedUsers } from './seeds/users/seed';

export const seedDatabase = async (
  app: INestApplicationContext,
): Promise<void> => {
  // Resolve the app-level services once and reuse them inside a single transaction so the seed stays atomic.
  const accessControlService = app.get(AccessControlService);
  const authRepository = app.get(AuthRepository);
  const notificationsRepository = app.get(NotificationsRepository);
  const organizationsService = app.get(OrganizationsService);
  const projectsRepository = app.get(ProjectsRepository);
  const settingsService = app.get(SettingsService);
  const usersRepository = app.get(UsersRepository);
  const environmentService = app.get(EnvironmentService);
  const tenantContextService = app.get(TenantContextService);

  await tenantContextService.runAsync(WORKER_DISPATCH_CONTEXT, () =>
    projectsRepository.client.transaction(async (transaction) => {
      // Seed order matters: policies and settings first, then identities, then dependent workspace records.
      await seedAccessControl(accessControlService, transaction);
      await seedSettings(settingsService, transaction);

      const seededUsers = await seedUsers(
        {
          accessControlService,
          environmentService,
          organizationsService,
          usersRepository,
        },
        transaction,
      );

      await seedProjects(projectsRepository, seededUsers, transaction);
      await seedNotifications(notificationsRepository, seededUsers, transaction);

      // Remove pre-existing sessions so a reset always boots into a clean, deterministic auth state.
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
