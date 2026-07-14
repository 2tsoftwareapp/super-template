import type { AuthLoginResponse } from "@/lib/api-types";

import { hasAdminAppAccess } from "@/lib/admin-resources";
import { apiPaths, type SsoProvider } from "@/lib/api-paths";
import { webFetch } from "@/lib/http";

import type { AdminLoginInput, MfaChallengeInput } from "../model/auth.schemas";

import {
  AUTH_FLOW_ERROR_CODES,
  AUTH_FLOW_RESULTS,
  HTTP_CREDENTIALS,
  HTTP_METHODS,
} from "../model/auth.constants";
import { AuthFlowError } from "../model/auth.errors";

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

export async function loginToAdmin(values: AdminLoginInput) {
  const response = await webFetch<AuthLoginResponse>(apiPaths.auth.login, {
    method: HTTP_METHODS.post,
    body: JSON.stringify(values),
  });

  if (response.data.mfaRequired) {
    if (!response.data.mfaToken) {
      throw new AuthFlowError(AUTH_FLOW_ERROR_CODES.missingMfaToken);
    }

    return {
      status: AUTH_FLOW_RESULTS.mfaRequired,
      mfaToken: response.data.mfaToken,
    };
  }

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

  if (response.data.mustChangePassword) {
    return {
      status: AUTH_FLOW_RESULTS.mustChangePassword,
      response,
    };
  }

  return {
    status: AUTH_FLOW_RESULTS.authenticated,
    response,
  };
}

export async function verifyAdminMfaChallenge(
  values: MfaChallengeInput & { mfaToken: string | null },
) {
  if (!values.mfaToken) {
    throw new AuthFlowError(AUTH_FLOW_ERROR_CODES.missingMfaToken);
  }

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

  return response;
}

export async function logoutAdmin() {
  await webFetch(apiPaths.auth.logout, { method: HTTP_METHODS.post });
}

export async function startSso(provider: SsoProvider, redirectUri: string) {
  const response = await fetch(apiPaths.auth.ssoStart(provider, redirectUri), {
    credentials: HTTP_CREDENTIALS.sameOrigin,
  });

  if (!response.ok) {
    throw new AuthFlowError(AUTH_FLOW_ERROR_CODES.ssoStartFailed);
  }

  const payload = (await response.json()) as {
    data?: { authorizationUrl?: string };
  };
  const authorizationUrl = payload.data?.authorizationUrl;

  if (!authorizationUrl) {
    throw new AuthFlowError(AUTH_FLOW_ERROR_CODES.ssoStartFailed);
  }

  return authorizationUrl;
}

export async function establishAdminSsoSession(exchangeCode: string) {
  await webFetch(apiPaths.auth.ssoEstablishSession, {
    method: HTTP_METHODS.post,
    body: JSON.stringify({ exchangeCode }),
  });
}
