import type { AuthenticatedRequestUser } from "../types/request-context";

import { AppError } from "../errors/app-error";

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
