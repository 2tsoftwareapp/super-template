import type { AuthLoginResponse } from "@/lib/api-types";

import { hasAdminAppAccess } from "@/lib/admin-resources";

import { AUTH_FLOW_ERROR_CODES, AUTH_FLOW_RESULTS } from "./auth.constants";
import { AuthFlowError } from "./auth.errors";

/**
 * Discriminated login outcome after a successful password (or equivalent)
 * credential exchange — before the handler navigates or opens MFA.
 */
export type AdminLoginFlowResult =
  | {
      status: typeof AUTH_FLOW_RESULTS.authenticated;
      response: AuthLoginResponse;
    }
  | {
      status: typeof AUTH_FLOW_RESULTS.mfaRequired;
      mfaToken: string;
    }
  | {
      status: typeof AUTH_FLOW_RESULTS.mustChangePassword;
      response: AuthLoginResponse;
    };

/**
 * Map a BFF login payload into a flow result.
 *
 * Flow:
 *   1. MFA required → require mfaToken or fail closed.
 *   2. Reject non-admin principals (FE UX gate only — BE still enforces).
 *   3. Force password change when the session flag is set.
 *   4. Otherwise treat as authenticated.
 * Trace: CODING_RULES §7 model / §20 R1.
 *
 * SECURITY: hasAdminAppAccess here only drives UX (logout + message). Every
 * admin BFF route must still authorize independently.
 */
export function resolveAdminLoginResult(response: AuthLoginResponse): AdminLoginFlowResult {
  // Step 1: MFA challenge
  if (response.data.mfaRequired) {
    if (!response.data.mfaToken) {
      throw new AuthFlowError(AUTH_FLOW_ERROR_CODES.missingMfaToken);
    }

    return {
      status: AUTH_FLOW_RESULTS.mfaRequired,
      mfaToken: response.data.mfaToken,
    };
  }

  // Step 2: admin portal gate
  const user = response.data.user;
  const hasAccess =
    user &&
    hasAdminAppAccess({
      roles: user.roles,
      permissions: response.data.permissions ?? [],
    });

  if (!hasAccess) {
    throw new AuthFlowError(AUTH_FLOW_ERROR_CODES.notAdmin);
  }

  // Step 3: mandatory password change
  if (response.data.mustChangePassword) {
    return {
      status: AUTH_FLOW_RESULTS.mustChangePassword,
      response,
    };
  }

  // Step 4: authenticated
  return {
    status: AUTH_FLOW_RESULTS.authenticated,
    response,
  };
}

/**
 * Ensure an MFA-verified session belongs to an admin principal.
 *
 * @throws AuthFlowError when the user lacks admin app access
 */
export function assertAdminLoginAccess(response: AuthLoginResponse): void {
  const user = response.data.user;
  const hasAccess =
    user &&
    hasAdminAppAccess({
      roles: user.roles,
      permissions: response.data.permissions ?? [],
    });

  if (!hasAccess) {
    throw new AuthFlowError(AUTH_FLOW_ERROR_CODES.notAdmin);
  }
}
