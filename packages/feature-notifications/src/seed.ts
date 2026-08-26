import type { FeatureSeedContext, FeatureSeeder } from "@repo/api-plugin-kit";
import type { DatabaseExecutor } from "@repo/database-runtime";

import {
  NOTIFICATIONS_REPOSITORY,
  type NotificationsRepositoryPort,
} from "./application/ports/notifications.repository.port";

interface SeededUsersBag {
  adminUserId: string;
  adminOrganizationId: string;
  regularUserId: string;
  regularOrganizationId: string;
}

async function runNotificationsSeed(ctx: FeatureSeedContext): Promise<void> {
  const seededUsers = ctx.bag.seededUsers as SeededUsersBag | undefined;
  if (!seededUsers) {
    throw new Error(
      'Notifications seeder requires bag.seededUsers from the users seeder. Ensure "users" is composed before "notifications".',
    );
  }

  const notificationsRepository = ctx.app.get(
    NOTIFICATIONS_REPOSITORY,
  ) as NotificationsRepositoryPort;
  const executor = ctx.executor as DatabaseExecutor;

  // Only seed the welcome notification once so repeated resets keep the same visible inbox shape.
  const existingSeedNotifications = await notificationsRepository.listForUser(
    seededUsers.regularUserId,
    seededUsers.regularOrganizationId,
    {
      page: 1,
      limit: 1,
      type: "system.seed",
    },
    executor,
  );

  if (existingSeedNotifications.rows.length === 0) {
    await notificationsRepository.create(
      {
        userId: seededUsers.regularUserId,
        organizationId: seededUsers.regularOrganizationId,
        type: "system.seed",
        title: "Welcome to the starter",
        body: "Your account has been provisioned with sample data.",
      },
      executor,
    );
  }
}

export const notificationsSeeders: readonly FeatureSeeder[] = [
  { id: "notifications", run: runNotificationsSeed },
];
