import type { AuthLoginResponse } from "@/lib/api-types";

import { apiPaths, type SsoProvider } from "@/lib/api-paths";
import { webFetch } from "@/lib/http";

import type { AdminLoginInput, MfaChallengeInput } from "../model/auth.schemas";

import {
  AUTH_FLOW_ERROR_CODES,
  HTTP_METHODS,
} from "../model/auth.constants";
import { AuthFlowError } from "../model/auth.errors";

/** Password login against the admin BFF — returns the raw session payload. */
export async function loginToAdmin(
  values: AdminLoginInput,
): Promise<AuthLoginResponse> {
  return webFetch<AuthLoginResponse>(apiPaths.auth.login, {
    method: HTTP_METHODS.post,
    body: JSON.stringify(values),
  });
}

/** Complete MFA challenge; requires a non-null mfaToken from the prior login. */
export async function verifyAdminMfaChallenge(
  values: MfaChallengeInput & { mfaToken: string | null },
): Promise<AuthLoginResponse> {
  if (!values.mfaToken) {
    throw new AuthFlowError(AUTH_FLOW_ERROR_CODES.missingMfaToken);
  }

  return webFetch<AuthLoginResponse>(apiPaths.auth.mfaVerifyChallenge, {
    method: HTTP_METHODS.post,
    body: JSON.stringify({
      mfaToken: values.mfaToken,
      code: values.code,
    }),
  });
}

/** End the current admin session at the BFF. */
export async function logoutAdmin() {
  await webFetch(apiPaths.auth.logout, { method: HTTP_METHODS.post });
}

/**
 * Begin an SSO redirect. Returns the IdP authorization URL.
 *
 * @throws AuthFlowError when the BFF omits authorizationUrl
 */
export async function startSso(provider: SsoProvider, redirectUri: string) {
  const payload = await webFetch<{
    data?: { authorizationUrl?: string };
  }>(apiPaths.auth.ssoStart(provider, redirectUri));

  const authorizationUrl = payload.data?.authorizationUrl;

  if (!authorizationUrl) {
    throw new AuthFlowError(AUTH_FLOW_ERROR_CODES.ssoStartFailed);
  }

  return authorizationUrl;
}

/** Exchange a one-time SSO code for an admin session cookie. */
export async function establishAdminSsoSession(exchangeCode: string) {
  await webFetch(apiPaths.auth.ssoEstablishSession, {
    method: HTTP_METHODS.post,
    body: JSON.stringify({ exchangeCode }),
  });
}
