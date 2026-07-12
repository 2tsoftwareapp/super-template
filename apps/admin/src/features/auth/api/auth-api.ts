import type { QueryClient } from "@tanstack/react-query";

import type { SsoProvider } from "@/lib/api-paths";
import type { AuthLoginResponse } from "@/lib/api-types";

import { sessionQueryKey } from "@/hooks/use-session";
import { hasAdminAppAccess } from "@/lib/admin-resources";
import { apiPaths } from "@/lib/api-paths";
import { webFetch } from "@/lib/http";

import type { AdminLoginInput, MfaChallengeInput } from "./auth-schemas";

import {
  AUTH_FLOW_ERROR_CODES,
  AUTH_FLOW_RESULTS,
  HTTP_CREDENTIALS,
  HTTP_METHODS,
} from "./auth-constants";
import { AuthFlowError } from "./auth-errors";

type SsoStartResponse = AuthLoginResponse & {
  data?: { authorizationUrl?: string };
};

export type AdminLoginFlowResult =
  | {
      status: typeof AUTH_FLOW_RESULTS.authenticated;
      response: AuthLoginResponse;
    }
  | {
      status: typeof AUTH_FLOW_RESULTS.mfaRequired;
      mfaToken: string;
    };

export async function loginToAdmin(values: AdminLoginInput) {
  // Step 1: submit credentials to the same-origin auth BFF.
  const response = await webFetch<AuthLoginResponse>(apiPaths.auth.login, {
    method: HTTP_METHODS.post,
    body: JSON.stringify(values),
  });

  // Step 2: pause the login flow when the API asks for MFA.
  if (response.data.mfaRequired) {
    if (!response.data.mfaToken) {
      throw new AuthFlowError(AUTH_FLOW_ERROR_CODES.missingMfaToken);
    }

    return {
      status: AUTH_FLOW_RESULTS.mfaRequired,
      mfaToken: response.data.mfaToken,
    };
  }

  // Step 3: require a hydrated user and admin app access.
  const user = response.data.user;
  const hasAccess =
    user &&
    hasAdminAppAccess({
      roles: user.roles,
      permissions: response.data.permissions ?? [],
    });

  if (!hasAccess) {
    await logoutAdmin();
    throw new AuthFlowError(AUTH_FLOW_ERROR_CODES.notAdmin);
  }

  // Step 4: return a completed auth result for the UI handler to redirect.
  return {
    status: AUTH_FLOW_RESULTS.authenticated,
    response,
  };
}

export async function verifyAdminMfaChallenge(
  values: MfaChallengeInput & { mfaToken: string | null },
) {
  // Step 1: ensure the MFA challenge was created by the login step.
  if (!values.mfaToken) {
    throw new AuthFlowError(AUTH_FLOW_ERROR_CODES.missingMfaToken);
  }

  // Step 2: verify the one-time code with the auth BFF.
  const response = await webFetch<AuthLoginResponse>(
    apiPaths.auth.mfaVerifyChallenge,
    {
      method: HTTP_METHODS.post,
      body: JSON.stringify({
        mfaToken: values.mfaToken,
        code: values.code,
      }),
    },
  );

  // Step 3: after MFA, require a hydrated user and admin app access.
  const user = response.data.user;
  const hasAccess =
    user &&
    hasAdminAppAccess({
      roles: user.roles,
      permissions: response.data.permissions ?? [],
    });

  if (!hasAccess) {
    await logoutAdmin();
    throw new AuthFlowError(AUTH_FLOW_ERROR_CODES.notAdmin);
  }

  // Step 4: return the verified session payload to the UI handler.
  return response;
}

export async function logoutAdmin() {
  await webFetch(apiPaths.auth.logout, { method: HTTP_METHODS.post });
}

export async function signOutAdmin(queryClient: QueryClient) {
  try {
    await logoutAdmin();
  } finally {
    queryClient.removeQueries({ queryKey: sessionQueryKey });
  }
}

export async function startSso(provider: SsoProvider, redirectUri: string) {
  // Step 1: ask the BFF for the provider authorization URL.
  const response = await fetch(apiPaths.auth.ssoStart(provider, redirectUri), {
    credentials: HTTP_CREDENTIALS.sameOrigin,
  });

  // Step 2: fail fast when the BFF cannot start the provider flow.
  if (!response.ok) {
    throw new AuthFlowError(AUTH_FLOW_ERROR_CODES.ssoStartFailed);
  }

  // Step 3: validate the response contains a redirect target.
  const payload = (await response.json()) as SsoStartResponse;
  const authorizationUrl = payload.data?.authorizationUrl;

  if (!authorizationUrl) {
    throw new AuthFlowError(AUTH_FLOW_ERROR_CODES.ssoStartFailed);
  }

  // Step 4: return the URL; the UI handler owns browser navigation.
  return authorizationUrl;
}

export async function establishAdminSsoSession(exchangeCode: string) {
  // Step 1: exchange the callback code for an admin session via the BFF.
  await webFetch(apiPaths.auth.ssoEstablishSession, {
    method: HTTP_METHODS.post,
    body: JSON.stringify({ exchangeCode }),
  });
}
