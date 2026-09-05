import { AppError, ERROR_CODES } from "@repo/api-runtime";

import { ORGANIZATION_ERROR_CODES } from "../public/error-codes";
export type OrganizationMemberRole = "OWNER" | "ADMIN" | "MEMBER";

export interface OrganizationMembership {
  userId: string;
  role: OrganizationMemberRole;
}

export function assertOrganizationRole(
  membership: OrganizationMembership,
  allowedRoles: readonly OrganizationMemberRole[],
): void {
  if (!allowedRoles.includes(membership.role)) {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      "Your role in this organization does not allow this action",
      403,
    );
  }
}

/** ADMIN may only manage MEMBER targets. OWNER may manage ADMIN, MEMBER, and other OWNERs. */
export function assertCanManageTargetRole(
  actorRole: OrganizationMemberRole,
  targetRole: OrganizationMemberRole,
): void {
  if (actorRole === "OWNER") {
    return;
  }

  if (targetRole !== "MEMBER") {
    throw new AppError(
      ERROR_CODES.AUTH_FORBIDDEN,
      "Only an owner can manage admins or other owners",
      403,
    );
  }
}

export function assertNotLastOwner(
  membership: OrganizationMembership,
  remainingOwnerCount: number,
): void {
  if (membership.role === "OWNER" && remainingOwnerCount === 0) {
    throw new AppError(
      ORGANIZATION_ERROR_CODES.ORGANIZATION_LAST_OWNER,
      "Transfer ownership to another member before removing the last owner",
      409,
    );
  }
}
