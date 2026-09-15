import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { AppError, PLATFORM_ROLE_NAMES } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";

/**
 * The slice of the organization-membership port this policy uses: "does a
 * membership row exist for this (organization, user) pair". Declared here as a
 * structural type instead of importing the port from the organizations feature
 * — a `domain/` file must not depend on a sibling feature (ADR 0001 rule 1).
 * The injected port satisfies it, and only the answer's nullability is read.
 */
export interface OrganizationMembershipLookup {
  findMembership(organizationId: string, userId: string): Promise<unknown>;
}

export function resolveUsersListOrganizationId(
  actor: AuthenticatedRequestUser,
): string | undefined {
  if (actor.roles.includes(PLATFORM_ROLE_NAMES.SUPER_ADMIN)) {
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
  if (actor.roles.includes(PLATFORM_ROLE_NAMES.SUPER_ADMIN)) {
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
  membership: OrganizationMembershipLookup,
  actor: AuthenticatedRequestUser,
  targetUserId: string,
): Promise<void> {
  if (actor.roles.includes(PLATFORM_ROLE_NAMES.SUPER_ADMIN)) {
    return;
  }

  const organizationId = assertActorHasOrganizationContext(actor);
  const record = await membership.findMembership(organizationId, targetUserId);

  if (!record) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      "You can only manage users in your organization",
      403,
    );
  }
}
