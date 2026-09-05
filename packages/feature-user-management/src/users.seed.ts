import type { FeatureSeedContext, FeatureSeeder } from "@repo/api-plugin-kit";
import type { DatabaseExecutor } from "@repo/database-runtime";

import { EnvironmentService } from "@repo/api-runtime";
import {
  ROLE_NAMES,
  USER_ACCESS_CONTROL,
  type UserAccessControl,
} from "@repo/feature-access-control/contracts";
import {
  PERSONAL_ORGANIZATION_PROVISIONER,
  type PersonalOrganizationProvisioner,
} from "@repo/feature-organization-management/contracts";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "@repo/feature-users/contracts";
import { hashPassword } from "@repo/api-kernel";

/** Bag key written by the users seeder for downstream notifications/auth seeders. */
export const SEEDED_USERS_BAG_KEY = "seededUsers";

export interface SeededUsersBag {
  adminUserId: string;
  adminOrganizationId: string;
  regularUserId: string;
  regularOrganizationId: string;
}

async function runUsersSeed(ctx: FeatureSeedContext): Promise<void> {
  const accessControlService = ctx.app.get(USER_ACCESS_CONTROL) as UserAccessControl;
  const environmentService = ctx.app.get(EnvironmentService) as EnvironmentService;
  const personalOrganizationProvisioner = ctx.app.get(
    PERSONAL_ORGANIZATION_PROVISIONER,
  ) as PersonalOrganizationProvisioner;
  const usersRepository = ctx.app.get(USERS_REPOSITORY) as UsersRepositoryPort;
  const executor = ctx.executor as DatabaseExecutor;

  const ensureUser = async (input: {
    email: string;
    displayName: string;
    password: string;
    roleName: string;
  }) => {
    const normalizedEmail = input.email.trim().toLowerCase();
    let user = await usersRepository.findByEmail(normalizedEmail, executor);

    if (!user) {
      const passwordHash = await hashPassword(input.password);
      user = await usersRepository.create(
        {
          email: normalizedEmail,
          passwordHash,
          displayName: input.displayName,
          status: "ACTIVE",
          emailVerifiedAt: new Date(),
        },
        executor,
      );
    } else {
      const passwordHash = await hashPassword(input.password);
      const updatedUser = await usersRepository.update(
        user.id,
        {
          passwordHash,
          displayName: input.displayName,
          status: "ACTIVE",
          emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        },
        executor,
      );

      if (!updatedUser) {
        throw new Error("Seed user update returned no rows");
      }

      user = updatedUser;
    }

    const role = await accessControlService.getRoleByName(input.roleName, null, executor);

    if (!role) {
      throw new Error(`Seed role ${input.roleName} was not found.`);
    }

    await accessControlService.replaceUserRoles(user.id, [role.id], null, executor);

    const organizationId = (await personalOrganizationProvisioner.ensurePersonalOrganization(
      user.id,
      user.displayName,
      executor,
    )) as string;

    return { userId: user.id, organizationId };
  };

  const { userId: adminUserId, organizationId: adminOrganizationId } = await ensureUser({
    email: environmentService.seedAdminEmail,
    displayName: "Seed Admin",
    password: environmentService.seedAdminPassword,
    roleName: ROLE_NAMES.SUPER_ADMIN,
  });
  const { userId: regularUserId, organizationId: regularOrganizationId } = await ensureUser({
    email: environmentService.seedUserEmail,
    displayName: "Seed User",
    password: environmentService.seedUserPassword,
    roleName: ROLE_NAMES.USER,
  });

  ctx.bag[SEEDED_USERS_BAG_KEY] = {
    adminUserId,
    adminOrganizationId,
    regularUserId,
    regularOrganizationId,
  } satisfies SeededUsersBag;
}

export const usersSeeders: readonly FeatureSeeder[] = [{ id: "users", run: runUsersSeed }];
