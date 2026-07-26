import type { EnvironmentService } from '@repo/api-core';
import type { AccessControlService } from '@repo/api-identity/modules/access-control/application/access-control.service';
import type { OrganizationsService } from '@repo/api-identity/modules/organizations/application/organizations.service';
import type { UsersRepositoryPort } from '@repo/api-identity/modules/users/application/ports/users.repository.port';

import { type DatabaseExecutor } from '@repo/api-database';
import { ROLE_NAMES } from '@repo/api-identity/modules/access-control/access-control.constants';
import { hashPassword } from '@repo/api-identity/modules/auth/application/auth.helpers';

import { type SeededUsersContext } from '../types';

export async function seedUsers(
  params: {
    accessControlService: AccessControlService;
    environmentService: EnvironmentService;
    organizationsService: OrganizationsService;
    usersRepository: UsersRepositoryPort;
  },
  executor: DatabaseExecutor,
): Promise<SeededUsersContext> {
  // This helper keeps user creation/update idempotent so repeated seeds do not duplicate accounts.
  const ensureUser = async (input: {
    email: string;
    displayName: string;
    password: string;
    roleName: string;
  }) => {
    const normalizedEmail = input.email.trim().toLowerCase();
    console.log(`[DEBUG] seedUsers: ensureUser ${normalizedEmail} - findByEmail`);
    let user = await params.usersRepository.findByEmail(normalizedEmail, executor);

    if (!user) {
      console.log(`[DEBUG] seedUsers: ensureUser ${normalizedEmail} - hashPassword`);
      const passwordHash = await hashPassword(input.password);
      console.log(`[DEBUG] seedUsers: ensureUser ${normalizedEmail} - create`);
      user = await params.usersRepository.create(
        {
          email: normalizedEmail,
          passwordHash,
          displayName: input.displayName,
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
        executor,
      );
    } else {
      console.log(`[DEBUG] seedUsers: ensureUser ${normalizedEmail} - update (hashPassword)`);
      const passwordHash = await hashPassword(input.password);
      console.log(`[DEBUG] seedUsers: ensureUser ${normalizedEmail} - update`);
      const updatedUser = await params.usersRepository.update(
        user.id,
        {
          passwordHash,
          displayName: input.displayName,
          status: 'ACTIVE',
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        },
        executor,
      );

      if (!updatedUser) {
        throw new Error('Seed user update returned no rows');
      }

      user = updatedUser;
    }
    console.log(`[DEBUG] seedUsers: ensureUser ${normalizedEmail} - done user db`);

    console.log(`[DEBUG] seedUsers: ensureUser ${normalizedEmail} - getRoleByName`);
    const role = await params.accessControlService.getRoleByName(
      input.roleName,
      null,
      executor,
    );

    if (!role) {
      throw new Error(`Seed role ${input.roleName} was not found.`);
    }

    console.log(`[DEBUG] seedUsers: ensureUser ${normalizedEmail} - replaceUserRoles`);
    // Assign the exact bootstrap role for each account instead of relying on defaults.
    await params.accessControlService.replaceUserRoles(
      user.id,
      [role.id],
      null,
      executor,
    );

    console.log(`[DEBUG] seedUsers: ensureUser ${normalizedEmail} - ensurePersonalOrganization`);
    const organizationId =
      await params.organizationsService.ensurePersonalOrganization(
        user.id,
        user.displayName,
        executor,
      );

    console.log(`[DEBUG] seedUsers: ensureUser ${normalizedEmail} - all done`);
    return { userId: user.id, organizationId };
  };

  const { userId: adminUserId, organizationId: adminOrganizationId } =
    await ensureUser({
      email: params.environmentService.seedAdminEmail,
      displayName: 'Seed Admin',
      password: params.environmentService.seedAdminPassword,
      roleName: ROLE_NAMES.SUPER_ADMIN,
    });
  const { userId: regularUserId, organizationId: regularOrganizationId } =
    await ensureUser({
      email: params.environmentService.seedUserEmail,
      displayName: 'Seed User',
      password: params.environmentService.seedUserPassword,
      roleName: ROLE_NAMES.USER,
    });

  return {
    adminUserId,
    adminOrganizationId,
    regularUserId,
    regularOrganizationId,
  };
}
