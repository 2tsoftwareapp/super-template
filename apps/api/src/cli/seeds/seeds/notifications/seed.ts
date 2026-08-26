import type { NotificationsRepositoryPort } from "@repo/feature-notifications/contracts";

import { type DatabaseExecutor } from "@repo/database-runtime";

import { type SeededUsersContext } from "../types";

export async function seedNotifications(
  notificationsRepository: NotificationsRepositoryPort,
  context: SeededUsersContext,
  executor: DatabaseExecutor,
): Promise<void> {
  // Only seed the welcome notification once so repeated resets keep the same visible inbox shape.
  const existingSeedNotifications = await notificationsRepository.listForUser(
    context.regularUserId,
    context.regularOrganizationId,
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
        userId: context.regularUserId,
        organizationId: context.regularOrganizationId,
        type: "system.seed",
        title: "Welcome to the starter",
        body: "Your account has been provisioned with sample data.",
      },
      executor,
    );
  }
}
