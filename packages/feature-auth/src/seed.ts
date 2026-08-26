 
import type { FeatureSeedContext, FeatureSeeder } from "@repo/api-plugin-kit";
import type { DatabaseExecutor } from "@repo/database-runtime";

import { AUTH_TOKEN_CLEANUP, type AuthTokenCleanup } from "@repo/api-runtime";

interface SeededUsersBag {
  adminUserId: string;
  adminOrganizationId: string;
  regularUserId: string;
  regularOrganizationId: string;
}

async function runAuthSessionCleanupSeed(ctx: FeatureSeedContext): Promise<void> {
  const seededUsers = ctx.bag.seededUsers as SeededUsersBag | undefined;
  if (!seededUsers) {
    throw new Error(
      'Auth seeder requires bag.seededUsers from the users seeder. Ensure "users" is composed before "auth".',
    );
  }

  const authTokenCleanup = ctx.app.get(AUTH_TOKEN_CLEANUP) as AuthTokenCleanup;
  const executor = ctx.executor as DatabaseExecutor;

  await authTokenCleanup.revokeAllSessionsForUser(seededUsers.adminUserId, executor);
  await authTokenCleanup.revokeAllSessionsForUser(seededUsers.regularUserId, executor);
}

export const authSeeders: readonly FeatureSeeder[] = [
  { id: "auth-session-cleanup", run: runAuthSessionCleanupSeed },
];
