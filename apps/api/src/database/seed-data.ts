import type { INestApplicationContext } from '@nestjs/common';
import { EnvironmentService } from '@repo/api-core';
import { ROLE_NAMES } from '@repo/api-identity/modules/access-control/access-control.constants';
import { AccessControlService } from '@repo/api-identity/modules/access-control/application/access-control.service';
import { hashPassword } from '@repo/api-identity/modules/auth/application/auth.helpers';
import { AuthRepository } from '@repo/api-identity/modules/auth/infrastructure/auth.repository';
import { OrganizationsService } from '@repo/api-identity/modules/organizations/application/organizations.service';
import { UsersRepository } from '@repo/api-identity/modules/users/infrastructure/users.repository';
import { SettingsService } from '@repo/api-platform/modules/settings/application/settings.service';
import { NotificationsRepository } from '@repo/api-workspace/modules/notifications/infrastructure/notifications.repository';
import { ProjectsRepository } from '@repo/api-workspace/modules/projects/infrastructure/projects.repository';

export const seedDatabase = async (
  app: INestApplicationContext,
): Promise<void> => {
  const accessControlService = app.get(AccessControlService);
  const authRepository = app.get(AuthRepository);
  const notificationsRepository = app.get(NotificationsRepository);
  const organizationsService = app.get(OrganizationsService);
  const projectsRepository = app.get(ProjectsRepository);
  const settingsService = app.get(SettingsService);
  const usersRepository = app.get(UsersRepository);
  const environmentService = app.get(EnvironmentService);

  await projectsRepository.client.transaction(async (transaction) => {
    await accessControlService.ensureSeedData(transaction);
    await settingsService.ensureSeedData(transaction);

    const ensureUser = async (params: {
      email: string;
      displayName: string;
      password: string;
      roleName: string;
    }) => {
      const normalizedEmail = params.email.trim().toLowerCase();
      let user = await usersRepository.findByEmail(
        normalizedEmail,
        transaction,
      );

      if (!user) {
        user = await usersRepository.create(
          {
            email: normalizedEmail,
            passwordHash: await hashPassword(params.password),
            displayName: params.displayName,
            status: 'ACTIVE',
            emailVerifiedAt: new Date(),
          },
          transaction,
        );
      } else {
        const updatedUser = await usersRepository.update(
          user.id,
          {
            passwordHash: await hashPassword(params.password),
            displayName: params.displayName,
            status: 'ACTIVE',
            emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
          },
          transaction,
        );

        if (!updatedUser) {
          throw new Error('Seed user update returned no rows');
        }

        user = updatedUser;
      }

      const role = await accessControlService.getRoleByName(
        params.roleName,
        transaction,
      );

      if (!role) {
        throw new Error(`Seed role ${params.roleName} was not found.`);
      }

      await accessControlService.replaceUserRoles(
        user.id,
        [role.id],
        transaction,
      );

      const organizationId =
        await organizationsService.ensurePersonalOrganization(
          user.id,
          user.displayName,
          transaction,
        );

      return { user, organizationId };
    };

    const { user: adminUser, organizationId: adminOrganizationId } =
      await ensureUser({
        email: environmentService.values.SEED_ADMIN_EMAIL,
        displayName: 'Seed Admin',
        password: environmentService.values.SEED_ADMIN_PASSWORD,
        roleName: ROLE_NAMES.SUPER_ADMIN,
      });
    const { user: regularUser, organizationId: regularOrganizationId } =
      await ensureUser({
        email: environmentService.values.SEED_USER_EMAIL,
        displayName: 'Seed User',
        password: environmentService.values.SEED_USER_PASSWORD,
        roleName: ROLE_NAMES.USER,
      });

    const ensureProject = async (
      ownerId: string,
      organizationId: string,
      name: string,
      description: string,
    ) => {
      const existing = await projectsRepository.findActiveByOwnerAndName(
        ownerId,
        name,
        transaction,
      );

      if (!existing) {
        await projectsRepository.create(
          {
            ownerId,
            organizationId,
            name,
            description,
            status: 'ACTIVE',
            createdById: adminUser.id,
          },
          transaction,
        );
      }
    };

    await ensureProject(
      adminUser.id,
      adminOrganizationId,
      'Starter Admin Project',
      'Reference admin-owned project',
    );
    await ensureProject(
      regularUser.id,
      regularOrganizationId,
      'Starter User Project',
      'Reference user-owned project',
    );

    const existingSeedNotifications = await notificationsRepository.listForUser(
      regularUser.id,
      {
        page: 1,
        limit: 1,
        type: 'system.seed',
      },
      transaction,
    );

    if (existingSeedNotifications.rows.length === 0) {
      await notificationsRepository.create(
        {
          userId: regularUser.id,
          organizationId: regularOrganizationId,
          type: 'system.seed',
          title: 'Welcome to the starter',
          body: 'Your account has been provisioned with sample data.',
        },
        transaction,
      );
    }

    await authRepository.revokeAllSessionsForUser(adminUser.id, transaction);
    await authRepository.revokeAllSessionsForUser(regularUser.id, transaction);
  });
};
