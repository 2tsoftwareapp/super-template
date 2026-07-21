"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { useRouter } from "@/i18n/navigation";

import { useEstablishSsoSessionMutation } from "../api/auth.mutations";
import {
  ADMIN_AUTH_ROUTES,
  AUTH_ERROR_QUERY_VALUES,
  AUTH_MESSAGES,
  AUTH_SEARCH_PARAMS,
} from "../model/auth.constants";
import { parseSsoCallbackSearchParams } from "../model/auth.search-params";

const ssoFailedLoginPath = `${ADMIN_AUTH_ROUTES.login}?${AUTH_SEARCH_PARAMS.error}=${AUTH_ERROR_QUERY_VALUES.ssoFailed}`;

/**
 * Complete the SSO redirect: exchange code → session → post-login route.
 *
 * Flow:
 *   1. Fail closed on IdP error flag or missing exchange code.
 *   2. Establish session via mutation (invalidates session query).
 *   3. Enter the app, or bounce to login with sso_failed.
 * Trace: CODING_RULES §5 R7 / §15 R4.
 */
export function useAdminSsoCallbackFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const called = useRef(false);
  const { mutate: establishSession } = useEstablishSsoSessionMutation();
  const params = parseSsoCallbackSearchParams(searchParams);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    // Step 1: reject known failure / missing code
    if (params.error === AUTH_ERROR_QUERY_VALUES.ssoFailed || !params.exchange) {
      router.replace(ssoFailedLoginPath);
      return;
    }

    // Step 2–3: exchange then navigate
    establishSession(params.exchange, {
      onSuccess: () => {
        router.replace(ADMIN_AUTH_ROUTES.postLogin);
      },
      onError: () => {
        router.replace(ssoFailedLoginPath);
      },
    });
  }, [params.error, params.exchange, router, establishSession]);

  return {
    statusMessage: AUTH_MESSAGES.completingSignIn,
  };
}
