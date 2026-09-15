import type { FeatureSeedContext, FeatureSeeder } from "@repo/api-plugin-kit";
import type { DatabaseExecutor } from "@repo/database-runtime";

import { hashPassword } from "@repo/api-kernel";
import { EnvironmentService } from "@repo/api-runtime";
import {
  ROLE_NAMES,
  USER_ACCESS_CONTROL,
  type UserAccessControl,
} from "@repo/feature-access-control/contracts";
import {
  ORGANIZATION_ACCESS_CONTROL,
  type OrganizationAccessControlPort,
} from "@repo/feature-organizations/contracts";
import { EnsurePersonalOrganizationUseCase } from "@repo/feature-organizations/module";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "@repo/feature-users/contracts";

/** Bag key written by the users seeder for downstream notifications/auth seeders. */
export const SEEDED_USERS_BAG_KEY = "seededUsers";

export interface SeededUsersBag {
  adminUserId: string;
  adminOrganizationId: string | null;
  regularUserId: string;
  regularOrganizationId: string | null;
}

/**
 * Seeder id contributed by `@repo/feature-access-control`'s `seed.ts`. Roles and
 * permissions must exist before the seeded users can be granted them; the edge
 * is declared here because it is a seed-time ordering contract, not an import.
 */
const ACCESS_CONTROL_SEEDER_ID = "access-control";

async function runUsersSeed(ctx: FeatureSeedContext): Promise<void> {
  const accessControlService = ctx.app.get(USER_ACCESS_CONTROL) as UserAccessControl;
  const environmentService = ctx.app.get(EnvironmentService) as EnvironmentService;
  const organizationProvisioner = ctx.app.get(
    EnsurePersonalOrganizationUseCase,
  ) as EnsurePersonalOrganizationUseCase;
  const organizationAccessControl = ctx.app.get(
    ORGANIZATION_ACCESS_CONTROL,
  ) as OrganizationAccessControlPort;
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

    // Seeded users need a real organization as test fixture in both
    // organization models — org-scoped endpoints and RLS tests rely on it.
    // Created explicitly (independent of the organization-model capability)
    // and granted the organization admin role, mirroring the historical
    // personal-org provisioning flow.
    const organizationId = await organizationProvisioner.execute(
      user.id,
      user.displayName,
      executor,
    );
    await organizationAccessControl.ensureOrganizationAdminRole(organizationId, user.id, executor);

    return { userId: user.id, organizationId };
  };

  const adminEmail = environmentService.seedAdminEmail;
  const adminPassword = environmentService.seedAdminPassword;
  const userEmail = environmentService.seedUserEmail;
  const userPassword = environmentService.seedUserPassword;
  if (!adminEmail || !adminPassword || !userEmail || !userPassword) {
    throw new Error(
      "SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_USER_EMAIL, and SEED_USER_PASSWORD are required to run db:seed",
    );
  }

  const { userId: adminUserId, organizationId: adminOrganizationId } = await ensureUser({
    email: adminEmail,
    displayName: "Seed Admin",
    password: adminPassword,
    roleName: ROLE_NAMES.SUPER_ADMIN,
  });
  const { userId: regularUserId, organizationId: regularOrganizationId } = await ensureUser({
    email: userEmail,
    displayName: "Seed User",
    password: userPassword,
    roleName: ROLE_NAMES.USER,
  });

  ctx.bag[SEEDED_USERS_BAG_KEY] = {
    adminUserId,
    adminOrganizationId,
    regularUserId,
    regularOrganizationId,
  } satisfies SeededUsersBag;
}

export const usersSeeders: readonly FeatureSeeder[] = [
  { id: "users", dependsOn: [ACCESS_CONTROL_SEEDER_ID], run: runUsersSeed },
];
