import type { AuthenticatedRequestUser } from "../types/request-context";

import { AppError } from "../errors/app-error";

/**
 * Sentinel organization id used for storage writes made in a platform
 * (organization-less) context. Kept as a UUID-shaped constant so existing
 * `uuid` columns and their indexes work unchanged while RLS policies can
 * still distinguish "user-scoped" rows from "organization-scoped" rows.
 */
export const PLATFORM_SCOPE_ORGANIZATION_ID = "00000000-0000-0000-0000-000000000000";

export const requireOrganizationId = (
  user: Pick<AuthenticatedRequestUser, "organizationId">,
): string => {
  if (!user.organizationId) {
    throw new AppError(
      // Platform-generic auth code; the aggregated catalog lives in api-runtime.
      "AUTH_FORBIDDEN",
      "An active organization is required",
      403,
    );
  }

  return user.organizationId;
};

/**
 * Organization id to write for tenant-scoped rows: the real organization when
 * the user has one, otherwise the platform-scope sentinel so org-less users
 * keep working with uuid-shaped storage columns.
 */
export const organizationIdForStorage = (
  user: Pick<AuthenticatedRequestUser, "organizationId">,
): string => user.organizationId ?? PLATFORM_SCOPE_ORGANIZATION_ID;
