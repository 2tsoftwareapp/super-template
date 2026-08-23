import type { AuthenticatedRequestUser } from "@repo/api-core";

import { AppError, ERROR_CODES } from "@repo/api-core";

import { ROLE_NAMES } from "../../access-control/access-control.constants";

export function resolveUsersListOrganizationId(
  actor: AuthenticatedRequestUser,
): string | undefined {
  if (actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
    return undefined;
  }

  if (!actor.organizationId) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      "An organization context is required to list users",
      403,
    );
  }

  return actor.organizationId;
}

export function assertActorHasOrganizationContext(actor: AuthenticatedRequestUser): string {
  if (actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
    throw new AppError(
      ERROR_CODES.INTERNAL_ERROR,
      "Organization context assertion called for SUPER_ADMIN",
      500,
    );
  }

  if (!actor.organizationId) {
    throw new AppError(ERROR_CODES.AUTH_FORBIDDEN, "An organization context is required", 403);
  }

  return actor.organizationId;
}

export async function assertUserBelongsToOrganization(
  isMember: (userId: string, organizationId: string) => Promise<boolean>,
  actor: AuthenticatedRequestUser,
  targetUserId: string,
): Promise<void> {
  if (actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)) {
    return;
  }

  const organizationId = assertActorHasOrganizationContext(actor);
  const belongs = await isMember(targetUserId, organizationId);

  if (!belongs) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      "You can only manage users in your organization",
      403,
    );
  }
}
