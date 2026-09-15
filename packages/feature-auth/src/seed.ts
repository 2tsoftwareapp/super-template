import type { FeatureSeedContext, FeatureSeeder } from "@repo/api-plugin-kit";
import type { DatabaseExecutor } from "@repo/database-runtime";

import { AUTH_TOKEN_MAINTENANCE, type AuthTokenMaintenance } from "@repo/feature-auth/contracts";

interface SeededUsersBag {
  adminUserId: string;
  adminOrganizationId: string;
  regularUserId: string;
  regularOrganizationId: string;
}

/**
 * Seeder id contributed by `@repo/feature-user-management`'s `users.seed.ts`.
 * Kept a literal on purpose: this package has no package-level dependency on
 * that feature (the coupling is the `bag.seededUsers` fixture contract written
 * at seed time), so the ordering edge is declared on the seeder instead.
 */
const USERS_SEEDER_ID = "users";

async function runAuthSessionCleanupSeed(ctx: FeatureSeedContext): Promise<void> {
  const seededUsers = ctx.bag.seededUsers as SeededUsersBag | undefined;
  if (!seededUsers) {
    throw new Error(
      `Auth seeder requires bag.seededUsers from the "${USERS_SEEDER_ID}" seeder. Ensure it is composed and declares no failed dependency.`,
    );
  }

  const tokenMaintenance = ctx.app.get(AUTH_TOKEN_MAINTENANCE) as AuthTokenMaintenance;
  const executor = ctx.executor as DatabaseExecutor;

  await tokenMaintenance.revokeAllSessionsForUser(seededUsers.adminUserId, executor);
  await tokenMaintenance.revokeAllSessionsForUser(seededUsers.regularUserId, executor);
}

export const authSeeders: readonly FeatureSeeder[] = [
  { id: "auth-session-cleanup", dependsOn: [USERS_SEEDER_ID], run: runAuthSessionCleanupSeed },
];
